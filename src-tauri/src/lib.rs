// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod binaries;
mod utils;

mod ytdlp;

use binaries::{
    check_binaries, download_binaries, get_binary_versions, update_ffmpeg, update_ytdlp,
};
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use utils::resolve_binary_path;
use ytdlp::build_ytdlp_args;

#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[allow(dead_code)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DownloadPayload {
    pub url: String,
    pub format: String, // 'video' | 'audio'
    pub location: String,
    pub args: Vec<String>,
    pub options: FormatOptions,
    pub advanced_options: AdvancedOptionsState,
    pub video_conversion: Option<VideoConversionOptions>,
    pub output_template: String,
    pub notifications_enabled: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FormatOptions {
    pub type_: String, // 'video' | 'audio' (mapped to 'type' in json)
    pub video_container: String,
    pub video_resolution: String,
    pub audio_format: String,
    pub audio_bitrate: String,
    pub audio_sample_rate: String,
    pub audio_bit_depth: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AdvancedOptionsState {
    pub embed_thumbnail: bool,
    pub add_metadata: bool,
    pub embed_subs: bool,
    pub write_auto_sub: bool,
    pub split_chapters: bool,
    pub playlist: String, // 'default' | 'single' | 'playlist'
    pub cookies_browser: String,
    pub time_range: Option<TimeRange>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TimeRange {
    pub enabled: bool,
    pub start: String,
    pub end: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct VideoConversionOptions {
    pub enabled: bool,
    pub video_codec: String,
    pub video_bitrate: String,
    pub audio_codec: String,
    pub audio_bitrate: String,
    pub hw_encoder: Option<String>,
}

#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DownloadResult {
    pub success: bool,
    pub message: String,
    pub title: Option<String>,
    pub filename: Option<String>,
    pub file_size: Option<u64>,
}

// Stub for start_download - to be implemented fully with tauri_plugin_process or std::process
#[tauri::command]
async fn start_download(app: AppHandle, payload: DownloadPayload) -> Result<(), String> {
    let yt_dlp_path = resolve_binary_path(&app, "yt-dlp").ok_or("yt-dlp not found")?;
    let ffmpeg_path = resolve_binary_path(&app, "ffmpeg");

    let (bin_path, args) = build_ytdlp_args(&app, &payload, &yt_dlp_path, ffmpeg_path.as_ref())
        .map_err(|e| e.to_string())?;

    app.emit(
        "download-progress",
        format!("Starting download for {}", payload.url),
    )
    .unwrap();

    // Use tokio::process::Command
    let mut cmd = Command::new(&bin_path);
    cmd.args(args);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn yt-dlp: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

    let mut stdout_reader = BufReader::new(stdout).lines();
    let mut stderr_reader = BufReader::new(stderr).lines();

    // Spawn tasks to read output
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Ok(Some(line)) = stdout_reader.next_line().await {
            app_handle.emit("download-progress", line).unwrap_or(());
        }
    });

    let app_handle_err = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Ok(Some(line)) = stderr_reader.next_line().await {
            app_handle_err.emit("download-progress", line).unwrap_or(());
        }
    });

    // Wait for process to finish
    tauri::async_runtime::spawn(async move {
        let status = child.wait().await;

        match status {
            Ok(s) => {
                app.emit(
                    "download-complete",
                    DownloadResult {
                        success: s.success(),
                        message: if s.success() {
                            "Download complete".to_string()
                        } else {
                            "Download failed".to_string()
                        },
                        title: None,
                        filename: None,
                        file_size: None,
                    },
                )
                .unwrap_or(());
            }
            Err(e) => {
                app.emit(
                    "download-complete",
                    DownloadResult {
                        success: false,
                        message: format!("Process error: {}", e),
                        title: None,
                        filename: None,
                        file_size: None,
                    },
                )
                .unwrap_or(());
            }
        }
    });

    Ok(())
}

#[tauri::command]
async fn cancel_download() -> bool {
    // Implement cancellation logic (kill process)
    true
}

#[tauri::command]
async fn select_directory() -> Option<String> {
    // Handled by plugin-dialog usually, or we can wrap it here
    None // Placeholder: use window.electron.selectDirectory via plugin in frontend if possible, or implement here using tauri::api::dialog
}

#[tauri::command]
async fn open_file_dialog() -> Option<serde_json::Value> {
    None
}

#[tauri::command]
async fn get_default_download_path(app: AppHandle) -> String {
    app.path()
        .download_dir()
        .unwrap_or(std::path::PathBuf::from("."))
        .to_string_lossy()
        .to_string()
}

#[tauri::command]
async fn get_latest_binary_versions() -> serde_json::Value {
    // TODO: Implement fetching from GitHub API
    serde_json::json!({
        "ytDlp": "Unknown",
        "ffmpeg": "Unknown"
    })
}

#[tauri::command]
async fn cancel_binary_download() {
    // Logic to abort download
}

#[tauri::command]
async fn check_app_update() -> serde_json::Value {
    serde_json::json!({
        "available": false,
        "currentVersion": "0.1.0",
        "error": "Not implemented"
    })
}

#[tauri::command]
async fn open_folder(_folder_path: String) {
    // Use shell open
}

#[tauri::command]
async fn fetch_video_info(app: AppHandle, url: String) -> Result<serde_json::Value, String> {
    let yt_dlp_path = resolve_binary_path(&app, "yt-dlp").ok_or("yt-dlp not found")?;

    let mut cmd = Command::new(yt_dlp_path);
    cmd.args(["-J", "--flat-playlist", "--no-warnings", &url]);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = cmd.output().await.map_err(|e| e.to_string())?;

    if output.status.success() {
        let json_str = String::from_utf8_lossy(&output.stdout);
        let data: serde_json::Value = serde_json::from_str(&json_str).map_err(|e| e.to_string())?;
        Ok(data)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn detect_hw_encoders(app: AppHandle) -> Result<serde_json::Value, String> {
    let ffmpeg_path = resolve_binary_path(&app, "ffmpeg");

    let mut available = Vec::new();

    if let Some(path) = ffmpeg_path {
        let mut cmd = Command::new(path);
        cmd.args(["-hide_banner", "-encoders"]);
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let output = cmd.output().await;

        if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);

            if stdout.contains("h264_nvenc") || stdout.contains("hevc_nvenc") {
                available.push("nvenc");
            }
            if stdout.contains("h264_qsv") || stdout.contains("hevc_qsv") {
                available.push("qsv");
            }
            if stdout.contains("h264_videotoolbox") || stdout.contains("hevc_videotoolbox") {
                available.push("videotoolbox");
            }
            if stdout.contains("h264_amf") || stdout.contains("hevc_amf") {
                available.push("amf");
            }
        }
    }

    Ok(serde_json::json!({ "available": available }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            check_binaries,
            download_binaries,
            get_binary_versions,
            update_ytdlp,
            update_ffmpeg,
            start_download,
            cancel_download,
            select_directory,
            open_file_dialog,
            get_default_download_path,
            get_latest_binary_versions,
            cancel_binary_download,
            check_app_update,
            open_folder,
            fetch_video_info,
            detect_hw_encoders
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

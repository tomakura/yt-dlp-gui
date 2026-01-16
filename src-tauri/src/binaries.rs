use crate::utils::{ensure_binaries_path, get_binaries_path, set_executable_permission};
use futures_util::StreamExt;
use serde::Serialize;
use std::fs::{self, File};
use std::io::{self};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BinaryUpdateProgress {
    pub r#type: String,
    pub percent: u64,
    pub status_input: Option<String>, // 'status' matches frontend interface
    pub status_key: Option<String>,
    pub progress_data: Option<ProgressData>,
}

#[derive(Clone, Serialize)]
pub struct ProgressData {
    pub downloaded: u64,
    pub total: u64,
    pub speed: f64,
}

// IPC Commands

#[tauri::command]
pub async fn check_binaries(app: AppHandle) -> serde_json::Value {
    // Reusing utils logic
    let bin_dir = get_binaries_path(&app);
    let yt_dlp = bin_dir.join(if cfg!(windows) {
        "yt-dlp.exe"
    } else {
        "yt-dlp"
    });
    let ffmpeg = bin_dir.join(if cfg!(windows) {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    });

    serde_json::json!({
        "ytdlp": yt_dlp.exists(),
        "ffmpeg": ffmpeg.exists(),
        "path": bin_dir.to_string_lossy()
    })
}

#[tauri::command]
pub async fn get_binary_versions(app: AppHandle) -> serde_json::Value {
    let bin_dir = get_binaries_path(&app);
    let yt_dlp = bin_dir.join(if cfg!(windows) {
        "yt-dlp.exe"
    } else {
        "yt-dlp"
    });
    let ffmpeg = bin_dir.join(if cfg!(windows) {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    });

    println!(
        "Checking versions at: yt-dlp={:?}, ffmpeg={:?}",
        yt_dlp, ffmpeg
    );

    let yt_dlp_version = get_version(&yt_dlp, "--version")
        .await
        .unwrap_or_else(|| "Not detected".to_string());
    let ffmpeg_version = get_version(&ffmpeg, "-version")
        .await
        .unwrap_or_else(|| "Not detected".to_string());

    println!(
        "Versions found: yt-dlp={}, ffmpeg={}",
        yt_dlp_version, ffmpeg_version
    );

    serde_json::json!({
        "ytDlp": yt_dlp_version,
        "ffmpeg": ffmpeg_version
    })
}

async fn get_version(path: &PathBuf, arg: &str) -> Option<String> {
    if !path.exists() {
        println!("Path does not exist: {:?}", path);
        return None;
    }

    match tokio::process::Command::new(path).arg(arg).output().await {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                let first_line = version.lines().next().unwrap_or("Unknown").to_string();

                // Parsers for specific binaries
                let clean_version = if arg.contains("-version") {
                    // ffmpeg usually uses -version
                    // Expected format: "ffmpeg version 6.1-tessus https://..."
                    if first_line.starts_with("ffmpeg version") {
                        first_line
                            .split_whitespace()
                            .nth(2)
                            .unwrap_or(&first_line)
                            .to_string()
                    } else {
                        first_line
                    }
                } else {
                    first_line
                };

                println!("Version command output for {:?}: {}", path, clean_version);
                Some(clean_version)
            } else {
                println!(
                    "Version command failed for {:?}: Status={}",
                    path, output.status
                );
                let stderr = String::from_utf8_lossy(&output.stderr);
                println!("Stderr: {}", stderr);
                None
            }
        }
        Err(e) => {
            println!("Failed to execute version command for {:?}: {}", path, e);
            None
        }
    }
}

#[tauri::command]
pub async fn update_ytdlp(app: AppHandle) -> Result<bool, String> {
    download_ytdlp_internal(&app)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_ffmpeg(app: AppHandle) -> Result<bool, String> {
    download_ffmpeg_internal(&app)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download_binaries(app: AppHandle) -> Result<bool, String> {
    println!("Starting download_binaries...");
    match update_ytdlp(app.clone()).await {
        Ok(_) => println!("yt-dlp update success"),
        Err(e) => println!("yt-dlp update error: {}", e),
    }
    update_ffmpeg(app).await
}

// Internal Logic

// Internal Logic

async fn download_file(
    url: &str,
    dest: &PathBuf,
    app: &AppHandle,
    type_name: &str,
    status_key: &str,
    update_progress: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    println!("Downloading from: {}", url);
    let response = client.get(url).send().await?;
    println!("Response status: {}", response.status());
    let total_size = response.content_length().unwrap_or(0);

    let mut file = tokio::fs::File::create(dest).await?;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    let start_time = std::time::Instant::now();
    let mut last_emit = std::time::Instant::now();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result?;
        use tokio::io::AsyncWriteExt;
        file.write_all(&chunk).await?;
        downloaded += chunk.len() as u64;

        if update_progress && last_emit.elapsed().as_millis() > 100 {
            let elapsed = start_time.elapsed().as_secs_f64();
            let speed = if elapsed > 0.0 {
                downloaded as f64 / elapsed
            } else {
                0.0
            };
            let percent = if total_size > 0 {
                downloaded * 100 / total_size
            } else {
                0
            };

            app.emit(
                "binary-update-progress",
                BinaryUpdateProgress {
                    r#type: type_name.to_string(),
                    percent,
                    status_input: Some(status_key.to_string()),
                    status_key: Some(status_key.to_string()),
                    progress_data: Some(ProgressData {
                        downloaded,
                        total: total_size,
                        speed,
                    }),
                },
            )
            .unwrap_or(());

            last_emit = std::time::Instant::now();
        }
    }

    Ok(())
}

async fn download_ytdlp_internal(app: &AppHandle) -> Result<bool, Box<dyn std::error::Error>> {
    let bin_path = ensure_binaries_path(app)?;
    let target = bin_path.join(if cfg!(windows) {
        "yt-dlp.exe"
    } else {
        "yt-dlp"
    });

    let url = if cfg!(windows) {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
    } else if cfg!(target_os = "macos") {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
    } else {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
    };

    download_file(url, &target, app, "ytdlp", "statusDownloadingYtDlp", true).await?;

    if !cfg!(windows) {
        set_executable_permission(&target)?;
        #[cfg(target_os = "macos")]
        {
            std::process::Command::new("xattr")
                .args(["-d", "com.apple.quarantine"])
                .arg(&target)
                .output()
                .ok(); // Ignore errors if attribute doesn't exist
        }
    }

    println!("yt-dlp download finished successfully");
    Ok(true)
}

async fn download_ffmpeg_internal(app: &AppHandle) -> Result<bool, Box<dyn std::error::Error>> {
    let bin_path = ensure_binaries_path(app)?;

    // Simplification: We will implement the MacOS flow as priority since user is on Mac
    // But keeping structure for others.

    if cfg!(target_os = "macos") {
        let version = "6.1";
        let ffmpeg_url = format!("https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v{}/ffmpeg-{}-macos-64.zip", version, version);
        let ffprobe_url = format!("https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v{}/ffprobe-{}-macos-64.zip", version, version);

        // Download ffmpeg zip
        let ffmpeg_zip = bin_path.join("ffmpeg.zip");
        println!("Downloading ffmpeg to: {:?}", ffmpeg_zip);
        download_file(
            &ffmpeg_url,
            &ffmpeg_zip,
            app,
            "ffmpeg",
            "statusDownloadingFfmpeg",
            true,
        )
        .await?;

        // Extract - Running blocking IO in spawn_blocking
        println!("Extracting ffmpeg zip...");
        let ffmpeg_zip_clone = ffmpeg_zip.clone();
        let bin_path_clone = bin_path.clone();
        tauri::async_runtime::spawn_blocking(move || {
            extract_zip(&ffmpeg_zip_clone, &bin_path_clone).map_err(|e| e.to_string())
        })
        .await
        .map_err(|e| e.to_string())??;

        fs::remove_file(&ffmpeg_zip)?;

        let ffmpeg_bin = bin_path.join("ffmpeg");
        set_executable_permission(&ffmpeg_bin)?;

        // Download ffprobe zip
        let ffprobe_zip = bin_path.join("ffprobe.zip");
        download_file(
            &ffprobe_url,
            &ffprobe_zip,
            app,
            "ffmpeg",
            "statusDownloadingFfmpeg",
            true,
        )
        .await?;

        // Extract
        let ffprobe_zip_clone = ffprobe_zip.clone();
        let bin_path_clone_2 = bin_path.clone();
        tauri::async_runtime::spawn_blocking(move || {
            extract_zip(&ffprobe_zip_clone, &bin_path_clone_2).map_err(|e| e.to_string())
        })
        .await
        .map_err(|e| e.to_string())??;

        fs::remove_file(&ffprobe_zip)?;

        let ffprobe_bin = bin_path.join("ffprobe");
        set_executable_permission(&ffprobe_bin)?;
    } else {
        // Windows/Linux logic from yt-dlp/FFmpeg-Builds
        // ... (Omitting for brevity unless user is building for specific target, focusing on current OS)
        return Err("Platform not fully implemented in migration script yet".into());
    }

    Ok(true)
}

fn extract_zip(
    archive_path: &PathBuf,
    target_dir: &PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(archive_path)?;
    let mut archive = zip::ZipArchive::new(file)?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let outpath = match file.enclosed_name() {
            Some(path) => target_dir.join(path),
            None => continue,
        };

        if (*file.name()).ends_with('/') {
            fs::create_dir_all(&outpath)?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)?;
                }
            }
            let mut outfile = File::create(&outpath)?;
            io::copy(&mut file, &mut outfile)?;
        }
    }
    Ok(())
}

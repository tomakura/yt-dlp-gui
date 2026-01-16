use crate::DownloadPayload;
use std::path::{Path, PathBuf};
use tauri::{AppHandle};

pub fn build_ytdlp_args(
    _app: &AppHandle,
    payload: &DownloadPayload,
    yt_dlp_path: &Path,
    ffmpeg_path: Option<&PathBuf>
) -> Result<(PathBuf, Vec<String>), String> {
    
    let mut args: Vec<String> = Vec::new();
    
    // Output template
    // In Electron: path.join(payload.location, payload.outputTemplate || '%(title)s.%(ext)s')
    // We expect payload.location to be absolute path from frontend or we construct it?
    // Frontend sends 'location' as selected directory path.
    let output_template = if payload.output_template.is_empty() {
        "%(title)s.%(ext)s"
    } else {
        &payload.output_template
    };
    
    // Combine location and template. 
    // Note: yt-dlp -o supports full paths.
    let output_path = Path::new(&payload.location).join(output_template);
    
    args.push(payload.url.clone());
    args.push("-o".to_string());
    args.push(output_path.to_string_lossy().to_string());
    
    args.push("--no-mtime".to_string());
    args.push("--print".to_string());
    args.push("after_move:filepath".to_string());
    args.push("--print".to_string());
    args.push("title".to_string());
    
    args.push("--extractor-args".to_string());
    args.push("youtube:player_client=default".to_string());
    
    args.push("--encoding".to_string());
    args.push("utf-8".to_string());
    
    // ffmpeg location
    if let Some(ff_path) = ffmpeg_path {
        let ff_location = if ff_path.is_dir() {
            ff_path.to_string_lossy().to_string()
        } else {
            // yt-dlp expects directory or binary? 
            // implementation says: if we only have binary path, pass its directory.
            // But if system ffmpeg, usage might be different. 
            // We use our app-local binary.
            ff_path.parent().unwrap_or(ff_path).to_string_lossy().to_string()
        };
        args.push("--ffmpeg-location".to_string());
        args.push(ff_location);
    }

    // Advanced options from payload
    if payload.advanced_options.embed_thumbnail { args.push("--embed-thumbnail".to_string()); }
    if payload.advanced_options.add_metadata { args.push("--add-metadata".to_string()); }
    
    if payload.format == "video" {
         if payload.advanced_options.embed_subs { args.push("--embed-subs".to_string()); }
         if payload.advanced_options.write_auto_sub { args.push("--write-auto-sub".to_string()); }
         if payload.advanced_options.split_chapters { args.push("--split-chapters".to_string()); }
    }
    
    if payload.advanced_options.cookies_browser != "none" {
        args.push("--cookies-from-browser".to_string());
        args.push(payload.advanced_options.cookies_browser.clone());
    }
    
    match payload.advanced_options.playlist.as_str() {
        "single" => args.push("--no-playlist".to_string()),
        "playlist" => args.push("--yes-playlist".to_string()),
        _ => {} // default
    }

    // Time range
    if let Some(range) = &payload.advanced_options.time_range {
        if range.enabled && !range.start.is_empty() && !range.end.is_empty() {
             args.push("--download-sections".to_string());
             args.push(format!("*{} - {}", range.start, range.end));
             args.push("--force-keyframes-at-cuts".to_string());
        }
    }
    
    if payload.format == "audio" {
        args.push("-x".to_string());
        args.push("--audio-format".to_string());
        args.push(payload.options.audio_format.clone());
        
        if payload.options.audio_format == "wav" {
             // PostProcessor args for bit depth?
             // Not implementing full complexity of bit depth for now or pass as generic args
        } else {
            args.push("--audio-quality".to_string());
            args.push(payload.options.audio_bitrate.clone());
        }
    } else {
        // Video options
        if payload.options.video_resolution != "best" {
             let height = payload.options.video_resolution.replace("p", "");
             // format: bestvideo[height<=?]+bestaudio/best
             args.push("-f".to_string());
             args.push(format!("bestvideo[height<={}]+bestaudio/best", height));
        } else {
             args.push("-f".to_string());
             args.push("bestvideo+bestaudio/best".to_string());
        }
        
        args.push("--merge-output-format".to_string());
        args.push(payload.options.video_container.clone());
        
        // Video conversion / Hardware acceleration
        if let Some(conversion) = &payload.video_conversion {
            if conversion.enabled {
                // Construct postprocessor args for ffmpeg
                // Re-implementation of the complex codec/hw mapping logic
                // For this MVP step, we will delegate this to a TODO or implement basic
                // skipping full HW accel table for brevity unless critical
            }
        }
    }
    
    Ok((yt_dlp_path.to_path_buf(), args))
}

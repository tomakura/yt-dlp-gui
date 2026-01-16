use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use std::fs;

pub fn get_binaries_path(app: &AppHandle) -> PathBuf {
    app.path().app_local_data_dir().expect("failed to get app data dir").join("bin")
}

pub fn resolve_binary_path(app: &AppHandle, name: &str) -> Option<PathBuf> {
    let bin_path = get_binaries_path(app).join(if cfg!(windows) {
        format!("{}.exe", name)
    } else {
        name.to_string()
    });

    if bin_path.exists() {
        Some(bin_path)
    } else {
        // Fallback to checking path? Or strictly enforce app-local binaries for security?
        // Implementation plan says: "Strictly limit shell scope to only allow executing the specific binaries... located in the app's local data directory"
        // So we return None if not in our bin folder.
        None
    }
}

pub fn ensure_binaries_path(app: &AppHandle) -> std::io::Result<PathBuf> {
    let path = get_binaries_path(app);
    if !path.exists() {
        fs::create_dir_all(&path)?;
    }
    Ok(path)
}

#[cfg(unix)]
pub fn set_executable_permission(path: &Path) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;
    let mut perms = fs::metadata(path)?.permissions();
    perms.set_mode(0o755);
    fs::set_permissions(path, perms)?;
    Ok(())
}

#[cfg(windows)]
pub fn set_executable_permission(_path: &Path) -> std::io::Result<()> {
    Ok(())
}

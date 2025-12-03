import { app, BrowserWindow, dialog, ipcMain, shell, net, Notification } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { spawn, spawnSync, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Safe require for optional dependencies
let ffmpegStatic: string | null = null;
let ytDlp: { path?: string } = {};


try {
  ffmpegStatic = require('ffmpeg-static') as string | null;
} catch (e) {
  console.log('ffmpeg-static not available');
}

try {
  ytDlp = require('yt-dlp-exec') as { path?: string };
} catch (e) {
  console.log('yt-dlp-exec not available');
}

type HwEncoder = 'auto' | 'none' | 'nvenc' | 'qsv' | 'videotoolbox' | 'amf';

interface VideoConversionOptions {
  enabled: boolean;
  videoCodec: 'copy' | 'h264' | 'h265' | 'vp9' | 'av1';
  videoBitrate: string;
  audioCodec: 'copy' | 'aac' | 'mp3' | 'opus';
  audioBitrate: string;
  hwEncoder?: HwEncoder;
}

interface DownloadPayload {
  url: string;
  format: 'video' | 'audio';
  location: string;
  args: string[];
  options: {
    type: 'video' | 'audio';
    videoContainer: string;
    videoResolution: string;
    audioFormat: string;
    audioBitrate: string;
    audioSampleRate: string;
    audioBitDepth: string;
  };
  advancedOptions: {
    embedThumbnail: boolean;
    addMetadata: boolean;
    embedSubs: boolean;
    writeAutoSub: boolean;
    splitChapters: boolean;
    playlist: 'default' | 'single' | 'playlist';
    cookiesBrowser: 'none' | 'chrome' | 'edge' | 'firefox';
    timeRange?: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  videoConversion?: VideoConversionOptions;
  outputTemplate: string;
  notificationsEnabled: boolean;
}

const isWindows = process.platform === 'win32';

// Use userData folder for binaries (writable location)
// Development: use project's Application folder
// Production: use app.getPath('userData')/bin
const getAppPath = () => {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'bin');
  }
  return path.join(process.cwd(), 'Application');
};

// Initialize appPath after app is ready
let appPath = '';

const ensureAppPath = () => {
  if (!appPath) {
    appPath = getAppPath();
  }
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath, { recursive: true });
  }
};

const commandExists = (cmd: string): boolean => {
  try {
    if (isWindows) {
      // On Windows, use 'where' command to check if executable exists in PATH
      const result = spawnSync('where', [cmd], {
        windowsHide: true,
        shell: true,
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      return result.status === 0;
    } else {
      // On Unix-like systems, try running the command
      const result = spawnSync(cmd, ['--version'], {
        windowsHide: true,
        stdio: 'pipe'
      });
      return result.status === 0 && result.error === undefined;
    }
  } catch {
    return false;
  }
};

const ytDlpBinaryPath = (ytDlp as unknown as { path?: string }).path;

const resolveYtDlpPath = () => {
  ensureAppPath();
  const bundled = path.join(appPath, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
  if (fs.existsSync(bundled)) return bundled;

  if (ytDlpBinaryPath && fs.existsSync(ytDlpBinaryPath)) return ytDlpBinaryPath;
  return commandExists('yt-dlp') ? 'yt-dlp' : null;
};

const resolveFfmpegPath = () => {
  ensureAppPath();
  const bundled = path.join(appPath, isWindows ? 'ffmpeg.exe' : 'ffmpeg');
  if (fs.existsSync(bundled)) return bundled;

  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic;
  return commandExists('ffmpeg') ? 'ffmpeg' : null;
};

const copyBinary = async (from: string, to: string) => {
  ensureAppPath();
  await fs.promises.copyFile(from, to);
  if (!isWindows) {
    await fs.promises.chmod(to, 0o755);
  }
};

// Global abort controller for binary downloads
let binaryDownloadController: AbortController | null = null;
let activeDownloadProcess: ChildProcess | null = null;
let isDownloadCancelled = false;

const downloadFile = (url: string, destination: string, onProgress?: (percent: number, downloaded: number, total: number, speed: number) => void) =>
  new Promise<void>((resolve, reject) => {
    ensureAppPath();

    const makeRequest = (requestUrl: string) => {
      const file = fs.createWriteStream(destination);

      const req = https.get(requestUrl, (res: any) => {
        // Handle redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlink(destination, () => { }); // Clean up empty file
          let redirectUrl = res.headers.location;
          if (redirectUrl.startsWith('/')) {
            const parsedUrl = new URL(requestUrl);
            redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
          } else if (!redirectUrl.startsWith('http')) {
            const parsedUrl = new URL(requestUrl);
            const pathParts = parsedUrl.pathname.split('/');
            pathParts.pop();
            redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${pathParts.join('/')}/${redirectUrl}`;
          }
          makeRequest(redirectUrl);
          return;
        }

        if (res.statusCode && res.statusCode >= 400) {
          file.close();
          reject(new Error(`HTTP Error: ${res.statusCode}`));
          return;
        }

        // Track progress
        const totalSize = parseInt(res.headers['content-length'] || '0', 10);
        let downloaded = 0;
        const startTime = Date.now();
        let lastUpdate = 0;

        res.on('data', (chunk: Buffer) => {
          downloaded += chunk.length;
          const now = Date.now();

          // Update every 100ms to avoid excessive IPC
          if (now - lastUpdate > 100 || downloaded === totalSize) {
            const elapsed = (now - startTime) / 1000; // seconds
            const speed = elapsed > 0 ? downloaded / elapsed : 0; // bytes/sec

            if (onProgress) {
              if (totalSize > 0) {
                onProgress(Math.round((downloaded / totalSize) * 100), downloaded, totalSize, speed);
              } else {
                // No content-length, report bytes downloaded
                onProgress(-1, downloaded, 0, speed);
              }
            }
            lastUpdate = now;
          }
        });

        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            if (!isWindows && fs.existsSync(destination)) {
              try {
                fs.chmodSync(destination, 0o755);
              } catch (e) {
                // Ignore chmod errors, especially for zip files or if file is missing
              }
            }
            resolve();
          });
        });
      });

      req.on('error', (err) => {
        file.close();
        // Only unlink if file exists to avoid ENOENT
        if (fs.existsSync(destination)) {
          fs.unlink(destination, () => reject(err));
        } else {
          reject(err);
        }
      });

      // Handle abort
      if (binaryDownloadController) {
        binaryDownloadController.signal.addEventListener('abort', () => {
          req.destroy();
          file.close();
          if (fs.existsSync(destination)) {
            fs.unlink(destination, () => { });
          }
          reject(new Error('Download cancelled'));
        });
      }
    };

    makeRequest(url);
  });

const downloadYtDlp = async (onProgress?: (percent: number, downloaded: number, total: number, speed: number) => void) => {
  const isMac = process.platform === 'darwin';
  const target = path.join(appPath, isWindows ? 'yt-dlp.exe' : 'yt-dlp');

  let url: string;
  if (isWindows) {
    url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
  } else if (isMac) {
    // Use standalone binary for macOS (doesn't require Python)
    url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
  } else {
    // Linux - use the Python zipapp
    url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
  }

  await downloadFile(url, target, onProgress);

  // Set executable permission and remove quarantine on macOS
  if (!isWindows) {
    await fs.promises.chmod(target, 0o755);
    if (isMac) {
      try {
        await execAsync(`xattr -d com.apple.quarantine "${target}"`);
      } catch {
        // Ignore if quarantine attribute doesn't exist
      }
    }
  }

  onProgress?.(100, 0, 0, 0);
  return target;
};

const downloadFfmpeg = async (onProgress?: (percent: number, downloaded: number, total: number, speed: number) => void, onStatus?: (statusKey: string) => void) => {
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';

  const ffmpegTarget = path.join(appPath, isWindows ? 'ffmpeg.exe' : 'ffmpeg');
  const ffprobeTarget = path.join(appPath, isWindows ? 'ffprobe.exe' : 'ffprobe');

  // For macOS, use ffbinaries (GitHub Releases) for faster download
  // Note: Currently using x64 builds which work on ARM64 via Rosetta 2
  if (isMac) {
    try {
      onStatus?.('statusDownloadingFfmpeg');

      // Using ffbinaries v6.1
      const version = '6.1';
      const ffmpegUrl = `https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v${version}/ffmpeg-${version}-macos-64.zip`;
      const ffprobeUrl = `https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v${version}/ffprobe-${version}-macos-64.zip`;

      const ffmpegZip = path.join(appPath, 'ffmpeg.zip');
      const ffprobeZip = path.join(appPath, 'ffprobe.zip');

      let ffmpegState = { downloaded: 0, total: 0, speed: 0 };
      let ffprobeState = { downloaded: 0, total: 0, speed: 0 };

      const updateCombinedProgress = () => {
        const downloaded = ffmpegState.downloaded + ffprobeState.downloaded;
        const total = ffmpegState.total + ffprobeState.total;
        const speed = ffmpegState.speed + ffprobeState.speed;

        if (total > 0) {
          const percent = Math.round((downloaded / total) * 100);
          // Map 0-100% download to 0-80% overall
          onProgress?.(Math.round(percent * 0.8), downloaded, total, speed);
        } else if (downloaded > 0) {
          onProgress?.(-1, downloaded, 0, speed);
        }
      };

      const p1 = downloadFile(ffmpegUrl, ffmpegZip, (p, d, t, s) => {
        ffmpegState = { downloaded: d, total: t, speed: s };
        updateCombinedProgress();
      });

      const p2 = downloadFile(ffprobeUrl, ffprobeZip, (p, d, t, s) => {
        ffprobeState = { downloaded: d, total: t, speed: s };
        updateCombinedProgress();
      });

      await Promise.all([p1, p2]);

      // Extract (80-100%)
      onStatus?.('statusExtracting');
      onProgress?.(85, 0, 0, 0);

      await Promise.all([
        execAsync(`unzip -o "${ffmpegZip}" -d "${appPath}"`),
        execAsync(`unzip -o "${ffprobeZip}" -d "${appPath}"`)
      ]);

      if (fs.existsSync(ffmpegZip)) fs.unlinkSync(ffmpegZip);
      if (fs.existsSync(ffprobeZip)) fs.unlinkSync(ffprobeZip);

      if (fs.existsSync(ffmpegTarget)) {
        fs.chmodSync(ffmpegTarget, 0o755);
        // Remove quarantine attribute on macOS
        if (isMac) {
          try {
            execAsync(`xattr -d com.apple.quarantine "${ffmpegTarget}"`).catch(() => { });
          } catch (e) { }
        }
      }
      if (fs.existsSync(ffprobeTarget)) {
        fs.chmodSync(ffprobeTarget, 0o755);
        // Remove quarantine attribute on macOS
        if (isMac) {
          try {
            execAsync(`xattr -d com.apple.quarantine "${ffprobeTarget}"`).catch(() => { });
          } catch (e) { }
        }
      }

      onProgress?.(100, 0, 0, 0);

      return ffmpegTarget;
    } catch (e) {
      console.error('Failed to download ffmpeg for macOS:', e);
      throw e;
    }
  }

  // Download ffmpeg and ffprobe from yt-dlp's FFmpeg builds (Windows/Linux)
  let url = '';
  if (isWindows) {
    url = 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';
  } else if (isLinux) {
    url = 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz';
  }

  if (!url) {
    throw new Error('Unsupported platform for ffmpeg download');
  }

  // For Windows/Linux, download and extract
  const tempFile = path.join(appPath, isWindows ? 'ffmpeg-temp.zip' : 'ffmpeg-temp.tar.xz');

  try {
    onStatus?.('statusDownloadingFfmpeg');
    await downloadFile(url, tempFile, (p, downloaded, total, speed) => {
      if (p >= 0) {
        onProgress?.(Math.round(p * 0.8), downloaded, total, speed); // 0-80% for download
      } else if (downloaded) {
        onProgress?.(-1, downloaded, total, speed);
      }
    });

    onStatus?.('statusExtracting');
    onProgress?.(85, 0, 0, 0);

    if (isWindows) {
      // Extract zip on Windows
      const extractDir = path.join(appPath, 'ffmpeg-extract');
      if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

      try {
        // Try using tar first (much faster than PowerShell Expand-Archive)
        await execAsync(`tar -xf "${tempFile}" -C "${extractDir}"`);
      } catch (e) {
        console.log('tar extraction failed, falling back to PowerShell', e);
        // Use PowerShell to extract the zip
        await execAsync(`powershell -NoProfile -Command "Expand-Archive -Path '${tempFile}' -DestinationPath '${extractDir}' -Force"`);
      }

      // Find and move ffmpeg.exe and ffprobe.exe
      const findAndMove = async (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await findAndMove(fullPath);
          } else if (entry.name === 'ffmpeg.exe') {
            fs.copyFileSync(fullPath, ffmpegTarget);
          } else if (entry.name === 'ffprobe.exe') {
            fs.copyFileSync(fullPath, ffprobeTarget);
          }
        }
      };
      await findAndMove(extractDir);

      // Clean up extract directory
      fs.rmSync(extractDir, { recursive: true, force: true });
    } else if (isLinux) {
      // Extract tar.xz on Linux - extract both ffmpeg and ffprobe
      try {
        await execAsync(`tar -xf "${tempFile}" -C "${appPath}" --strip-components=2 "*/bin/ffmpeg" "*/bin/ffprobe"`);
      } catch (e) {
        // Some versions might have different structure, try alternative extraction
        await execAsync(`tar -xf "${tempFile}" -C "${appPath}"`);
        // Find and move ffmpeg/ffprobe to appPath
        const extractedDirs = fs.readdirSync(appPath).filter(f => f.startsWith('ffmpeg-'));
        for (const dir of extractedDirs) {
          const binPath = path.join(appPath, dir, 'bin');
          if (fs.existsSync(binPath)) {
            const ffmpegSrc = path.join(binPath, 'ffmpeg');
            const ffprobeSrc = path.join(binPath, 'ffprobe');
            if (fs.existsSync(ffmpegSrc)) {
              fs.renameSync(ffmpegSrc, ffmpegTarget);
            }
            if (fs.existsSync(ffprobeSrc)) {
              fs.renameSync(ffprobeSrc, ffprobeTarget);
            }
          }
          // Clean up extracted directory
          fs.rmSync(path.join(appPath, dir), { recursive: true, force: true });
        }
      }

      if (fs.existsSync(ffmpegTarget)) {
        fs.chmodSync(ffmpegTarget, 0o755);
      }
      if (fs.existsSync(ffprobeTarget)) {
        fs.chmodSync(ffprobeTarget, 0o755);
      }
    }

    onProgress?.(95, 0, 0, 0);
    onStatus?.('statusCleaningUp');

    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }

    onProgress?.(100, 0, 0, 0);

    return ffmpegTarget;
  } catch (e) {
    // Clean up on failure
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    throw e;
  }
};

const installFfmpeg = async () => {
  return downloadFfmpeg();
};

const formatProgressDetails = (downloaded: number, total: number, speed: number) => {
  const mbDownloaded = (downloaded / 1024 / 1024).toFixed(1);
  const mbTotal = (total / 1024 / 1024).toFixed(1);
  const mbSpeed = (speed / 1024 / 1024).toFixed(1);

  if (total > 0) {
    return `${mbDownloaded}MB / ${mbTotal}MB (${mbSpeed} MB/s)`;
  } else {
    return `${mbDownloaded}MB (${mbSpeed} MB/s)`;
  }
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#ffffff',
      height: 30,
    },
    backgroundColor: '#1a1a1a',
    icon: path.join(__dirname, '../build/icon.png'),
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.tomakura.ytdlpgui');
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('select-directory', async () => {
  const [window] = BrowserWindow.getAllWindows();
  const result = await dialog.showOpenDialog(window ?? undefined, {
    properties: ['openDirectory'],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('open-file-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  });
  if (canceled || filePaths.length === 0) {
    return null;
  }
  try {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return { content, filePath: filePaths[0] };
  } catch (e) {
    console.error('Failed to read file:', e);
    return null;
  }
});

ipcMain.handle('get-default-download-path', () => {
  return app.getPath('downloads');
});

const fetchJson = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const request = net.request({
      url,
      method: 'GET'
    });

    request.setHeader('User-Agent', 'yt-dlp-gui/1.0.0');
    request.setHeader('Accept', 'application/vnd.github.v3+json');

    let data = '';

    request.on('response', (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const location = Array.isArray(response.headers.location)
          ? response.headers.location[0]
          : response.headers.location;
        fetchJson(location).then(resolve).catch(reject);
        return;
      }

      // Check for non-2xx status codes
      if (response.statusCode < 200 || response.statusCode >= 300) {
        console.error(`fetchJson failed: ${url} returned status ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.on('data', (chunk) => {
        data += chunk.toString();
      });

      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.error(`fetchJson parse error for ${url}:`, e, 'Data:', data.substring(0, 200));
          reject(e);
        }
      });

      response.on('error', (error) => {
        console.error(`fetchJson response error for ${url}:`, error);
        reject(error);
      });
    });

    request.on('error', (error) => {
      console.error(`fetchJson request error for ${url}:`, error);
      reject(error);
    });

    request.end();
  });
};

ipcMain.handle('get-latest-binary-versions', async () => {
  let ytDlpLatest = 'Unknown';
  let ffmpegLatest = 'Unknown';

  try {
    const ytDlpRelease = await fetchJson('https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest');
    if (ytDlpRelease && ytDlpRelease.tag_name) {
      ytDlpLatest = ytDlpRelease.tag_name;
    }
  } catch (e) {
    console.error('Failed to fetch yt-dlp latest version', e);
  }

  // Determine ffmpeg source based on platform
  const isMac = process.platform === 'darwin';

  if (isMac) {
    // macOS uses ffbinaries
    try {
      const ffmpegData = await fetchJson('https://ffbinaries.com/api/v1/version/latest');
      if (ffmpegData && ffmpegData.version) {
        ffmpegLatest = ffmpegData.version;
      }
    } catch (e) {
      console.error('Failed to fetch ffmpeg latest version from ffbinaries', e);
    }
  } else {
    // Windows/Linux uses yt-dlp/FFmpeg-Builds
    // The "latest" release uses "master-latest" naming, extract N-number from release body or use tag
    try {
      const ffmpegRelease = await fetchJson('https://api.github.com/repos/yt-dlp/FFmpeg-Builds/releases/latest');
      if (ffmpegRelease) {
        // Try to extract N-number from release body (usually contains version info)
        const body = ffmpegRelease.body || '';
        const nMatch = body.match(/N-(\d+)/);
        if (nMatch) {
          ffmpegLatest = `N-${nMatch[1]}`;
        } else {
          // Fallback: check assets for autobuild naming or use "latest" tag
          const assets = ffmpegRelease.assets || [];
          const platformPattern = isWindows ? 'win64' : 'linux64';
          for (const asset of assets) {
            if (asset.name && asset.name.includes(platformPattern)) {
              // Try patterns like "ffmpeg-N-118134-..." or "ffmpeg-master-latest-..."
              const match = asset.name.match(/ffmpeg-(N-\d+)/);
              if (match) {
                ffmpegLatest = match[1];
                break;
              }
            }
          }
          // If still unknown, use a special marker for "latest" builds
          if (ffmpegLatest === 'Unknown' && ffmpegRelease.tag_name === 'latest') {
            ffmpegLatest = 'latest';
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch ffmpeg latest version from yt-dlp/FFmpeg-Builds', e);
    }
  }

  console.log('get-latest-binary-versions result:', { ytDlp: ytDlpLatest, ffmpeg: ffmpegLatest });
  return { ytDlp: ytDlpLatest, ffmpeg: ffmpegLatest };
});

ipcMain.handle('cancel-download', () => {
  if (activeDownloadProcess) {
    isDownloadCancelled = true;
    activeDownloadProcess.kill();
    return true;
  }
  return false;
});

ipcMain.handle('check-binaries', async () => {
  ensureAppPath();
  const ytDlpPath = resolveYtDlpPath();
  const ffmpegPath = resolveFfmpegPath();
  console.log('check-binaries:', { ytDlpPath, ffmpegPath, appPath });
  return {
    ytdlp: !!ytDlpPath,
    ffmpeg: !!ffmpegPath,
    path: appPath
  };
});

ipcMain.handle('get-binary-versions', async () => {
  const ytDlpPath = resolveYtDlpPath();
  const ffmpegPath = resolveFfmpegPath();

  let ytDlpVersion = 'Not detected';
  let ffmpegVersion = 'Not detected';

  if (ytDlpPath) {
    try {
      // Use async exec instead of spawnSync to avoid blocking
      // Quote path to handle spaces
      const { stdout } = await execAsync(`"${ytDlpPath}" --version`, {
        windowsHide: true,
        encoding: 'utf-8',
        timeout: 10000
      });
      if (stdout) {
        ytDlpVersion = stdout.trim();
      }
    } catch (e) {
      console.error('Error getting yt-dlp version:', e);
    }
  }

  if (ffmpegPath) {
    try {
      const { stdout } = await execAsync(`"${ffmpegPath}" -version`, {
        windowsHide: true,
        encoding: 'utf-8',
        timeout: 10000
      });
      if (stdout) {
        // ffmpeg version output is verbose, usually first line: "ffmpeg version 4.4.1 ..." or "ffmpeg version N-121938-g..."
        const firstLine = stdout.split('\n')[0];
        const match = firstLine.match(/ffmpeg version (\S+)/);
        if (match) {
          let version = match[1];
          // Truncate long git-based versions (e.g., "N-121938-g1a2b3c4d5e-..." -> "N-121938")
          if (version.startsWith('N-') && version.length > 15) {
            const parts = version.split('-');
            if (parts.length >= 2) {
              version = `${parts[0]}-${parts[1]}`;
            }
          }
          ffmpegVersion = version;
        } else {
          ffmpegVersion = firstLine; // Fallback
        }
      }
    } catch (e) {
      console.error('Error getting ffmpeg version:', e);
    }
  }

  return { ytDlp: ytDlpVersion, ffmpeg: ffmpegVersion };
});

ipcMain.handle('update-ytdlp', async (event) => {
  try {
    binaryDownloadController = new AbortController();
    const [window] = BrowserWindow.getAllWindows();
    const sendProgress = (percent: number, statusKey: string, progressData?: { downloaded: number, total: number, speed: number }) => {
      window?.webContents.send('binary-update-progress', { type: 'ytdlp', percent, statusKey, progressData });
    };
    sendProgress(0, 'statusDownloadingYtDlp');
    await downloadYtDlp((percent, downloaded, total, speed) => {
      if (percent >= 0) {
        sendProgress(percent, 'statusDownloadingYtDlp', { downloaded, total, speed });
      } else if (downloaded) {
        sendProgress(-1, 'statusDownloadingYtDlp', { downloaded, total: 0, speed });
      }
    });
    binaryDownloadController = null;
    // Send null to clear progress (indicates completion)
    window?.webContents.send('binary-update-progress', null);
    return true;
  } catch (error: any) {
    binaryDownloadController = null;
    const [window] = BrowserWindow.getAllWindows();
    window?.webContents.send('binary-update-progress', null);
    if (error?.message === 'Download cancelled') {
      return 'cancelled';
    }
    console.error('Failed to update yt-dlp', error);
    return false;
  }
});

ipcMain.handle('update-ffmpeg', async (event) => {
  try {
    binaryDownloadController = new AbortController();
    const [window] = BrowserWindow.getAllWindows();
    let currentStatusKey = 'statusDownloadingFfmpeg';
    const sendProgress = (percent: number, statusKey: string, progressData?: { downloaded: number, total: number, speed: number }) => {
      window?.webContents.send('binary-update-progress', { type: 'ffmpeg', percent, statusKey, progressData });
    };
    sendProgress(0, currentStatusKey);
    await downloadFfmpeg(
      (percent, downloaded, total, speed) => {
        if (percent >= 0) {
          sendProgress(percent, currentStatusKey, { downloaded, total, speed });
        } else if (downloaded) {
          sendProgress(-1, currentStatusKey, { downloaded, total: 0, speed });
        }
      },
      (statusKey) => {
        currentStatusKey = statusKey;
        sendProgress(-2, statusKey); // -2 indicates status change only
      }
    );
    binaryDownloadController = null;
    // Send null to clear progress (indicates completion)
    window?.webContents.send('binary-update-progress', null);
    return true;
  } catch (error: any) {
    binaryDownloadController = null;
    const [window] = BrowserWindow.getAllWindows();
    window?.webContents.send('binary-update-progress', null);
    if (error?.message === 'Download cancelled') {
      return 'cancelled';
    }
    console.error('Failed to update ffmpeg', error);
    return false;
  }
});

// Cancel binary download
ipcMain.handle('cancel-binary-download', () => {
  if (binaryDownloadController) {
    binaryDownloadController.abort();
    binaryDownloadController = null;
    return true;
  }
  return false;
});

ipcMain.handle('download-binaries', async () => {
  try {
    binaryDownloadController = new AbortController();
    const [window] = BrowserWindow.getAllWindows();
    let currentStatusKey = 'statusDownloadingYtDlp';

    const sendProgress = (percent: number, statusKey: string, progressData?: { downloaded: number, total: number, speed: number }) => {
      window?.webContents.send('binary-update-progress', { type: 'all', percent, statusKey, progressData });
    };

    sendProgress(0, currentStatusKey);

    // 1. Download yt-dlp (0-20%)
    await downloadYtDlp((percent, downloaded, total, speed) => {
      if (percent >= 0) {
        // Map 0-100% to 0-20%
        const overallPercent = Math.round(percent * 0.2);
        sendProgress(overallPercent, currentStatusKey, { downloaded, total, speed });
      } else if (downloaded) {
        sendProgress(-1, currentStatusKey, { downloaded, total: 0, speed });
      }
    });

    sendProgress(20, 'statusYtDlpDownloadComplete');

    // 2. Download ffmpeg (20-100%)
    currentStatusKey = 'statusDownloadingFfmpeg';
    await downloadFfmpeg(
      (percent, downloaded, total, speed) => {
        if (percent >= 0) {
          // Map 0-100% to 20-100% (range of 80%)
          const overallPercent = 20 + Math.round(percent * 0.8);
          sendProgress(overallPercent, currentStatusKey, { downloaded, total, speed });
        } else if (downloaded) {
          sendProgress(-1, currentStatusKey, { downloaded, total: 0, speed });
        }
      },
      (statusKey) => {
        currentStatusKey = statusKey;
        sendProgress(-2, statusKey);
      }
    );

    binaryDownloadController = null;
    window?.webContents.send('binary-update-progress', null);
    return true;
  } catch (error: any) {
    binaryDownloadController = null;
    const [window] = BrowserWindow.getAllWindows();
    window?.webContents.send('binary-update-progress', null);
    if (error?.message === 'Download cancelled') {
      return 'cancelled';
    }
    console.error('Failed to download binaries', error);
    return false;
  }
});

ipcMain.on('open-folder', (_event, folderPath: string) => {
  shell.openPath(folderPath);
});

ipcMain.on('download', async (event, payload: DownloadPayload) => {
  const ytdlpPath = resolveYtDlpPath();
  const ffmpegPath = resolveFfmpegPath();

  if (!ytdlpPath) {
    event.reply('download-complete', { success: false, message: 'yt-dlp not found.' });
    return;
  }

  // Check execution permissions
  try {
    if (!isWindows) {
      fs.accessSync(ytdlpPath, fs.constants.X_OK);
    }
  } catch (e) {
    try {
      fs.chmodSync(ytdlpPath, 0o755);
    } catch (e2: any) {
      event.reply('download-complete', { success: false, message: `No execution permission for yt-dlp: ${e2.message}` });
      return;
    }
  }

  event.reply('download-progress', '📥 Calling yt-dlp...');
  event.reply('download-progress', `🔗 URL: ${payload.url}`);
  event.reply('download-progress', `🛠 yt-dlp Path: ${ytdlpPath}`);

  const outputPath = path.join(payload.location, payload.outputTemplate || '%(title)s.%(ext)s');

  const args: string[] = [
    payload.url,
    '-o',
    outputPath,
    '--no-mtime',
    '--print', 'after_move:filepath',
    '--print', 'title',
    // Use default player client to avoid SABR streaming issues
    '--extractor-args', 'youtube:player_client=default',
    // Force UTF-8 encoding for consistent output on Windows
    '--encoding', 'utf-8',
  ];

  if (ffmpegPath) {
    // yt-dlp expects a directory for ffmpeg-location when resolving ffprobe.
    // If we only have a binary path, pass its directory instead.
    let ffmpegLocationArg: string | null = null;
    try {
      const stats = fs.statSync(ffmpegPath);
      ffmpegLocationArg = stats.isDirectory() ? ffmpegPath : path.dirname(ffmpegPath);
    } catch {
      // If the path isn't directly accessible (e.g., system ffmpeg), use it as-is
      ffmpegLocationArg = ffmpegPath;
    }

    if (ffmpegLocationArg !== 'ffmpeg') {
      args.push('--ffmpeg-location', ffmpegLocationArg);
    }
  }

  // Advanced options (only for video mode or applicable audio options)
  if (payload.advancedOptions.embedThumbnail) args.push('--embed-thumbnail');
  if (payload.advancedOptions.addMetadata) args.push('--add-metadata');

  // Video-only options
  if (payload.options.type === 'video') {
    if (payload.advancedOptions.embedSubs) args.push('--embed-subs');
    if (payload.advancedOptions.writeAutoSub) args.push('--write-auto-sub');
    if (payload.advancedOptions.splitChapters) args.push('--split-chapters');
  }

  if (payload.advancedOptions.cookiesBrowser !== 'none') {
    args.push('--cookies-from-browser', payload.advancedOptions.cookiesBrowser);
  }
  if (payload.advancedOptions.playlist === 'single') args.push('--no-playlist');
  if (payload.advancedOptions.playlist === 'playlist') args.push('--yes-playlist');

  // Time Range
  if (payload.advancedOptions.timeRange?.enabled && payload.advancedOptions.timeRange.start && payload.advancedOptions.timeRange.end) {
    args.push('--download-sections', `*${payload.advancedOptions.timeRange.start}-${payload.advancedOptions.timeRange.end}`);
    // Force re-encoding to ensure accurate cuts, especially for non-keyframe cuts
    args.push('--force-keyframes-at-cuts');
  }

  if (payload.options.type === 'audio') {
    event.reply('download-progress', `🎵 Audio format: ${payload.options.audioFormat.toUpperCase()}`);

    args.push(
      '-x',
      '--audio-format',
      payload.options.audioFormat
    );

    // WAV uses bit depth instead of bitrate
    if (payload.options.audioFormat === 'wav') {
      event.reply('download-progress', `📊 Bit depth: ${payload.options.audioBitDepth || '16'}bit`);
      // WAV doesn't support --audio-quality, use postprocessor args for bit depth
      const bitDepth = payload.options.audioBitDepth || '16';
      args.push('--postprocessor-args', `ffmpeg:-acodec pcm_s${bitDepth}le`);
    } else {
      event.reply('download-progress', `📊 Bitrate: ${payload.options.audioBitrate}`);
      args.push('--audio-quality', payload.options.audioBitrate);
    }
  } else {
    event.reply('download-progress', `🎬 Video format: ${payload.options.videoContainer.toUpperCase()}`);
    event.reply('download-progress', `📐 Resolution: ${payload.options.videoResolution}`);

    if (payload.options.videoResolution !== 'best') {
      const height = payload.options.videoResolution.replace('p', '');
      args.push('-f', `bestvideo[height<=${height}]+bestaudio/best`);
    } else {
      args.push('-f', 'bestvideo+bestaudio/best');
    }
    args.push('--merge-output-format', payload.options.videoContainer);

    // Video conversion options
    if (payload.videoConversion?.enabled) {
      event.reply('download-progress', `🔄 Conversion: video=${payload.videoConversion.videoCodec}, audio=${payload.videoConversion.audioCodec}`);

      const postArgs: string[] = [];
      const hwEncoder = payload.videoConversion.hwEncoder || 'auto';

      if (payload.videoConversion.videoCodec !== 'copy') {
        // Hardware encoder mapping
        const getHwEncoderCodec = (codec: string, hw: HwEncoder): string => {
          if (hw === 'none') {
            // Software encoders
            const softwareCodecMap: Record<string, string> = {
              'h264': 'libx264',
              'h265': 'libx265',
              'vp9': 'libvpx-vp9',
              'av1': 'libaom-av1'
            };
            return softwareCodecMap[codec] || 'libx264';
          }

          // Hardware encoder specific codecs
          const hwCodecMap: Record<string, Record<string, string>> = {
            'nvenc': {
              'h264': 'h264_nvenc',
              'h265': 'hevc_nvenc',
              'av1': 'av1_nvenc'
            },
            'qsv': {
              'h264': 'h264_qsv',
              'h265': 'hevc_qsv',
              'av1': 'av1_qsv',
              'vp9': 'vp9_qsv'
            },
            'videotoolbox': {
              'h264': 'h264_videotoolbox',
              'h265': 'hevc_videotoolbox'
            },
            'amf': {
              'h264': 'h264_amf',
              'h265': 'hevc_amf'
            }
          };

          if (hw === 'auto') {
            // Try to detect available encoder
            // Priority: videotoolbox (macOS) > nvenc > qsv > amf > software
            const isMacOS = process.platform === 'darwin';
            if (isMacOS && hwCodecMap['videotoolbox'][codec]) {
              return hwCodecMap['videotoolbox'][codec];
            }
            // For auto on other platforms, fall back to software
            const softwareCodecMap: Record<string, string> = {
              'h264': 'libx264',
              'h265': 'libx265',
              'vp9': 'libvpx-vp9',
              'av1': 'libaom-av1'
            };
            return softwareCodecMap[codec] || 'libx264';
          }

          return hwCodecMap[hw]?.[codec] || 'libx264';
        };

        const selectedCodec = getHwEncoderCodec(payload.videoConversion.videoCodec, hwEncoder);
        postArgs.push(`-c:v ${selectedCodec}`);

        if (hwEncoder !== 'none' && hwEncoder !== 'auto') {
          event.reply('download-progress', `🎮 Using hardware encoder: ${hwEncoder.toUpperCase()}`);
        }

        if (payload.videoConversion.videoBitrate) {
          postArgs.push(`-b:v ${payload.videoConversion.videoBitrate}`);
        }
      }

      if (payload.videoConversion.audioCodec !== 'copy') {
        const audioCodecMap: Record<string, string> = {
          'aac': 'aac',
          'mp3': 'libmp3lame',
          'opus': 'libopus'
        };
        postArgs.push(`-c:a ${audioCodecMap[payload.videoConversion.audioCodec]}`);
        if (payload.videoConversion.audioBitrate) {
          postArgs.push(`-b:a ${payload.videoConversion.audioBitrate}`);
        }
      }

      if (postArgs.length > 0) {
        args.push('--postprocessor-args', `ffmpeg:${postArgs.join(' ')}`);
      }
    }
  }

  if (payload.args?.length) {
    args.push(...payload.args);
  }

  event.reply('download-progress', '⏳ Starting download...');

  let downloadedTitle = '';
  let downloadedFilepath = '';

  isDownloadCancelled = false;

  // Provide Node.js path to yt-dlp for JavaScript runtime support
  // On Windows, set PYTHONIOENCODING to utf-8 to avoid encoding issues
  const spawnEnv: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: `${path.dirname(process.execPath)}${isWindows ? ';' : ':'}${process.env.PATH || ''}`,
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1'
  };

  activeDownloadProcess = spawn(ytdlpPath, args, {
    windowsHide: true,
    env: spawnEnv
  });

  if (activeDownloadProcess.stdout) {
    activeDownloadProcess.stdout.setEncoding('utf8');
    activeDownloadProcess.stdout.on('data', (data: string) => {
      const output = data.trim();
      const lines = output.split('\n');

      lines.forEach(line => {
        // Extract title and filepath from --print output
        if (!downloadedTitle && line && !line.includes('[') && !line.includes('%')) {
          downloadedTitle = line;
        }
        if (line && (line.endsWith('.mp4') || line.endsWith('.mkv') || line.endsWith('.webm') ||
          line.endsWith('.mp3') || line.endsWith('.m4a') || line.endsWith('.flac') ||
          line.endsWith('.wav') || line.endsWith('.aac'))) {
          downloadedFilepath = line;
        }

        event.reply('download-progress', line);
      });
    });
  }

  if (activeDownloadProcess.stderr) {
    activeDownloadProcess.stderr.setEncoding('utf8');
    activeDownloadProcess.stderr.on('data', (data: string) => {
      event.reply('download-progress', data);
    });
  }

  activeDownloadProcess.on('error', (error) => {
    event.reply('download-progress', `❌ Error: ${error.message}`);
    event.reply('download-complete', { success: false, message: 'Failed to start download.' });
  });

  activeDownloadProcess.on('close', (code) => {
    activeDownloadProcess = null;

    if (isDownloadCancelled) {
      event.reply('download-progress', '🚫 Download cancelled.');
      event.reply('download-complete', {
        success: false,
        message: 'Download cancelled.',
        title: downloadedTitle,
        filename: downloadedFilepath
      });
      return;
    }

    let fileSize = 0;
    if (downloadedFilepath && fs.existsSync(downloadedFilepath)) {
      try {
        const stats = fs.statSync(downloadedFilepath);
        fileSize = stats.size;
      } catch (e) {
        // Ignore file stat errors
      }
    }

    if (code === 0) {
      event.reply('download-progress', '✅ Download complete!');
      event.reply('download-complete', {
        success: true,
        message: 'Download complete.',
        title: downloadedTitle,
        filename: downloadedFilepath,
        fileSize
      });
    } else {
      event.reply('download-progress', `❌ Error occurred (code: ${code})`);
      event.reply('download-complete', {
        success: false,
        message: `Error occurred (code: ${code})`,
        title: downloadedTitle,
        filename: downloadedFilepath,
        fileSize
      });
    }
  });
});

ipcMain.handle('check-app-update', async () => {
  try {
    // Replace with your actual repository
    const release = await fetchJson('https://api.github.com/repos/tomakura/yt-dlp-gui/releases/latest');
    if (!release || !release.tag_name) {
      throw new Error('Invalid release data');
    }

    const latestVersion = release.tag_name.replace(/^v/, '');
    const currentVersion = app.getVersion();

    // Simple string comparison for now, or use semver if needed
    // Assuming versions are like "0.0.1"
    const isUpdateAvailable = latestVersion !== currentVersion;

    return {
      available: isUpdateAvailable,
      currentVersion,
      latestVersion,
      url: release.html_url
    };
  } catch (e) {
    console.error('Failed to check for app updates', e);
    return {
      available: false,
      currentVersion: app.getVersion(),
      error: 'Failed to check for updates'
    };
  }
});

ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url);
});

// Fetch video information for preview
ipcMain.handle('fetch-video-info', async (_, url: string) => {
  const ytdlpPath = resolveYtDlpPath();

  if (!ytdlpPath) {
    return { error: 'yt-dlp not found' };
  }

  try {
    const args = [
      url,
      '-J', // Output JSON
      '--playlist-end', '50', // Limit to 50 items for preview performance
      '--ignore-errors', // Continue even if some videos are unavailable
      '--no-warnings',
      '--extractor-args', 'youtube:player_client=default',
      '--encoding', 'utf-8',
    ];

    // Set encoding environment variables for Windows
    const spawnEnv: NodeJS.ProcessEnv = {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1'
    };

    const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const proc = spawn(ytdlpPath, args, { windowsHide: true, env: spawnEnv });

      proc.stdout?.setEncoding('utf8');
      proc.stdout?.on('data', (data: string) => {
        stdout += data;
      });

      proc.stderr?.setEncoding('utf8');
      proc.stderr?.on('data', (data: string) => {
        stderr += data;
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });

      proc.on('error', reject);

      // Timeout after 30 seconds
      setTimeout(() => {
        proc.kill();
        reject(new Error('Timeout'));
      }, 30000);
    });

    const data = JSON.parse(result.stdout);

    // Check if it's a playlist
    if (data._type === 'playlist' && data.entries) {
      // For playlists, we need to get more details for each entry
      // But for performance, we'll limit to first 50 entries
      const entries = data.entries.slice(0, 50).map((entry: any) => {
        // Calculate best resolution for entry
        let bestResolution: string | undefined;
        // Check if formats are available (might not be with flat-playlist)
        if (entry.formats) {
          const heights = entry.formats
            .filter((f: any) => f.height && f.vcodec && f.vcodec !== 'none')
            .map((f: any) => f.height);

          if (heights.length > 0) {
            const maxHeight = Math.max(...heights);
            if (maxHeight >= 2160) bestResolution = '4K';
            else if (maxHeight >= 1440) bestResolution = '1440p';
            else if (maxHeight >= 1080) bestResolution = '1080p';
            else if (maxHeight >= 720) bestResolution = '720p';
            else if (maxHeight >= 480) bestResolution = '480p';
            else if (maxHeight >= 360) bestResolution = '360p';
            else bestResolution = `${maxHeight}p`;
          }
        }
        // Fallback to entry.height if available (common in flat-playlist)
        else if (entry.height) {
          const maxHeight = entry.height;
          if (maxHeight >= 2160) bestResolution = '4K';
          else if (maxHeight >= 1440) bestResolution = '1440p';
          else if (maxHeight >= 1080) bestResolution = '1080p';
          else if (maxHeight >= 720) bestResolution = '720p';
          else if (maxHeight >= 480) bestResolution = '480p';
          else if (maxHeight >= 360) bestResolution = '360p';
          else bestResolution = `${maxHeight}p`;
        }

        return {
          id: entry.id || entry.url,
          title: entry.title || 'Unknown',
          channel: entry.channel || entry.uploader || data.channel || data.uploader || 'Unknown',
          thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url || '',
          duration: entry.duration || 0,
          viewCount: entry.view_count,
          filesize: entry.filesize || entry.filesize_approx,
          bestResolution,
        };
      });

      return {
        isPlaylist: true,
        playlist: {
          id: data.id,
          title: data.title,
          channel: data.channel || data.uploader || 'Unknown',
          thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || entries[0]?.thumbnail,
          videoCount: data.playlist_count || entries.length,
          entries,
        }
      };
    }

    // Single video
    // Get format info for size estimation
    const formats = (data.formats || []).map((f: any) => ({
      format_id: f.format_id,
      ext: f.ext,
      resolution: f.resolution || (f.height ? `${f.width}x${f.height}` : null),
      height: f.height,
      filesize: f.filesize,
      filesize_approx: f.filesize_approx,
      vcodec: f.vcodec,
      acodec: f.acodec,
      tbr: f.tbr,
      abr: f.abr,
    }));

    // Calculate approximate total size
    let estimatedSize = 0;
    const videoFormats = formats.filter((f: any) => f.vcodec && f.vcodec !== 'none');
    const audioFormats = formats.filter((f: any) => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'));

    if (videoFormats.length > 0) {
      const bestVideo = videoFormats.sort((a: any, b: any) =>
        (b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0)
      )[0];
      estimatedSize += bestVideo.filesize || bestVideo.filesize_approx || 0;
    }

    if (audioFormats.length > 0) {
      const bestAudio = audioFormats.sort((a: any, b: any) =>
        (b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0)
      )[0];
      estimatedSize += bestAudio.filesize || bestAudio.filesize_approx || 0;
    }

    // Get best resolution from video formats
    let bestResolution: string | undefined;
    if (videoFormats.length > 0) {
      // Get all heights and find the max
      const heights = (data.formats || [])
        .filter((f: any) => f.height && f.vcodec && f.vcodec !== 'none')
        .map((f: any) => f.height);

      if (heights.length > 0) {
        const maxHeight = Math.max(...heights);
        // Convert to standard resolution names
        if (maxHeight >= 2160) bestResolution = '4K';
        else if (maxHeight >= 1440) bestResolution = '1440p';
        else if (maxHeight >= 1080) bestResolution = '1080p';
        else if (maxHeight >= 720) bestResolution = '720p';
        else if (maxHeight >= 480) bestResolution = '480p';
        else if (maxHeight >= 360) bestResolution = '360p';
        else bestResolution = `${maxHeight}p`;
      }
    }

    return {
      isPlaylist: false,
      video: {
        id: data.id,
        title: data.title || 'Unknown',
        channel: data.channel || data.uploader || 'Unknown',
        channelUrl: data.channel_url || data.uploader_url,
        thumbnail: data.thumbnail || data.thumbnails?.slice(-1)[0]?.url || '',
        duration: data.duration || 0,
        viewCount: data.view_count,
        uploadDate: data.upload_date,
        description: data.description?.substring(0, 200),
        filesize: estimatedSize || data.filesize || data.filesize_approx,
        formats,
        bestResolution,
      }
    };
  } catch (error: any) {
    console.error('Failed to fetch video info:', error);
    return { error: error.message || 'Failed to fetch video info' };
  }
});

// Detect available hardware encoders
ipcMain.handle('detect-hw-encoders', async () => {
  const ffmpegPath = resolveFfmpegPath();

  if (!ffmpegPath) {
    return { available: [] };
  }

  const encoders: string[] = [];

  try {
    const { stdout } = await execAsync(`"${ffmpegPath}" -hide_banner -encoders`);

    // Check for NVENC (NVIDIA)
    if (stdout.includes('h264_nvenc') || stdout.includes('hevc_nvenc')) {
      encoders.push('nvenc');
    }

    // Check for QuickSync (Intel)
    if (stdout.includes('h264_qsv') || stdout.includes('hevc_qsv')) {
      encoders.push('qsv');
    }

    // Check for VideoToolbox (Apple)
    if (stdout.includes('h264_videotoolbox') || stdout.includes('hevc_videotoolbox')) {
      encoders.push('videotoolbox');
    }

    // Check for AMF (AMD)
    if (stdout.includes('h264_amf') || stdout.includes('hevc_amf')) {
      encoders.push('amf');
    }
  } catch (e) {
    console.error('Failed to detect hardware encoders:', e);
  }

  return { available: encoders };
});

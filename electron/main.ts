import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
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

interface VideoConversionOptions {
  enabled: boolean;
  videoCodec: 'copy' | 'h264' | 'h265' | 'vp9' | 'av1';
  videoBitrate: string;
  audioCodec: 'copy' | 'aac' | 'mp3' | 'opus';
  audioBitrate: string;
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
  };
  videoConversion?: VideoConversionOptions;
  outputTemplate: string;
}

const isWindows = process.platform === 'win32';
const appPath = app.isPackaged
  ? path.join(process.resourcesPath, 'Application')
  : path.join(process.cwd(), 'Application');

const ensureAppPath = () => {
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath, { recursive: true });
  }
};

const commandExists = (cmd: string) => {
  try {
    const result = spawnSync(cmd, ['--version'], { windowsHide: true });
    return result.status === 0;
  } catch {
    return false;
  }
};

const ytDlpBinaryPath = (ytDlp as unknown as { path?: string }).path;

const resolveYtDlpPath = () => {
  const bundled = path.join(appPath, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
  if (fs.existsSync(bundled)) return bundled;

  if (ytDlpBinaryPath && fs.existsSync(ytDlpBinaryPath)) return ytDlpBinaryPath;
  return commandExists('yt-dlp') ? 'yt-dlp' : null;
};

const resolveFfmpegPath = () => {
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
  const target = path.join(appPath, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
  const url = isWindows
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
  await downloadFile(url, target, onProgress);
  onProgress?.(100, 0, 0, 0);
  return target;
};

const downloadFfmpeg = async (onProgress?: (percent: number, downloaded: number, total: number, speed: number) => void, onStatus?: (status: string) => void) => {
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';

  const ffmpegTarget = path.join(appPath, isWindows ? 'ffmpeg.exe' : 'ffmpeg');
  const ffprobeTarget = path.join(appPath, isWindows ? 'ffprobe.exe' : 'ffprobe');

  // For macOS, use ffbinaries (GitHub Releases) for faster download
  // Note: Currently using x64 builds which work on ARM64 via Rosetta 2
  if (isMac) {
    try {
      onStatus?.('ffmpeg と ffprobe をダウンロード中 (GitHub)...');

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
      onStatus?.('ffmpeg/ffprobe を展開中...');
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
    onStatus?.('ffmpeg をダウンロード中...');
    await downloadFile(url, tempFile, (p, downloaded, total, speed) => {
      if (p >= 0) {
        onProgress?.(Math.round(p * 0.8), downloaded, total, speed); // 0-80% for download
      } else if (downloaded) {
        onProgress?.(-1, downloaded, total, speed);
      }
    });

    onStatus?.('ffmpeg を展開中...');
    onProgress?.(85, 0, 0, 0);

    if (isWindows) {
      // Extract zip on Windows
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(tempFile);
      const entries = zip.getEntries();
      for (const entry of entries) {
        if (entry.entryName.endsWith('ffmpeg.exe')) {
          zip.extractEntryTo(entry, appPath, false, true);
        }
        if (entry.entryName.endsWith('ffprobe.exe')) {
          zip.extractEntryTo(entry, appPath, false, true);
        }
      }
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
    onStatus?.('クリーンアップ中...');

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
      preload: path.join(__dirname, 'preload.js'),
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
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

app.whenReady().then(createWindow);

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

const fetchJson = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'yt-dlp-gui' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

ipcMain.handle('get-latest-binary-versions', async () => {
  let ytDlpLatest = '不明';
  let ffmpegLatest = '不明';

  try {
    const ytDlpRelease = await fetchJson('https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest');
    if (ytDlpRelease && ytDlpRelease.tag_name) {
      ytDlpLatest = ytDlpRelease.tag_name;
    }
  } catch (e) {
    console.error('Failed to fetch yt-dlp latest version', e);
  }

  // For ffmpeg, we use ffbinaries which doesn't have a simple API for "latest version" that matches the binary version exactly.
  // But we can try to fetch from ffbinaries API if available, or just skip it for now.
  // ffbinaries-node uses http://ffbinaries.com/api/v1/version/latest
  try {
    // This is a guess based on ffbinaries-node behavior
    // Actually, let's just check the github release for ffbinaries-prebuilt if possible, 
    // or just return '不明' if it's too complex.
    // Let's try fetching from ffbinaries.com API
    const ffmpegData = await fetchJson('https://ffbinaries.com/api/v1/version/latest');
    if (ffmpegData && ffmpegData.version) {
      ffmpegLatest = ffmpegData.version;
    }
  } catch (e) {
    console.error('Failed to fetch ffmpeg latest version', e);
  }

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
  const ytDlpPath = resolveYtDlpPath();
  const ffmpegPath = resolveFfmpegPath();
  return {
    ytdlp: !!ytDlpPath,
    ffmpeg: !!ffmpegPath,
    path: appPath
  };
});

ipcMain.handle('get-binary-versions', async () => {
  const ytDlpPath = resolveYtDlpPath();
  const ffmpegPath = resolveFfmpegPath();

  let ytDlpVersion = '未検出';
  let ffmpegVersion = '未検出';

  if (ytDlpPath) {
    try {
      const { stdout } = await execAsync(`"${ytDlpPath}" --version`);
      ytDlpVersion = stdout.trim();
    } catch (e) {
      console.error('Error getting yt-dlp version:', e);
    }
  }

  if (ffmpegPath) {
    try {
      const { stdout } = await execAsync(`"${ffmpegPath}" -version`);
      // ffmpeg version output is verbose, usually first line: "ffmpeg version 4.4.1 ..."
      const firstLine = stdout.split('\n')[0];
      const match = firstLine.match(/ffmpeg version (\S+)/);
      if (match) {
        ffmpegVersion = match[1];
      } else {
        ffmpegVersion = firstLine; // Fallback
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
    let currentStatus = 'yt-dlp をダウンロード中...';
    const sendProgress = (percent: number, status: string, downloaded?: number) => {
      window?.webContents.send('binary-update-progress', { type: 'ytdlp', percent, status, downloaded });
    };
    sendProgress(0, currentStatus);
    await downloadYtDlp((percent, downloaded, total, speed) => {
      if (percent >= 0) {
        const details = formatProgressDetails(downloaded, total, speed);
        sendProgress(percent, `${currentStatus} ${percent}% - ${details}`, downloaded);
      } else if (downloaded) {
        const details = formatProgressDetails(downloaded, 0, speed);
        sendProgress(-1, `${currentStatus} ${details}`, downloaded);
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
    let currentStatus = 'ffmpeg をダウンロード中...';
    const sendProgress = (percent: number, status: string, downloaded?: number) => {
      window?.webContents.send('binary-update-progress', { type: 'ffmpeg', percent, status, downloaded });
    };
    sendProgress(0, currentStatus);
    await downloadFfmpeg(
      (percent, downloaded, total, speed) => {
        if (percent >= 0) {
          const details = formatProgressDetails(downloaded, total, speed);
          sendProgress(percent, `${currentStatus} ${percent}% - ${details}`, downloaded);
        } else if (downloaded) {
          const details = formatProgressDetails(downloaded, 0, speed);
          sendProgress(-1, `${currentStatus} ${details}`, downloaded);
        }
      },
      (status) => {
        currentStatus = status;
        sendProgress(-2, status); // -2 indicates status change only
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
    let currentStatus = 'yt-dlp をダウンロード中...';

    const sendProgress = (percent: number, status: string, downloaded?: number) => {
      window?.webContents.send('binary-update-progress', { type: 'all', percent, status, downloaded });
    };

    sendProgress(0, currentStatus);

    // 1. Download yt-dlp (0-20%)
    await downloadYtDlp((percent, downloaded, total, speed) => {
      if (percent >= 0) {
        // Map 0-100% to 0-20%
        const overallPercent = Math.round(percent * 0.2);
        const details = formatProgressDetails(downloaded, total, speed);
        sendProgress(overallPercent, `${currentStatus} ${percent}% - ${details}`, downloaded);
      } else if (downloaded) {
        const details = formatProgressDetails(downloaded, 0, speed);
        sendProgress(-1, `${currentStatus} ${details}`, downloaded);
      }
    });

    sendProgress(20, 'yt-dlp のダウンロード完了');

    // 2. Download ffmpeg (20-100%)
    currentStatus = 'ffmpeg をダウンロード中...';
    await downloadFfmpeg(
      (percent, downloaded, total, speed) => {
        if (percent >= 0) {
          // Map 0-100% to 20-100% (range of 80%)
          const overallPercent = 20 + Math.round(percent * 0.8);
          const details = formatProgressDetails(downloaded, total, speed);
          sendProgress(overallPercent, `${currentStatus} ${percent}% - ${details}`, downloaded);
        } else if (downloaded) {
          const details = formatProgressDetails(downloaded, 0, speed);
          sendProgress(-1, `${currentStatus} ${details}`, downloaded);
        }
      },
      (status) => {
        currentStatus = status;
        sendProgress(-2, status);
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
    event.reply('download-complete', { success: false, message: 'yt-dlp が見つかりませんでした。' });
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
      event.reply('download-complete', { success: false, message: `yt-dlp の実行権限がありません: ${e2.message}` });
      return;
    }
  }

  event.reply('download-progress', '📥 yt-dlpを呼び出しています...');
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
  ];

  if (ffmpegPath && ffmpegPath !== 'ffmpeg') {
    // Pass the full path to the binary, not just the directory
    // This helps yt-dlp find the companion ffprobe binary more reliably
    args.push('--ffmpeg-location', ffmpegPath);
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

  if (payload.options.type === 'audio') {
    event.reply('download-progress', `🎵 音声形式: ${payload.options.audioFormat.toUpperCase()}`);

    args.push(
      '-x',
      '--audio-format',
      payload.options.audioFormat
    );

    // WAV uses bit depth instead of bitrate
    if (payload.options.audioFormat === 'wav') {
      event.reply('download-progress', `📊 ビット深度: ${payload.options.audioBitDepth || '16'}bit`);
      // WAV doesn't support --audio-quality, use postprocessor args for bit depth
      const bitDepth = payload.options.audioBitDepth || '16';
      args.push('--postprocessor-args', `ffmpeg:-acodec pcm_s${bitDepth}le`);
    } else {
      event.reply('download-progress', `📊 ビットレート: ${payload.options.audioBitrate}`);
      args.push('--audio-quality', payload.options.audioBitrate);
    }
  } else {
    event.reply('download-progress', `🎬 動画形式: ${payload.options.videoContainer.toUpperCase()}`);
    event.reply('download-progress', `📐 解像度: ${payload.options.videoResolution}`);

    if (payload.options.videoResolution !== 'best') {
      const height = payload.options.videoResolution.replace('p', '');
      args.push('-f', `bestvideo[height<=${height}]+bestaudio/best`);
    } else {
      args.push('-f', 'bestvideo+bestaudio/best');
    }
    args.push('--merge-output-format', payload.options.videoContainer);

    // Video conversion options
    if (payload.videoConversion?.enabled) {
      event.reply('download-progress', `🔄 変換オプション: 動画コーデック=${payload.videoConversion.videoCodec}, 音声コーデック=${payload.videoConversion.audioCodec}`);

      const postArgs: string[] = [];

      if (payload.videoConversion.videoCodec !== 'copy') {
        const codecMap: Record<string, string> = {
          'h264': 'libx264',
          'h265': 'libx265',
          'vp9': 'libvpx-vp9',
          'av1': 'libaom-av1'
        };
        postArgs.push(`-c:v ${codecMap[payload.videoConversion.videoCodec]}`);
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

  event.reply('download-progress', '⏳ ダウンロードを開始します...');

  let downloadedTitle = '';
  let downloadedFilepath = '';

  isDownloadCancelled = false;
  activeDownloadProcess = spawn(ytdlpPath, args, { windowsHide: true });

  if (activeDownloadProcess.stdout) {
    activeDownloadProcess.stdout.on('data', (data: Buffer) => {
      const output = data.toString().trim();
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
    activeDownloadProcess.stderr.on('data', (data: Buffer) => {
      event.reply('download-progress', data.toString());
    });
  }

  activeDownloadProcess.on('error', (error) => {
    event.reply('download-progress', `❌ エラー: ${error.message}`);
    event.reply('download-complete', { success: false, message: 'ダウンロード開始に失敗しました。' });
  });

  activeDownloadProcess.on('close', (code) => {
    activeDownloadProcess = null;

    if (isDownloadCancelled) {
      event.reply('download-progress', '🚫 ダウンロードをキャンセルしました。');
      event.reply('download-complete', {
        success: false,
        message: 'ダウンロードをキャンセルしました。',
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
      event.reply('download-progress', '✅ ダウンロードが完了しました！');
      event.reply('download-complete', {
        success: true,
        message: 'ダウンロードが完了しました。',
        title: downloadedTitle,
        filename: downloadedFilepath,
        fileSize
      });
    } else {
      event.reply('download-progress', `❌ エラーが発生しました (コード: ${code})`);
      event.reply('download-complete', {
        success: false,
        message: `エラーが発生しました (コード: ${code})`,
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
      error: '更新の確認に失敗しました'
    };
  }
});

ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url);
});

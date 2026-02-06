"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path_1 = require("path");
var fs_1 = require("fs");
var https_1 = require("https");
var child_process_1 = require("child_process");
var url_1 = require("url");
var module_1 = require("module");
var child_process_2 = require("child_process");
var util_1 = require("util");
var execAsync = (0, util_1.promisify)(child_process_2.exec);
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var require = (0, module_1.createRequire)(import.meta.url);
// Safe require for optional dependencies
var ffmpegStatic = null;
var ytDlp = {};
try {
    ffmpegStatic = require('ffmpeg-static');
}
catch (e) {
    console.log('ffmpeg-static not available');
}
try {
    ytDlp = require('yt-dlp-exec');
}
catch (e) {
    console.log('yt-dlp-exec not available');
}
var isWindows = process.platform === 'win32';
var appPath = electron_1.app.isPackaged
    ? path_1.default.join(process.resourcesPath, 'Application')
    : path_1.default.join(process.cwd(), 'Application');
var ensureAppPath = function () {
    if (!fs_1.default.existsSync(appPath)) {
        fs_1.default.mkdirSync(appPath, { recursive: true });
    }
};
var commandExists = function (cmd) {
    try {
        var result = (0, child_process_1.spawnSync)(cmd, ['--version'], { windowsHide: true });
        return result.status === 0;
    }
    catch (_a) {
        return false;
    }
};
var ytDlpBinaryPath = ytDlp.path;
var resolveYtDlpPath = function () {
    var bundled = path_1.default.join(appPath, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
    if (fs_1.default.existsSync(bundled))
        return bundled;
    if (ytDlpBinaryPath && fs_1.default.existsSync(ytDlpBinaryPath))
        return ytDlpBinaryPath;
    return commandExists('yt-dlp') ? 'yt-dlp' : null;
};
var resolveFfmpegPath = function () {
    var bundled = path_1.default.join(appPath, isWindows ? 'ffmpeg.exe' : 'ffmpeg');
    if (fs_1.default.existsSync(bundled))
        return bundled;
    if (ffmpegStatic && fs_1.default.existsSync(ffmpegStatic))
        return ffmpegStatic;
    return commandExists('ffmpeg') ? 'ffmpeg' : null;
};
var copyBinary = function (from, to) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ensureAppPath();
                return [4 /*yield*/, fs_1.default.promises.copyFile(from, to)];
            case 1:
                _a.sent();
                if (!!isWindows) return [3 /*break*/, 3];
                return [4 /*yield*/, fs_1.default.promises.chmod(to, 493)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
// Global abort controller for binary downloads
var binaryDownloadController = null;
var activeDownloadProcess = null;
var isDownloadCancelled = false;
var downloadFile = function (url, destination, onProgress) {
    return new Promise(function (resolve, reject) {
        ensureAppPath();
        var makeRequest = function (requestUrl) {
            var file = fs_1.default.createWriteStream(destination);
            var req = https_1.default.get(requestUrl, function (res) {
                // Handle redirects
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    file.close();
                    fs_1.default.unlink(destination, function () { }); // Clean up empty file
                    var redirectUrl = res.headers.location;
                    if (redirectUrl.startsWith('/')) {
                        var parsedUrl = new URL(requestUrl);
                        redirectUrl = "".concat(parsedUrl.protocol, "//").concat(parsedUrl.host).concat(redirectUrl);
                    }
                    else if (!redirectUrl.startsWith('http')) {
                        var parsedUrl = new URL(requestUrl);
                        var pathParts = parsedUrl.pathname.split('/');
                        pathParts.pop();
                        redirectUrl = "".concat(parsedUrl.protocol, "//").concat(parsedUrl.host).concat(pathParts.join('/'), "/").concat(redirectUrl);
                    }
                    makeRequest(redirectUrl);
                    return;
                }
                if (res.statusCode && res.statusCode >= 400) {
                    file.close();
                    reject(new Error("HTTP Error: ".concat(res.statusCode)));
                    return;
                }
                // Track progress
                var totalSize = parseInt(res.headers['content-length'] || '0', 10);
                var downloaded = 0;
                var startTime = Date.now();
                var lastUpdate = 0;
                res.on('data', function (chunk) {
                    downloaded += chunk.length;
                    var now = Date.now();
                    // Update every 100ms to avoid excessive IPC
                    if (now - lastUpdate > 100 || downloaded === totalSize) {
                        var elapsed = (now - startTime) / 1000; // seconds
                        var speed = elapsed > 0 ? downloaded / elapsed : 0; // bytes/sec
                        if (onProgress) {
                            if (totalSize > 0) {
                                onProgress(Math.round((downloaded / totalSize) * 100), downloaded, totalSize, speed);
                            }
                            else {
                                // No content-length, report bytes downloaded
                                onProgress(-1, downloaded, 0, speed);
                            }
                        }
                        lastUpdate = now;
                    }
                });
                res.pipe(file);
                file.on('finish', function () {
                    file.close(function () {
                        if (!isWindows && fs_1.default.existsSync(destination)) {
                            try {
                                fs_1.default.chmodSync(destination, 493);
                            }
                            catch (e) {
                                // Ignore chmod errors, especially for zip files or if file is missing
                            }
                        }
                        resolve();
                    });
                });
            });
            req.on('error', function (err) {
                file.close();
                // Only unlink if file exists to avoid ENOENT
                if (fs_1.default.existsSync(destination)) {
                    fs_1.default.unlink(destination, function () { return reject(err); });
                }
                else {
                    reject(err);
                }
            });
            // Handle abort
            if (binaryDownloadController) {
                binaryDownloadController.signal.addEventListener('abort', function () {
                    req.destroy();
                    file.close();
                    if (fs_1.default.existsSync(destination)) {
                        fs_1.default.unlink(destination, function () { });
                    }
                    reject(new Error('Download cancelled'));
                });
            }
        };
        makeRequest(url);
    });
};
var downloadYtDlp = function (onProgress) { return __awaiter(void 0, void 0, void 0, function () {
    var target, url;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                target = path_1.default.join(appPath, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
                url = isWindows
                    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
                    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
                return [4 /*yield*/, downloadFile(url, target, onProgress)];
            case 1:
                _a.sent();
                onProgress === null || onProgress === void 0 ? void 0 : onProgress(100, 0, 0, 0);
                return [2 /*return*/, target];
        }
    });
}); };
var downloadFfmpeg = function (onProgress, onStatus) { return __awaiter(void 0, void 0, void 0, function () {
    var isMac, isLinux, ffmpegTarget, ffprobeTarget, version, ffmpegUrl, ffprobeUrl, ffmpegZip, ffprobeZip, ffmpegState_1, ffprobeState_1, updateCombinedProgress_1, p1, p2, e_1, url, tempFile, AdmZip, zip, entries, _i, entries_1, entry, e_2, extractedDirs, _a, extractedDirs_1, dir, binPath, ffmpegSrc, ffprobeSrc, e_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                isMac = process.platform === 'darwin';
                isLinux = process.platform === 'linux';
                ffmpegTarget = path_1.default.join(appPath, isWindows ? 'ffmpeg.exe' : 'ffmpeg');
                ffprobeTarget = path_1.default.join(appPath, isWindows ? 'ffprobe.exe' : 'ffprobe');
                if (!isMac) return [3 /*break*/, 5];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                onStatus === null || onStatus === void 0 ? void 0 : onStatus('ffmpeg と ffprobe をダウンロード中 (GitHub)...');
                version = '6.1';
                ffmpegUrl = "https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v".concat(version, "/ffmpeg-").concat(version, "-macos-64.zip");
                ffprobeUrl = "https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v".concat(version, "/ffprobe-").concat(version, "-macos-64.zip");
                ffmpegZip = path_1.default.join(appPath, 'ffmpeg.zip');
                ffprobeZip = path_1.default.join(appPath, 'ffprobe.zip');
                ffmpegState_1 = { downloaded: 0, total: 0, speed: 0 };
                ffprobeState_1 = { downloaded: 0, total: 0, speed: 0 };
                updateCombinedProgress_1 = function () {
                    var downloaded = ffmpegState_1.downloaded + ffprobeState_1.downloaded;
                    var total = ffmpegState_1.total + ffprobeState_1.total;
                    var speed = ffmpegState_1.speed + ffprobeState_1.speed;
                    if (total > 0) {
                        var percent = Math.round((downloaded / total) * 100);
                        // Map 0-100% download to 0-80% overall
                        onProgress === null || onProgress === void 0 ? void 0 : onProgress(Math.round(percent * 0.8), downloaded, total, speed);
                    }
                    else if (downloaded > 0) {
                        onProgress === null || onProgress === void 0 ? void 0 : onProgress(-1, downloaded, 0, speed);
                    }
                };
                p1 = downloadFile(ffmpegUrl, ffmpegZip, function (p, d, t, s) {
                    ffmpegState_1 = { downloaded: d, total: t, speed: s };
                    updateCombinedProgress_1();
                });
                p2 = downloadFile(ffprobeUrl, ffprobeZip, function (p, d, t, s) {
                    ffprobeState_1 = { downloaded: d, total: t, speed: s };
                    updateCombinedProgress_1();
                });
                return [4 /*yield*/, Promise.all([p1, p2])];
            case 2:
                _b.sent();
                // Extract (80-100%)
                onStatus === null || onStatus === void 0 ? void 0 : onStatus('ffmpeg/ffprobe を展開中...');
                onProgress === null || onProgress === void 0 ? void 0 : onProgress(85, 0, 0, 0);
                return [4 /*yield*/, Promise.all([
                        execAsync("unzip -o \"".concat(ffmpegZip, "\" -d \"").concat(appPath, "\"")),
                        execAsync("unzip -o \"".concat(ffprobeZip, "\" -d \"").concat(appPath, "\""))
                    ])];
            case 3:
                _b.sent();
                if (fs_1.default.existsSync(ffmpegZip))
                    fs_1.default.unlinkSync(ffmpegZip);
                if (fs_1.default.existsSync(ffprobeZip))
                    fs_1.default.unlinkSync(ffprobeZip);
                if (fs_1.default.existsSync(ffmpegTarget)) {
                    fs_1.default.chmodSync(ffmpegTarget, 493);
                    // Remove quarantine attribute on macOS
                    if (isMac) {
                        try {
                            execAsync("xattr -d com.apple.quarantine \"".concat(ffmpegTarget, "\"")).catch(function () { });
                        }
                        catch (e) { }
                    }
                }
                if (fs_1.default.existsSync(ffprobeTarget)) {
                    fs_1.default.chmodSync(ffprobeTarget, 493);
                    // Remove quarantine attribute on macOS
                    if (isMac) {
                        try {
                            execAsync("xattr -d com.apple.quarantine \"".concat(ffprobeTarget, "\"")).catch(function () { });
                        }
                        catch (e) { }
                    }
                }
                onProgress === null || onProgress === void 0 ? void 0 : onProgress(100, 0, 0, 0);
                return [2 /*return*/, ffmpegTarget];
            case 4:
                e_1 = _b.sent();
                console.error('Failed to download ffmpeg for macOS:', e_1);
                throw e_1;
            case 5:
                url = '';
                if (isWindows) {
                    url = 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';
                }
                else if (isLinux) {
                    url = 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz';
                }
                if (!url) {
                    throw new Error('Unsupported platform for ffmpeg download');
                }
                tempFile = path_1.default.join(appPath, isWindows ? 'ffmpeg-temp.zip' : 'ffmpeg-temp.tar.xz');
                _b.label = 6;
            case 6:
                _b.trys.push([6, 15, , 16]);
                onStatus === null || onStatus === void 0 ? void 0 : onStatus('ffmpeg をダウンロード中...');
                return [4 /*yield*/, downloadFile(url, tempFile, function (p, downloaded, total, speed) {
                        if (p >= 0) {
                            onProgress === null || onProgress === void 0 ? void 0 : onProgress(Math.round(p * 0.8), downloaded, total, speed); // 0-80% for download
                        }
                        else if (downloaded) {
                            onProgress === null || onProgress === void 0 ? void 0 : onProgress(-1, downloaded, total, speed);
                        }
                    })];
            case 7:
                _b.sent();
                onStatus === null || onStatus === void 0 ? void 0 : onStatus('ffmpeg を展開中...');
                onProgress === null || onProgress === void 0 ? void 0 : onProgress(85, 0, 0, 0);
                if (!isWindows) return [3 /*break*/, 8];
                AdmZip = require('adm-zip');
                zip = new AdmZip(tempFile);
                entries = zip.getEntries();
                for (_i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                    entry = entries_1[_i];
                    if (entry.entryName.endsWith('ffmpeg.exe')) {
                        zip.extractEntryTo(entry, appPath, false, true);
                    }
                    if (entry.entryName.endsWith('ffprobe.exe')) {
                        zip.extractEntryTo(entry, appPath, false, true);
                    }
                }
                return [3 /*break*/, 14];
            case 8:
                if (!isLinux) return [3 /*break*/, 14];
                _b.label = 9;
            case 9:
                _b.trys.push([9, 11, , 13]);
                return [4 /*yield*/, execAsync("tar -xf \"".concat(tempFile, "\" -C \"").concat(appPath, "\" --strip-components=2 \"*/bin/ffmpeg\" \"*/bin/ffprobe\""))];
            case 10:
                _b.sent();
                return [3 /*break*/, 13];
            case 11:
                e_2 = _b.sent();
                // Some versions might have different structure, try alternative extraction
                return [4 /*yield*/, execAsync("tar -xf \"".concat(tempFile, "\" -C \"").concat(appPath, "\""))];
            case 12:
                // Some versions might have different structure, try alternative extraction
                _b.sent();
                extractedDirs = fs_1.default.readdirSync(appPath).filter(function (f) { return f.startsWith('ffmpeg-'); });
                for (_a = 0, extractedDirs_1 = extractedDirs; _a < extractedDirs_1.length; _a++) {
                    dir = extractedDirs_1[_a];
                    binPath = path_1.default.join(appPath, dir, 'bin');
                    if (fs_1.default.existsSync(binPath)) {
                        ffmpegSrc = path_1.default.join(binPath, 'ffmpeg');
                        ffprobeSrc = path_1.default.join(binPath, 'ffprobe');
                        if (fs_1.default.existsSync(ffmpegSrc)) {
                            fs_1.default.renameSync(ffmpegSrc, ffmpegTarget);
                        }
                        if (fs_1.default.existsSync(ffprobeSrc)) {
                            fs_1.default.renameSync(ffprobeSrc, ffprobeTarget);
                        }
                    }
                    // Clean up extracted directory
                    fs_1.default.rmSync(path_1.default.join(appPath, dir), { recursive: true, force: true });
                }
                return [3 /*break*/, 13];
            case 13:
                if (fs_1.default.existsSync(ffmpegTarget)) {
                    fs_1.default.chmodSync(ffmpegTarget, 493);
                }
                if (fs_1.default.existsSync(ffprobeTarget)) {
                    fs_1.default.chmodSync(ffprobeTarget, 493);
                }
                _b.label = 14;
            case 14:
                onProgress === null || onProgress === void 0 ? void 0 : onProgress(95, 0, 0, 0);
                onStatus === null || onStatus === void 0 ? void 0 : onStatus('クリーンアップ中...');
                // Clean up temp file
                if (fs_1.default.existsSync(tempFile)) {
                    fs_1.default.unlinkSync(tempFile);
                }
                onProgress === null || onProgress === void 0 ? void 0 : onProgress(100, 0, 0, 0);
                return [2 /*return*/, ffmpegTarget];
            case 15:
                e_3 = _b.sent();
                // Clean up on failure
                if (fs_1.default.existsSync(tempFile)) {
                    fs_1.default.unlinkSync(tempFile);
                }
                throw e_3;
            case 16: return [2 /*return*/];
        }
    });
}); };
var installFfmpeg = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, downloadFfmpeg()];
    });
}); };
var formatProgressDetails = function (downloaded, total, speed) {
    var mbDownloaded = (downloaded / 1024 / 1024).toFixed(1);
    var mbTotal = (total / 1024 / 1024).toFixed(1);
    var mbSpeed = (speed / 1024 / 1024).toFixed(1);
    if (total > 0) {
        return "".concat(mbDownloaded, "MB / ").concat(mbTotal, "MB (").concat(mbSpeed, " MB/s)");
    }
    else {
        return "".concat(mbDownloaded, "MB (").concat(mbSpeed, " MB/s)");
    }
};
var createWindow = function () {
    var mainWindow = new electron_1.BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.mjs'),
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
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
};
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
electron_1.ipcMain.handle('select-directory', function () { return __awaiter(void 0, void 0, void 0, function () {
    var window, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                window = electron_1.BrowserWindow.getAllWindows()[0];
                return [4 /*yield*/, electron_1.dialog.showOpenDialog(window !== null && window !== void 0 ? window : undefined, {
                        properties: ['openDirectory'],
                    })];
            case 1:
                result = _a.sent();
                if (result.canceled)
                    return [2 /*return*/, null];
                return [2 /*return*/, result.filePaths[0]];
        }
    });
}); });
var fetchJson = function (url) {
    return new Promise(function (resolve, reject) {
        https_1.default.get(url, { headers: { 'User-Agent': 'yt-dlp-gui' } }, function (res) {
            var data = '';
            res.on('data', function (chunk) { return data += chunk; });
            res.on('end', function () {
                try {
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};
electron_1.ipcMain.handle('get-latest-binary-versions', function () { return __awaiter(void 0, void 0, void 0, function () {
    var ytDlpLatest, ffmpegLatest, ytDlpRelease, e_4, ffmpegData, e_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ytDlpLatest = '不明';
                ffmpegLatest = '不明';
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fetchJson('https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest')];
            case 2:
                ytDlpRelease = _a.sent();
                if (ytDlpRelease && ytDlpRelease.tag_name) {
                    ytDlpLatest = ytDlpRelease.tag_name;
                }
                return [3 /*break*/, 4];
            case 3:
                e_4 = _a.sent();
                console.error('Failed to fetch yt-dlp latest version', e_4);
                return [3 /*break*/, 4];
            case 4:
                _a.trys.push([4, 6, , 7]);
                return [4 /*yield*/, fetchJson('https://ffbinaries.com/api/v1/version/latest')];
            case 5:
                ffmpegData = _a.sent();
                if (ffmpegData && ffmpegData.version) {
                    ffmpegLatest = ffmpegData.version;
                }
                return [3 /*break*/, 7];
            case 6:
                e_5 = _a.sent();
                console.error('Failed to fetch ffmpeg latest version', e_5);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/, { ytDlp: ytDlpLatest, ffmpeg: ffmpegLatest }];
        }
    });
}); });
electron_1.ipcMain.handle('cancel-download', function () {
    if (activeDownloadProcess) {
        isDownloadCancelled = true;
        activeDownloadProcess.kill();
        return true;
    }
    return false;
});
electron_1.ipcMain.handle('check-binaries', function () { return __awaiter(void 0, void 0, void 0, function () {
    var ytDlpPath, ffmpegPath;
    return __generator(this, function (_a) {
        ytDlpPath = resolveYtDlpPath();
        ffmpegPath = resolveFfmpegPath();
        return [2 /*return*/, {
                ytdlp: !!ytDlpPath,
                ffmpeg: !!ffmpegPath,
                path: appPath
            }];
    });
}); });
electron_1.ipcMain.handle('get-binary-versions', function () { return __awaiter(void 0, void 0, void 0, function () {
    var ytDlpPath, ffmpegPath, ytDlpVersion, ffmpegVersion, stdout, e_6, stdout, firstLine, match, e_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ytDlpPath = resolveYtDlpPath();
                ffmpegPath = resolveFfmpegPath();
                ytDlpVersion = '未検出';
                ffmpegVersion = '未検出';
                if (!ytDlpPath) return [3 /*break*/, 4];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, execAsync("\"".concat(ytDlpPath, "\" --version"))];
            case 2:
                stdout = (_a.sent()).stdout;
                ytDlpVersion = stdout.trim();
                return [3 /*break*/, 4];
            case 3:
                e_6 = _a.sent();
                console.error('Error getting yt-dlp version:', e_6);
                return [3 /*break*/, 4];
            case 4:
                if (!ffmpegPath) return [3 /*break*/, 8];
                _a.label = 5;
            case 5:
                _a.trys.push([5, 7, , 8]);
                return [4 /*yield*/, execAsync("\"".concat(ffmpegPath, "\" -version"))];
            case 6:
                stdout = (_a.sent()).stdout;
                firstLine = stdout.split('\n')[0];
                match = firstLine.match(/ffmpeg version (\S+)/);
                if (match) {
                    ffmpegVersion = match[1];
                }
                else {
                    ffmpegVersion = firstLine; // Fallback
                }
                return [3 /*break*/, 8];
            case 7:
                e_7 = _a.sent();
                console.error('Error getting ffmpeg version:', e_7);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/, { ytDlp: ytDlpVersion, ffmpeg: ffmpegVersion }];
        }
    });
}); });
electron_1.ipcMain.handle('update-ytdlp', function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var window_1, currentStatus_1, sendProgress_1, error_1, window_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                binaryDownloadController = new AbortController();
                window_1 = electron_1.BrowserWindow.getAllWindows()[0];
                currentStatus_1 = 'yt-dlp をダウンロード中...';
                sendProgress_1 = function (percent, status, downloaded) {
                    window_1 === null || window_1 === void 0 ? void 0 : window_1.webContents.send('binary-update-progress', { type: 'ytdlp', percent: percent, status: status, downloaded: downloaded });
                };
                sendProgress_1(0, currentStatus_1);
                return [4 /*yield*/, downloadYtDlp(function (percent, downloaded, total, speed) {
                        if (percent >= 0) {
                            var details = formatProgressDetails(downloaded, total, speed);
                            sendProgress_1(percent, "".concat(currentStatus_1, " ").concat(percent, "% - ").concat(details), downloaded);
                        }
                        else if (downloaded) {
                            var details = formatProgressDetails(downloaded, 0, speed);
                            sendProgress_1(-1, "".concat(currentStatus_1, " ").concat(details), downloaded);
                        }
                    })];
            case 1:
                _a.sent();
                binaryDownloadController = null;
                // Send null to clear progress (indicates completion)
                window_1 === null || window_1 === void 0 ? void 0 : window_1.webContents.send('binary-update-progress', null);
                return [2 /*return*/, true];
            case 2:
                error_1 = _a.sent();
                binaryDownloadController = null;
                window_2 = electron_1.BrowserWindow.getAllWindows()[0];
                window_2 === null || window_2 === void 0 ? void 0 : window_2.webContents.send('binary-update-progress', null);
                if ((error_1 === null || error_1 === void 0 ? void 0 : error_1.message) === 'Download cancelled') {
                    return [2 /*return*/, 'cancelled'];
                }
                console.error('Failed to update yt-dlp', error_1);
                return [2 /*return*/, false];
            case 3: return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.handle('update-ffmpeg', function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var window_3, currentStatus_2, sendProgress_2, error_2, window_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                binaryDownloadController = new AbortController();
                window_3 = electron_1.BrowserWindow.getAllWindows()[0];
                currentStatus_2 = 'ffmpeg をダウンロード中...';
                sendProgress_2 = function (percent, status, downloaded) {
                    window_3 === null || window_3 === void 0 ? void 0 : window_3.webContents.send('binary-update-progress', { type: 'ffmpeg', percent: percent, status: status, downloaded: downloaded });
                };
                sendProgress_2(0, currentStatus_2);
                return [4 /*yield*/, downloadFfmpeg(function (percent, downloaded, total, speed) {
                        if (percent >= 0) {
                            var details = formatProgressDetails(downloaded, total, speed);
                            sendProgress_2(percent, "".concat(currentStatus_2, " ").concat(percent, "% - ").concat(details), downloaded);
                        }
                        else if (downloaded) {
                            var details = formatProgressDetails(downloaded, 0, speed);
                            sendProgress_2(-1, "".concat(currentStatus_2, " ").concat(details), downloaded);
                        }
                    }, function (status) {
                        currentStatus_2 = status;
                        sendProgress_2(-2, status); // -2 indicates status change only
                    })];
            case 1:
                _a.sent();
                binaryDownloadController = null;
                // Send null to clear progress (indicates completion)
                window_3 === null || window_3 === void 0 ? void 0 : window_3.webContents.send('binary-update-progress', null);
                return [2 /*return*/, true];
            case 2:
                error_2 = _a.sent();
                binaryDownloadController = null;
                window_4 = electron_1.BrowserWindow.getAllWindows()[0];
                window_4 === null || window_4 === void 0 ? void 0 : window_4.webContents.send('binary-update-progress', null);
                if ((error_2 === null || error_2 === void 0 ? void 0 : error_2.message) === 'Download cancelled') {
                    return [2 /*return*/, 'cancelled'];
                }
                console.error('Failed to update ffmpeg', error_2);
                return [2 /*return*/, false];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Cancel binary download
electron_1.ipcMain.handle('cancel-binary-download', function () {
    if (binaryDownloadController) {
        binaryDownloadController.abort();
        binaryDownloadController = null;
        return true;
    }
    return false;
});
electron_1.ipcMain.handle('download-binaries', function () { return __awaiter(void 0, void 0, void 0, function () {
    var window_5, currentStatus_3, sendProgress_3, error_3, window_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                binaryDownloadController = new AbortController();
                window_5 = electron_1.BrowserWindow.getAllWindows()[0];
                currentStatus_3 = 'yt-dlp をダウンロード中...';
                sendProgress_3 = function (percent, status, downloaded) {
                    window_5 === null || window_5 === void 0 ? void 0 : window_5.webContents.send('binary-update-progress', { type: 'all', percent: percent, status: status, downloaded: downloaded });
                };
                sendProgress_3(0, currentStatus_3);
                // 1. Download yt-dlp (0-20%)
                return [4 /*yield*/, downloadYtDlp(function (percent, downloaded, total, speed) {
                        if (percent >= 0) {
                            // Map 0-100% to 0-20%
                            var overallPercent = Math.round(percent * 0.2);
                            var details = formatProgressDetails(downloaded, total, speed);
                            sendProgress_3(overallPercent, "".concat(currentStatus_3, " ").concat(percent, "% - ").concat(details), downloaded);
                        }
                        else if (downloaded) {
                            var details = formatProgressDetails(downloaded, 0, speed);
                            sendProgress_3(-1, "".concat(currentStatus_3, " ").concat(details), downloaded);
                        }
                    })];
            case 1:
                // 1. Download yt-dlp (0-20%)
                _a.sent();
                sendProgress_3(20, 'yt-dlp のダウンロード完了');
                // 2. Download ffmpeg (20-100%)
                currentStatus_3 = 'ffmpeg をダウンロード中...';
                return [4 /*yield*/, downloadFfmpeg(function (percent, downloaded, total, speed) {
                        if (percent >= 0) {
                            // Map 0-100% to 20-100% (range of 80%)
                            var overallPercent = 20 + Math.round(percent * 0.8);
                            var details = formatProgressDetails(downloaded, total, speed);
                            sendProgress_3(overallPercent, "".concat(currentStatus_3, " ").concat(percent, "% - ").concat(details), downloaded);
                        }
                        else if (downloaded) {
                            var details = formatProgressDetails(downloaded, 0, speed);
                            sendProgress_3(-1, "".concat(currentStatus_3, " ").concat(details), downloaded);
                        }
                    }, function (status) {
                        currentStatus_3 = status;
                        sendProgress_3(-2, status);
                    })];
            case 2:
                _a.sent();
                binaryDownloadController = null;
                window_5 === null || window_5 === void 0 ? void 0 : window_5.webContents.send('binary-update-progress', null);
                return [2 /*return*/, true];
            case 3:
                error_3 = _a.sent();
                binaryDownloadController = null;
                window_6 = electron_1.BrowserWindow.getAllWindows()[0];
                window_6 === null || window_6 === void 0 ? void 0 : window_6.webContents.send('binary-update-progress', null);
                if ((error_3 === null || error_3 === void 0 ? void 0 : error_3.message) === 'Download cancelled') {
                    return [2 /*return*/, 'cancelled'];
                }
                console.error('Failed to download binaries', error_3);
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.on('open-folder', function (_event, folderPath) {
    electron_1.shell.openPath(folderPath);
});
electron_1.ipcMain.on('download', function (event, payload) { return __awaiter(void 0, void 0, void 0, function () {
    var ytdlpPath, ffmpegPath, outputPath, args, bitDepth, height, postArgs, codecMap, audioCodecMap, downloadedTitle, downloadedFilepath;
    var _a, _b;
    return __generator(this, function (_c) {
        ytdlpPath = resolveYtDlpPath();
        ffmpegPath = resolveFfmpegPath();
        if (!ytdlpPath) {
            event.reply('download-complete', { success: false, message: 'yt-dlp が見つかりませんでした。' });
            return [2 /*return*/];
        }
        // Check execution permissions
        try {
            if (!isWindows) {
                fs_1.default.accessSync(ytdlpPath, fs_1.default.constants.X_OK);
            }
        }
        catch (e) {
            try {
                fs_1.default.chmodSync(ytdlpPath, 493);
            }
            catch (e2) {
                event.reply('download-complete', { success: false, message: "yt-dlp \u306E\u5B9F\u884C\u6A29\u9650\u304C\u3042\u308A\u307E\u305B\u3093: ".concat(e2.message) });
                return [2 /*return*/];
            }
        }
        event.reply('download-progress', '📥 yt-dlpを呼び出しています...');
        event.reply('download-progress', "\uD83D\uDD17 URL: ".concat(payload.url));
        event.reply('download-progress', "\uD83D\uDEE0 yt-dlp Path: ".concat(ytdlpPath));
        outputPath = path_1.default.join(payload.location, payload.outputTemplate || '%(title)s.%(ext)s');
        args = [
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
        if (payload.advancedOptions.embedThumbnail)
            args.push('--embed-thumbnail');
        if (payload.advancedOptions.addMetadata)
            args.push('--add-metadata');
        // Video-only options
        if (payload.options.type === 'video') {
            if (payload.advancedOptions.embedSubs)
                args.push('--embed-subs');
            if (payload.advancedOptions.writeAutoSub)
                args.push('--write-auto-sub');
            if (payload.advancedOptions.splitChapters)
                args.push('--split-chapters');
        }
        if (payload.advancedOptions.cookiesBrowser !== 'none') {
            args.push('--cookies-from-browser', payload.advancedOptions.cookiesBrowser);
        }
        if (payload.advancedOptions.playlist === 'single')
            args.push('--no-playlist');
        if (payload.advancedOptions.playlist === 'playlist')
            args.push('--yes-playlist');
        if (payload.options.type === 'audio') {
            event.reply('download-progress', "\uD83C\uDFB5 \u97F3\u58F0\u5F62\u5F0F: ".concat(payload.options.audioFormat.toUpperCase()));
            args.push('-x', '--audio-format', payload.options.audioFormat);
            // WAV uses bit depth instead of bitrate
            if (payload.options.audioFormat === 'wav') {
                event.reply('download-progress', "\uD83D\uDCCA \u30D3\u30C3\u30C8\u6DF1\u5EA6: ".concat(payload.options.audioBitDepth || '16', "bit"));
                bitDepth = payload.options.audioBitDepth || '16';
                args.push('--postprocessor-args', "ffmpeg:-acodec pcm_s".concat(bitDepth, "le"));
            }
            else {
                event.reply('download-progress', "\uD83D\uDCCA \u30D3\u30C3\u30C8\u30EC\u30FC\u30C8: ".concat(payload.options.audioBitrate));
                args.push('--audio-quality', payload.options.audioBitrate);
            }
        }
        else {
            event.reply('download-progress', "\uD83C\uDFAC \u52D5\u753B\u5F62\u5F0F: ".concat(payload.options.videoContainer.toUpperCase()));
            event.reply('download-progress', "\uD83D\uDCD0 \u89E3\u50CF\u5EA6: ".concat(payload.options.videoResolution));
            if (payload.options.videoResolution !== 'best') {
                height = payload.options.videoResolution.replace('p', '');
                args.push('-f', "bestvideo[height<=".concat(height, "]+bestaudio/best"));
            }
            else {
                args.push('-f', 'bestvideo+bestaudio/best');
            }
            args.push('--merge-output-format', payload.options.videoContainer);
            // Video conversion options
            if ((_a = payload.videoConversion) === null || _a === void 0 ? void 0 : _a.enabled) {
                event.reply('download-progress', "\uD83D\uDD04 \u5909\u63DB\u30AA\u30D7\u30B7\u30E7\u30F3: \u52D5\u753B\u30B3\u30FC\u30C7\u30C3\u30AF=".concat(payload.videoConversion.videoCodec, ", \u97F3\u58F0\u30B3\u30FC\u30C7\u30C3\u30AF=").concat(payload.videoConversion.audioCodec));
                postArgs = [];
                if (payload.videoConversion.videoCodec !== 'copy') {
                    codecMap = {
                        'h264': 'libx264',
                        'h265': 'libx265',
                        'vp9': 'libvpx-vp9',
                        'av1': 'libaom-av1'
                    };
                    postArgs.push("-c:v ".concat(codecMap[payload.videoConversion.videoCodec]));
                    if (payload.videoConversion.videoBitrate) {
                        postArgs.push("-b:v ".concat(payload.videoConversion.videoBitrate));
                    }
                }
                if (payload.videoConversion.audioCodec !== 'copy') {
                    audioCodecMap = {
                        'aac': 'aac',
                        'mp3': 'libmp3lame',
                        'opus': 'libopus'
                    };
                    postArgs.push("-c:a ".concat(audioCodecMap[payload.videoConversion.audioCodec]));
                    if (payload.videoConversion.audioBitrate) {
                        postArgs.push("-b:a ".concat(payload.videoConversion.audioBitrate));
                    }
                }
                if (postArgs.length > 0) {
                    args.push('--postprocessor-args', "ffmpeg:".concat(postArgs.join(' ')));
                }
            }
        }
        if ((_b = payload.args) === null || _b === void 0 ? void 0 : _b.length) {
            args.push.apply(args, payload.args);
        }
        event.reply('download-progress', '⏳ ダウンロードを開始します...');
        downloadedTitle = '';
        downloadedFilepath = '';
        isDownloadCancelled = false;
        activeDownloadProcess = (0, child_process_1.spawn)(ytdlpPath, args, { windowsHide: true });
        if (activeDownloadProcess.stdout) {
            activeDownloadProcess.stdout.on('data', function (data) {
                var output = data.toString().trim();
                var lines = output.split('\n');
                lines.forEach(function (line) {
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
            activeDownloadProcess.stderr.on('data', function (data) {
                event.reply('download-progress', data.toString());
            });
        }
        activeDownloadProcess.on('error', function (error) {
            event.reply('download-progress', "\u274C \u30A8\u30E9\u30FC: ".concat(error.message));
            event.reply('download-complete', { success: false, message: 'ダウンロード開始に失敗しました。' });
        });
        activeDownloadProcess.on('close', function (code) {
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
            var fileSize = 0;
            if (downloadedFilepath && fs_1.default.existsSync(downloadedFilepath)) {
                try {
                    var stats = fs_1.default.statSync(downloadedFilepath);
                    fileSize = stats.size;
                }
                catch (e) {
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
                    fileSize: fileSize
                });
            }
            else {
                event.reply('download-progress', "\u274C \u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F (\u30B3\u30FC\u30C9: ".concat(code, ")"));
                event.reply('download-complete', {
                    success: false,
                    message: "\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F (\u30B3\u30FC\u30C9: ".concat(code, ")"),
                    title: downloadedTitle,
                    filename: downloadedFilepath,
                    fileSize: fileSize
                });
            }
        });
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.handle('check-app-update', function () { return __awaiter(void 0, void 0, void 0, function () {
    var release, latestVersion, currentVersion, isUpdateAvailable, e_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fetchJson('https://api.github.com/repos/tomakura/yt-dlp-gui/releases/latest')];
            case 1:
                release = _a.sent();
                if (!release || !release.tag_name) {
                    throw new Error('Invalid release data');
                }
                latestVersion = release.tag_name.replace(/^v/, '');
                currentVersion = electron_1.app.getVersion();
                isUpdateAvailable = latestVersion !== currentVersion;
                return [2 /*return*/, {
                        available: isUpdateAvailable,
                        currentVersion: currentVersion,
                        latestVersion: latestVersion,
                        url: release.html_url
                    }];
            case 2:
                e_8 = _a.sent();
                console.error('Failed to check for app updates', e_8);
                return [2 /*return*/, {
                        available: false,
                        currentVersion: electron_1.app.getVersion(),
                        error: '更新の確認に失敗しました'
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.handle('open-external', function (_, url) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, electron_1.shell.openExternal(url)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });

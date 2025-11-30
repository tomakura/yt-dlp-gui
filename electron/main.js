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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path_1 = require("path");
var child_process_1 = require("child_process");
var fs_1 = require("fs");
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    electron_1.app.quit();
}
var mainWindow = null;
var createWindow = function () {
    mainWindow = new electron_1.BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#00000000',
            symbolColor: '#ffffff',
            height: 30
        },
        backgroundColor: '#1a1a1a', // Dark background
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
};
electron_1.app.on('ready', createWindow);
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
// IPC Handlers
electron_1.ipcMain.handle('select-directory', function () { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!mainWindow)
                    return [2 /*return*/, null];
                return [4 /*yield*/, electron_1.dialog.showOpenDialog(mainWindow, {
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
electron_1.ipcMain.handle('check-binaries', function () { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, ytdlp, ffmpeg, exists;
    return __generator(this, function (_a) {
        appPath = electron_1.app.isPackaged
            ? path_1.default.join(process.resourcesPath, 'Application')
            : path_1.default.join(process.cwd(), 'Application');
        ytdlp = path_1.default.join(appPath, 'yt-dlp.exe');
        ffmpeg = path_1.default.join(appPath, 'ffmpeg.exe');
        exists = {
            ytdlp: fs_1.default.existsSync(ytdlp),
            ffmpeg: fs_1.default.existsSync(ffmpeg),
            path: appPath
        };
        return [2 /*return*/, exists];
    });
}); });
electron_1.ipcMain.on('download', function (event, _a) {
    var url = _a.url, format = _a.format, location = _a.location, args = _a.args;
    var appPath = electron_1.app.isPackaged
        ? path_1.default.join(process.resourcesPath, 'Application')
        : path_1.default.join(process.cwd(), 'Application');
    var ytdlp = path_1.default.join(appPath, 'yt-dlp.exe');
    var ffmpeg = path_1.default.join(appPath, 'ffmpeg.exe'); // Path to ffmpeg for yt-dlp to use
    // Construct arguments
    // Basic args: URL, output template, ffmpeg location
    var finalArgs = __spreadArray([
        url,
        '-o', path_1.default.join(location, '%(title)s.%(ext)s'),
        '--ffmpeg-location', appPath,
        '--no-mtime'
    ], args, true);
    if (format === 'audio') {
        finalArgs.push('-x', '--audio-format', 'mp3');
    }
    else if (format === 'video') {
        finalArgs.push('-f', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4');
    }
    console.log("Spawning: ".concat(ytdlp, " ").concat(finalArgs.join(' ')));
    var child = (0, child_process_1.spawn)(ytdlp, finalArgs);
    child.stdout.on('data', function (data) {
        var output = data.toString();
        event.reply('download-progress', { type: 'stdout', data: output });
    });
    child.stderr.on('data', function (data) {
        var output = data.toString();
        event.reply('download-progress', { type: 'stderr', data: output });
    });
    child.on('close', function (code) {
        event.reply('download-complete', code);
    });
});

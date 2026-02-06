"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    selectDirectory: function () { return electron_1.ipcRenderer.invoke('select-directory'); },
    checkBinaries: function () { return electron_1.ipcRenderer.invoke('check-binaries'); },
    getBinaryVersions: function () { return electron_1.ipcRenderer.invoke('get-binary-versions'); },
    getLatestBinaryVersions: function () { return electron_1.ipcRenderer.invoke('get-latest-binary-versions'); },
    startDownload: function (params) { return electron_1.ipcRenderer.send('download', params); },
    cancelDownload: function () { return electron_1.ipcRenderer.invoke('cancel-download'); },
    onDownloadProgress: function (callback) {
        var subscription = function (_event, data) { return callback(data); };
        electron_1.ipcRenderer.on('download-progress', subscription);
        return function () { return electron_1.ipcRenderer.removeListener('download-progress', subscription); };
    },
    onDownloadComplete: function (callback) {
        var subscription = function (_event, result) {
            return callback(result);
        };
        electron_1.ipcRenderer.on('download-complete', subscription);
        return function () { return electron_1.ipcRenderer.removeListener('download-complete', subscription); };
    },
    onBinaryUpdateProgress: function (callback) {
        var subscription = function (_event, data) {
            return callback(data);
        };
        electron_1.ipcRenderer.on('binary-update-progress', subscription);
        return function () { return electron_1.ipcRenderer.removeListener('binary-update-progress', subscription); };
    },
    updateYtDlp: function () { return electron_1.ipcRenderer.invoke('update-ytdlp'); },
    updateFfmpeg: function () { return electron_1.ipcRenderer.invoke('update-ffmpeg'); },
    cancelBinaryDownload: function () { return electron_1.ipcRenderer.invoke('cancel-binary-download'); },
    checkAppUpdate: function () { return electron_1.ipcRenderer.invoke('check-app-update'); },
    openExternal: function (url) { return electron_1.ipcRenderer.invoke('open-external', url); },
    downloadBinaries: function () { return electron_1.ipcRenderer.invoke('download-binaries'); },
    openFolder: function (folderPath) { return electron_1.ipcRenderer.send('open-folder', folderPath); },
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    selectDirectory: function () { return electron_1.ipcRenderer.invoke('select-directory'); },
    checkBinaries: function () { return electron_1.ipcRenderer.invoke('check-binaries'); },
    startDownload: function (params) { return electron_1.ipcRenderer.send('download', params); },
    onDownloadProgress: function (callback) {
        var subscription = function (_event, data) { return callback(data); };
        electron_1.ipcRenderer.on('download-progress', subscription);
        return function () { return electron_1.ipcRenderer.removeListener('download-progress', subscription); };
    },
    onDownloadComplete: function (callback) {
        var subscription = function (_event, code) { return callback(code); };
        electron_1.ipcRenderer.on('download-complete', subscription);
        return function () { return electron_1.ipcRenderer.removeListener('download-complete', subscription); };
    }
});

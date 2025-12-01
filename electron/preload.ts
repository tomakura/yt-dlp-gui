import { contextBridge, ipcRenderer } from 'electron';
import type { DownloadPayload, DownloadResult, BinaryUpdateProgress } from '../src/types/electron';

contextBridge.exposeInMainWorld('electron', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  checkBinaries: () => ipcRenderer.invoke('check-binaries'),
  getBinaryVersions: () => ipcRenderer.invoke('get-binary-versions'),
  getLatestBinaryVersions: () => ipcRenderer.invoke('get-latest-binary-versions'),
  startDownload: (params: DownloadPayload) => ipcRenderer.send('download', params),
  cancelDownload: () => ipcRenderer.invoke('cancel-download'),
  onDownloadProgress: (callback: (data: string) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, data: string) => callback(data);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.removeListener('download-progress', subscription);
  },
  onDownloadComplete: (callback: (result: DownloadResult) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, result: DownloadResult) =>
      callback(result);
    ipcRenderer.on('download-complete', subscription);
    return () => ipcRenderer.removeListener('download-complete', subscription);
  },
  onBinaryUpdateProgress: (callback: (data: BinaryUpdateProgress | null) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, data: BinaryUpdateProgress | null) =>
      callback(data);
    ipcRenderer.on('binary-update-progress', subscription);
    return () => ipcRenderer.removeListener('binary-update-progress', subscription);
  },
  updateYtDlp: () => ipcRenderer.invoke('update-ytdlp'),
  updateFfmpeg: () => ipcRenderer.invoke('update-ffmpeg'),
  cancelBinaryDownload: () => ipcRenderer.invoke('cancel-binary-download'),
  checkAppUpdate: () => ipcRenderer.invoke('check-app-update'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  downloadBinaries: () => ipcRenderer.invoke('download-binaries'),
  openFolder: (folderPath: string) => ipcRenderer.send('open-folder', folderPath),
});

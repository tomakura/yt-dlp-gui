import { contextBridge, ipcRenderer } from 'electron';
import type {
  BinaryPresence,
  DownloadPayload,
  DownloadResult,
  BinaryUpdateProgress,
  InstalledBinaryVersions,
  LatestBinaryVersions,
  VideoInfoRequest,
  VideoInfoResult,
  HwEncoderResult
} from '../shared/contracts';

contextBridge.exposeInMainWorld('electron', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),
  checkBinaries: (): Promise<BinaryPresence> => ipcRenderer.invoke('check-binaries'),
  migrateLegacyBinaries: () => ipcRenderer.invoke('migrate-legacy-binaries'),
  getBinaryVersions: (): Promise<InstalledBinaryVersions> => ipcRenderer.invoke('get-binary-versions'),
  getLatestBinaryVersions: (): Promise<LatestBinaryVersions> => ipcRenderer.invoke('get-latest-binary-versions'),
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
  fetchVideoInfo: (request: VideoInfoRequest): Promise<VideoInfoResult> =>
    ipcRenderer.invoke('fetch-video-info', request),
  detectHwEncoders: (): Promise<HwEncoderResult> =>
    ipcRenderer.invoke('detect-hw-encoders'),
});

import type {
  BinaryPresence,
  BinaryUpdateProgress,
  DownloadPayload,
  DownloadResult,
  HwEncoderResult,
  InstalledBinaryVersions,
  LatestBinaryVersions,
  VideoInfoRequest,
  VideoInfoResult
} from '../../shared/contracts';

declare global {
  interface Window {
    electron: {
      selectDirectory: () => Promise<string | null>;
      openFileDialog: () => Promise<{ content: string; filePath: string } | null>;
      getDefaultDownloadPath: () => Promise<string>;
      checkBinaries: () => Promise<BinaryPresence>;
      migrateLegacyBinaries: () => Promise<{ migrated: boolean; copied: string[]; sources: string[]; skipped?: string; error?: string }>;
      getBinaryVersions: () => Promise<InstalledBinaryVersions>;
      getLatestBinaryVersions: () => Promise<LatestBinaryVersions>;
      startDownload: (payload: DownloadPayload) => void;
      cancelDownload: () => Promise<boolean>;
      onDownloadProgress: (callback: (data: string) => void) => () => void;
      onDownloadComplete: (callback: (result: DownloadResult) => void) => () => void;
      onBinaryUpdateProgress: (callback: (data: BinaryUpdateProgress | null) => void) => () => void;
      updateYtDlp: () => Promise<boolean | 'cancelled'>;
      updateFfmpeg: () => Promise<boolean | 'cancelled'>;
      cancelBinaryDownload: () => Promise<boolean>;
      checkAppUpdate: () => Promise<{ available: boolean; currentVersion: string; latestVersion?: string; url?: string; error?: string }>;
      openExternal: (url: string) => Promise<void>;
      downloadBinaries: () => Promise<boolean | 'cancelled'>;
      openFolder: (folderPath: string) => void;
      fetchVideoInfo: (request: VideoInfoRequest) => Promise<VideoInfoResult>;
      detectHwEncoders: () => Promise<HwEncoderResult>;
    };
  }
}

export { };

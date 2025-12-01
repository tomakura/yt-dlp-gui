import { AdvancedOptionsState, FormatOptions, VideoConversionOptions } from './options';

export interface DownloadPayload {
  url: string;
  format: FormatOptions['type'];
  location: string;
  args: string[];
  options: FormatOptions;
  advancedOptions: AdvancedOptionsState;
  videoConversion?: VideoConversionOptions;
  outputTemplate: string;
}

export interface DownloadResult {
  success: boolean;
  message: string;
  title?: string;
  filename?: string;
  fileSize?: number;
}

export interface BinaryUpdateProgress {
  type: 'ytdlp' | 'ffmpeg';
  percent: number;
  status: string;
}

export interface VideoInfoResult {
  isPlaylist: boolean;
  video?: {
    id: string;
    title: string;
    channel: string;
    channelUrl?: string;
    thumbnail: string;
    duration: number;
    viewCount?: number;
    uploadDate?: string;
    description?: string;
    filesize?: number;
    formats?: {
      format_id: string;
      ext: string;
      resolution?: string;
      filesize?: number;
      filesize_approx?: number;
      vcodec?: string;
      acodec?: string;
      tbr?: number;
    }[];
  };
  playlist?: {
    id: string;
    title: string;
    channel: string;
    thumbnail?: string;
    videoCount: number;
    entries: {
      id: string;
      title: string;
      channel: string;
      thumbnail: string;
      duration: number;
      viewCount?: number;
      filesize?: number;
    }[];
  };
  error?: string;
}

export interface HwEncoderResult {
  available: ('nvenc' | 'qsv' | 'videotoolbox' | 'amf')[];
}

declare global {
  interface Window {
    electron: {
      selectDirectory: () => Promise<string | null>;
      checkBinaries: () => Promise<{ ytdlp: boolean; ffmpeg: boolean; path: string }>;
      getBinaryVersions: () => Promise<{ ytDlp: string; ffmpeg: string }>;
      getLatestBinaryVersions: () => Promise<{ ytDlp: string; ffmpeg: string }>;
      startDownload: (payload: DownloadPayload) => void;
      cancelDownload: () => Promise<boolean>;
      onDownloadProgress: (callback: (data: string) => void) => () => void;
      onDownloadComplete: (callback: (result: DownloadResult) => void) => () => void;
      onBinaryUpdateProgress: (callback: (data: BinaryUpdateProgress | null) => void) => () => void;
      updateYtDlp: () => Promise<boolean | 'cancelled'>;
      updateFfmpeg: () => Promise<boolean | 'cancelled'>;
      cancelBinaryDownload: () => Promise<void>;
      checkAppUpdate: () => Promise<{ available: boolean; currentVersion: string; latestVersion?: string; url?: string; error?: string }>;
      openExternal: (url: string) => Promise<void>;
      downloadBinaries: () => Promise<boolean>;
      openFolder: (folderPath: string) => void;
      fetchVideoInfo: (url: string) => Promise<VideoInfoResult>;
      detectHwEncoders: () => Promise<HwEncoderResult>;
    };
  }
}

export {};

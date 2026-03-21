import type {
  AdvancedOptionsState,
  FormatOptions,
  HwEncoder,
  VideoConversionOptions
} from '../src/types/options';

export type DownloadStatus = 'complete' | 'error' | 'cancelled';
export type BinaryUpdateChannel = 'ytdlp' | 'ffmpeg' | 'all';
export type PreviewErrorCode =
  | 'unsupported'
  | 'timeout'
  | 'network'
  | 'rate_limited'
  | 'auth_required'
  | 'unknown';
export type PreviewErrorSource = 'fast' | 'yt_dlp';

export interface DownloadPayload {
  url: string;
  location: string;
  args: string[];
  options: FormatOptions;
  advancedOptions: AdvancedOptionsState;
  videoConversion?: VideoConversionOptions;
  outputTemplate: string;
  notificationsEnabled: boolean;
}

export interface DownloadResult {
  status: DownloadStatus;
  success: boolean;
  message: string;
  title?: string;
  filename?: string;
  fileSize?: number;
}

export interface BinaryUpdateProgress {
  type: BinaryUpdateChannel;
  percent: number;
  status?: string;
  statusKey?: string;
  progressData?: {
    downloaded: number;
    total: number;
    speed: number;
  };
}

export interface BinaryPresence {
  ytDlp: boolean;
  ffmpeg: boolean;
  ffprobe: boolean;
  managedPath: string;
}

export interface InstalledBinaryInfo {
  detected: boolean;
  version: string | null;
  path: string | null;
}

export interface LatestBinaryInfo {
  latestKnown: boolean;
  version: string | null;
}

export interface InstalledBinaryVersions {
  ytDlp: InstalledBinaryInfo;
  ffmpeg: InstalledBinaryInfo;
}

export interface LatestBinaryVersions {
  ytDlp: LatestBinaryInfo;
  ffmpeg: LatestBinaryInfo;
}

export interface PreviewError {
  code: PreviewErrorCode;
  source: PreviewErrorSource;
  message: string;
}

export interface FormatInfo {
  format_id: string;
  ext: string;
  resolution?: string;
  height?: number;
  filesize?: number;
  filesize_approx?: number;
  vcodec?: string;
  acodec?: string;
  tbr?: number;
  abr?: number;
}

export interface VideoInfo {
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
  bestResolution?: string;
  formats?: FormatInfo[];
}

export interface PlaylistInfo {
  id: string;
  title: string;
  channel: string;
  thumbnail?: string;
  videoCount: number;
  entries: VideoInfo[];
}

export interface VideoInfoRequest {
  url: string;
  cookiesBrowser?: AdvancedOptionsState['cookiesBrowser'];
}

export interface VideoInfoResult {
  isPlaylist: boolean;
  fetchedBy?: PreviewErrorSource;
  cached?: boolean;
  video?: VideoInfo;
  playlist?: PlaylistInfo;
  error?: PreviewError;
}

export interface HwEncoderResult {
  available: HwEncoder[];
}

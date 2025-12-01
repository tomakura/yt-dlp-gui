export type FormatType = 'video' | 'audio';

export interface FormatOptions {
  type: FormatType;
  videoContainer: string;
  videoResolution: string;
  audioFormat: string;
  audioBitrate: string;
  audioSampleRate: string;
  audioBitDepth: string; // for WAV: 16, 24, 32
}

export interface VideoConversionOptions {
  enabled: boolean;
  videoCodec: 'copy' | 'h264' | 'h265' | 'vp9' | 'av1';
  videoBitrate: string;
  audioCodec: 'copy' | 'aac' | 'mp3' | 'opus';
  audioBitrate: string;
}

export interface AdvancedOptionsState {
  embedThumbnail: boolean;
  addMetadata: boolean;
  embedSubs: boolean;
  writeAutoSub: boolean;
  splitChapters: boolean;
  playlist: 'default' | 'single' | 'playlist';
  cookiesBrowser: 'none' | 'chrome' | 'edge' | 'firefox';
}

export interface DownloadHistoryItem {
  id: string;
  url: string;
  title: string;
  location: string;
  filename: string;
  fileSize: number;
  format: FormatType;
  timestamp: number;
  success: boolean;
}

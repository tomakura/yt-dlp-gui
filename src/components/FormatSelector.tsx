import React from 'react';
import { Film, Music2, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import type { FormatOptions, FormatType, VideoConversionOptions } from '../types/options';

interface Theme {
  tabActive: string;
  tabActiveText: string;
  tabInactive: string;
  tabInactiveText: string;
  toggleActive: string;
  toggleTrack: string;
  icon: string;
}

interface FormatSelectorProps {
  options: FormatOptions;
  setOptions: (options: FormatOptions) => void;
  videoConversion?: VideoConversionOptions;
  setVideoConversion?: (options: VideoConversionOptions) => void;
  theme?: Theme;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({ 
  options, 
  setOptions,
  videoConversion,
  setVideoConversion,
  theme
}) => {
  const [showConversion, setShowConversion] = React.useState(false);
  
  // デフォルトテーマ値
  const themeStyles = theme || {
    tabActive: 'bg-purple-500/20',
    tabActiveText: 'text-purple-200',
    tabInactive: 'bg-white/5',
    tabInactiveText: 'text-gray-400',
    toggleActive: 'bg-purple-500',
    toggleTrack: 'bg-purple-500/20',
    icon: 'text-purple-400'
  };
  
  const setType = (type: FormatType) => setOptions({ ...options, type });
  const update = <K extends keyof FormatOptions>(key: K, value: FormatOptions[K]) =>
    setOptions({ ...options, [key]: value });

  const updateConversion = <K extends keyof VideoConversionOptions>(key: K, value: VideoConversionOptions[K]) => {
    if (setVideoConversion && videoConversion) {
      setVideoConversion({ ...videoConversion, [key]: value });
    }
  };

  return (
    <div className="space-y-3 glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <Film size={16} className={themeStyles.icon} />
          フォーマット
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setType('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${options.type === 'video'
                ? `${themeStyles.tabActive} ${themeStyles.tabActiveText} border border-current/30`
                : `${themeStyles.tabInactive} ${themeStyles.tabInactiveText} border border-white/10 hover:bg-white/10`
              }`}
          >
            動画
          </button>
          <button
            onClick={() => setType('audio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${options.type === 'audio'
                ? `${themeStyles.tabActive} ${themeStyles.tabActiveText} border border-current/30`
                : `${themeStyles.tabInactive} ${themeStyles.tabInactiveText} border border-white/10 hover:bg-white/10`
              }`}
          >
            音声
          </button>
        </div>
      </div>

      {options.type === 'video' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">解像度</label>
              <select
                value={options.videoResolution}
                onChange={(e) => update('videoResolution', e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]"
              >
                <option value="best">最高</option>
                <option value="2160p">2160p</option>
                <option value="1440p">1440p</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">コンテナ</label>
              <select
                value={options.videoContainer}
                onChange={(e) => update('videoContainer', e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]"
              >
                <option value="mp4">mp4</option>
                <option value="mkv">mkv</option>
                <option value="webm">webm</option>
              </select>
            </div>
          </div>

          {/* Video Conversion Options */}
          {videoConversion && setVideoConversion && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <button
                onClick={() => setShowConversion(!showConversion)}
                className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings size={14} className="text-orange-400" />
                  <span>変換オプション</span>
                  {videoConversion.enabled && (
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px]">ON</span>
                  )}
                </div>
                {showConversion ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showConversion && (
                <div className="mt-3 space-y-3">
                  <button
                    type="button"
                    onClick={() => updateConversion('enabled', !videoConversion.enabled)}
                    className={`relative flex items-center justify-between w-full text-[11px] px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                      videoConversion.enabled
                        ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/40 text-orange-200 shadow-lg shadow-orange-500/10'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-gray-200'
                    }`}
                  >
                    <span className="font-medium">変換を有効化</span>
                    <div className={`relative w-9 h-5 rounded-full transition-all duration-200 ${
                      videoConversion.enabled 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500' 
                        : 'bg-white/20'
                    }`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 shadow-md ${
                        videoConversion.enabled 
                          ? 'left-[18px] bg-white' 
                          : 'left-0.5 bg-gray-400'
                      }`} />
                    </div>
                  </button>

                  {videoConversion.enabled && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] text-gray-400">動画コーデック</label>
                          <select
                            value={videoConversion.videoCodec}
                            onChange={(e) => updateConversion('videoCodec', e.target.value as VideoConversionOptions['videoCodec'])}
                            className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]"
                          >
                            <option value="copy">コピー (無変換)</option>
                            <option value="h264">H.264 (AVC)</option>
                            <option value="h265">H.265 (HEVC)</option>
                            <option value="vp9">VP9</option>
                            <option value="av1">AV1</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-gray-400">動画ビットレート</label>
                          <select
                            value={videoConversion.videoBitrate}
                            onChange={(e) => updateConversion('videoBitrate', e.target.value)}
                            disabled={videoConversion.videoCodec === 'copy'}
                            className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b] disabled:opacity-50"
                          >
                            <option value="">自動</option>
                            <option value="50M">50 Mbps</option>
                            <option value="30M">30 Mbps</option>
                            <option value="20M">20 Mbps</option>
                            <option value="10M">10 Mbps</option>
                            <option value="5M">5 Mbps</option>
                            <option value="2M">2 Mbps</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] text-gray-400">音声コーデック</label>
                          <select
                            value={videoConversion.audioCodec}
                            onChange={(e) => updateConversion('audioCodec', e.target.value as VideoConversionOptions['audioCodec'])}
                            className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]"
                          >
                            <option value="copy">コピー (無変換)</option>
                            <option value="aac">AAC</option>
                            <option value="mp3">MP3</option>
                            <option value="opus">Opus</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-gray-400">音声ビットレート</label>
                          <select
                            value={videoConversion.audioBitrate}
                            onChange={(e) => updateConversion('audioBitrate', e.target.value)}
                            disabled={videoConversion.audioCodec === 'copy'}
                            className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b] disabled:opacity-50"
                          >
                            <option value="">自動</option>
                            <option value="320k">320 kbps</option>
                            <option value="256k">256 kbps</option>
                            <option value="192k">192 kbps</option>
                            <option value="128k">128 kbps</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-gray-400">形式</label>
            <select
              value={options.audioFormat}
              onChange={(e) => update('audioFormat', e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]"
            >
              <option value="mp3">mp3</option>
              <option value="m4a">m4a</option>
              <option value="aac">aac</option>
              <option value="flac">flac</option>
              <option value="wav">wav</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-gray-400">
              {options.audioFormat === 'wav' ? 'ビット深度' : 'ビットレート'}
            </label>
            {options.audioFormat === 'wav' ? (
              <select
                value={options.audioBitDepth || '16'}
                onChange={(e) => update('audioBitDepth', e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]"
              >
                <option value="16">16 bit</option>
                <option value="24">24 bit</option>
                <option value="32">32 bit</option>
              </select>
            ) : (
              <select
                value={options.audioBitrate}
                onChange={(e) => update('audioBitrate', e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]"
              >
                <option value="320k">320 kbps</option>
                <option value="256k">256 kbps</option>
                <option value="192k">192 kbps</option>
                <option value="128k">128 kbps</option>
              </select>
            )}
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-[11px] text-gray-400 flex items-center gap-2">
              <Music2 size={14} className="text-pink-400" />
              サンプルレート
            </label>
            <select
              value={options.audioSampleRate}
              onChange={(e) => update('audioSampleRate', e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]"
            >
              <option value="48000">48 kHz</option>
              <option value="44100">44.1 kHz</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Clock, User, List, ChevronDown, ChevronUp, Loader2, AlertCircle, Film, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../i18n';

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
  filesize?: number; // Approximate filesize in bytes
  formats?: FormatInfo[];
  bestResolution?: string; // e.g., "1080p", "4K"
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
  tbr?: number; // Total bitrate
  abr?: number; // Audio bitrate
}

export interface PlaylistInfo {
  id: string;
  title: string;
  channel: string;
  thumbnail?: string;
  videoCount: number;
  entries: VideoInfo[];
}

interface Theme {
  icon: string;
  primary: string;
  secondary: string;
  accent: string;
}

interface VideoPreviewProps {
  url: string;
  isLoading: boolean;
  error: string | null;
  videoInfo: VideoInfo | null;
  playlistInfo: PlaylistInfo | null;
  onToggle: () => void;
  isExpanded: boolean;
  theme?: Theme;
}

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '--:--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatViewCount = (count: number | undefined): string => {
  if (!count) return '';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  url,
  isLoading,
  error,
  videoInfo,
  playlistInfo,
  onToggle,
  isExpanded,
  theme,
}) => {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);

  const themeStyles = theme || {
    icon: 'text-purple-400',
    primary: 'from-blue-400',
    secondary: 'via-purple-400',
    accent: 'to-pink-400'
  };

  // Reset index when playlist changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [playlistInfo?.id]);

  const isPlaylist = playlistInfo && playlistInfo.entries.length > 1;
  const currentVideo = isPlaylist ? playlistInfo.entries[currentIndex] : videoInfo;

  const handlePrevious = () => {
    if (isPlaylist && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (isPlaylist && currentIndex < playlistInfo.entries.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Check if URL is valid
  const isValidUrl = url && (url.startsWith('http://') || url.startsWith('https://'));

  // Check if we have no data and not loading
  const hasNoData = !isLoading && !error && !videoInfo && !playlistInfo;

  // If no URL, don't render
  if (!url) return null;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Film size={14} className={themeStyles.icon} />
          <span>{t('videoInfo')}</span>
          {!isLoading && (videoInfo || playlistInfo) && (
            isPlaylist ? (
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30 ml-2">
                {t('playlist')}
              </span>
            ) : (
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30 ml-2">
                {t('video')}
              </span>
            )
          )}
          {isLoading && (
            <Loader2 size={12} className="animate-spin text-gray-500" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPlaylist && (
            <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-medium">
              {currentIndex + 1} / {playlistInfo.entries.length}
            </span>
          )}
          {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </button>

      {/* Content - Collapsible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              {/* Invalid URL state */}
              {!isValidUrl && (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-gray-500">
                  <Link2 size={24} />
                  <span className="text-sm">{t('enterValidUrl')}</span>
                </div>
              )}

              {/* Loading state */}
              {isValidUrl && isLoading && (
                <div className="flex items-center justify-center py-6 gap-3">
                  <Loader2 size={24} className={`animate-spin ${themeStyles.icon}`} />
                  <span className="text-sm text-gray-400">{t('fetchingVideoInfo')}</span>
                </div>
              )}

              {/* Error state */}
              {isValidUrl && error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-red-400">
                  <AlertCircle size={24} />
                  <span className="text-sm text-center">{t('unsupportedUrl')}</span>
                  <span className="text-[10px] text-gray-500">{error}</span>
                </div>
              )}

              {/* No data state (after fetch completed but no result) */}
              {isValidUrl && hasNoData && (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-gray-500">
                  <AlertCircle size={24} />
                  <span className="text-sm">{t('noVideoFound')}</span>
                </div>
              )}

              {/* Video info */}
              {isValidUrl && !isLoading && !error && currentVideo && (
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative shrink-0 w-36 aspect-video rounded-xl overflow-hidden bg-black/50 group">
                    {currentVideo.thumbnail ? (
                      <img
                        src={currentVideo.thumbnail}
                        alt={currentVideo.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play size={28} className="text-gray-600" />
                      </div>
                    )}

                    {/* Duration overlay */}
                    {currentVideo.duration > 0 && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-medium">
                        {formatDuration(currentVideo.duration)}
                      </div>
                    )}

                    {/* Best resolution badge */}
                    {currentVideo.bestResolution && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500/90 text-[9px] text-white font-bold">
                        {currentVideo.bestResolution}
                      </div>
                    )}
                  </div>

                  {/* Video details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Title */}
                    <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug">
                      {currentVideo.title}
                    </h3>

                    {/* Channel */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <User size={11} className={themeStyles.icon} />
                      <span className="truncate">{currentVideo.channel}</span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      {currentVideo.duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock size={10} />
                          <span>{formatDuration(currentVideo.duration)}</span>
                        </div>
                      )}
                      {currentVideo.viewCount && (
                        <span>{formatViewCount(currentVideo.viewCount)} {t('views')}</span>
                      )}
                      {currentVideo.bestResolution && (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Film size={10} />
                          <span className="font-medium">{t('bestQuality')}: {currentVideo.bestResolution}</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* Playlist navigation */}
              {isPlaylist && !isLoading && !error && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${currentIndex === 0
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <ChevronLeft size={14} />
                    {t('previous')}
                  </button>

                  {/* Thumbnail gallery dots */}
                  <div className="flex items-center gap-1 max-w-[180px] overflow-hidden">
                    {playlistInfo.entries.slice(
                      Math.max(0, currentIndex - 3),
                      Math.min(playlistInfo.entries.length, currentIndex + 4)
                    ).map((entry, idx) => {
                      const actualIndex = Math.max(0, currentIndex - 3) + idx;
                      return (
                        <button
                          key={entry.id}
                          onClick={() => setCurrentIndex(actualIndex)}
                          className={`w-2 h-2 rounded-full transition-all ${actualIndex === currentIndex
                            ? `${themeStyles.icon.replace('text-', 'bg-')} w-4`
                            : 'bg-white/20 hover:bg-white/40'
                            }`}
                        />
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={currentIndex === playlistInfo.entries.length - 1}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${currentIndex === playlistInfo.entries.length - 1
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    {t('next')}
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

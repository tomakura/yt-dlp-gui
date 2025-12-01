import React from 'react';
import { FolderOpen, Star, X } from 'lucide-react';
import { useI18n } from '../i18n';

interface Theme {
  icon: string;
  activeTab: string;
  focusRing: string;
}

interface LocationSelectorProps {
  location: string;
  setLocation: (path: string) => void;
  favorites: string[];
  onToggleFavorite: (path: string) => void;
  theme?: Theme;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ 
  location, 
  setLocation,
  favorites,
  onToggleFavorite,
  theme
}) => {
  const { t } = useI18n();
  const themeStyles = theme || {
    icon: 'text-green-400',
    activeTab: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    focusRing: 'focus:ring-purple-500/50'
  };

  const handleBrowse = async () => {
    try {
      const selected = await window.electron.selectDirectory();
      if (selected) {
        setLocation(selected);
      }
    } catch {
      // ignore errors
    }
  };

  const isFavorite = location && favorites.includes(location);

  // Get folder name from path for display (handle both Windows \ and Unix /)
  const getFolderName = (pathStr: string) => {
    // Split by both forward and back slashes
    const parts = pathStr.split(/[\\/]/);
    return parts[parts.length - 1] || parts[parts.length - 2] || pathStr;
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-400 flex items-center gap-2">
        <FolderOpen size={14} className={themeStyles.icon} />
        {t('saveTo')}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('folderPathPlaceholder')}
          className="flex-1 glass-input rounded-xl px-3 py-2 text-sm text-gray-200 bg-transparent"
        />
        <button
          type="button"
          onClick={handleBrowse}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors"
        >
          {t('browse')}
        </button>
        <button
          type="button"
          onClick={() => location && onToggleFavorite(location)}
          disabled={!location}
          className={`px-3 py-2 rounded-xl border text-xs transition-colors ${
            isFavorite 
              ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30' 
              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
        >
          <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      
      {/* Favorites list */}
      {favorites.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {favorites.map((fav) => (
            <button
              key={fav}
              onClick={() => setLocation(fav)}
              className={`group flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors ${
                location === fav 
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-200'
              }`}
              title={fav}
            >
              <Star size={10} className="text-yellow-400" fill="currentColor" />
              <span className="max-w-[100px] truncate">{getFolderName(fav)}</span>
              <X 
                size={10} 
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(fav);
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

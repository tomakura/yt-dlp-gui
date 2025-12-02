import React from 'react';
import { Search, Link, X, Clipboard, FileText } from 'lucide-react';
import { useI18n } from '../i18n';

interface UrlInputProps {
  url: string;
  setUrl: (url: string) => void;
  theme: { icon: string };
  onImport?: () => void;
}

export const UrlInput: React.FC<UrlInputProps> = ({ url, setUrl, theme, onImport }) => {
  const { t } = useI18n();

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch (e) {
      console.error('Failed to read clipboard', e);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-400 flex items-center gap-2">
        <Link size={14} className={theme.icon} />
        {t('downloadUrl')}
      </label>
      <div className="flex gap-2">
        <div className="flex items-center gap-2 flex-1 glass-input rounded-xl px-3 py-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('urlPlaceholder')}
            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-full"
          />
          {url && (
            <button
              onClick={() => setUrl('')}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={handlePaste}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors"
          title={t('paste')}
        >
          <div className="flex items-center gap-1">
            <Clipboard size={14} />
            <span className="hidden sm:inline">{t('paste')}</span>
          </div>
        </button>

        {onImport && (
          <button
            onClick={onImport}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors"
            title={t('importFileTooltip')}
          >
            <div className="flex items-center gap-1">
              <FileText size={14} />
              <span className="hidden sm:inline">{t('importFile')}</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

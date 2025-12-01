import React from 'react';
import { Link2, ClipboardPaste } from 'lucide-react';

interface Theme {
  icon: string;
}

interface UrlInputProps {
  url: string;
  setUrl: (value: string) => void;
  theme?: Theme;
}

export const UrlInput: React.FC<UrlInputProps> = ({ url, setUrl, theme }) => {
  const themeStyles = theme || {
    icon: 'text-blue-400'
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-400 flex items-center gap-2">
        <Link2 size={14} className={themeStyles.icon} />
        ダウンロードURL
      </label>
      <div className="flex gap-2">
        <div className="flex items-center gap-2 flex-1 glass-input rounded-xl px-3 py-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-full"
          />
        </div>
        <button
          type="button"
          onClick={handlePaste}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-1">
            <ClipboardPaste size={14} />
            貼り付け
          </div>
        </button>
      </div>
    </div>
  );
};

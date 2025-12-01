import React from 'react';
import { Settings2 } from 'lucide-react';
import type { AdvancedOptionsState, FormatOptions } from '../types/options';

interface Theme {
  toggleActive: string;
  toggleTrack: string;
  icon: string;
}

interface AdvancedOptionsProps {
  options: AdvancedOptionsState;
  setOptions: (options: AdvancedOptionsState) => void;
  formatType: FormatOptions['type'];
  theme?: Theme;
}

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  tooltip?: string;
  theme?: Theme;
}> = ({ label, checked, onChange, disabled, tooltip, theme }) => {
  // toggleActive/toggleTrackがグラデーション形式（from-x to-y）か単一色（bg-x）かで処理を分ける
  const toggleActive = theme?.toggleActive || 'bg-purple-500';
  const toggleTrack = theme?.toggleTrack || 'bg-purple-500/20';
  const isGradient = toggleActive.includes('from-');
  
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative flex items-center justify-between text-[11px] px-3 py-2.5 rounded-xl border transition-all duration-200 ${
        disabled 
          ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/5 text-gray-500' 
          : checked
            ? `${isGradient ? 'bg-gradient-to-r' : ''} ${toggleTrack} border-current/40 text-gray-200 shadow-lg`
            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-gray-200'
      }`}
      title={tooltip}
    >
      <span className="font-medium">{label}</span>
      <div className={`relative w-9 h-5 rounded-full transition-all duration-200 ${
        checked 
          ? `${isGradient ? 'bg-gradient-to-r' : ''} ${toggleActive}` 
          : 'bg-white/20'
      }`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 shadow-md ${
          checked 
            ? 'left-[18px] bg-white' 
            : 'left-0.5 bg-gray-400'
        }`} />
      </div>
    </button>
  );
};

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({ options, setOptions, formatType, theme }) => {
  const update = <K extends keyof AdvancedOptionsState>(key: K, value: AdvancedOptionsState[K]) =>
    setOptions({ ...options, [key]: value });

  const isAudioMode = formatType === 'audio';

  const themeStyles = theme || {
    toggleActive: 'bg-purple-500',
    toggleTrack: 'bg-purple-500/20',
    icon: 'text-purple-400'
  };

  return (
    <div className="space-y-3 glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
        <Settings2 size={16} className={themeStyles.icon} />
        詳細オプション
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Toggle label="サムネイルを埋め込み" checked={options.embedThumbnail} onChange={(v) => update('embedThumbnail', v)} theme={themeStyles} />
        <Toggle label="メタデータを埋め込み" checked={options.addMetadata} onChange={(v) => update('addMetadata', v)} theme={themeStyles} />
        <Toggle 
          label="字幕を埋め込み" 
          checked={options.embedSubs} 
          onChange={(v) => update('embedSubs', v)} 
          disabled={isAudioMode}
          tooltip={isAudioMode ? '音声モードでは利用できません' : undefined}
          theme={themeStyles}
        />
        <Toggle 
          label="自動字幕を書き出し" 
          checked={options.writeAutoSub} 
          onChange={(v) => update('writeAutoSub', v)}
          disabled={isAudioMode}
          tooltip={isAudioMode ? '音声モードでは利用できません' : undefined}
          theme={themeStyles}
        />
        <Toggle 
          label="チャプターで分割" 
          checked={options.splitChapters} 
          onChange={(v) => update('splitChapters', v)}
          disabled={isAudioMode}
          tooltip={isAudioMode ? '音声モードでは利用できません' : undefined}
          theme={themeStyles}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] text-gray-400">プレイリスト</label>
          <select
            value={options.playlist}
            onChange={(e) => update('playlist', e.target.value as AdvancedOptionsState['playlist'])}
            className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]"
          >
            <option value="default">自動</option>
            <option value="single">単体のみ</option>
            <option value="all">プレイリスト全て</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-gray-400">ブラウザCookie</label>
          <select
            value={options.cookiesBrowser}
            onChange={(e) => update('cookiesBrowser', e.target.value as AdvancedOptionsState['cookiesBrowser'])}
            className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]"
          >
            <option value="none">使用しない</option>
            <option value="chrome">Chrome</option>
            <option value="firefox">Firefox</option>
          </select>
        </div>
      </div>

      {isAudioMode && (
        <p className="text-[11px] text-gray-500">
          ⚠️ 音声モードでは、字幕埋め込み・自動字幕・チャプター分割は利用できません。
        </p>
      )}
    </div>
  );
};

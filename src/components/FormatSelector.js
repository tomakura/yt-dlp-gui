"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatSelector = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var i18n_1 = require("../i18n");
var FormatSelector = function (_a) {
    var options = _a.options, setOptions = _a.setOptions, theme = _a.theme, estimatedSize = _a.estimatedSize;
    var t = (0, i18n_1.useI18n)().t;
    var formatFileSize = function (bytes) {
        if (!bytes || bytes <= 0)
            return '';
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024)
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };
    var themeStyles = theme || {
        tabActive: 'bg-purple-500/20',
        tabActiveText: 'text-purple-200',
        tabInactive: 'bg-white/5',
        tabInactiveText: 'text-gray-400',
        toggleActive: 'bg-purple-500',
        toggleTrack: 'bg-purple-500/20',
        icon: 'text-purple-400'
    };
    var setType = function (type) { return setOptions(__assign(__assign({}, options), { type: type })); };
    var update = function (key, value) {
        var _a;
        return setOptions(__assign(__assign({}, options), (_a = {}, _a[key] = value, _a)));
    };
    var getButtonClass = function (isActive) {
        if (isActive) {
            return 'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' + themeStyles.tabActive + ' ' + themeStyles.tabActiveText + ' border border-current/30';
        }
        return 'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' + themeStyles.tabInactive + ' ' + themeStyles.tabInactiveText + ' border border-white/10 hover:bg-white/10';
    };
    return (<div className="space-y-3 glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <lucide_react_1.Film size={16} className={themeStyles.icon}/>
          {t('format')}
        </div>
        <div className="flex gap-2">
          <button onClick={function () { return setType('video'); }} className={getButtonClass(options.type === 'video')}>
            {t('video')}
          </button>
          <button onClick={function () { return setType('audio'); }} className={getButtonClass(options.type === 'audio')}>
            {t('audio')}
          </button>
        </div>
      </div>

      {options.type === 'video' ? (<>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">{t('resolution')}</label>
              <select value={options.videoResolution} onChange={function (e) { return update('videoResolution', e.target.value); }} className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]">
                <option value="best">{t('best')}</option>
                <option value="2160p">2160p</option>
                <option value="1440p">1440p</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">{t('container')}</label>
              <select value={options.videoContainer} onChange={function (e) { return update('videoContainer', e.target.value); }} className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]">
                <option value="mp4">mp4</option>
                <option value="mkv">mkv</option>
                <option value="webm">webm</option>
              </select>
            </div>
          </div>

          {/* Codec Selection for Video */}
          {options.conversion && (<div className="mt-3 pt-3 border-t border-white/5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400">{t('videoCodec') || 'Video Codec'}</label>
                  <select value={options.conversion.videoCodec} onChange={function (e) { return update('conversion', __assign(__assign({}, options.conversion), { videoCodec: e.target.value })); }} className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]">
                    <option value="h264">H.264 (Default)</option>
                    <option value="h265">H.265 (HEVC)</option>
                    <option value="av1">AV1</option>
                    <option value="vp9">VP9</option>
                    <option value="copy">Copy (No Recode)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400">{t('audioCodec') || 'Audio Codec'}</label>
                  <select value={options.conversion.audioCodec} onChange={function (e) { return update('conversion', __assign(__assign({}, options.conversion), { audioCodec: e.target.value })); }} className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]">
                    <option value="aac">AAC (Default)</option>
                    <option value="mp3">MP3</option>
                    <option value="opus">Opus</option>
                    <option value="copy">Copy (No Recode)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400">{t('audioBitrate') || 'Audio Bitrate'}</label>
                  <select value={options.conversion.audioBitrate} onChange={function (e) { return update('conversion', __assign(__assign({}, options.conversion), { audioBitrate: e.target.value })); }} className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]" disabled={options.conversion.audioCodec === 'copy'}>
                    <option value="320k">320 kbps</option>
                    <option value="256k">256 kbps</option>
                    <option value="192k">192 kbps</option>
                    <option value="128k">128 kbps</option>
                  </select>
                </div>
              </div>
            </div>)}

          {estimatedSize && estimatedSize > 0 && (<div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-end gap-2">
              <span className="text-[10px] text-gray-500">{t('estimatedSize')}:</span>
              <span className="text-[11px] text-emerald-400 font-medium">{formatFileSize(estimatedSize)}</span>
            </div>)}
        </>) : (<div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">{t('format')}</label>
              <select value={options.audioFormat} onChange={function (e) { return update('audioFormat', e.target.value); }} className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]">
                <option value="mp3">mp3</option>
                <option value="m4a">m4a</option>
                <option value="aac">aac</option>
                <option value="flac">flac</option>
                <option value="wav">wav</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">
                {options.audioFormat === 'wav' ? t('bitDepth') : t('bitrate')}
              </label>
              {options.audioFormat === 'wav' ? (<select value={options.audioBitDepth || '16'} onChange={function (e) { return update('audioBitDepth', e.target.value); }} className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]">
                  <option value="16">16 bit</option>
                  <option value="24">24 bit</option>
                  <option value="32">32 bit</option>
                </select>) : (<select value={options.audioBitrate} onChange={function (e) { return update('audioBitrate', e.target.value); }} className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]">
                  <option value="320k">320 kbps</option>
                  <option value="256k">256 kbps</option>
                  <option value="192k">192 kbps</option>
                  <option value="128k">128 kbps</option>
                </select>)}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-gray-400 flex items-center gap-2">
              <lucide_react_1.Music2 size={14} className="text-pink-400"/>
              {t('sampleRate')}
            </label>
            <select value={options.audioSampleRate} onChange={function (e) { return update('audioSampleRate', e.target.value); }} className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]">
              <option value="48000">48 kHz</option>
              <option value="44100">44.1 kHz</option>
            </select>
          </div>

          {estimatedSize && estimatedSize > 0 && (<div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
              <span className="text-[10px] text-gray-500">{t('estimatedSize')}:</span>
              <span className="text-[11px] text-emerald-400 font-medium">{formatFileSize(estimatedSize)}</span>
            </div>)}
        </div>)}
    </div>);
};
exports.FormatSelector = FormatSelector;

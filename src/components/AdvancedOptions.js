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
exports.AdvancedOptions = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var i18n_1 = require("../i18n");
var Toggle = function (_a) {
    var label = _a.label, checked = _a.checked, onChange = _a.onChange, disabled = _a.disabled, tooltip = _a.tooltip, theme = _a.theme;
    // toggleActive/toggleTrackがグラデーション形式（from-x to-y）か単一色（bg-x）かで処理を分ける
    var toggleActive = (theme === null || theme === void 0 ? void 0 : theme.toggleActive) || 'bg-purple-500';
    var toggleTrack = (theme === null || theme === void 0 ? void 0 : theme.toggleTrack) || 'bg-purple-500/20';
    var isGradient = toggleActive.includes('from-');
    return (<button type="button" onClick={function () { return !disabled && onChange(!checked); }} disabled={disabled} className={"relative flex items-center justify-between text-[11px] px-3 py-2.5 rounded-xl border transition-all duration-200 ".concat(disabled
            ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/5 text-gray-500'
            : checked
                ? "".concat(isGradient ? 'bg-gradient-to-r' : '', " ").concat(toggleTrack, " border-current/40 text-gray-200 shadow-lg")
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-gray-200')} title={tooltip}>
      <span className="font-medium">{label}</span>
      <div className={"relative w-9 h-5 rounded-full transition-all duration-200 ".concat(checked
            ? "".concat(isGradient ? 'bg-gradient-to-r' : '', " ").concat(toggleActive)
            : 'bg-white/20')}>
        <div className={"absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 shadow-md ".concat(checked
            ? 'left-[18px] bg-white'
            : 'left-0.5 bg-gray-400')}/>
      </div>
    </button>);
};
var AdvancedOptions = function (_a) {
    var _b, _c, _d, _e;
    var options = _a.options, setOptions = _a.setOptions, formatType = _a.formatType, theme = _a.theme;
    var t = (0, i18n_1.useI18n)().t;
    var update = function (key, value) {
        var _a;
        return setOptions(__assign(__assign({}, options), (_a = {}, _a[key] = value, _a)));
    };
    var isAudioMode = formatType === 'audio';
    var themeStyles = theme || {
        toggleActive: 'bg-purple-500',
        toggleTrack: 'bg-purple-500/20',
        icon: 'text-purple-400'
    };
    return (<div className="space-y-3 glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
        <lucide_react_1.Settings2 size={16} className={themeStyles.icon}/>
        {t('advancedOptions')}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Toggle label={t('embedThumbnail')} checked={options.embedThumbnail} onChange={function (v) { return update('embedThumbnail', v); }} theme={themeStyles}/>
        <Toggle label={t('embedMetadata')} checked={options.addMetadata} onChange={function (v) { return update('addMetadata', v); }} theme={themeStyles}/>
        <Toggle label={t('embedSubtitles')} checked={options.embedSubs} onChange={function (v) { return update('embedSubs', v); }} disabled={isAudioMode} tooltip={isAudioMode ? t('audioModeWarning') : undefined} theme={themeStyles}/>
        <Toggle label={t('writeAutoSubtitles')} checked={options.writeAutoSub} onChange={function (v) { return update('writeAutoSub', v); }} disabled={isAudioMode} tooltip={isAudioMode ? t('audioModeWarning') : undefined} theme={themeStyles}/>
        <Toggle label={t('splitChapters')} checked={options.splitChapters} onChange={function (v) { return update('splitChapters', v); }} disabled={isAudioMode} tooltip={isAudioMode ? t('audioModeWarning') : undefined} theme={themeStyles}/>
      </div>

      <div className="space-y-3 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between">
          <Toggle label={t('timeRange')} checked={((_b = options.timeRange) === null || _b === void 0 ? void 0 : _b.enabled) || false} onChange={function (v) { return update('timeRange', __assign(__assign({}, options.timeRange), { enabled: v })); }} theme={themeStyles}/>
        </div>

        {((_c = options.timeRange) === null || _c === void 0 ? void 0 : _c.enabled) && (<div className="grid grid-cols-2 gap-3 pl-1">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400">{t('startTime')} (HH:MM:SS)</label>
              <input type="text" value={((_d = options.timeRange) === null || _d === void 0 ? void 0 : _d.start) || ''} onChange={function (e) { return update('timeRange', __assign(__assign({}, options.timeRange), { start: e.target.value })); }} placeholder="00:00:00" className="w-full glass-input rounded-lg px-2 py-1.5 text-xs text-gray-200 bg-[#0b0b0b] font-mono"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400">{t('endTime')} (HH:MM:SS)</label>
              <input type="text" value={((_e = options.timeRange) === null || _e === void 0 ? void 0 : _e.end) || ''} onChange={function (e) { return update('timeRange', __assign(__assign({}, options.timeRange), { end: e.target.value })); }} placeholder="00:01:00" className="w-full glass-input rounded-lg px-2 py-1.5 text-xs text-gray-200 bg-[#0b0b0b] font-mono"/>
            </div>
          </div>)}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] text-gray-400">{t('playlist')}</label>
          <select value={options.playlist} onChange={function (e) { return update('playlist', e.target.value); }} className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]">
            <option value="default">{t('playlistAuto')}</option>
            <option value="single">{t('playlistSingle')}</option>
            <option value="all">{t('playlistAll')}</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-gray-400">{t('browserCookies')}</label>
          <select value={options.cookiesBrowser} onChange={function (e) { return update('cookiesBrowser', e.target.value); }} className="w-full glass-input rounded-xl px-3 py-2 text-xs text-gray-200 bg-[#0b0b0b]">
            <option value="none">{t('cookiesNone')}</option>
            <option value="chrome">Chrome</option>
            <option value="firefox">Firefox</option>
          </select>
        </div>
      </div>

      {isAudioMode && (<p className="text-[11px] text-gray-500">
          ⚠️ {t('audioModeWarning')}
        </p>)}
    </div>);
};
exports.AdvancedOptions = AdvancedOptions;

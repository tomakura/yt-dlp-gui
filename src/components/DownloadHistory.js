"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadHistory = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var framer_motion_1 = require("framer-motion");
var i18n_1 = require("../i18n");
var DownloadHistory = function (_a) {
    var history = _a.history, onClearHistory = _a.onClearHistory, onRemoveItem = _a.onRemoveItem;
    var _b = (0, i18n_1.useI18n)(), t = _b.t, language = _b.language;
    var formatFileSize = function (bytes) {
        if (bytes === 0)
            return t('unknown');
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    var formatDate = function (timestamp) {
        var date = new Date(timestamp);
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        var locale = language === 'ja' ? 'ja-JP' : 'en-US';
        if (days === 0) {
            return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        }
        else if (days === 1) {
            return t('yesterday');
        }
        else if (days < 7) {
            return t('daysAgo').replace('{days}', String(days));
        }
        else {
            return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
        }
    };
    var openFolder = function (filepath) {
        // Extract directory from filepath
        var dir = filepath.substring(0, filepath.lastIndexOf('/')) || filepath;
        window.electron.openFolder(dir);
    };
    var getFolderName = function (path) {
        var parts = path.split('/');
        return parts[parts.length - 1] || path;
    };
    if (history.length === 0) {
        return (<div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <lucide_react_1.History size={16} className="text-blue-400"/>
          {t('downloadHistory')}
        </div>
        <div className="text-center py-8 text-gray-600 text-xs border border-dashed border-white/10 rounded-xl">
          <lucide_react_1.History size={24} className="mx-auto mb-2 opacity-50"/>
          {t('noHistory')}
        </div>
      </div>);
    }
    return (<div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <lucide_react_1.History size={16} className="text-blue-400"/>
          {t('downloadHistory')}
          <span className="text-[10px] text-gray-500 font-normal">({history.length} {t('items')})</span>
        </div>
        <button onClick={onClearHistory} className="text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
          <lucide_react_1.Trash2 size={12}/>
          {t('clearHistory')}
        </button>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
        <framer_motion_1.AnimatePresence>
          {history.map(function (item) { return (<framer_motion_1.motion.div key={item.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="group bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.success ? (<lucide_react_1.CheckCircle size={12} className="text-green-400 shrink-0"/>) : (<lucide_react_1.XCircle size={12} className="text-red-400 shrink-0"/>)}
                    <span className="text-xs text-gray-200 truncate font-medium">
                      {item.title || t('titleUnknown')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-gray-500">
                    <div className="flex items-center gap-1">
                      <lucide_react_1.Clock size={10}/>
                      {formatDate(item.timestamp)}
                    </div>
                    <div className="flex items-center gap-1">
                      <lucide_react_1.HardDrive size={10}/>
                      {formatFileSize(item.fileSize)}
                    </div>
                    <div className="flex items-center gap-1">
                      <lucide_react_1.Folder size={10}/>
                      <span className="truncate max-w-[120px]" title={item.location}>
                        {getFolderName(item.location)}
                      </span>
                    </div>
                    <span className={"px-1.5 py-0.5 rounded text-[9px] ".concat(item.format === 'video'
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-blue-500/20 text-blue-300')}>
                      {item.format === 'video' ? t('video') : t('audio')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.filename && item.success && (<>
                      <button onClick={function () { return openFolder(item.filename); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-colors" title={t('openFile') || 'Open File'}>
                        <lucide_react_1.ExternalLink size={12}/>
                      </button>
                      <button onClick={function () {
                    var _a;
                    var dir = ((_a = item.filename) === null || _a === void 0 ? void 0 : _a.substring(0, item.filename.lastIndexOf(item.filename.includes('\\') ? '\\' : '/'))) || item.location;
                    window.electron.openFolder(dir);
                }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-colors" title={t('openFolder') || 'Open Folder'}>
                        <lucide_react_1.Folder size={12}/>
                      </button>
                    </>)}
                  <button onClick={function () { return onRemoveItem(item.id); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors" title={t('removeFromHistory')}>
                    <lucide_react_1.Trash2 size={12}/>
                  </button>
                </div>
              </div>
            </framer_motion_1.motion.div>); })}
        </framer_motion_1.AnimatePresence>
      </div>
    </div>);
};
exports.DownloadHistory = DownloadHistory;

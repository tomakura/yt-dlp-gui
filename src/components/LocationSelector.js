"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationSelector = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var i18n_1 = require("../i18n");
var LocationSelector = function (_a) {
    var location = _a.location, setLocation = _a.setLocation, favorites = _a.favorites, onToggleFavorite = _a.onToggleFavorite, theme = _a.theme;
    var t = (0, i18n_1.useI18n)().t;
    var themeStyles = theme || {
        icon: 'text-green-400',
        activeTab: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        focusRing: 'focus:ring-purple-500/50'
    };
    var handleBrowse = function () { return __awaiter(void 0, void 0, void 0, function () {
        var selected, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, window.electron.selectDirectory()];
                case 1:
                    selected = _b.sent();
                    if (selected) {
                        setLocation(selected);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var isFavorite = location && favorites.includes(location);
    // Get folder name from path for display (handle both Windows \ and Unix /)
    var getFolderName = function (pathStr) {
        // Split by both forward and back slashes
        var parts = pathStr.split(/[\\/]/);
        return parts[parts.length - 1] || parts[parts.length - 2] || pathStr;
    };
    return (<div className="space-y-2">
      <label className="text-xs text-gray-400 flex items-center gap-2">
        <lucide_react_1.FolderOpen size={14} className={themeStyles.icon}/>
        {t('saveTo')}
      </label>
      <div className="flex gap-2">
        <input type="text" value={location} onChange={function (e) { return setLocation(e.target.value); }} placeholder={t('folderPathPlaceholder')} className="flex-1 glass-input rounded-xl px-3 py-2 text-sm text-gray-200 bg-transparent"/>
        <button type="button" onClick={handleBrowse} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors">
          {t('browse')}
        </button>
        <button type="button" onClick={function () { return location && onToggleFavorite(location); }} disabled={!location} className={"px-3 py-2 rounded-xl border text-xs transition-colors ".concat(isFavorite
            ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30'
            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10', " disabled:opacity-50 disabled:cursor-not-allowed")} title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}>
          <lucide_react_1.Star size={14} fill={isFavorite ? 'currentColor' : 'none'}/>
        </button>
      </div>
      
      {/* Favorites list */}
      {favorites.length > 0 && (<div className="flex flex-wrap gap-1.5 pt-1">
          {favorites.map(function (fav) { return (<button key={fav} onClick={function () { return setLocation(fav); }} className={"group flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors ".concat(location === fav
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-200')} title={fav}>
              <lucide_react_1.Star size={10} className="text-yellow-400" fill="currentColor"/>
              <span className="max-w-[100px] truncate">{getFolderName(fav)}</span>
              <lucide_react_1.X size={10} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity" onClick={function (e) {
                    e.stopPropagation();
                    onToggleFavorite(fav);
                }}/>
            </button>); })}
        </div>)}
    </div>);
};
exports.LocationSelector = LocationSelector;

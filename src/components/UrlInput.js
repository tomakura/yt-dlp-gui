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
exports.UrlInput = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var i18n_1 = require("../i18n");
var UrlInput = function (_a) {
    var url = _a.url, setUrl = _a.setUrl, theme = _a.theme, onImport = _a.onImport;
    var t = (0, i18n_1.useI18n)().t;
    var handlePaste = function () { return __awaiter(void 0, void 0, void 0, function () {
        var text, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, navigator.clipboard.readText()];
                case 1:
                    text = _a.sent();
                    if (text)
                        setUrl(text);
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    console.error('Failed to read clipboard', e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-2">
      <label className="text-xs text-gray-400 flex items-center gap-2">
        <lucide_react_1.Link size={14} className={theme.icon}/>
        {t('downloadUrl')}
      </label>
      <div className="flex gap-2">
        <div className="flex items-center gap-2 flex-1 glass-input rounded-xl px-3 py-2">
          <input type="text" value={url} onChange={function (e) { return setUrl(e.target.value); }} placeholder={t('urlPlaceholder')} className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-full"/>
          {url && (<button onClick={function () { return setUrl(''); }} className="text-gray-500 hover:text-white transition-colors">
              <lucide_react_1.X size={14}/>
            </button>)}
        </div>
        <button onClick={handlePaste} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors" title={t('paste')}>
          <div className="flex items-center gap-1">
            <lucide_react_1.Clipboard size={14}/>
            <span className="hidden sm:inline">{t('paste')}</span>
          </div>
        </button>

        {onImport && (<button onClick={onImport} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors" title={t('importFileTooltip')}>
            <div className="flex items-center gap-1">
              <lucide_react_1.FileText size={14}/>
              <span className="hidden sm:inline">{t('importFile')}</span>
            </div>
          </button>)}
      </div>
    </div>);
};
exports.UrlInput = UrlInput;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useI18n = exports.I18nProvider = void 0;
var react_1 = require("react");
var translations_1 = require("./translations");
var I18nContext = (0, react_1.createContext)(undefined);
var I18nProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(function () {
        var saved = localStorage.getItem('language');
        if (saved && (saved === 'ja' || saved === 'en'))
            return saved;
        // Auto-detect from browser
        var browserLang = navigator.language.toLowerCase();
        return browserLang.startsWith('ja') ? 'ja' : 'en';
    }), language = _b[0], setLanguage = _b[1];
    (0, react_1.useEffect)(function () {
        localStorage.setItem('language', language);
    }, [language]);
    var t = function (key, params) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        var text = translations_1.translations[language][key] || translations_1.translations.ja[key] || key;
        if (params) {
            Object.entries(params).forEach(function (_a) {
                var k = _a[0], v = _a[1];
                text = text.replace("{".concat(k, "}"), v);
            });
        }
        return text;
    };
    return (<I18nContext.Provider value={{ language: language, setLanguage: setLanguage, t: t }}>
      {children}
    </I18nContext.Provider>);
};
exports.I18nProvider = I18nProvider;
var useI18n = function () {
    var context = (0, react_1.useContext)(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
};
exports.useI18n = useI18n;

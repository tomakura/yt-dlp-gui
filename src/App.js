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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var framer_motion_1 = require("framer-motion");
var UrlInput_1 = require("./components/UrlInput");
var FormatSelector_1 = require("./components/FormatSelector");
var LocationSelector_1 = require("./components/LocationSelector");
var AdvancedOptions_1 = require("./components/AdvancedOptions");
var StatusToast_1 = require("./components/StatusToast");
var SettingsModal_1 = require("./components/SettingsModal");
var DownloadHistory_1 = require("./components/DownloadHistory");
var VideoPreview_1 = require("./components/VideoPreview");
var QueueList_1 = require("./components/QueueList");
var i18n_1 = require("./i18n");
// Detect OS for keyboard shortcut display
var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
var themes = {
    default: {
        name: 'Midnight',
        primary: 'from-blue-400',
        secondary: 'via-purple-400',
        accent: 'to-pink-400',
        button: 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600',
        buttonShadow: 'shadow-purple-900/20',
        blob1: 'bg-blue-600/10',
        blob2: 'bg-pink-600/5',
        icon: 'text-purple-400',
        border: 'border-purple-500/20',
        activeTab: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
        toggle: 'bg-purple-500',
        toggleBg: 'bg-purple-500/20',
        focusRing: 'focus:ring-purple-500/50'
    },
    cyberpunk: {
        name: 'Cyberpunk',
        primary: 'from-yellow-400',
        secondary: 'via-red-500',
        accent: 'to-pink-500',
        button: 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500',
        buttonShadow: 'shadow-yellow-900/20',
        blob1: 'bg-yellow-600/10',
        blob2: 'bg-cyan-600/5',
        icon: 'text-yellow-400',
        border: 'border-yellow-500/20',
        activeTab: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
        toggle: 'bg-yellow-500',
        toggleBg: 'bg-yellow-500/20',
        focusRing: 'focus:ring-yellow-500/50'
    },
    ocean: {
        name: 'Ocean',
        primary: 'from-cyan-500',
        secondary: 'via-blue-600',
        accent: 'to-teal-500',
        button: 'bg-gradient-to-r from-cyan-500 via-blue-600 to-teal-500',
        buttonShadow: 'shadow-cyan-900/20',
        blob1: 'bg-cyan-600/10',
        blob2: 'bg-blue-600/5',
        icon: 'text-cyan-400',
        border: 'border-cyan-500/20',
        activeTab: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
        toggle: 'bg-cyan-500',
        toggleBg: 'bg-cyan-500/20',
        focusRing: 'focus:ring-cyan-500/50'
    },
    forest: {
        name: 'Forest',
        primary: 'from-emerald-500',
        secondary: 'via-green-600',
        accent: 'to-lime-500',
        button: 'bg-gradient-to-r from-emerald-500 via-green-600 to-lime-500',
        buttonShadow: 'shadow-emerald-900/20',
        blob1: 'bg-emerald-600/10',
        blob2: 'bg-green-600/5',
        icon: 'text-emerald-400',
        border: 'border-emerald-500/20',
        activeTab: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
        toggle: 'bg-emerald-500',
        toggleBg: 'bg-emerald-500/20',
        focusRing: 'focus:ring-emerald-500/50'
    }
};
function App() {
    var _this = this;
    var t = (0, i18n_1.useI18n)().t;
    var _a = (0, react_1.useState)(''), url = _a[0], setUrl = _a[1];
    var _b = (0, react_1.useState)(function () {
        return localStorage.getItem('lastLocation') || '';
    }), location = _b[0], setLocation = _b[1];
    // Theme State
    var _c = (0, react_1.useState)(function () {
        return localStorage.getItem('theme') || 'default';
    }), currentTheme = _c[0], setCurrentTheme = _c[1];
    (0, react_1.useEffect)(function () {
        localStorage.setItem('theme', currentTheme);
    }, [currentTheme]);
    var theme = themes[currentTheme];
    var _d = (0, react_1.useState)(function () {
        var saved = localStorage.getItem('lastFormatOptions');
        var defaultConversion = {
            enabled: true,
            videoCodec: 'h264',
            videoBitrate: '',
            audioCodec: 'aac',
            audioBitrate: '320k',
            hwEncoder: 'auto'
        };
        if (saved) {
            var parsed = JSON.parse(saved);
            return __assign(__assign({}, parsed), { type: 'video', conversion: parsed.conversion || defaultConversion });
        }
        return {
            type: 'video',
            videoContainer: 'mp4',
            videoResolution: 'best',
            audioFormat: 'mp3',
            audioBitrate: '320k',
            audioSampleRate: '48000',
            audioBitDepth: '16',
            conversion: defaultConversion
        };
    }), formatOptions = _d[0], setFormatOptions = _d[1];
    var _e = (0, react_1.useState)(function () {
        var saved = localStorage.getItem('lastAdvancedOptions');
        return saved ? JSON.parse(saved) : {
            embedThumbnail: true,
            addMetadata: true,
            embedSubs: false,
            writeAutoSub: false,
            splitChapters: false,
            playlist: 'default',
            cookiesBrowser: 'none',
            timeRange: { enabled: false, start: '', end: '' }
        };
    }), advancedOptions = _e[0], setAdvancedOptions = _e[1];
    // Settings State
    var _f = (0, react_1.useState)(false), isSettingsOpen = _f[0], setIsSettingsOpen = _f[1];
    var _g = (0, react_1.useState)([]), presets = _g[0], setPresets = _g[1];
    var _h = (0, react_1.useState)('%(title)s.%(ext)s'), outputTemplate = _h[0], setOutputTemplate = _h[1];
    var _j = (0, react_1.useState)(function () {
        return localStorage.getItem('notificationsEnabled') === 'true';
    }), notificationsEnabled = _j[0], setNotificationsEnabled = _j[1];
    (0, react_1.useEffect)(function () {
        localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
    }, [notificationsEnabled]);
    var _k = (0, react_1.useState)(function () {
        return localStorage.getItem('autoUpdateBinaries') === 'true';
    }), autoUpdateBinaries = _k[0], setAutoUpdateBinaries = _k[1];
    (0, react_1.useEffect)(function () {
        localStorage.setItem('autoUpdateBinaries', String(autoUpdateBinaries));
    }, [autoUpdateBinaries]);
    // Batch Download Queue
    var _l = (0, react_1.useState)(function () {
        var saved = localStorage.getItem('downloadQueue');
        return saved ? JSON.parse(saved) : [];
    }), downloadQueue = _l[0], setDownloadQueue = _l[1];
    var _m = (0, react_1.useState)('download'), activePage = _m[0], setActivePage = _m[1];
    var _o = (0, react_1.useState)(false), isQueueOpen = _o[0], setIsQueueOpen = _o[1];
    // Binary Status State
    var _p = (0, react_1.useState)(null), binariesExist = _p[0], setBinariesExist = _p[1];
    var _q = (0, react_1.useState)(null), binaryStatus = _q[0], setBinaryStatus = _q[1];
    var _r = (0, react_1.useState)(null), binaryUpdateProgress = _r[0], setBinaryUpdateProgress = _r[1];
    var _s = (0, react_1.useState)(false), isUpdatingBinaries = _s[0], setIsUpdatingBinaries = _s[1];
    var _t = (0, react_1.useState)(false), isBinaryVersionLoading = _t[0], setIsBinaryVersionLoading = _t[1];
    var _u = (0, react_1.useState)(null), binaryVersions = _u[0], setBinaryVersions = _u[1];
    var _v = (0, react_1.useState)(null), latestBinaryVersions = _v[0], setLatestBinaryVersions = _v[1];
    // Clipboard Monitor State
    var _w = (0, react_1.useState)(false), isClipboardMonitorEnabled = _w[0], setIsClipboardMonitorEnabled = _w[1];
    // Favorites State
    var _x = (0, react_1.useState)(function () {
        var saved = localStorage.getItem('favoriteFolders');
        return saved ? JSON.parse(saved) : [];
    }), favorites = _x[0], setFavorites = _x[1];
    (0, react_1.useEffect)(function () {
        localStorage.setItem('downloadQueue', JSON.stringify(downloadQueue));
    }, [downloadQueue]);
    // Download History State
    var _y = (0, react_1.useState)(function () {
        var saved = localStorage.getItem('downloadHistory');
        return saved ? JSON.parse(saved) : [];
    }), downloadHistory = _y[0], setDownloadHistory = _y[1];
    var _z = (0, react_1.useState)(false), showConsole = _z[0], setShowConsole = _z[1];
    // Download Progress State
    var _0 = (0, react_1.useState)(0), downloadProgress = _0[0], setDownloadProgress = _0[1];
    var _1 = (0, react_1.useState)(''), currentDownloadUrl = _1[0], setCurrentDownloadUrl = _1[1];
    // Download Progress Details
    var _2 = (0, react_1.useState)(''), downloadSpeed = _2[0], setDownloadSpeed = _2[1];
    var _3 = (0, react_1.useState)(''), downloadedSize = _3[0], setDownloadedSize = _3[1];
    var _4 = (0, react_1.useState)(''), totalSize = _4[0], setTotalSize = _4[1];
    var _5 = (0, react_1.useState)(''), eta = _5[0], setEta = _5[1];
    // Video Preview State
    var _6 = (0, react_1.useState)(false), videoPreviewLoading = _6[0], setVideoPreviewLoading = _6[1];
    var _7 = (0, react_1.useState)(null), videoPreviewError = _7[0], setVideoPreviewError = _7[1];
    var _8 = (0, react_1.useState)(null), videoInfo = _8[0], setVideoInfo = _8[1];
    var _9 = (0, react_1.useState)(null), playlistInfo = _9[0], setPlaylistInfo = _9[1];
    var _10 = (0, react_1.useState)(true), isVideoPreviewExpanded = _10[0], setIsVideoPreviewExpanded = _10[1];
    var isMac = navigator.userAgent.includes('Mac');
    // Calculate estimated size based on format options and video info
    var estimatedSize = (0, react_1.useMemo)(function () {
        var _a, _b;
        var currentVideo = videoInfo || ((_a = playlistInfo === null || playlistInfo === void 0 ? void 0 : playlistInfo.entries) === null || _a === void 0 ? void 0 : _a[0]);
        if (!currentVideo)
            return undefined;
        var duration = currentVideo.duration || 0;
        var formats = currentVideo.formats || [];
        if (formatOptions.type === 'video') {
            var videoFormats = formats.filter(function (f) { return f.vcodec && f.vcodec !== 'none'; });
            var audioFormats = formats.filter(function (f) { return f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'); });
            if (!videoFormats.length)
                return currentVideo.filesize;
            // Find matching video format based on resolution
            var matchingVideoFormat = void 0;
            if (formatOptions.videoResolution === 'best') {
                matchingVideoFormat = __spreadArray([], videoFormats, true).sort(function (a, b) { return (b.height || 0) - (a.height || 0); })[0];
            }
            else {
                var targetHeight_1 = parseInt(formatOptions.videoResolution, 10);
                if (Number.isFinite(targetHeight_1)) {
                    matchingVideoFormat = __spreadArray([], videoFormats, true).sort(function (a, b) {
                        return Math.abs((a.height || 0) - targetHeight_1) - Math.abs((b.height || 0) - targetHeight_1);
                    })[0];
                }
                else {
                    matchingVideoFormat = videoFormats[0];
                }
            }
            // Get video size
            var videoSize = (matchingVideoFormat === null || matchingVideoFormat === void 0 ? void 0 : matchingVideoFormat.filesize) || (matchingVideoFormat === null || matchingVideoFormat === void 0 ? void 0 : matchingVideoFormat.filesize_approx) || 0;
            // If no filesize, estimate from bitrate and duration
            if (!videoSize && duration > 0) {
                if (matchingVideoFormat === null || matchingVideoFormat === void 0 ? void 0 : matchingVideoFormat.tbr) {
                    // tbr is total bitrate in kbps
                    videoSize = Math.round((matchingVideoFormat.tbr * 1000 * duration) / 8);
                }
                else {
                    // Fallback based on resolution
                    var height = (matchingVideoFormat === null || matchingVideoFormat === void 0 ? void 0 : matchingVideoFormat.height) || 0;
                    var estimatedBitrate = 0;
                    if (height >= 2160)
                        estimatedBitrate = 15000;
                    else if (height >= 1440)
                        estimatedBitrate = 8000;
                    else if (height >= 1080)
                        estimatedBitrate = 3000;
                    else if (height >= 720)
                        estimatedBitrate = 1500;
                    else if (height >= 480)
                        estimatedBitrate = 800;
                    else if (height >= 360)
                        estimatedBitrate = 500;
                    else
                        estimatedBitrate = 300;
                    videoSize = Math.round((estimatedBitrate * 1000 * duration) / 8);
                }
            }
            // Get best audio size if video doesn't have audio
            var audioSize = 0;
            var videoHasAudio = (matchingVideoFormat === null || matchingVideoFormat === void 0 ? void 0 : matchingVideoFormat.acodec) && matchingVideoFormat.acodec !== 'none';
            if (!videoHasAudio && audioFormats.length > 0) {
                var bestAudio = __spreadArray([], audioFormats, true).sort(function (a, b) {
                    return (b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0);
                })[0];
                audioSize = (bestAudio === null || bestAudio === void 0 ? void 0 : bestAudio.filesize) || (bestAudio === null || bestAudio === void 0 ? void 0 : bestAudio.filesize_approx) || 0;
                // If no audio filesize, estimate (assume ~128kbps audio)
                if (!audioSize && duration > 0) {
                    audioSize = Math.round((128 * 1000 * duration) / 8);
                }
            }
            var totalSize_1 = videoSize + audioSize;
            return totalSize_1 > 0 ? totalSize_1 : currentVideo.filesize;
        }
        // For audio, calculate based on duration and bitrate
        if (!duration || duration <= 0)
            return undefined;
        var bitrateKbps = 320; // default
        var bitrateMatch = (_b = formatOptions.audioBitrate) === null || _b === void 0 ? void 0 : _b.match(/(\d+)/);
        if (bitrateMatch) {
            bitrateKbps = parseInt(bitrateMatch[1], 10);
        }
        if (formatOptions.audioFormat === 'flac') {
            bitrateKbps = 900; // ~900 kbps average for FLAC
        }
        else if (formatOptions.audioFormat === 'wav') {
            var bitDepth = parseInt(formatOptions.audioBitDepth || '16', 10);
            var sampleRate = parseInt(formatOptions.audioSampleRate || '48000', 10);
            var bytesPerSecond = (sampleRate * bitDepth * 2) / 8;
            return Math.round(duration * bytesPerSecond);
        }
        var estimatedBytes = Math.round((bitrateKbps * 1000 * duration) / 8 * 1.05);
        return estimatedBytes;
    }, [videoInfo, playlistInfo, formatOptions]);
    (0, react_1.useEffect)(function () {
        var interval;
        if (isClipboardMonitorEnabled) {
            interval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                var text, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, navigator.clipboard.readText()];
                        case 1:
                            text = _a.sent();
                            if (text && text !== url && (text.startsWith('http://') || text.startsWith('https://'))) {
                                setUrl(text);
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _a.sent();
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); }, 1000);
        }
        return function () { return clearInterval(interval); };
    }, [isClipboardMonitorEnabled, url]);
    // Download State
    var _11 = (0, react_1.useState)(false), isDownloading = _11[0], setIsDownloading = _11[1];
    var _12 = (0, react_1.useState)('downloading'), progressStage = _12[0], setProgressStage = _12[1];
    var _13 = (0, react_1.useState)('idle'), status = _13[0], setStatus = _13[1];
    var _14 = (0, react_1.useState)([]), logs = _14[0], setLogs = _14[1];
    var logsEndRef = (0, react_1.useRef)(null);
    var logsContainerRef = (0, react_1.useRef)(null);
    // Auto scroll logs
    (0, react_1.useEffect)(function () {
        if (logsContainerRef.current) {
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
    }, [logs]);
    // Parse progress from yt-dlp output
    var parseProgress = (0, react_1.useCallback)(function (log) {
        // Match patterns like "[download]  45.2% of 100.00MiB at 5.00MiB/s ETA 00:10"
        var downloadMatch = log.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*\w+)\s+at\s+(\d+\.?\d*\w+\/s)\s+ETA\s+(\S+)/i);
        if (downloadMatch) {
            setDownloadProgress(parseFloat(downloadMatch[1]));
            setTotalSize(downloadMatch[2]);
            setDownloadSpeed(downloadMatch[3]);
            setEta(downloadMatch[4]);
            // Calculate downloaded size
            var percent = parseFloat(downloadMatch[1]) / 100;
            var totalMatch = downloadMatch[2].match(/(\d+\.?\d*)/);
            if (totalMatch) {
                var total = parseFloat(totalMatch[1]);
                var downloaded = total * percent;
                var unit = downloadMatch[2].replace(/[\d.]/g, '');
                setDownloadedSize("".concat(downloaded.toFixed(1)).concat(unit));
            }
            return;
        }
        // Match simpler pattern "[download]  45.2% of 100.00MiB"
        var simpleMatch = log.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*\w+)/i);
        if (simpleMatch) {
            setDownloadProgress(parseFloat(simpleMatch[1]));
            setTotalSize(simpleMatch[2]);
        }
        // Detect conversion phase
        if (log.includes('[ExtractAudio]') || log.includes('[Merger]') || log.includes('Destination:')) {
            setProgressStage('converting');
        }
        // Also match ffmpeg conversion progress
        var ffmpegMatch = log.match(/time=(\d+):(\d+):(\d+)/);
        if (ffmpegMatch) {
            setProgressStage('converting');
            // Just indicate activity during conversion
            setDownloadProgress(function (prev) { return Math.min(prev + 0.1, 99); });
        }
    }, []);
    // Track the current fetch request to avoid stale results
    var fetchRequestIdRef = (0, react_1.useRef)(0);
    var fetchTimeoutRef = (0, react_1.useRef)(null);
    // Fetch video info when URL changes
    var fetchVideoInfoDebounced = (0, react_1.useCallback)(function (urlToFetch) {
        // Clear any pending timeout
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
            fetchTimeoutRef.current = null;
        }
        // Increment request ID to invalidate any in-flight requests
        fetchRequestIdRef.current += 1;
        var currentRequestId = fetchRequestIdRef.current;
        if (!urlToFetch || !urlToFetch.startsWith('http')) {
            setVideoInfo(null);
            setPlaylistInfo(null);
            setVideoPreviewError(null);
            setVideoPreviewLoading(false);
            return;
        }
        fetchTimeoutRef.current = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
            var result, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setVideoPreviewLoading(true);
                        setVideoPreviewError(null);
                        setVideoInfo(null);
                        setPlaylistInfo(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, window.electron.fetchVideoInfo(urlToFetch)];
                    case 2:
                        result = _a.sent();
                        // Check if this request is still the latest one
                        if (currentRequestId !== fetchRequestIdRef.current) {
                            // A newer request has been made, discard this result
                            return [2 /*return*/];
                        }
                        if (result.error) {
                            setVideoPreviewError(result.error);
                        }
                        else if (result.isPlaylist && result.playlist) {
                            setPlaylistInfo(result.playlist);
                        }
                        else if (result.video) {
                            setVideoInfo(result.video);
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        // Check if this request is still the latest one
                        if (currentRequestId !== fetchRequestIdRef.current) {
                            return [2 /*return*/];
                        }
                        setVideoPreviewError(err_1.message || 'Failed to fetch video info');
                        return [3 /*break*/, 5];
                    case 4:
                        // Only update loading state if this is still the latest request
                        if (currentRequestId === fetchRequestIdRef.current) {
                            setVideoPreviewLoading(false);
                        }
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); }, 500); // Debounce 500ms
    }, []);
    // Trigger video info fetch when URL changes
    (0, react_1.useEffect)(function () {
        if (url && binariesExist) {
            setIsVideoPreviewExpanded(true); // Expand preview when URL changes
            fetchVideoInfoDebounced(url);
        }
        else {
            setVideoInfo(null);
            setPlaylistInfo(null);
        }
    }, [url, binariesExist, fetchVideoInfoDebounced]);
    var checkBinaries = function () { return __awaiter(_this, void 0, void 0, function () {
        var result, allExist, versions, migration_1, recheck, allExistAfter, versions, err_2, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 18, , 19]);
                    return [4 /*yield*/, window.electron.checkBinaries()];
                case 1:
                    result = _a.sent();
                    console.log('checkBinaries result:', result);
                    allExist = result.ytdlp && result.ffmpeg;
                    setBinariesExist(allExist);
                    if (!allExist) return [3 /*break*/, 6];
                    setIsBinaryVersionLoading(true);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 4, 5]);
                    return [4 /*yield*/, window.electron.getBinaryVersions()];
                case 3:
                    versions = _a.sent();
                    setBinaryVersions(versions);
                    return [3 /*break*/, 5];
                case 4:
                    setIsBinaryVersionLoading(false);
                    return [7 /*endfinally*/];
                case 5:
                    // Fetch latest versions in background
                    window.electron.getLatestBinaryVersions().then(function (latest) {
                        setLatestBinaryVersions(latest);
                    }).catch(function (err) { return console.error('Failed to fetch latest versions', err); });
                    _a.label = 6;
                case 6:
                    if (!!allExist) return [3 /*break*/, 17];
                    setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ['Error: yt-dlp or ffmpeg binaries not found.'], false); });
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 16, , 17]);
                    return [4 /*yield*/, window.electron.migrateLegacyBinaries()];
                case 8:
                    migration_1 = _a.sent();
                    if (!(migration_1 === null || migration_1 === void 0 ? void 0 : migration_1.migrated)) return [3 /*break*/, 14];
                    setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
                        "Migrated legacy binaries: ".concat(migration_1.copied.join(', '))
                    ], false); });
                    return [4 /*yield*/, window.electron.checkBinaries()];
                case 9:
                    recheck = _a.sent();
                    allExistAfter = recheck.ytdlp && recheck.ffmpeg;
                    setBinariesExist(allExistAfter);
                    if (!allExistAfter) return [3 /*break*/, 13];
                    setIsBinaryVersionLoading(true);
                    _a.label = 10;
                case 10:
                    _a.trys.push([10, , 12, 13]);
                    return [4 /*yield*/, window.electron.getBinaryVersions()];
                case 11:
                    versions = _a.sent();
                    setBinaryVersions(versions);
                    return [3 /*break*/, 13];
                case 12:
                    setIsBinaryVersionLoading(false);
                    return [7 /*endfinally*/];
                case 13: return [3 /*break*/, 15];
                case 14:
                    if (migration_1 === null || migration_1 === void 0 ? void 0 : migration_1.error) {
                        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["Legacy binary migration failed: ".concat(migration_1.error)], false); });
                    }
                    _a.label = 15;
                case 15: return [3 /*break*/, 17];
                case 16:
                    err_2 = _a.sent();
                    console.error('Failed to migrate legacy binaries', err_2);
                    return [3 /*break*/, 17];
                case 17: return [3 /*break*/, 19];
                case 18:
                    error_1 = _a.sent();
                    console.error("Failed to check binaries", error_1);
                    setBinariesExist(false);
                    return [3 /*break*/, 19];
                case 19: return [2 /*return*/];
            }
        });
    }); };
    // Auto-update binaries and app check on startup
    (0, react_1.useEffect)(function () {
        var checkUpdates = function () { return __awaiter(_this, void 0, void 0, function () {
            var update, version_1, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, window.electron.checkAppUpdate()];
                    case 1:
                        update = _a.sent();
                        if (update && update.available) {
                            version_1 = update.latestVersion || 'latest';
                            setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('newVersionAvailable').replace('{version}', version_1)], false); });
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _a.sent();
                        console.error('Failed to check app update:', e_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        checkUpdates();
    }, [t]);
    // Effect to trigger binary update if auto-update is enabled and updates are available
    (0, react_1.useEffect)(function () {
        if (autoUpdateBinaries && binariesExist && latestBinaryVersions && binaryVersions) {
            var shouldUpdateYtDlp = latestBinaryVersions.ytDlp !== 'Unknown' && latestBinaryVersions.ytDlp !== binaryVersions.ytDlp;
            // For ffmpeg, simplest logic: update if different and not unknown
            var shouldUpdateFfmpeg = latestBinaryVersions.ffmpeg !== 'Unknown' &&
                latestBinaryVersions.ffmpeg !== 'latest' &&
                !binaryVersions.ffmpeg.startsWith('N-') &&
                binaryVersions.ffmpeg !== latestBinaryVersions.ffmpeg;
            if (shouldUpdateYtDlp && !isUpdatingBinaries) {
                handleUpdateBinaries();
            }
            // NOTE: We don't auto-update ffmpeg yet to avoid conflicts or long downloads without explicit user consent/visibility
            // But we could add it here if desired.
        }
    }, [autoUpdateBinaries, binariesExist, binaryVersions, latestBinaryVersions]);
    (0, react_1.useEffect)(function () {
        // Load presets and template from localStorage
        var savedPresets = localStorage.getItem('globalPresets');
        if (savedPresets) {
            try {
                setPresets(JSON.parse(savedPresets));
            }
            catch (e) {
                console.error('Failed to parse presets', e);
            }
        }
        var savedTemplate = localStorage.getItem('outputTemplate');
        if (savedTemplate)
            setOutputTemplate(savedTemplate);
        // Set default download location if not already set
        if (!location) {
            window.electron.getDefaultDownloadPath().then(function (defaultPath) {
                setLocation(defaultPath);
                localStorage.setItem('lastLocation', defaultPath);
            }).catch(function (err) { return console.error('Failed to get default download path', err); });
        }
        checkBinaries();
    }, []);
    // Separate effect for download listeners to avoid stale closures
    (0, react_1.useEffect)(function () {
        var removeDownloadListeners = window.electron.onDownloadProgress(function (progress) {
            setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [progress], false); });
            parseProgress(progress);
        });
        return function () {
            removeDownloadListeners();
        };
    }, [parseProgress]);
    // Effect for binary update progress
    (0, react_1.useEffect)(function () {
        var removeBinaryProgressListener = window.electron.onBinaryUpdateProgress(function (progress) {
            setBinaryUpdateProgress(progress);
        });
        return function () {
            removeBinaryProgressListener();
        };
    }, []);
    // Refs to hold current values for download complete callback
    var currentDownloadUrlRef = react_1.default.useRef(currentDownloadUrl);
    var locationRef = react_1.default.useRef(location);
    var formatTypeRef = react_1.default.useRef(formatOptions.type);
    // Keep refs up to date
    (0, react_1.useEffect)(function () {
        currentDownloadUrlRef.current = currentDownloadUrl;
        locationRef.current = location;
        formatTypeRef.current = formatOptions.type;
    }, [currentDownloadUrl, location, formatOptions.type]);
    // Effect for download complete - only register once
    (0, react_1.useEffect)(function () {
        var removeCompleteListeners = window.electron.onDownloadComplete(function (result) {
            setIsDownloading(false);
            if (result.message.toLowerCase().includes('cancel')) {
                setStatus('cancelled');
            }
            else {
                setStatus(result.success ? 'complete' : 'error');
            }
            setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [result.message], false); });
            setDownloadProgress(result.success ? 100 : 0);
            // Add to history - use refs to get current values
            setDownloadHistory(function (prev) {
                var historyItem = {
                    id: crypto.randomUUID(),
                    url: currentDownloadUrlRef.current,
                    title: result.title || '',
                    location: locationRef.current,
                    filename: result.filename || '',
                    fileSize: result.fileSize || 0,
                    format: formatTypeRef.current,
                    timestamp: Date.now(),
                    success: result.success
                };
                return __spreadArray([historyItem], prev, true).slice(0, 50); // Keep max 50 items
            });
        });
        return function () {
            removeCompleteListeners();
        };
    }, []); // Empty dependency array - register only once
    // Save settings when changed
    (0, react_1.useEffect)(function () {
        localStorage.setItem('globalPresets', JSON.stringify(presets));
    }, [presets]);
    (0, react_1.useEffect)(function () {
        localStorage.setItem('outputTemplate', outputTemplate);
    }, [outputTemplate]);
    (0, react_1.useEffect)(function () {
        localStorage.setItem('lastLocation', location);
    }, [location]);
    (0, react_1.useEffect)(function () {
        localStorage.setItem('lastFormatOptions', JSON.stringify(formatOptions));
    }, [formatOptions]);
    (0, react_1.useEffect)(function () {
        localStorage.setItem('lastAdvancedOptions', JSON.stringify(advancedOptions));
    }, [advancedOptions]);
    (0, react_1.useEffect)(function () {
        localStorage.setItem('favoriteFolders', JSON.stringify(favorites));
    }, [favorites]);
    (0, react_1.useEffect)(function () {
        localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
    }, [downloadHistory]);
    // ...
    var handleToggleFavorite = function (path) {
        if (favorites.includes(path)) {
            setFavorites(favorites.filter(function (f) { return f !== path; }));
        }
        else {
            setFavorites(__spreadArray(__spreadArray([], favorites, true), [path], false));
        }
    };
    var handleClearHistory = function () {
        setDownloadHistory([]);
    };
    var handleRemoveHistoryItem = function (id) {
        setDownloadHistory(function (prev) { return prev.filter(function (item) { return item.id !== id; }); });
    };
    var handleSavePreset = function (name) {
        var newPreset = {
            id: crypto.randomUUID(),
            name: name,
            location: location,
            format: formatOptions
        };
        setPresets(__spreadArray(__spreadArray([], presets, true), [newPreset], false));
    };
    var handleDeletePreset = function (id) {
        setPresets(presets.filter(function (p) { return p.id !== id; }));
    };
    var handleApplyPreset = function (preset) {
        setLocation(preset.location);
        setFormatOptions(preset.format);
    };
    var handleCancelVideoDownload = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isDownloading) return [3 /*break*/, 2];
                    return [4 /*yield*/, window.electron.cancelDownload()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); };
    // Refactor handleDownload to accept URL override
    var startDownloadProcess = (0, react_1.useCallback)(function (targetUrl, subfolder) {
        if (!targetUrl)
            return;
        if (!location) {
            alert(t('selectDestination'));
            return;
        }
        setIsDownloading(true);
        setStatus('downloading');
        setProgressStage('downloading');
        setDownloadProgress(0);
        setCurrentDownloadUrl(targetUrl);
        setLogs([t('startingDownload')]);
        // Reset progress details
        setDownloadSpeed('');
        setDownloadedSize('');
        setTotalSize('');
        setEta('');
        var args = [];
        var customArgsInput = document.getElementById('custom-args');
        var customArgs = (customArgsInput === null || customArgsInput === void 0 ? void 0 : customArgsInput.value) ? customArgsInput.value.split(' ').filter(function (a) { return a; }) : [];
        // Determine final output template
        var finalOutputTemplate = outputTemplate;
        // If subfolder is provided (Batch Import), prepend it
        if (subfolder) {
            // Use forward slash for template, yt-dlp handles OS path separators
            finalOutputTemplate = "".concat(subfolder, "/") + finalOutputTemplate;
        }
        // If it's a playlist (and not a batch import with explicit subfolder), append playlist folder
        else if (advancedOptions.playlist === 'all' || (playlistInfo && playlistInfo.entries.length > 1)) {
            finalOutputTemplate = '%(playlist_title)s/' + finalOutputTemplate;
        }
        window.electron.startDownload({
            url: targetUrl,
            format: formatOptions.type,
            location: location,
            args: customArgs,
            options: formatOptions,
            advancedOptions: advancedOptions,
            videoConversion: formatOptions.conversion,
            outputTemplate: finalOutputTemplate,
            notificationsEnabled: notificationsEnabled
        });
    }, [location, formatOptions, advancedOptions, outputTemplate, notificationsEnabled, t, playlistInfo]);
    // Update original handleDownload to use the new function
    var handleDownload = (0, react_1.useCallback)(function () {
        startDownloadProcess(url);
    }, [startDownloadProcess, url]);
    var handleAddToQueue = (0, react_1.useCallback)(function () {
        if (!url)
            return;
        if (!location) {
            alert(t('selectDestination'));
            return;
        }
        setDownloadQueue(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{ url: url }], false); });
        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('queuedForDownload', { url: url })], false); });
    }, [location, t, url]);
    var handleRemoveQueueItem = (0, react_1.useCallback)(function (index) {
        setDownloadQueue(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    }, []);
    var handleMoveQueueItem = (0, react_1.useCallback)(function (index, direction) {
        setDownloadQueue(function (prev) {
            var _a;
            var newQueue = __spreadArray([], prev, true);
            var targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= newQueue.length)
                return prev;
            _a = [newQueue[targetIndex], newQueue[index]], newQueue[index] = _a[0], newQueue[targetIndex] = _a[1];
            return newQueue;
        });
    }, []);
    var handleClearQueue = (0, react_1.useCallback)(function () {
        setDownloadQueue([]);
    }, []);
    // Queue processing effect - improved
    (0, react_1.useEffect)(function () {
        if (!isDownloading && downloadQueue.length > 0) {
            var nextItem_1 = downloadQueue[0];
            setDownloadQueue(function (prev) { return prev.slice(1); });
            // Update URL state for UI consistency
            setUrl(nextItem_1.url);
            setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('startingQueuedDownload', { url: nextItem_1.url })], false); });
            // Start download
            startDownloadProcess(nextItem_1.url, nextItem_1.subfolder);
        }
    }, [isDownloading, downloadQueue, startDownloadProcess, t]);
    var handleBatchImport = function () { return __awaiter(_this, void 0, void 0, function () {
        var result, urls_1, filePath, fileName, subfolder_1, queueItems_1, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, window.electron.openFileDialog()];
                case 1:
                    result = _a.sent();
                    if (result && result.content) {
                        urls_1 = result.content.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(function (line) { return line && !line.startsWith('#'); });
                        filePath = result.filePath;
                        fileName = filePath.split(/[/\\]/).pop() || 'Batch Download';
                        subfolder_1 = fileName.replace(/\.[^/.]+$/, "");
                        if (urls_1.length > 0) {
                            queueItems_1 = urls_1.map(function (url) { return ({ url: url, subfolder: subfolder_1 }); });
                            setDownloadQueue(function (prev) { return __spreadArray(__spreadArray([], prev, true), queueItems_1, true); });
                            setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["Added ".concat(urls_1.length, " URLs to queue (Folder: ").concat(subfolder_1, ")")], false); });
                        }
                    }
                    return [3 /*break*/, 3];
                case 2:
                    e_3 = _a.sent();
                    console.error('Failed to import file', e_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Keyboard shortcuts - must be after handleDownload definition
    (0, react_1.useEffect)(function () {
        var handleKeyDown = function (e) {
            // Cmd/Ctrl + Enter to start download
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (!isDownloading && url && location && binariesExist !== false && !isSettingsOpen) {
                    handleDownload();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return function () { return window.removeEventListener('keydown', handleKeyDown); };
    }, [isDownloading, url, location, binariesExist, isSettingsOpen, handleDownload]);
    var handleUpdateBinaries = function () { return __awaiter(_this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsUpdatingBinaries(true);
                    setBinaryUpdateProgress({ type: 'ytdlp', percent: 0, statusKey: 'startingYtDlpUpdate' });
                    setBinaryStatus(null);
                    setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('startingYtDlpUpdate')], false); });
                    return [4 /*yield*/, window.electron.updateYtDlp()];
                case 1:
                    result = _a.sent();
                    setIsUpdatingBinaries(false);
                    setBinaryUpdateProgress(null);
                    if (result === true) {
                        setBinaryStatus({ message: t('updateComplete'), type: 'success' });
                        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('ytDlpUpdateComplete')], false); });
                    }
                    else if (result === 'cancelled') {
                        setBinaryStatus({ message: t('updateCancelled'), type: 'info' });
                        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('ytDlpUpdateCancelled')], false); });
                    }
                    else {
                        setBinaryStatus({ message: t('updateFailed'), type: 'error' });
                        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('ytDlpUpdateFailed')], false); });
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var handleUpdateFfmpeg = function () { return __awaiter(_this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsUpdatingBinaries(true);
                    setBinaryUpdateProgress({ type: 'ffmpeg', percent: 0, statusKey: 'startingFfmpegUpdate' });
                    setBinaryStatus(null);
                    setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('startingFfmpegUpdate')], false); });
                    return [4 /*yield*/, window.electron.updateFfmpeg()];
                case 1:
                    result = _a.sent();
                    setIsUpdatingBinaries(false);
                    setBinaryUpdateProgress(null);
                    if (result === true) {
                        setBinaryStatus({ message: t('updateComplete'), type: 'success' });
                        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('ffmpegUpdateComplete')], false); });
                    }
                    else if (result === 'cancelled') {
                        setBinaryStatus({ message: t('updateCancelled'), type: 'info' });
                        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('ffmpegUpdateCancelled')], false); });
                    }
                    else {
                        setBinaryStatus({ message: t('updateFailed'), type: 'error' });
                        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('ffmpegUpdateFailed')], false); });
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var handleCancelDownload = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, window.electron.cancelBinaryDownload()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDownloadBinaries = function () { return __awaiter(_this, void 0, void 0, function () {
        var success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsUpdatingBinaries(true);
                    setBinaryUpdateProgress({ type: 'ytdlp', percent: 0, statusKey: 'startingBinaryDownload' });
                    setBinaryStatus(null);
                    setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('startingBinaryDownload')], false); });
                    return [4 /*yield*/, window.electron.downloadBinaries()];
                case 1:
                    success = _a.sent();
                    setIsUpdatingBinaries(false);
                    setBinaryUpdateProgress(null);
                    if (success) {
                        setBinaryStatus({ message: t('downloadComplete2'), type: 'success' });
                        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('binaryDownloadComplete')], false); });
                        checkBinaries(); // Re-check status
                    }
                    else {
                        setBinaryStatus({ message: t('downloadFailed'), type: 'error' });
                        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [t('binaryDownloadFailed')], false); });
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-hidden relative flex flex-col">
			{/* Background Gradients */}
			<div className={"fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none animate-pulse ".concat(theme.blob1)} style={{ animationDuration: '8s' }}/>
			<div className={"fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none animate-pulse ".concat(theme.blob2)} style={{ animationDuration: '10s', animationDelay: '1s' }}/>
			<div className={"fixed top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none ".concat(theme.blob1)}/>

			{/* Drag Region & Window Controls */}
			<div className="fixed top-0 left-0 w-full h-10 z-50 drag"/>

			<div className="flex-1 flex flex-col min-h-0 w-full max-w-full mx-auto p-4 pt-8 relative z-10">

				{/* Header */}
				<framer_motion_1.motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-1 mb-4 relative shrink-0">
					<div className={"absolute top-0 flex items-center gap-2 z-50 no-drag ".concat(isMac ? 'right-0 flex-row-reverse' : 'left-0')}>
						<button onClick={function () { return setIsSettingsOpen(true); }} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer" title={t('settings')}>
							<lucide_react_1.Settings size={18} className={theme.icon}/>
						</button>

						{presets.length > 0 && (<select onChange={function (e) {
                var preset = presets.find(function (p) { return p.id === e.target.value; });
                if (preset)
                    handleApplyPreset(preset);
            }} className="glass-input rounded-full px-3 py-1.5 text-[10px] text-gray-300 cursor-pointer hover:bg-white/10 transition-colors appearance-none" defaultValue="">
								<option value="" disabled>{t('preset')}</option>
								{presets.map(function (preset) { return (<option key={preset.id} value={preset.id} className="bg-[#111] text-white">
										{preset.name}
									</option>); })}
							</select>)}
					</div>

					<h1 className={"text-3xl font-bold font-display bg-gradient-to-r ".concat(theme.primary, " ").concat(theme.secondary, " ").concat(theme.accent, " bg-clip-text text-transparent drop-shadow-2xl tracking-tight")}>
						yt-dlp GUI
					</h1>
					<p className="text-gray-400 text-xs font-light tracking-wide">{t('appSubtitle')}</p>
					<div className="flex justify-center gap-2 pt-3">
						<button onClick={function () { return setActivePage('download'); }} className={"px-4 py-2 rounded-full border text-sm transition-colors ".concat(activePage === 'download'
            ? "".concat(theme.activeTab, " border-white/30")
            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10')}>
							{t('downloadTab')}
						</button>
						<button onClick={function () { return setActivePage('history'); }} className={"px-4 py-2 rounded-full border text-sm transition-colors ".concat(activePage === 'history'
            ? "".concat(theme.activeTab, " border-white/30")
            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10')}>
							{t('history')}
						</button>
					</div>
				</framer_motion_1.motion.div>

				<div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
					{activePage === 'download' ? (<framer_motion_1.motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar pb-4">
							<div className="glass rounded-3xl p-5 shadow-2xl flex flex-col gap-4 flex-1">
								{binariesExist === false && (<div className={"bg-red-500/10 border ".concat(theme.border, " text-red-400 p-3 rounded-xl flex items-center gap-3 text-xs shrink-0")}>
										<lucide_react_1.AlertCircle size={16}/>
										<span>{t('binaryNotFound')}</span>
									</div>)}

								<div className="shrink-0 space-y-3">
									<UrlInput_1.UrlInput url={url} setUrl={setUrl} theme={{ icon: theme.icon }} onImport={handleBatchImport}/>

									{/* Video Preview */}
									{url && (<VideoPreview_1.VideoPreview url={url} isLoading={videoPreviewLoading} error={videoPreviewError} videoInfo={videoInfo} playlistInfo={playlistInfo} onToggle={function () { return setIsVideoPreviewExpanded(!isVideoPreviewExpanded); }} onRefresh={function () { return fetchVideoInfoDebounced(url); }} isExpanded={isVideoPreviewExpanded} theme={{
                    icon: theme.icon,
                    primary: theme.primary,
                    secondary: theme.secondary,
                    accent: theme.accent
                }}/>)}

									{/* Clipboard Monitor Toggle */}
									<div className="flex items-center justify-end px-1">
										<div className="flex items-center gap-2 cursor-pointer" onClick={function () { return setIsClipboardMonitorEnabled(!isClipboardMonitorEnabled); }}>
											<div className={"w-2 h-2 rounded-full transition-colors ".concat(isClipboardMonitorEnabled ? "".concat(theme.toggle, " animate-pulse") : 'bg-gray-600')}/>
											<span className="text-xs text-gray-400 select-none">{t('clipboardMonitoring')}</span>
											<div className={"relative w-8 h-4 rounded-full transition-colors duration-200 ".concat(isClipboardMonitorEnabled ? theme.toggleBg : 'bg-white/10')}>
												<div className={"absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform duration-200 ".concat(isClipboardMonitorEnabled ? "translate-x-4 ".concat(theme.toggle) : 'bg-gray-400')}/>
											</div>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
									<FormatSelector_1.FormatSelector options={formatOptions} setOptions={setFormatOptions} theme={{
                tabActive: theme.activeTab.split(' ')[0],
                tabActiveText: theme.activeTab.split(' ')[1],
                tabInactive: 'bg-white/5',
                tabInactiveText: 'text-gray-400',
                toggleActive: theme.toggle,
                toggleTrack: theme.toggleBg,
                icon: theme.icon
            }} estimatedSize={estimatedSize}/>
									<div className="space-y-4">
										<LocationSelector_1.LocationSelector location={location} setLocation={setLocation} favorites={favorites} onToggleFavorite={handleToggleFavorite} theme={{
                icon: theme.icon,
                activeTab: theme.activeTab,
                focusRing: theme.focusRing
            }}/>

										<AdvancedOptions_1.AdvancedOptions options={advancedOptions} setOptions={setAdvancedOptions} formatType={formatOptions.type} theme={{
                toggleActive: theme.toggle,
                toggleTrack: theme.toggleBg,
                icon: theme.icon
            }}/>

										<div className="space-y-2">
											<details className="group">
												<summary className="flex items-center gap-2 text-[10px] font-medium text-gray-400 cursor-pointer hover:text-white transition-colors select-none">
													<lucide_react_1.Terminal size={12}/>
													{t('customArgs')}
												</summary>
												<div className="mt-1">
													<input type="text" placeholder={t('customArgsPlaceholder')} className="w-full glass-input rounded-xl px-3 py-2 text-[10px] text-gray-300 placeholder-gray-600" id="custom-args"/>
												</div>
											</details>
										</div>
									</div>
								</div>

								<div className="mt-auto pt-2 shrink-0 space-y-3">

									<div className="flex gap-2">
										<framer_motion_1.motion.button whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)" }} whileTap={{ scale: 0.99 }} onClick={handleDownload} disabled={isDownloading || !url || !location || binariesExist === false} className={"relative flex-1 py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all overflow-hidden ".concat(isDownloading
                ? 'bg-white/5 cursor-not-allowed text-gray-300 border border-white/10'
                : "".concat(theme.button, " text-white shadow-xl ").concat(theme.buttonShadow, " border border-white/10"))}>
											{/* Progress bar background */}
											{isDownloading && (<framer_motion_1.motion.div className={"absolute inset-0 ".concat(theme.button, " opacity-30")} initial={{ width: '0%' }} animate={{ width: "".concat(downloadProgress, "%") }} transition={{ duration: 0.3 }}/>)}

											<span className="relative z-10 flex items-center gap-2">
												{isDownloading ? (<>
														<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
														{progressStage === 'converting' ? (<span className="animate-pulse">{t('converting')} {downloadProgress > 0 && "".concat(downloadProgress.toFixed(1), "%")}</span>) : (<span>{t('processing')} {downloadProgress > 0 && "".concat(downloadProgress.toFixed(1), "%")}</span>)}
													</>) : (<>
														<lucide_react_1.Download size={18}/>
														{t('startDownload')}
														<span className="text-xs opacity-60 ml-1">({isMac ? '⌘' : 'Ctrl'}+Enter)</span>
													</>)}
											</span>
										</framer_motion_1.motion.button>

										<framer_motion_1.motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={handleAddToQueue} disabled={!url || !location || binariesExist === false} className={"px-4 rounded-2xl border transition-all flex items-center gap-2 text-sm font-medium ".concat(!url || !location || binariesExist === false
                ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/15')}>
											<lucide_react_1.ListPlus size={18}/>
											{isDownloading ? t('addToQueue') : t('queueDownload')}
											{downloadQueue.length > 0 && (<span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-xs text-gray-200">
													{downloadQueue.length}
												</span>)}
										</framer_motion_1.motion.button>

										{isDownloading && (<framer_motion_1.motion.button initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCancelVideoDownload} className="px-4 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 flex items-center justify-center" title={t('cancel')}>
												<lucide_react_1.XCircle size={20}/>
											</framer_motion_1.motion.button>)}
									</div>

									{/* Download Progress Details */}
									<framer_motion_1.AnimatePresence>
										{isDownloading && (downloadSpeed || downloadedSize || eta) && (<framer_motion_1.motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
												<div className="glass rounded-xl p-3 flex items-center justify-between text-xs">
													<div className="flex items-center gap-4">
														{downloadSpeed && (<div className="flex items-center gap-1.5">
																<lucide_react_1.Zap size={12} className="text-yellow-400"/>
																<span className="text-gray-400">{t('downloadSpeed')}:</span>
																<span className="text-white font-medium">{downloadSpeed}</span>
															</div>)}
														{downloadedSize && totalSize && (<div className="flex items-center gap-1.5">
																<lucide_react_1.Download size={12} className="text-emerald-400"/>
																<span className="text-gray-400">{t('downloadedSize')}:</span>
																<span className="text-white font-medium">{downloadedSize} / {totalSize}</span>
															</div>)}
													</div>
													{eta && eta !== 'Unknown' && (<div className="flex items-center gap-1.5">
															<span className="text-gray-400">{t('remainingTime')}:</span>
															<span className="text-white font-medium">{eta}</span>
														</div>)}
												</div>
											</framer_motion_1.motion.div>)}
									</framer_motion_1.AnimatePresence>

									<div className="flex items-center justify-between text-xs text-gray-300 relative z-50">
										<div className="flex items-center gap-2">
											{/* Queue Count removed as requested */}
										</div>

										<div className="relative">
											<button onClick={function () { return setIsQueueOpen(!isQueueOpen); }} className={"flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ".concat(isDownloading && downloadQueue.length > 0
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10')}>
												<lucide_react_1.ClipboardList size={14}/>
												{isDownloading && downloadQueue.length > 0 ? (<span>{t('processing')} {1} / {1 + downloadQueue.length}</span>) : (<span>{t('viewQueue')} ({downloadQueue.length})</span>)}
											</button>

											<framer_motion_1.AnimatePresence>
												{isQueueOpen && (<QueueList_1.QueueList queue={downloadQueue} onRemove={handleRemoveQueueItem} onMove={handleMoveQueueItem} onClear={handleClearQueue} onClose={function () { return setIsQueueOpen(false); }} isDownloading={isDownloading}/>)}
											</framer_motion_1.AnimatePresence>
										</div>
									</div>

									{/* Console Toggle & Output */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<button onClick={function () { return setShowConsole(!showConsole); }} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
												<lucide_react_1.Terminal size={12}/>
												<span>{t('consoleOutput')}</span>
												<framer_motion_1.motion.div animate={{ rotate: showConsole ? 180 : 0 }} transition={{ duration: 0.2 }}>
													<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
														<path d="M6 9l6 6 6-6"/>
													</svg>
												</framer_motion_1.motion.div>
											</button>

											{/* Status Toast Placeholder / Display */}
											<div className="h-8 flex items-center justify-end min-w-[200px]">
												<framer_motion_1.AnimatePresence mode="wait">
													{status !== 'idle' && (<framer_motion_1.motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
															<StatusToast_1.StatusToast status={status} message={status === 'complete' ? t('downloadCompleteMsg') :
                    status === 'downloading' ? t('downloadingMsg') :
                        status === 'cancelled' ? t('cancelledMsg') :
                            t('downloadErrorMsg')} onClose={function () { return setStatus('idle'); }}/>
														</framer_motion_1.motion.div>)}
												</framer_motion_1.AnimatePresence>
											</div>
										</div>

										<framer_motion_1.AnimatePresence>
											{showConsole && (<framer_motion_1.motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 200, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
													<div className="glass rounded-xl p-3 h-full flex flex-col">
														<div className="flex justify-end mb-2">
															<button onClick={function () { return setLogs([]); }} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors" title={t('clearLogs')}>
																<lucide_react_1.X size={12}/>
															</button>
														</div>
														<div ref={logsContainerRef} className="flex-1 bg-[#0a0a0a]/50 rounded-lg border border-white/5 p-2 overflow-y-auto font-mono text-[10px] text-gray-300 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent shadow-inner">
															{logs.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 opacity-50">
																	<lucide_react_1.Terminal size={16}/>
																	<span>{t('waiting')}</span>
																</div>) : (<>
																	{logs.map(function (log, i) { return (<framer_motion_1.motion.div key={i} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="break-all border-l-2 border-transparent hover:border-white/20 pl-2 transition-colors leading-relaxed">
																			{log}
																		</framer_motion_1.motion.div>); })}
																	<div ref={logsEndRef}/>
																</>)}
														</div>
													</div>
												</framer_motion_1.motion.div>)}
										</framer_motion_1.AnimatePresence>
									</div>
								</div>
							</div>
						</framer_motion_1.motion.div>) : (<framer_motion_1.motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-4 space-y-4">
							<div className="glass rounded-3xl border border-white/10 shadow-2xl p-4">
								<DownloadHistory_1.DownloadHistory history={downloadHistory} onClearHistory={handleClearHistory} onRemoveItem={handleRemoveHistoryItem}/>
							</div>
						</framer_motion_1.motion.div>)}

				</div>

				<SettingsModal_1.SettingsModal isOpen={isSettingsOpen} onClose={function () { return setIsSettingsOpen(false); }} presets={presets} onSavePreset={handleSavePreset} onDeletePreset={handleDeletePreset} outputTemplate={outputTemplate} setOutputTemplate={setOutputTemplate} binariesExist={binariesExist} onUpdateBinaries={handleUpdateBinaries} onUpdateFfmpeg={handleUpdateFfmpeg} onCancelDownload={handleCancelDownload} onDownloadBinaries={handleDownloadBinaries} binaryStatus={binaryStatus} binaryUpdateProgress={binaryUpdateProgress} isBinaryVersionLoading={isBinaryVersionLoading} currentTheme={currentTheme} setTheme={setCurrentTheme} themes={themes} binaryVersions={binaryVersions} latestBinaryVersions={latestBinaryVersions} onClearBinaryStatus={function () { return setBinaryStatus(null); }} notificationsEnabled={notificationsEnabled} setNotificationsEnabled={setNotificationsEnabled} autoUpdateBinaries={autoUpdateBinaries} setAutoUpdateBinaries={setAutoUpdateBinaries}/>

			</div>
		</div>);
}
exports.default = App;

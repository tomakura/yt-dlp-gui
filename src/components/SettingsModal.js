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
exports.SettingsModal = void 0;
var react_1 = require("react");
var react_dom_1 = require("react-dom");
var lucide_react_1 = require("lucide-react");
var i18n_1 = require("../i18n");
var framer_motion_1 = require("framer-motion");
var SettingsModal = function (_a) {
    var _b;
    var isOpen = _a.isOpen, onClose = _a.onClose, presets = _a.presets, onSavePreset = _a.onSavePreset, onDeletePreset = _a.onDeletePreset, outputTemplate = _a.outputTemplate, setOutputTemplate = _a.setOutputTemplate, binariesExist = _a.binariesExist, onUpdateBinaries = _a.onUpdateBinaries, onUpdateFfmpeg = _a.onUpdateFfmpeg, onCancelDownload = _a.onCancelDownload, onDownloadBinaries = _a.onDownloadBinaries, binaryStatus = _a.binaryStatus, binaryUpdateProgress = _a.binaryUpdateProgress, isBinaryVersionLoading = _a.isBinaryVersionLoading, currentTheme = _a.currentTheme, setTheme = _a.setTheme, themes = _a.themes, binaryVersions = _a.binaryVersions, latestBinaryVersions = _a.latestBinaryVersions, onClearBinaryStatus = _a.onClearBinaryStatus, notificationsEnabled = _a.notificationsEnabled, setNotificationsEnabled = _a.setNotificationsEnabled, autoUpdateBinaries = _a.autoUpdateBinaries, setAutoUpdateBinaries = _a.setAutoUpdateBinaries;
    var _c = (0, i18n_1.useI18n)(), t = _c.t, language = _c.language, setLanguage = _c.setLanguage;
    var _d = (0, react_1.useState)('general'), activeTab = _d[0], setActiveTab = _d[1];
    var _e = (0, react_1.useState)(''), newPresetName = _e[0], setNewPresetName = _e[1];
    var _f = (0, react_1.useState)(null), appUpdateStatus = _f[0], setAppUpdateStatus = _f[1];
    var handleCheckAppUpdate = function () { return __awaiter(void 0, void 0, void 0, function () {
        var update, version, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setAppUpdateStatus({ checking: true, available: null });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, window.electron.checkAppUpdate()];
                case 2:
                    update = _a.sent();
                    if (update && update.available) {
                        version = update.latestVersion || 'latest';
                        setAppUpdateStatus({
                            checking: false,
                            available: true,
                            version: version,
                            url: update.url,
                            message: t('newVersionAvailable').replace('{version}', version)
                        });
                        // Ask user if they want to update? Not implemented in UI yet, but we inform them.
                    }
                    else {
                        setAppUpdateStatus({
                            checking: false,
                            available: false,
                            message: t('upToDate')
                        });
                    }
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    console.error("Update check failed:", e_1);
                    setAppUpdateStatus({ checking: false, available: null, message: t('updateCheckFailed') });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Reset update status when modal opens/closes or tab changes if desired
    // For now, keep it simple.
    var formatProgress = function (progress) {
        var statusText = '';
        if (progress.statusKey) {
            statusText = t(progress.statusKey);
        }
        else if (progress.status) {
            statusText = progress.status;
        }
        if (progress.progressData) {
            var _a = progress.progressData, downloaded = _a.downloaded, total = _a.total, speed = _a.speed;
            var mbDownloaded = (downloaded / 1024 / 1024).toFixed(1);
            var mbSpeed = (speed / 1024 / 1024).toFixed(1);
            if (total > 0) {
                var mbTotal = (total / 1024 / 1024).toFixed(1);
                return "".concat(statusText, " ").concat(progress.percent, "% - ").concat(mbDownloaded, "MB / ").concat(mbTotal, "MB (").concat(mbSpeed, " MB/s)");
            }
            else {
                return "".concat(statusText, " ").concat(mbDownloaded, "MB (").concat(mbSpeed, " MB/s)");
            }
        }
        return statusText || t('downloading');
    };
    var activeTheme = themes[currentTheme];
    // Handle ESC key to close modal
    (0, react_1.useEffect)(function () {
        if (!isOpen)
            return;
        var handleKeyDown = function (e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                onClose();
            }
        };
        // Use capture phase with higher priority
        document.addEventListener('keydown', handleKeyDown, { capture: true });
        return function () { return document.removeEventListener('keydown', handleKeyDown, { capture: true }); };
    }, [isOpen, onClose]);
    // Reset state when modal closes
    (0, react_1.useEffect)(function () {
        if (!isOpen) {
            // Small delay to allow animation to complete
            var timer_1 = setTimeout(function () {
                setActiveTab('general');
            }, 300);
            return function () { return clearTimeout(timer_1); };
        }
    }, [isOpen]);
    var handleSave = function () {
        if (newPresetName.trim()) {
            onSavePreset(newPresetName);
            setNewPresetName('');
        }
    };
    var handleClose = function () {
        onClose();
    };
    var tabs = [
        { id: 'general', label: t('general'), icon: lucide_react_1.Settings },
        { id: 'appearance', label: t('appearance'), icon: lucide_react_1.Palette },
        { id: 'binaries', label: t('binaries'), icon: lucide_react_1.Terminal },
        { id: 'presets', label: t('presets'), icon: lucide_react_1.FolderOpen },
        { id: 'info', label: t('info'), icon: lucide_react_1.Info },
    ];
    // Use portal to render modal at document body level
    var modalContent = (<framer_motion_1.AnimatePresence>
			{isOpen && (<framer_motion_1.motion.div key="settings-modal-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: 'none' }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[60] pointer-events-none">
					{/* Backdrop */}
					<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: 'none' }} transition={{ duration: 0.2 }} onClick={handleClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"/>

					{/* Modal */}
					<framer_motion_1.motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20, pointerEvents: 'none' }} transition={{ duration: 0.2 }} className="fixed inset-0 m-auto w-full max-w-4xl h-[80vh] bg-[#111] border border-white/10 rounded-3xl shadow-2xl z-[70] overflow-hidden flex flex-col md:flex-row pointer-events-auto">
						{/* Sidebar */}
						<div className="w-full md:w-64 bg-black/20 border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-col gap-2">
							<div className="mb-6 px-2 pt-2 hidden md:block">
								<h2 className="text-xl font-bold text-white">{t('settingsTitle')}</h2>
								<div className="flex items-center gap-2 mt-2">
									<lucide_react_1.Globe size={12} className="text-gray-500"/>
									<select value={language} onChange={function (e) { return setLanguage(e.target.value); }} className="bg-transparent text-xs text-gray-400 cursor-pointer hover:text-white transition-colors focus:outline-none">
										<option value="ja" className="bg-[#111]">日本語</option>
										<option value="en" className="bg-[#111]">English</option>
									</select>
								</div>
							</div>							<div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
								{tabs.map(function (tab) {
                var Icon = tab.icon;
                var themeColor = (activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.toggle) || 'bg-purple-500';
                return (<button key={tab.id} onClick={function () { return setActiveTab(tab.id); }} className={"flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ".concat(activeTab === tab.id
                        ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5')}>
											<Icon size={18}/>
											<span className="text-sm font-medium">{tab.label}</span>
											{activeTab === tab.id && (<framer_motion_1.motion.div layoutId="activeTab" className={"absolute left-0 w-1 h-8 ".concat(themeColor, " rounded-r-full hidden md:block")}/>)}
										</button>);
            })}
							</div>

							<div className="mt-auto hidden md:block px-4 py-2">
								<p className="text-xs font-mono text-gray-600">V1.1.0</p>
							</div>
						</div>

						{/* Content Area */}
						<div className="flex-1 flex flex-col min-w-0 bg-[#111]">
							{/* Mobile Header (Close Button) */}
							<div className="p-4 border-b border-white/5 flex justify-between items-center md:hidden">
								<span className="font-bold text-white">{(_b = tabs.find(function (t) { return t.id === activeTab; })) === null || _b === void 0 ? void 0 : _b.label}</span>
								<button onClick={handleClose} className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10">
									<lucide_react_1.X size={20}/>
								</button>
							</div>

							{/* Desktop Close Button */}
							<div className="hidden md:flex justify-end p-4 absolute top-0 right-0 z-10">
								<button onClick={handleClose} className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10 bg-black/20 backdrop-blur-md">
									<lucide_react_1.X size={20}/>
								</button>
							</div>

							<div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
								<framer_motion_1.motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-8 max-w-2xl mx-auto pb-10">
									{activeTab === 'general' && (<div className="space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-white mb-1">{t('generalSettings')}</h3>
												<p className="text-sm text-gray-500">{t('generalSettingsDesc')}</p>
											</div>

											<div className="space-y-4">
												<div className="space-y-2">
													<label className="text-sm font-medium text-gray-300 flex items-center gap-2">
														<lucide_react_1.Save size={16} className={(activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.icon) || 'text-purple-400'}/>
														{t('outputTemplate')}
													</label>
													<p className="text-xs text-gray-500">{t('outputTemplateHelp')}</p>
													<input type="text" value={outputTemplate} onChange={function (e) { return setOutputTemplate(e.target.value); }} placeholder="%(title)s.%(ext)s" className="w-full glass-input rounded-xl px-4 py-3 text-sm text-gray-200 font-mono focus:outline-none"/>
													<div className="flex gap-2 flex-wrap">
														<button onClick={function () { return setOutputTemplate('%(title)s.%(ext)s'); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-400 transition-colors">
															{t('templateDefault')}
														</button>
														<button onClick={function () { return setOutputTemplate('%(upload_date)s - %(title)s.%(ext)s'); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-400 transition-colors">
															{t('templateWithDate')}
														</button>
														<button onClick={function () { return setOutputTemplate('%(uploader)s/%(title)s.%(ext)s'); }} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-400 transition-colors">
															{t('templateWithUploader')}
														</button>
													</div>
												</div>
											</div>
										</div>)}

									{activeTab === 'appearance' && (<div className="space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-white mb-1">{t('appearanceSettings')}</h3>
												<p className="text-sm text-gray-500">{t('appearanceSettingsDesc')}</p>
											</div>

											<div className="grid grid-cols-2 gap-4">
												{Object.entries(themes).map(function (_a) {
                    var key = _a[0], theme = _a[1];
                    return (<button key={key} onClick={function () { return setTheme(key); }} className={"relative p-4 rounded-xl border transition-all text-left group ".concat(currentTheme === key
                            ? 'bg-white/10 border-white/30 ring-1 ring-white/20'
                            : 'bg-white/5 border-white/5 hover:bg-white/10')}>
														<div className={"w-full h-24 rounded-lg bg-gradient-to-br ".concat(theme.button.replace('bg-gradient-to-r ', ''), " opacity-80 mb-3 shadow-lg")}/>
														<div className="flex items-center justify-between">
															<span className="text-sm font-medium text-gray-200">{theme.name}</span>
															{currentTheme === key && (<div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"/>)}
														</div>
													</button>);
                })}
											</div>
										</div>)}

									{activeTab === 'binaries' && (<div className="space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-white mb-1">{t('binaryManagement')}</h3>
												<p className="text-sm text-gray-500">{t('binaryDescription')}</p>
											</div>

											<div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-3">
														<div className={"p-3 rounded-xl ".concat(binariesExist ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
															<lucide_react_1.Terminal size={24}/>
														</div>
														<div>
															<div className="text-sm font-medium text-gray-200">{t('status')}</div>
															<div className={"text-xs ".concat(binariesExist ? 'text-green-400' : 'text-red-400')}>
																{binariesExist === null ? t('checking') : binariesExist ? t('installed') : t('notDetected')}
															</div>
														</div>
													</div>

													{/* Auto-update Toggle */}
													<button onClick={function () { return setAutoUpdateBinaries(!autoUpdateBinaries); }} className={"flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ".concat(autoUpdateBinaries
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10')} title={t('autoUpdateBinariesDesc')}>
														<div className={"w-8 h-4 rounded-full relative transition-colors ".concat(autoUpdateBinaries ? 'bg-blue-500' : 'bg-gray-600')}>
															<div className={"absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ".concat(autoUpdateBinaries ? 'left-[18px]' : 'left-0.5')}/>
														</div>
														<span className="text-xs">{t('autoUpdateBinaries')}</span>
													</button>
												</div>

												{binariesExist && (<div className="grid grid-cols-2 gap-4">
														<div className="bg-white/5 p-3 rounded-xl border border-white/5">
															<div className="text-xs text-gray-500 mb-1">yt-dlp {t('version')}</div>
															<div className="flex items-center gap-2">
																{isBinaryVersionLoading ? (<div className="flex items-center gap-2 text-sm text-gray-300">
																		<lucide_react_1.Loader2 size={14} className="animate-spin"/>
																		<span>{t('checking')}</span>
																	</div>) : (<div className="text-sm font-mono text-gray-200">{(binaryVersions === null || binaryVersions === void 0 ? void 0 : binaryVersions.ytDlp) || t('unknown')}</div>)}
																{(binaryVersions === null || binaryVersions === void 0 ? void 0 : binaryVersions.ytDlp) && binaryVersions.ytDlp !== 'Not detected' && ((latestBinaryVersions === null || latestBinaryVersions === void 0 ? void 0 : latestBinaryVersions.ytDlp) && latestBinaryVersions.ytDlp !== 'Unknown' ? (binaryVersions.ytDlp === latestBinaryVersions.ytDlp ? (<span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">{t('latest')}</span>) : (<span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20">
																				{t('updateAvailable')} → {latestBinaryVersions.ytDlp}
																			</span>)) : null)}
															</div>
														</div>
														<div className="bg-white/5 p-3 rounded-xl border border-white/5">
															<div className="text-xs text-gray-500 mb-1">ffmpeg {t('version')}</div>
															<div className="flex items-center gap-2">
																{isBinaryVersionLoading ? (<div className="flex items-center gap-2 text-sm text-gray-300">
																		<lucide_react_1.Loader2 size={14} className="animate-spin"/>
																		<span>{t('checking')}</span>
																	</div>) : (<div className="text-sm font-mono text-gray-200">{(binaryVersions === null || binaryVersions === void 0 ? void 0 : binaryVersions.ffmpeg) || t('unknown')}</div>)}
																{(binaryVersions === null || binaryVersions === void 0 ? void 0 : binaryVersions.ffmpeg) && binaryVersions.ffmpeg !== 'Not detected' && (
                    // Show "latest" badge if: ffmpeg is N-* version (yt-dlp/FFmpeg-Builds latest), versions match, or API returned "latest" marker
                    (binaryVersions.ffmpeg.startsWith('N-') ||
                        ((latestBinaryVersions === null || latestBinaryVersions === void 0 ? void 0 : latestBinaryVersions.ffmpeg) && (binaryVersions.ffmpeg === latestBinaryVersions.ffmpeg ||
                            binaryVersions.ffmpeg.includes(latestBinaryVersions.ffmpeg) ||
                            latestBinaryVersions.ffmpeg === 'latest'))) ? (<span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">{t('latest')}</span>) : (latestBinaryVersions === null || latestBinaryVersions === void 0 ? void 0 : latestBinaryVersions.ffmpeg) && latestBinaryVersions.ffmpeg !== 'Unknown' && (<span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20">
																			{t('updateAvailable')} → {latestBinaryVersions.ffmpeg}
																		</span>))}
											</div>
										</div>
									</div>)}

												<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
													{binariesExist ? (<>
															<button onClick={onUpdateBinaries} disabled={!!binaryUpdateProgress} className={"px-4 py-3 rounded-xl ".concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.toggleBg) || 'bg-purple-500/10', " hover:opacity-80 ").concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.icon) || 'text-purple-400', " text-sm font-medium transition-colors border ").concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.border) || 'border-purple-500/20', " disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2")}>
																<lucide_react_1.Terminal size={16}/>
																{t('updateYtDlp')}
															</button>
															<button onClick={onUpdateFfmpeg} disabled={!!binaryUpdateProgress} className={"px-4 py-3 rounded-xl ".concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.toggleBg) || 'bg-purple-500/10', " hover:opacity-80 ").concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.icon) || 'text-purple-400', " text-sm font-medium transition-colors border ").concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.border) || 'border-purple-500/20', " disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2")}>
																<lucide_react_1.Film size={16}/>
																{t('updateFfmpeg')}
															</button>
														</>) : (<button onClick={onDownloadBinaries} disabled={!!binaryUpdateProgress} className="col-span-2 px-4 py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium transition-colors border border-green-500/20 animate-pulse disabled:animate-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
															<lucide_react_1.Download size={16}/>
															{t('downloadBinaries')}
														</button>)}
												</div>

												{binaryUpdateProgress && (<div className="space-y-3">
														<div className="flex justify-between items-center text-xs text-gray-400">

															<span>{formatProgress(binaryUpdateProgress)}</span>
															{binaryUpdateProgress.percent >= 0 ? (<span>{binaryUpdateProgress.percent}%</span>) : (<span>{t('downloading')}</span>)}
														</div>
														<div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
															{binaryUpdateProgress.percent >= 0 ? (<framer_motion_1.motion.div className={"relative h-full rounded-full overflow-hidden ".concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.button) || 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600')} initial={{ width: 0 }} animate={{ width: "".concat(binaryUpdateProgress.percent, "%") }} transition={{ duration: 0.3 }}>
																	<framer_motion_1.motion.div className="absolute inset-0 bg-white/30" initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}/>
																</framer_motion_1.motion.div>) : (<framer_motion_1.motion.div className={"absolute h-full rounded-full ".concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.button) || 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600')} initial={{ left: '-30%' }} animate={{ left: '100%' }} transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear'
                        }} style={{ width: '30%' }}/>)}
														</div>
														<button onClick={onCancelDownload} className="w-full px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors border border-red-500/20 flex items-center justify-center gap-2">
															<lucide_react_1.XCircle size={16}/>
															{t('cancelDownload')}
														</button>
													</div>)}

												{binaryStatus && (<div className={"text-xs text-center py-2 rounded-lg border flex items-center justify-between px-3 ".concat(binaryStatus.type === 'success'
                        ? 'text-green-300 bg-green-500/10 border-green-500/20'
                        : binaryStatus.type === 'error'
                            ? 'text-red-300 bg-red-500/10 border-red-500/20'
                            : 'text-blue-300 bg-blue-500/10 border-blue-500/20 animate-pulse')}>
														<span className="flex-1">{binaryStatus.message}</span>
														<button onClick={onClearBinaryStatus} className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors">
															<lucide_react_1.X size={14}/>
														</button>
													</div>)}
											</div>
										</div>)}

									{activeTab === 'presets' && (<div className="space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-white mb-1">{t('presetManagement')}</h3>
												<p className="text-sm text-gray-500">{t('presetDescription')}</p>
											</div>

											<div className="flex gap-2">
												<input type="text" value={newPresetName} onChange={function (e) { return setNewPresetName(e.target.value); }} placeholder={t('presetNamePlaceholder')} className="flex-1 glass-input rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none"/>
												<button onClick={handleSave} disabled={!newPresetName.trim()} className={"px-4 py-2 rounded-xl ".concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.toggleBg) || 'bg-purple-500/20', " hover:opacity-80 text-gray-200 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2")}>
													<lucide_react_1.Plus size={16}/>
													{t('save')}
												</button>
											</div>

											<div className="space-y-3">
												{presets.length === 0 ? (<div className="text-center py-12 text-gray-600 text-sm border border-dashed border-white/10 rounded-2xl">
														<lucide_react_1.FolderOpen size={32} className="mx-auto mb-3 opacity-50"/>
														{t('noPresets')}
													</div>) : (<framer_motion_1.AnimatePresence>
														{presets.map(function (preset) { return (<framer_motion_1.motion.div key={preset.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
																<div className="flex flex-col overflow-hidden mr-4">
																	<span className="text-sm text-gray-200 font-medium truncate">
																		{preset.name}
																	</span>
																	<div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
																		<div className="flex items-center gap-1">
																			{preset.format.type === 'video' ? <lucide_react_1.Film size={12}/> : <lucide_react_1.Music size={12}/>}
																			<span>{preset.format.type === 'video' ? t('video') : t('audio')}</span>
																		</div>
																		<span className="truncate opacity-50">|</span>
																		<span className="truncate">{preset.location}</span>
																	</div>
																</div>
																<button onClick={function () { return onDeletePreset(preset.id); }} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
																	<lucide_react_1.Trash2 size={16}/>
																</button>
															</framer_motion_1.motion.div>); })}
													</framer_motion_1.AnimatePresence>)}
											</div>
										</div>)}

									{activeTab === 'info' && (<div className="space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-white mb-1">{t('appInfo')}</h3>
												<p className="text-sm text-gray-500">{t('disclaimer')}</p>
											</div>

											<div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
												<div className="flex items-center gap-4 mb-4">
													<div className={"w-16 h-16 rounded-2xl ".concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.button) || 'bg-purple-600', " flex items-center justify-center shadow-lg")}>
														<lucide_react_1.Download size={32} className="text-white"/>
													</div>
													<div>
														<h4 className="text-xl font-bold text-white">yt-dlp-gui</h4>
														<p className="text-sm text-gray-400">Version 1.3.1</p>
													</div>
												</div>

												<div className="space-y-2 text-sm text-gray-300">
													<div className="flex justify-between py-2 border-b border-white/5">
														<span className="text-gray-500">{t('author')}</span>
														<span>Tomakura</span>
													</div>
													<div className="flex justify-between py-2 border-b border-white/5">
														<span className="text-gray-500">yt-dlp</span>
														{isBinaryVersionLoading ? (<span className="flex items-center gap-2 text-gray-300">
																<lucide_react_1.Loader2 size={14} className="animate-spin"/>
																<span>{t('checking')}</span>
															</span>) : (<span className="font-mono">{(binaryVersions === null || binaryVersions === void 0 ? void 0 : binaryVersions.ytDlp) || t('unknown')}</span>)}
													</div>
													<div className="flex justify-between py-2 border-b border-white/5">
														<span className="text-gray-500">ffmpeg</span>
														{isBinaryVersionLoading ? (<span className="flex items-center gap-2 text-gray-300">
																<lucide_react_1.Loader2 size={14} className="animate-spin"/>
																<span>{t('checking')}</span>
															</span>) : (<span className="font-mono">{(binaryVersions === null || binaryVersions === void 0 ? void 0 : binaryVersions.ffmpeg) || t('unknown')}</span>)}
													</div>
												</div>

												<div className="pt-2 space-y-2">
													<button className={"w-full px-4 py-3 rounded-xl ".concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.toggleBg) || 'bg-purple-500/10', " hover:opacity-80 ").concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.icon) || 'text-purple-400', " text-sm font-medium transition-colors border ").concat((activeTheme === null || activeTheme === void 0 ? void 0 : activeTheme.border) || 'border-purple-500/20', " flex items-center justify-center gap-2")} onClick={handleCheckAppUpdate} disabled={appUpdateStatus === null || appUpdateStatus === void 0 ? void 0 : appUpdateStatus.checking}>
														{(appUpdateStatus === null || appUpdateStatus === void 0 ? void 0 : appUpdateStatus.checking) ? <lucide_react_1.Loader2 className="animate-spin" size={16}/> : <lucide_react_1.Download size={16}/>}
														{(appUpdateStatus === null || appUpdateStatus === void 0 ? void 0 : appUpdateStatus.checking) ? t('checkingUpdates') : t('checkForUpdates')}
													</button>

													{appUpdateStatus && !appUpdateStatus.checking && (<div className={"text-xs text-center py-3 rounded-lg border ".concat(appUpdateStatus.available
                        ? 'text-green-300 bg-green-500/10 border-green-500/20'
                        : 'text-gray-400 bg-white/5 border-white/5')}>
															<div className="font-medium mb-1">
																{appUpdateStatus.available
                        ? t('newVersionAvailable', { version: appUpdateStatus.version || '' })
                        : appUpdateStatus.message || t('upToDate')}
															</div>
															{appUpdateStatus.available && appUpdateStatus.url && (<button onClick={function () { return window.electron.openExternal(appUpdateStatus.url); }} className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
																	{t('openDownloadPage')}
																</button>)}
														</div>)}
												</div>

												{/* Ko-fi Support */}
												<div className="pt-2">
													<button onClick={function () { return window.electron.openExternal('https://ko-fi.com/tomakura'); }} className="w-full px-4 py-3 rounded-xl bg-[#FF5E5B]/10 hover:bg-[#FF5E5B]/20 text-[#FF5E5B] text-sm font-medium transition-colors border border-[#FF5E5B]/20 flex items-center justify-center gap-2">
														<lucide_react_1.Heart size={16}/>
														{t('supportOnKofi')}
													</button>
												</div>

												<div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
													<h5 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
														<lucide_react_1.Info size={14} className="text-blue-400"/>
														{t('disclaimer')}
													</h5>
													<p className="text-xs text-gray-400 leading-relaxed">
														{t('disclaimerText')}
													</p>
												</div>

												<div className="text-center pt-4">
													<p className="text-xs text-gray-600 italic">
														{t('aiDisclaimer')}
													</p>
												</div>
											</div>
										</div>)}
								</framer_motion_1.motion.div>
							</div>
						</div>
					</framer_motion_1.motion.div>
				</framer_motion_1.motion.div>)}
		</framer_motion_1.AnimatePresence>);
    return (0, react_dom_1.createPortal)(modalContent, document.body);
};
exports.SettingsModal = SettingsModal;

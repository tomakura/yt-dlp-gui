import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FolderOpen, Plus, Trash2, Film, Music, Terminal, Palette, Layout, Monitor, HardDrive, Settings as SettingsIcon, Download, XCircle, Info, Loader2, Heart, Globe } from 'lucide-react';
import { useI18n } from '../i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Preset } from '../types/Preset';
import { BinaryUpdateProgress } from '../types/electron';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	presets: Preset[];
	onSavePreset: (name: string) => void;
	onDeletePreset: (id: string) => void;
	outputTemplate: string;
	setOutputTemplate: (template: string) => void;
	binariesExist: boolean | null;
	onUpdateBinaries: () => void;
	onUpdateFfmpeg: () => void;
	onCancelDownload: () => void;
	onDownloadBinaries: () => void;
	binaryStatus: { message: string; type: 'info' | 'success' | 'error' } | null;
	binaryUpdateProgress: BinaryUpdateProgress | null;
	currentTheme: any;
	setTheme: (theme: any) => void;
	themes: any;
	binaryVersions: { ytDlp: string; ffmpeg: string } | null;
	latestBinaryVersions: { ytDlp: string; ffmpeg: string } | null;
}

type Tab = 'general' | 'appearance' | 'binaries' | 'presets' | 'info';

export const SettingsModal: React.FC<SettingsModalProps> = ({
	isOpen,
	onClose,
	presets,
	onSavePreset,
	onDeletePreset,
	outputTemplate,
	setOutputTemplate,
	binariesExist,
	onUpdateBinaries,
	onUpdateFfmpeg,
	onCancelDownload,
	onDownloadBinaries,
	binaryStatus,
	binaryUpdateProgress,
	currentTheme,
	setTheme,
	themes,
	binaryVersions,
	latestBinaryVersions
}) => {
	const { t, language, setLanguage } = useI18n();
	const [activeTab, setActiveTab] = useState<Tab>('general');
	const [newPresetName, setNewPresetName] = useState('');
	const [appUpdateStatus, setAppUpdateStatus] = useState<{
		checking: boolean;
		available: boolean | null;
		version?: string;
		url?: string;
		message?: string;
	} | null>(null);

	const handleCheckAppUpdate = async () => {
		setAppUpdateStatus({ checking: true, available: null });
		try {
			const result = await window.electron.checkAppUpdate();
			if (result.error) {
				setAppUpdateStatus({ checking: false, available: null, message: t('updateCheckFailed') });
			} else {
				setAppUpdateStatus({ 
					checking: false, 
					available: result.available, 
					version: result.latestVersion, 
					url: result.url,
					message: result.available 
						? t('newVersionAvailable').replace('{version}', result.latestVersion || '') 
						: t('upToDate')
				});
			}
		} catch (e) {
			setAppUpdateStatus({ checking: false, available: null, message: t('updateCheckFailed') });
		}
	};

	// Reset update status when modal opens/closes or tab changes if desired
	// For now, keep it simple.

	const activeTheme = themes[currentTheme];

	// Handle ESC key to close modal
	useEffect(() => {
		if (!isOpen) return;
		
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				onClose();
			}
		};
		
		// Use capture phase with higher priority
		document.addEventListener('keydown', handleKeyDown, { capture: true });
		return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
	}, [isOpen, onClose]);

	// Reset state when modal closes
	useEffect(() => {
		if (!isOpen) {
			// Small delay to allow animation to complete
			const timer = setTimeout(() => {
				setActiveTab('general');
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	const handleSave = () => {
		if (newPresetName.trim()) {
			onSavePreset(newPresetName);
			setNewPresetName('');
		}
	};

	const handleClose = () => {
		onClose();
	};

	const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
		{ id: 'general', label: t('general'), icon: SettingsIcon },
		{ id: 'appearance', label: t('appearance'), icon: Palette },
		{ id: 'binaries', label: t('binaries'), icon: Terminal },
		{ id: 'presets', label: t('presets'), icon: FolderOpen },
		{ id: 'info', label: t('info'), icon: Info },
	];

	// Use portal to render modal at document body level
	const modalContent = (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					key="settings-modal-container"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0, pointerEvents: 'none' }}
					transition={{ duration: 0.2 }}
					className="fixed inset-0 z-[60] pointer-events-none"
				>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0, pointerEvents: 'none' }}
						transition={{ duration: 0.2 }}
						onClick={handleClose}
						className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20, pointerEvents: 'none' }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 m-auto w-full max-w-4xl h-[80vh] bg-[#111] border border-white/10 rounded-3xl shadow-2xl z-[70] overflow-hidden flex flex-col md:flex-row pointer-events-auto"
					>
						{/* Sidebar */}
						<div className="w-full md:w-64 bg-black/20 border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-col gap-2">
									<div className="mb-6 px-2 pt-2 hidden md:block">
										<h2 className="text-xl font-bold text-white">{t('settingsTitle')}</h2>
										<div className="flex items-center gap-2 mt-2">
											<Globe size={12} className="text-gray-500" />
											<select
												value={language}
												onChange={(e) => setLanguage(e.target.value as 'ja' | 'en')}
												className="bg-transparent text-xs text-gray-400 cursor-pointer hover:text-white transition-colors focus:outline-none"
											>
												<option value="ja" className="bg-[#111]">日本語</option>
												<option value="en" className="bg-[#111]">English</option>
											</select>
										</div>
									</div>							<div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
								{tabs.map((tab) => {
									const Icon = tab.icon;
									const themeColor = activeTheme?.toggle || 'bg-purple-500';
									return (
										<button
											key={tab.id}
											onClick={() => setActiveTab(tab.id)}
											className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id
													? 'bg-white/10 text-white shadow-lg shadow-white/5'
													: 'text-gray-400 hover:text-white hover:bg-white/5'
												}`}
										>
											<Icon size={18} />
											<span className="text-sm font-medium">{tab.label}</span>
											{activeTab === tab.id && (
												<motion.div
													layoutId="activeTab"
													className={`absolute left-0 w-1 h-8 ${themeColor} rounded-r-full hidden md:block`}
												/>
											)}
										</button>
									);
								})}
							</div>

							<div className="mt-auto hidden md:block px-4 py-2">
								<p className="text-xs font-mono text-gray-600">V1.0</p>
							</div>
						</div>

						{/* Content Area */}
						<div className="flex-1 flex flex-col min-w-0 bg-[#111]">
							{/* Mobile Header (Close Button) */}
							<div className="p-4 border-b border-white/5 flex justify-between items-center md:hidden">
								<span className="font-bold text-white">{tabs.find(t => t.id === activeTab)?.label}</span>
								<button onClick={handleClose} className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10">
									<X size={20} />
								</button>
							</div>

							{/* Desktop Close Button */}
							<div className="hidden md:flex justify-end p-4 absolute top-0 right-0 z-10">
								<button onClick={handleClose} className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10 bg-black/20 backdrop-blur-md">
									<X size={20} />
								</button>
							</div>

							<div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
								<motion.div
									key={activeTab}
									initial={{ opacity: 0, x: 10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.2 }}
									className="space-y-8 max-w-2xl mx-auto pb-10"
								>
									{activeTab === 'general' && (
										<div className="space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-white mb-1">{t('generalSettings')}</h3>
												<p className="text-sm text-gray-500">{t('generalSettingsDesc')}</p>
											</div>

											<div className="space-y-4">
												<div className="space-y-2">
													<label className="text-sm font-medium text-gray-300 flex items-center gap-2">
														<Save size={16} className={activeTheme?.icon || 'text-purple-400'} />
														{t('outputTemplate')}
													</label>
													<p className="text-xs text-gray-500">{t('outputTemplateHelp')}</p>
													<input
														type="text"
														value={outputTemplate}
														onChange={(e) => setOutputTemplate(e.target.value)}
														placeholder="%(title)s.%(ext)s"
														className="w-full glass-input rounded-xl px-4 py-3 text-sm text-gray-200 font-mono focus:outline-none"
													/>
													<div className="flex gap-2 flex-wrap">
														<button
															onClick={() => setOutputTemplate('%(title)s.%(ext)s')}
															className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-400 transition-colors"
														>
															{t('templateDefault')}
														</button>
														<button
															onClick={() => setOutputTemplate('%(upload_date)s - %(title)s.%(ext)s')}
															className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-400 transition-colors"
														>
															{t('templateWithDate')}
														</button>
														<button
															onClick={() => setOutputTemplate('%(uploader)s/%(title)s.%(ext)s')}
															className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-400 transition-colors"
														>
															{t('templateWithUploader')}
														</button>
													</div>
												</div>
											</div>
										</div>
									)}

									{activeTab === 'appearance' && (
										<div className="space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-white mb-1">{t('appearanceSettings')}</h3>
												<p className="text-sm text-gray-500">{t('appearanceSettingsDesc')}</p>
											</div>

											<div className="grid grid-cols-2 gap-4">
												{Object.entries(themes).map(([key, theme]: [string, any]) => (
													<button
														key={key}
														onClick={() => setTheme(key as any)}
														className={`relative p-4 rounded-xl border transition-all text-left group ${currentTheme === key
															? 'bg-white/10 border-white/30 ring-1 ring-white/20'
															: 'bg-white/5 border-white/5 hover:bg-white/10'
															}`}
													>
														<div className={`w-full h-24 rounded-lg bg-gradient-to-br ${theme.button.replace('bg-gradient-to-r ', '')} opacity-80 mb-3 shadow-lg`} />
														<div className="flex items-center justify-between">
															<span className="text-sm font-medium text-gray-200">{theme.name}</span>
															{currentTheme === key && (
																<div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
															)}
														</div>
													</button>
												))}
											</div>
										</div>
									)}

									{activeTab === 'binaries' && (
										<div className="space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-white mb-1">{t('binaryManagement')}</h3>
												<p className="text-sm text-gray-500">{t('binaryDescription')}</p>
											</div>

											<div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-3">
														<div className={`p-3 rounded-xl ${binariesExist ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
															<Terminal size={24} />
														</div>
														<div>
															<div className="text-sm font-medium text-gray-200">{t('status')}</div>
															<div className={`text-xs ${binariesExist ? 'text-green-400' : 'text-red-400'}`}>
																{binariesExist === null ? t('checking') : binariesExist ? t('installed') : t('notDetected')}
															</div>
														</div>
													</div>
												</div>

												{binariesExist && (
													<div className="grid grid-cols-2 gap-4">
														<div className="bg-white/5 p-3 rounded-xl border border-white/5">
															<div className="text-xs text-gray-500 mb-1">yt-dlp {t('version')}</div>
															<div className="flex items-center gap-2">
																<div className="text-sm font-mono text-gray-200">{binaryVersions?.ytDlp || t('unknown')}</div>
																{latestBinaryVersions?.ytDlp && binaryVersions?.ytDlp === latestBinaryVersions.ytDlp && (
																	<span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">{t('latest')}</span>
																)}
															</div>
														</div>
														<div className="bg-white/5 p-3 rounded-xl border border-white/5">
															<div className="text-xs text-gray-500 mb-1">ffmpeg {t('version')}</div>
															<div className="flex items-center gap-2">
																<div className="text-sm font-mono text-gray-200">{binaryVersions?.ffmpeg || t('unknown')}</div>
																{latestBinaryVersions?.ffmpeg && binaryVersions?.ffmpeg && binaryVersions.ffmpeg.includes(latestBinaryVersions.ffmpeg) && (
																	<span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">{t('latest')}</span>
																)}
															</div>
														</div>
													</div>
												)}

												<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
													{binariesExist ? (
														<>
															<button
																onClick={onUpdateBinaries}
																disabled={!!binaryStatus || !!binaryUpdateProgress}
																className={`px-4 py-3 rounded-xl ${activeTheme?.toggleBg || 'bg-purple-500/10'} hover:opacity-80 ${activeTheme?.icon || 'text-purple-400'} text-sm font-medium transition-colors border ${activeTheme?.border || 'border-purple-500/20'} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
															>
																<Terminal size={16} />
																{t('updateYtDlp')}
															</button>
															<button
																onClick={onUpdateFfmpeg}
																disabled={!!binaryStatus || !!binaryUpdateProgress}
																className={`px-4 py-3 rounded-xl ${activeTheme?.toggleBg || 'bg-purple-500/10'} hover:opacity-80 ${activeTheme?.icon || 'text-purple-400'} text-sm font-medium transition-colors border ${activeTheme?.border || 'border-purple-500/20'} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
															>
																<Film size={16} />
																{t('updateFfmpeg')}
															</button>
														</>
													) : (
														<button
															onClick={onDownloadBinaries}
															disabled={!!binaryStatus || !!binaryUpdateProgress}
															className="col-span-2 px-4 py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium transition-colors border border-green-500/20 animate-pulse disabled:animate-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
														>
															<Download size={16} />
															{t('downloadBinaries')}
														</button>
													)}
												</div>

												{binaryUpdateProgress && (
													<div className="space-y-3">
														<div className="flex justify-between items-center text-xs text-gray-400">
															<span>{binaryUpdateProgress.status}</span>
															{binaryUpdateProgress.percent >= 0 ? (
																<span>{binaryUpdateProgress.percent}%</span>
															) : (
																<span>{t('downloading')}</span>
															)}
														</div>
														<div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
															{binaryUpdateProgress.percent >= 0 ? (
																<motion.div
																	className={`relative h-full rounded-full overflow-hidden ${activeTheme?.button || 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'}`}
																	initial={{ width: 0 }}
																	animate={{ width: `${binaryUpdateProgress.percent}%` }}
																	transition={{ duration: 0.3 }}
																>
																	<motion.div
																		className="absolute inset-0 bg-white/30"
																		initial={{ x: '-100%' }}
																		animate={{ x: '100%' }}
																		transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
																	/>
																</motion.div>
															) : (
																<motion.div
																	className={`absolute h-full rounded-full ${activeTheme?.button || 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'}`}
																	initial={{ left: '-30%' }}
																	animate={{ left: '100%' }}
																	transition={{ 
																		duration: 1, 
																		repeat: Infinity,
																		ease: 'linear'
																	}}
																	style={{ width: '30%' }}
																/>
															)}
														</div>
														<button
															onClick={onCancelDownload}
															className="w-full px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors border border-red-500/20 flex items-center justify-center gap-2"
														>
															<XCircle size={16} />
															{t('cancelDownload')}
														</button>
													</div>
												)}

												{binaryStatus && (
													<div className={`text-xs text-center py-2 rounded-lg border ${binaryStatus.type === 'success'
														? 'text-green-300 bg-green-500/10 border-green-500/20'
														: binaryStatus.type === 'error'
															? 'text-red-300 bg-red-500/10 border-red-500/20'
															: 'text-blue-300 bg-blue-500/10 border-blue-500/20 animate-pulse'
														}`}>
														{binaryStatus.message}
													</div>
												)}
											</div>
										</div>
									)}

									{activeTab === 'presets' && (
										<div className="space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-white mb-1">{t('presetManagement')}</h3>
												<p className="text-sm text-gray-500">{t('presetDescription')}</p>
											</div>

											<div className="flex gap-2">
												<input
													type="text"
													value={newPresetName}
													onChange={(e) => setNewPresetName(e.target.value)}
													placeholder={t('presetNamePlaceholder')}
													className="flex-1 glass-input rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none"
												/>
												<button
													onClick={handleSave}
													disabled={!newPresetName.trim()}
													className={`px-4 py-2 rounded-xl ${activeTheme?.toggleBg || 'bg-purple-500/20'} hover:opacity-80 text-gray-200 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
												>
													<Plus size={16} />
													{t('save')}
												</button>
											</div>

											<div className="space-y-3">
												{presets.length === 0 ? (
													<div className="text-center py-12 text-gray-600 text-sm border border-dashed border-white/10 rounded-2xl">
														<FolderOpen size={32} className="mx-auto mb-3 opacity-50" />
														{t('noPresets')}
													</div>
												) : (
													<AnimatePresence>
														{presets.map((preset) => (
															<motion.div
																key={preset.id}
																initial={{ opacity: 0, y: 10 }}
																animate={{ opacity: 1, y: 0 }}
																exit={{ opacity: 0, y: -10 }}
																className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors"
															>
																<div className="flex flex-col overflow-hidden mr-4">
																	<span className="text-sm text-gray-200 font-medium truncate">
																		{preset.name}
																	</span>
																	<div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
																		<div className="flex items-center gap-1">
																			{preset.format.type === 'video' ? <Film size={12} /> : <Music size={12} />}
																			<span>{preset.format.type === 'video' ? t('video') : t('audio')}</span>
																		</div>
																		<span className="truncate opacity-50">|</span>
																		<span className="truncate">{preset.location}</span>
																	</div>
																</div>
																<button
																	onClick={() => onDeletePreset(preset.id)}
																	className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
																>
																	<Trash2 size={16} />
																</button>
															</motion.div>
														))}
													</AnimatePresence>
												)}
											</div>
										</div>
									)}

									{activeTab === 'info' && (
										<div className="space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-white mb-1">{t('appInfo')}</h3>
												<p className="text-sm text-gray-500">{t('disclaimer')}</p>
											</div>

											<div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
												<div className="flex items-center gap-4 mb-4">
													<div className={`w-16 h-16 rounded-2xl ${activeTheme?.button || 'bg-purple-600'} flex items-center justify-center shadow-lg`}>
														<Download size={32} className="text-white" />
													</div>
													<div>
														<h4 className="text-xl font-bold text-white">yt-dlp-gui</h4>
														<p className="text-sm text-gray-400">Version 1.0</p>
													</div>
												</div>
												
												<div className="space-y-2 text-sm text-gray-300">
													<div className="flex justify-between py-2 border-b border-white/5">
														<span className="text-gray-500">{t('author')}</span>
														<span>Tomakura</span>
													</div>
													<div className="flex justify-between py-2 border-b border-white/5">
														<span className="text-gray-500">yt-dlp</span>
														<span className="font-mono">{binaryVersions?.ytDlp || t('unknown')}</span>
													</div>
													<div className="flex justify-between py-2 border-b border-white/5">
														<span className="text-gray-500">ffmpeg</span>
														<span className="font-mono">{binaryVersions?.ffmpeg || t('unknown')}</span>
													</div>
												</div>

												<div className="pt-2 space-y-2">
													<button
														className={`w-full px-4 py-3 rounded-xl ${activeTheme?.toggleBg || 'bg-purple-500/10'} hover:opacity-80 ${activeTheme?.icon || 'text-purple-400'} text-sm font-medium transition-colors border ${activeTheme?.border || 'border-purple-500/20'} flex items-center justify-center gap-2`}
														onClick={handleCheckAppUpdate}
														disabled={appUpdateStatus?.checking}
													>
														{appUpdateStatus?.checking ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
														{appUpdateStatus?.checking ? t('checkingUpdates') : t('checkForUpdates')}
													</button>

													{appUpdateStatus && !appUpdateStatus.checking && (
														<div className={`text-xs text-center py-3 rounded-lg border ${
															appUpdateStatus.available 
															? 'text-green-300 bg-green-500/10 border-green-500/20' 
															: 'text-gray-400 bg-white/5 border-white/5'
														}`}>
															<div className="font-medium mb-1">
																{appUpdateStatus.available 
																	? t('newVersionAvailable', { version: appUpdateStatus.version || '' })
																	: appUpdateStatus.message || t('upToDate')}
															</div>
															{appUpdateStatus.available && appUpdateStatus.url && (
																<button 
																	onClick={() => window.electron.openExternal(appUpdateStatus.url!)}
																	className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
																>
																	{t('openDownloadPage')}
																</button>
															)}
														</div>
													)}
												</div>

												{/* Ko-fi Support */}
												<div className="pt-2">
													<button
														onClick={() => window.electron.openExternal('https://ko-fi.com/tomakura')}
														className="w-full px-4 py-3 rounded-xl bg-[#FF5E5B]/10 hover:bg-[#FF5E5B]/20 text-[#FF5E5B] text-sm font-medium transition-colors border border-[#FF5E5B]/20 flex items-center justify-center gap-2"
													>
														<Heart size={16} />
														{t('supportOnKofi')}
													</button>
												</div>

												<div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
													<h5 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
														<Info size={14} className="text-blue-400" />
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
										</div>
									)}
								</motion.div>
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	return createPortal(modalContent, document.body);
};

import React, { useState, useEffect, useRef } from 'react';
import { Download, Terminal, AlertCircle, X, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UrlInput } from './components/UrlInput';
import { FormatSelector, FormatOptions } from './components/FormatSelector';
import { LocationSelector } from './components/LocationSelector';
import { AdvancedOptions, AdvancedOptionsState } from './components/AdvancedOptions';
import { StatusToast } from './components/StatusToast';
import { SettingsModal } from './components/SettingsModal';
import { Preset } from './types/Preset';

// Theme Definitions
type Theme = 'default' | 'cyberpunk' | 'ocean' | 'forest';

const themes: Record<Theme, {
	name: string;
	primary: string;
	secondary: string;
	accent: string;
	button: string;
	buttonShadow: string;
	blob1: string;
	blob2: string;
	icon: string;
	border: string;
}> = {
	default: {
		name: 'Midnight',
		primary: 'from-blue-400',
		secondary: 'via-purple-400',
		accent: 'to-pink-400',
		button: 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600',
		buttonShadow: 'shadow-purple-900/20',
		blob1: 'bg-blue-600/10',
		blob2: 'bg-pink-600/5',
		icon: 'text-gray-300', // Default icon color
		border: 'border-red-500/20' // Default error border
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
		border: 'border-yellow-500/20'
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
		border: 'border-cyan-500/20'
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
		border: 'border-emerald-500/20'
	}
};

function App() {
	const [url, setUrl] = useState('');
	const [location, setLocation] = useState(() => {
		return localStorage.getItem('lastLocation') || '';
	});

	// Theme State
	const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
		return (localStorage.getItem('theme') as Theme) || 'default';
	});

	useEffect(() => {
		localStorage.setItem('theme', currentTheme);
	}, [currentTheme]);

	const theme = themes[currentTheme];

	const [formatOptions, setFormatOptions] = useState<FormatOptions>(() => {
		const saved = localStorage.getItem('lastFormatOptions');
		const parsed = saved ? JSON.parse(saved) : {
			type: 'video',
			videoContainer: 'mp4',
			videoResolution: 'best',
			audioFormat: 'mp3',
			audioBitrate: '320k',
			audioSampleRate: '48000'
		};
		return { ...parsed, type: 'video' };
	});
	const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptionsState>(() => {
		const saved = localStorage.getItem('lastAdvancedOptions');
		return saved ? JSON.parse(saved) : {
			embedThumbnail: true,
			addMetadata: true,
			embedSubs: false,
			writeAutoSub: false,
			splitChapters: false,
			playlist: 'default',
			cookiesBrowser: 'none'
		};
	});

	// Settings State
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [presets, setPresets] = useState<Preset[]>([]);
	const [outputTemplate, setOutputTemplate] = useState('%(title)s.%(ext)s');

	// Binary Status State
	const [binariesExist, setBinariesExist] = useState<boolean | null>(null);
	const [binaryStatus, setBinaryStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
	const [isUpdatingBinaries, setIsUpdatingBinaries] = useState(false);

	// Clipboard Monitor State
	const [isClipboardMonitorEnabled, setIsClipboardMonitorEnabled] = useState(false);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (isClipboardMonitorEnabled) {
			interval = setInterval(async () => {
				try {
					const text = await navigator.clipboard.readText();
					if (text && text !== url && (text.startsWith('http://') || text.startsWith('https://'))) {
						setUrl(text);
					}
				} catch (e) {
					// Ignore clipboard read errors (e.g. not focused)
				}
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [isClipboardMonitorEnabled, url]);

	// Download State
	const [isDownloading, setIsDownloading] = useState(false);
	const [status, setStatus] = useState<'idle' | 'downloading' | 'complete' | 'error'>('idle');
	const [logs, setLogs] = useState<string[]>([]);
	const logsEndRef = useRef<HTMLDivElement>(null);

	const checkBinaries = async () => {
		try {
			const result = await window.electron.checkBinaries();
			// Assuming result is { ytdlp: boolean, ffmpeg: boolean, path: string }
			const allExist = result.ytdlp && result.ffmpeg;
			setBinariesExist(allExist);

			if (!allExist) {
				setLogs(prev => [...prev, 'Error: yt-dlp or ffmpeg binaries not found.']);
				// setStatus('error'); // Don't set error status immediately on load, just show warning
			}
		} catch (error) {
			console.error("Failed to check binaries", error);
			setBinariesExist(false);
		}
	};

	useEffect(() => {
		// Load presets and template from localStorage
		const savedPresets = localStorage.getItem('globalPresets');
		if (savedPresets) {
			try {
				setPresets(JSON.parse(savedPresets));
			} catch (e) {
				console.error('Failed to parse presets', e);
			}
		}

		const savedTemplate = localStorage.getItem('outputTemplate');
		if (savedTemplate) setOutputTemplate(savedTemplate);

		checkBinaries();

		// Listeners
		const removeDownloadListeners = window.electron.onDownloadProgress((_event, progress) => {
			setLogs(prev => [...prev, progress]);
		});

		const removeCompleteListeners = window.electron.onDownloadComplete((_event, result: { success: boolean; message: string }) => {
			setIsDownloading(false);
			setStatus(result.success ? 'complete' : 'error');
			setLogs(prev => [...prev, result.message]);
		});

		return () => {
			removeDownloadListeners();
			removeCompleteListeners();
		};
	}, []);

	// Save settings when changed
	useEffect(() => {
		localStorage.setItem('globalPresets', JSON.stringify(presets));
	}, [presets]);

	useEffect(() => {
		localStorage.setItem('outputTemplate', outputTemplate);
	}, [outputTemplate]);

	useEffect(() => {
		localStorage.setItem('lastLocation', location);
	}, [location]);

	useEffect(() => {
		localStorage.setItem('lastFormatOptions', JSON.stringify(formatOptions));
	}, [formatOptions]);

	useEffect(() => {
		localStorage.setItem('lastAdvancedOptions', JSON.stringify(advancedOptions));
	}, [advancedOptions]);

	// ...

	const handleSavePreset = (name: string) => {
		const newPreset: Preset = {
			id: crypto.randomUUID(),
			name,
			location,
			format: formatOptions
		};
		setPresets([...presets, newPreset]);
	};

	const handleDeletePreset = (id: string) => {
		setPresets(presets.filter(p => p.id !== id));
	};

	const handleApplyPreset = (preset: Preset) => {
		setLocation(preset.location);
		setFormatOptions(preset.format);
	};

	const handleDownload = () => {
		if (!url) return;
		if (!location) {
			alert('保存先フォルダを選択してください。');
			return;
		}

		setIsDownloading(true);
		setStatus('downloading');
		setLogs(['ダウンロードを開始します...']);

		const args: string[] = [];
		const customArgsInput = document.getElementById('custom-args') as HTMLInputElement;
		const customArgs = customArgsInput?.value ? customArgsInput.value.split(' ').filter(a => a) : [];

		window.electron.startDownload({
			url,
			format: formatOptions.type,
			location,
			args: customArgs,
			options: formatOptions,
			advancedOptions,
			outputTemplate // Pass the template
		});
	};



	const handleUpdateBinaries = async () => {
		setIsUpdatingBinaries(true);
		setBinaryStatus({ message: 'yt-dlpの更新中...', type: 'info' });
		setLogs(prev => [...prev, 'yt-dlpの更新を開始します...']);
		const success = await window.electron.updateYtDlp();
		setIsUpdatingBinaries(false);
		if (success) {
			setBinaryStatus({ message: '更新完了', type: 'success' });
			setLogs(prev => [...prev, 'yt-dlpの更新が完了しました。']);
			setTimeout(() => setBinaryStatus(null), 3000);
		} else {
			setBinaryStatus({ message: '更新失敗', type: 'error' });
			setLogs(prev => [...prev, 'yt-dlpの更新に失敗しました。']);
		}
	};

	const handleUpdateFfmpeg = async () => {
		setIsUpdatingBinaries(true);
		setBinaryStatus({ message: 'ffmpegの更新中...', type: 'info' });
		setLogs(prev => [...prev, 'ffmpegの更新を開始します...']);
		const success = await window.electron.updateFfmpeg();
		setIsUpdatingBinaries(false);
		if (success) {
			setBinaryStatus({ message: '更新完了', type: 'success' });
			setLogs(prev => [...prev, 'ffmpegの更新が完了しました。']);
			setTimeout(() => setBinaryStatus(null), 3000);
		} else {
			setBinaryStatus({ message: '更新失敗', type: 'error' });
			setLogs(prev => [...prev, 'ffmpegの更新に失敗しました。']);
		}
	};

	const handleDownloadBinaries = async () => {
		setIsUpdatingBinaries(true);
		setBinaryStatus({ message: 'バイナリのダウンロード中...', type: 'info' });
		setLogs(prev => [...prev, 'バイナリのダウンロードを開始します...']);
		const success = await window.electron.downloadBinaries();
		setIsUpdatingBinaries(false);
		if (success) {
			setBinaryStatus({ message: 'ダウンロード完了', type: 'success' });
			setLogs(prev => [...prev, 'バイナリのダウンロードとセットアップが完了しました。']);
			checkBinaries(); // Re-check status
			setTimeout(() => setBinaryStatus(null), 3000);
		} else {
			setBinaryStatus({ message: 'ダウンロード失敗', type: 'error' });
			setLogs(prev => [...prev, 'バイナリのダウンロードに失敗しました。']);
		}
	};

	return (
		<div className="h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-hidden relative flex flex-col">
			{/* Background Gradients */}
			<div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
			<div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none animate-pulse ${theme.blob1}" style={{ animationDuration: '10s', animationDelay: '1s' }} />
			<div className="fixed top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none ${theme.blob2}" />

			<div className="flex-1 flex flex-col min-h-0 w-full max-w-full mx-auto p-4 relative z-10">

				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center space-y-1 mb-4 relative drag shrink-0"
				>
					<div className="absolute left-0 top-0 flex items-center gap-2 z-50 no-drag">
						<button
							onClick={() => setIsSettingsOpen(true)}
							className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
						>
							<SettingsIcon size={18} className={theme.icon} />
						</button>

						{presets.length > 0 && (
							<select
								onChange={(e) => {
									const preset = presets.find(p => p.id === e.target.value);
									if (preset) handleApplyPreset(preset);
								}}
								className="glass-input rounded-full px-3 py-1.5 text-[10px] text-gray-300 cursor-pointer hover:bg-white/10 transition-colors appearance-none"
								defaultValue=""
							>
								<option value="" disabled>プリセット</option>
								{presets.map(preset => (
									<option key={preset.id} value={preset.id} className="bg-[#111] text-white">
										{preset.name}
									</option>
								))}
							</select>
						)}
					</div>

					<h1 className="text-3xl font-bold font-display bg-gradient-to-r ${theme.primary} ${theme.secondary} ${theme.accent} bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
						yt-dlp GUI
					</h1>
					<p className="text-gray-400 text-xs font-light tracking-wide">高機能動画ダウンローダー</p>
				</motion.div>

				<div className="flex-1 flex flex-col gap-6 min-h-0">
					{/* Top Panel - Controls */}
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex-1 min-h-0 flex flex-col"
					>
						<div className="glass rounded-3xl p-5 shadow-2xl flex flex-col gap-4 flex-1 overflow-y-auto custom-scrollbar">
							{binariesExist === false && (
								<div className={`bg-red-500/10 border ${theme.border} text-red-400 p-3 rounded-xl flex items-center gap-3 text-xs shrink-0`}>
									<AlertCircle size={16} />
									<span>バイナリ (yt-dlp/ffmpeg) がアプリケーションフォルダに見つかりません。設定からダウンロードしてください。</span>
								</div>
							)}

							<div className="shrink-0">
								<UrlInput url={url} setUrl={setUrl} />
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
								<FormatSelector options={formatOptions} setOptions={setFormatOptions} />
								<div className="space-y-4">
									<LocationSelector
										location={location}
										setLocation={setLocation}
									/>

									<AdvancedOptions
										options={advancedOptions}
										setOptions={setAdvancedOptions}
										formatType={formatOptions.type}
									/>

									<div className="space-y-2">
										<details className="group">
											<summary className="flex items-center gap-2 text-[10px] font-medium text-gray-400 cursor-pointer hover:text-white transition-colors select-none">
												<Terminal size={12} />
												カスタム引数
											</summary>
											<div className="mt-1">
												<input
													type="text"
													placeholder="--embed-subs --write-auto-sub ..."
													className="w-full glass-input rounded-xl px-3 py-2 text-[10px] text-gray-300 placeholder-gray-600"
													id="custom-args"
												/>
											</div>
										</details>
									</div>
								</div>
							</div>

							<div className="mt-auto pt-2 shrink-0 space-y-3">
								<div className="flex items-center justify-between px-1">
									<div className="flex items-center gap-2">
										<div className={`w-2 h-2 rounded-full ${isClipboardMonitorEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
										<span className="text-xs text-gray-400">クリップボード監視</span>
									</div>
									<button
										onClick={() => setIsClipboardMonitorEnabled(!isClipboardMonitorEnabled)}
										className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isClipboardMonitorEnabled ? 'bg-green-500/20' : 'bg-white/10'
											}`}
									>
										<div
											className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-transform duration-200 ${isClipboardMonitorEnabled ? 'translate-x-5 bg-green-500' : 'bg-gray-400'
												}`}
										/>
									</button>
								</div>

								<motion.button
									whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)" }}
									whileTap={{ scale: 0.99 }}
									onClick={handleDownload}
									disabled={isDownloading || !url || !location || binariesExist === false}
									className={`w-full py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${isDownloading
										? 'bg-white/5 cursor-not-allowed text-gray-500 border border-white/5'
										: `${theme.button} text-white shadow-xl ${theme.buttonShadow} border border-white/10`
										}`}
								>
									{isDownloading ? (
										<>
											<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											処理中...
										</>
									) : (
										<>
											<Download size={18} />
											ダウンロード開始
										</>
									)}
								</motion.button>
							</div>
						</div>
					</motion.div>

					{/* Bottom Panel - Console & Status */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="w-full shrink-0 flex flex-col gap-2"
					>
						<StatusToast
							status={status}
							message={status === 'success' ? 'ダウンロードが完了しました！' : 'ダウンロードに失敗しました。ログを確認してください。'}
							onClose={() => setStatus('idle')}
						/>

						<div className="glass rounded-3xl p-4 shadow-2xl flex flex-col h-48 overflow-hidden">
							<div className="flex items-center justify-between mb-2 shrink-0">
								<div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
									<Terminal size={14} className="text-green-400" />
									コンソール出力
								</div>
								<button
									onClick={() => setLogs([])}
									className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
									title="ログをクリア"
								>
									<X size={12} />
								</button>
							</div>

							<div className="flex-1 bg-[#0a0a0a]/50 rounded-xl border border-white/5 p-3 overflow-y-auto font-mono text-[10px] text-gray-300 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent shadow-inner">
								{logs.length === 0 ? (
									<div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 opacity-50">
										<Terminal size={20} />
										<span>待機中...</span>
									</div>
								) : (
									<>
										{logs.map((log, i) => (
											<div key={i} className="break-all border-l-2 border-transparent hover:border-white/20 pl-2 transition-colors leading-relaxed">
												{log}
											</div>
										))}
										<div ref={logsEndRef} />
									</>
								)}
							</div>
						</div>
					</motion.div>
				</div>

				<SettingsModal
					isOpen={isSettingsOpen}
					onClose={() => setIsSettingsOpen(false)}
					presets={presets}
					onSavePreset={handleSavePreset}
					onDeletePreset={handleDeletePreset}
					outputTemplate={outputTemplate}
					setOutputTemplate={setOutputTemplate}
					binariesExist={binariesExist}
					onUpdateBinaries={handleUpdateBinaries}
					onUpdateFfmpeg={handleUpdateFfmpeg}
					onDownloadBinaries={handleDownloadBinaries}
					binaryStatus={binaryStatus}
					currentTheme={currentTheme}
					setTheme={setCurrentTheme}
					themes={themes}
				/>

			</div>
		</div>
	);
}

export default App;

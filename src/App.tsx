import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Terminal, AlertCircle, X, Settings as SettingsIcon, History, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UrlInput } from './components/UrlInput';
import { FormatSelector } from './components/FormatSelector';
import { LocationSelector } from './components/LocationSelector';
import { AdvancedOptions } from './components/AdvancedOptions';
import { StatusToast, Status } from './components/StatusToast';
import { SettingsModal } from './components/SettingsModal';
import { DownloadHistory } from './components/DownloadHistory';
import { FormatOptions, AdvancedOptionsState, VideoConversionOptions, DownloadHistoryItem } from './types/options';
import { DownloadResult } from './types/electron';
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
	activeTab: string;
	toggle: string;
	toggleBg: string;
	focusRing: string;
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
			audioSampleRate: '48000',
			audioBitDepth: '16'
		};
		return { ...parsed, type: 'video' };
	});

	const [videoConversion, setVideoConversion] = useState<VideoConversionOptions>(() => {
		const saved = localStorage.getItem('videoConversion');
		return saved ? JSON.parse(saved) : {
			enabled: false,
			videoCodec: 'copy',
			videoBitrate: '',
			audioCodec: 'copy',
			audioBitrate: ''
		};
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
	const [binaryUpdateProgress, setBinaryUpdateProgress] = useState<{ type: 'ytdlp' | 'ffmpeg'; percent: number; status: string } | null>(null);
	const [isUpdatingBinaries, setIsUpdatingBinaries] = useState(false);
	const [binaryVersions, setBinaryVersions] = useState<{ ytDlp: string; ffmpeg: string } | null>(null);
	const [latestBinaryVersions, setLatestBinaryVersions] = useState<{ ytDlp: string; ffmpeg: string } | null>(null);

	// Clipboard Monitor State
	const [isClipboardMonitorEnabled, setIsClipboardMonitorEnabled] = useState(false);

	// Favorites State
	const [favorites, setFavorites] = useState<string[]>(() => {
		const saved = localStorage.getItem('favoriteFolders');
		return saved ? JSON.parse(saved) : [];
	});

	// Download History State
	const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>(() => {
		const saved = localStorage.getItem('downloadHistory');
		return saved ? JSON.parse(saved) : [];
	});

	// Show History Panel State
	const [showHistory, setShowHistory] = useState(false);
	const [showConsole, setShowConsole] = useState(false);

	// Download Progress State
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [currentDownloadUrl, setCurrentDownloadUrl] = useState('');

	const isMac = navigator.userAgent.includes('Mac');

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
	const [status, setStatus] = useState<Status>('idle');
	const [logs, setLogs] = useState<string[]>([]);
	const logsEndRef = useRef<HTMLDivElement>(null);
	const logsContainerRef = useRef<HTMLDivElement>(null);

	// Auto scroll logs
	useEffect(() => {
		if (logsContainerRef.current) {
			logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
		}
	}, [logs]);

	// Parse progress from yt-dlp output
	const parseProgress = useCallback((log: string) => {
		// Match patterns like "[download]  45.2% of 100.00MiB"
		const match = log.match(/\[download\]\s+(\d+\.?\d*)%/);
		if (match) {
			setDownloadProgress(parseFloat(match[1]));
		}
		// Also match ffmpeg conversion progress
		const ffmpegMatch = log.match(/time=(\d+):(\d+):(\d+)/);
		if (ffmpegMatch) {
			// Just indicate activity during conversion
			setDownloadProgress(prev => Math.min(prev + 0.1, 99));
		}
	}, []);

	const checkBinaries = async () => {
		try {
			const result = await window.electron.checkBinaries();
			// Assuming result is { ytdlp: boolean, ffmpeg: boolean, path: string }
			const allExist = result.ytdlp && result.ffmpeg;
			setBinariesExist(allExist);

			if (allExist) {
				const versions = await window.electron.getBinaryVersions();
				setBinaryVersions(versions);
				
				// Fetch latest versions in background
				window.electron.getLatestBinaryVersions().then(latest => {
					setLatestBinaryVersions(latest);
				}).catch(err => console.error('Failed to fetch latest versions', err));
			}

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
	}, []);

	// Separate effect for download listeners to avoid stale closures
	useEffect(() => {
		const removeDownloadListeners = window.electron.onDownloadProgress((progress) => {
			setLogs(prev => [...prev, progress]);
			parseProgress(progress);
		});

		return () => {
			removeDownloadListeners();
		};
	}, [parseProgress]);

	// Effect for binary update progress
	useEffect(() => {
		const removeBinaryProgressListener = window.electron.onBinaryUpdateProgress((progress) => {
			setBinaryUpdateProgress(progress);
		});

		return () => {
			removeBinaryProgressListener();
		};
	}, []);

	// Refs to hold current values for download complete callback
	const currentDownloadUrlRef = React.useRef(currentDownloadUrl);
	const locationRef = React.useRef(location);
	const formatTypeRef = React.useRef(formatOptions.type);

	// Keep refs up to date
	useEffect(() => {
		currentDownloadUrlRef.current = currentDownloadUrl;
		locationRef.current = location;
		formatTypeRef.current = formatOptions.type;
	}, [currentDownloadUrl, location, formatOptions.type]);

	// Effect for download complete - only register once
	useEffect(() => {
		const removeCompleteListeners = window.electron.onDownloadComplete((result: DownloadResult) => {
			setIsDownloading(false);
			
			if (result.message.includes('キャンセル')) {
				setStatus('cancelled');
			} else {
				setStatus(result.success ? 'complete' : 'error');
			}
			
			setLogs(prev => [...prev, result.message]);
			setDownloadProgress(result.success ? 100 : 0);
			
			// Add to history - use refs to get current values
			setDownloadHistory(prev => {
				const historyItem: DownloadHistoryItem = {
					id: crypto.randomUUID(),
					url: currentDownloadUrlRef.current,
					title: result.title || 'タイトル不明',
					location: locationRef.current,
					filename: result.filename || '',
					fileSize: result.fileSize || 0,
					format: formatTypeRef.current,
					timestamp: Date.now(),
					success: result.success
				};
				return [historyItem, ...prev].slice(0, 50); // Keep max 50 items
			});
		});

		return () => {
			removeCompleteListeners();
		};
	}, []); // Empty dependency array - register only once

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

	useEffect(() => {
		localStorage.setItem('videoConversion', JSON.stringify(videoConversion));
	}, [videoConversion]);

	useEffect(() => {
		localStorage.setItem('favoriteFolders', JSON.stringify(favorites));
	}, [favorites]);

	useEffect(() => {
		localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
	}, [downloadHistory]);

	// ...

	const handleToggleFavorite = (path: string) => {
		if (favorites.includes(path)) {
			setFavorites(favorites.filter(f => f !== path));
		} else {
			setFavorites([...favorites, path]);
		}
	};

	const handleClearHistory = () => {
		setDownloadHistory([]);
	};

	const handleRemoveHistoryItem = (id: string) => {
		setDownloadHistory(prev => prev.filter(item => item.id !== id));
	};

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

	const handleCancelVideoDownload = async () => {
		if (isDownloading) {
			await window.electron.cancelDownload();
			// Status update will be handled by onDownloadComplete event
		}
	};

	const handleDownload = useCallback(() => {
		if (!url) return;
		if (!location) {
			alert('保存先フォルダを選択してください。');
			return;
		}

		setIsDownloading(true);
		setStatus('downloading');
		setDownloadProgress(0);
		setCurrentDownloadUrl(url);
		setLogs(['🚀 ダウンロードプロセスを開始します...']);

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
			videoConversion: formatOptions.type === 'video' ? videoConversion : undefined,
			outputTemplate // Pass the template
		});
	}, [url, location, formatOptions, advancedOptions, videoConversion, outputTemplate]);

	// Keyboard shortcuts - must be after handleDownload definition
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Cmd/Ctrl + Enter to start download
			if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
				if (!isDownloading && url && location && binariesExist !== false && !isSettingsOpen) {
					handleDownload();
				}
			}
			// Escape to close settings or history
			// Note: Settings modal handles its own ESC key via portal
			if (e.key === 'Escape') {
				if (showHistory) {
					setShowHistory(false);
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isDownloading, url, location, binariesExist, isSettingsOpen, showHistory, handleDownload]);

	const handleUpdateBinaries = async () => {
		setIsUpdatingBinaries(true);
		setBinaryUpdateProgress({ type: 'ytdlp', percent: 0, status: 'yt-dlpの更新を開始...' });
		setBinaryStatus(null);
		setLogs(prev => [...prev, 'yt-dlpの更新を開始します...']);
		const result = await window.electron.updateYtDlp();
		setIsUpdatingBinaries(false);
		setBinaryUpdateProgress(null);
		if (result === true) {
			setBinaryStatus({ message: '更新完了', type: 'success' });
			setLogs(prev => [...prev, 'yt-dlpの更新が完了しました。']);
			setTimeout(() => setBinaryStatus(null), 3000);
		} else if (result === 'cancelled') {
			setBinaryStatus({ message: 'キャンセルされました', type: 'info' });
			setLogs(prev => [...prev, 'yt-dlpの更新がキャンセルされました。']);
			setTimeout(() => setBinaryStatus(null), 3000);
		} else {
			setBinaryStatus({ message: '更新失敗', type: 'error' });
			setLogs(prev => [...prev, 'yt-dlpの更新に失敗しました。']);
		}
	};

	const handleUpdateFfmpeg = async () => {
		setIsUpdatingBinaries(true);
		setBinaryUpdateProgress({ type: 'ffmpeg', percent: 0, status: 'ffmpegの更新を開始...' });
		setBinaryStatus(null);
		setLogs(prev => [...prev, 'ffmpegの更新を開始します...']);
		const result = await window.electron.updateFfmpeg();
		setIsUpdatingBinaries(false);
		setBinaryUpdateProgress(null);
		if (result === true) {
			setBinaryStatus({ message: '更新完了', type: 'success' });
			setLogs(prev => [...prev, 'ffmpegの更新が完了しました。']);
			setTimeout(() => setBinaryStatus(null), 3000);
		} else if (result === 'cancelled') {
			setBinaryStatus({ message: 'キャンセルされました', type: 'info' });
			setLogs(prev => [...prev, 'ffmpegの更新がキャンセルされました。']);
			setTimeout(() => setBinaryStatus(null), 3000);
		} else {
			setBinaryStatus({ message: '更新失敗', type: 'error' });
			setLogs(prev => [...prev, 'ffmpegの更新に失敗しました。']);
		}
	};

	const handleCancelDownload = async () => {
		await window.electron.cancelBinaryDownload();
	};

	const handleDownloadBinaries = async () => {
		setIsUpdatingBinaries(true);
		setBinaryUpdateProgress({ type: 'ytdlp', percent: 0, status: 'バイナリのダウンロードを開始...' });
		setBinaryStatus(null);
		setLogs(prev => [...prev, 'バイナリのダウンロードを開始します...']);
		const success = await window.electron.downloadBinaries();
		setIsUpdatingBinaries(false);
		setBinaryUpdateProgress(null);
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
			<div className={`fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none animate-pulse ${theme.blob1}`} style={{ animationDuration: '8s' }} />
			<div className={`fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none animate-pulse ${theme.blob2}`} style={{ animationDuration: '10s', animationDelay: '1s' }} />
			<div className={`fixed top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none ${theme.blob1}`} />

			{/* Drag Region & Window Controls */}
			<div className="fixed top-0 left-0 w-full h-10 z-50 drag" />

			<div className="flex-1 flex flex-col min-h-0 w-full max-w-full mx-auto p-4 pt-8 relative z-10">

				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center space-y-1 mb-4 relative shrink-0"
				>
					<div className={`absolute top-0 flex items-center gap-2 z-50 no-drag ${isMac ? 'right-0 flex-row-reverse' : 'left-0'}`}>
						<button
							onClick={() => setIsSettingsOpen(true)}
							className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
							title="設定"
						>
							<SettingsIcon size={18} className={theme.icon} />
						</button>

						<button
							onClick={() => setShowHistory(!showHistory)}
							className={`p-2 rounded-full transition-colors cursor-pointer ${
								showHistory 
									? `${theme.button} bg-opacity-20` 
									: 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
							}`}
							title="ダウンロード履歴"
						>
							<History size={18} className={showHistory ? 'text-white' : ''} />
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

					<h1 className={`text-3xl font-bold font-display bg-gradient-to-r ${theme.primary} ${theme.secondary} ${theme.accent} bg-clip-text text-transparent drop-shadow-2xl tracking-tight`}>
						yt-dlp GUI
					</h1>
					<p className="text-gray-400 text-xs font-light tracking-wide">高機能動画ダウンローダー</p>
				</motion.div>

				<div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar pb-4">
					{/* Top Panel - Controls */}
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex-1 min-h-0 flex flex-col"
					>
						<div className="glass rounded-3xl p-5 shadow-2xl flex flex-col gap-4 flex-1">
							{binariesExist === false && (
								<div className={`bg-red-500/10 border ${theme.border} text-red-400 p-3 rounded-xl flex items-center gap-3 text-xs shrink-0`}>
									<AlertCircle size={16} />
									<span>バイナリ (yt-dlp/ffmpeg) がアプリケーションフォルダに見つかりません。設定からダウンロードしてください。</span>
								</div>
							)}

							<div className="shrink-0 space-y-3">
								<UrlInput url={url} setUrl={setUrl} theme={{ icon: theme.icon }} />
								
								{/* Clipboard Monitor Toggle */}
								<div className="flex items-center justify-end px-1">
									<div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsClipboardMonitorEnabled(!isClipboardMonitorEnabled)}>
										<div className={`w-2 h-2 rounded-full transition-colors ${isClipboardMonitorEnabled ? `${theme.toggle} animate-pulse` : 'bg-gray-600'}`} />
										<span className="text-xs text-gray-400 select-none">クリップボード監視</span>
										<div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${isClipboardMonitorEnabled ? theme.toggleBg : 'bg-white/10'}`}>
											<div
												className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform duration-200 ${isClipboardMonitorEnabled ? `translate-x-4 ${theme.toggle}` : 'bg-gray-400'}`}
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
								<FormatSelector 
									options={formatOptions} 
									setOptions={setFormatOptions}
									videoConversion={videoConversion}
									setVideoConversion={setVideoConversion}
									theme={{
										tabActive: theme.activeTab.split(' ')[0],
										tabActiveText: theme.activeTab.split(' ')[1],
										tabInactive: 'bg-white/5',
										tabInactiveText: 'text-gray-400',
										toggleActive: theme.toggle,
										toggleTrack: theme.toggleBg,
										icon: theme.icon
									}}
								/>
								<div className="space-y-4">
									<LocationSelector
										location={location}
										setLocation={setLocation}
										favorites={favorites}
										onToggleFavorite={handleToggleFavorite}
										theme={{
											icon: theme.icon,
											activeTab: theme.activeTab,
											focusRing: theme.focusRing
										}}
									/>

									<AdvancedOptions
										options={advancedOptions}
										setOptions={setAdvancedOptions}
										formatType={formatOptions.type}
										theme={{
											toggleActive: theme.toggle,
											toggleTrack: theme.toggleBg,
											icon: theme.icon
										}}
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


								<div className="flex gap-2">
									<motion.button
										whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)" }}
										whileTap={{ scale: 0.99 }}
										onClick={handleDownload}
										disabled={isDownloading || !url || !location || binariesExist === false}
										className={`relative flex-1 py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all overflow-hidden ${isDownloading
											? 'bg-white/5 cursor-not-allowed text-gray-300 border border-white/10'
											: `${theme.button} text-white shadow-xl ${theme.buttonShadow} border border-white/10`
											}`}
									>
										{/* Progress bar background */}
										{isDownloading && (
											<motion.div
												className={`absolute inset-0 ${theme.button} opacity-30`}
												initial={{ width: '0%' }}
												animate={{ width: `${downloadProgress}%` }}
												transition={{ duration: 0.3 }}
											/>
										)}
										
										<span className="relative z-10 flex items-center gap-2">
											{isDownloading ? (
												<>
													<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
													処理中... {downloadProgress > 0 && `${downloadProgress.toFixed(1)}%`}
												</>
											) : (
												<>
													<Download size={18} />
													ダウンロード開始
													<span className="text-xs opacity-60 ml-1">(⌘+Enter)</span>
												</>
											)}
										</span>
									</motion.button>

									{isDownloading && (
										<motion.button
											initial={{ width: 0, opacity: 0 }}
											animate={{ width: 'auto', opacity: 1 }}
											exit={{ width: 0, opacity: 0 }}
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={handleCancelVideoDownload}
											className="px-4 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 flex items-center justify-center"
											title="キャンセル"
										>
											<XCircle size={20} />
										</motion.button>
									)}
								</div>

								{/* Console Toggle & Output */}
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<button 
											onClick={() => setShowConsole(!showConsole)}
											className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
										>
											<Terminal size={12} />
											<span>コンソール出力</span>
											<motion.div
												animate={{ rotate: showConsole ? 180 : 0 }}
												transition={{ duration: 0.2 }}
											>
												<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<path d="M6 9l6 6 6-6"/>
												</svg>
											</motion.div>
										</button>
										
										{/* Status Toast Placeholder / Display */}
										<div className="h-8 flex items-center justify-end min-w-[200px]">
											<AnimatePresence mode="wait">
												{status !== 'idle' && (
													<motion.div
														initial={{ opacity: 0, x: 20 }}
														animate={{ opacity: 1, x: 0 }}
														exit={{ opacity: 0, x: 20 }}
													>
														<StatusToast
															status={status}
															message={
																status === 'complete' ? 'ダウンロードが完了しました！' :
																status === 'downloading' ? 'ダウンロード中です...' :
																'ダウンロードに失敗しました。ログを確認してください。'
															}
															onClose={() => setStatus('idle')}
														/>
													</motion.div>
												)}
											</AnimatePresence>
										</div>
									</div>

									<AnimatePresence>
										{showConsole && (
											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: 200, opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												className="overflow-hidden"
											>
												<div className="glass rounded-xl p-3 h-full flex flex-col">
													<div className="flex justify-end mb-2">
														<button
															onClick={() => setLogs([])}
															className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
															title="ログをクリア"
														>
															<X size={12} />
														</button>
													</div>
													<div 
														ref={logsContainerRef}
														className="flex-1 bg-[#0a0a0a]/50 rounded-lg border border-white/5 p-2 overflow-y-auto font-mono text-[10px] text-gray-300 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent shadow-inner"
													>
														{logs.length === 0 ? (
															<div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 opacity-50">
																<Terminal size={16} />
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
										)}
									</AnimatePresence>
								</div>
							</div>
						</div>
					</motion.div>



					{/* History Panel */}
					<AnimatePresence>
						{showHistory && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="w-full shrink-0 overflow-hidden"
							>
								<div className="glass rounded-3xl p-4 shadow-2xl">
									<DownloadHistory
										history={downloadHistory}
										onClearHistory={handleClearHistory}
										onRemoveItem={handleRemoveHistoryItem}
									/>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
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
					onCancelDownload={handleCancelDownload}
					onDownloadBinaries={handleDownloadBinaries}
					binaryStatus={binaryStatus}
					binaryUpdateProgress={binaryUpdateProgress}
					currentTheme={currentTheme}
					setTheme={setCurrentTheme}
					themes={themes}
					binaryVersions={binaryVersions}
					latestBinaryVersions={latestBinaryVersions}
				/>

			</div>
		</div>
	);
}

export default App;

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Download, Terminal, AlertCircle, X, Settings as SettingsIcon, History, XCircle, Zap, ListPlus, ArrowUp, ArrowDown, Trash2, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UrlInput } from './components/UrlInput';
import { FormatSelector } from './components/FormatSelector';
import { LocationSelector } from './components/LocationSelector';
import { AdvancedOptions } from './components/AdvancedOptions';
import { StatusToast, Status } from './components/StatusToast';
import { SettingsModal } from './components/SettingsModal';
import { DownloadHistory } from './components/DownloadHistory';
import { VideoPreview, VideoInfo, PlaylistInfo } from './components/VideoPreview';
import { FormatOptions, AdvancedOptionsState, DownloadHistoryItem } from './types/options';
import { DownloadResult, BinaryUpdateProgress } from './types/electron';
import { Preset } from './types/Preset';
import { useI18n } from './i18n';

// Detect OS for keyboard shortcut display
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

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
	const { t } = useI18n();
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

	const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptionsState>(() => {
		const saved = localStorage.getItem('lastAdvancedOptions');
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
	});

	// Settings State
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [presets, setPresets] = useState<Preset[]>([]);
	const [outputTemplate, setOutputTemplate] = useState('%(title)s.%(ext)s');
	const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
		return localStorage.getItem('notificationsEnabled') === 'true';
	});

	useEffect(() => {
		localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
	}, [notificationsEnabled]);

        // Batch Download Queue
        const [downloadQueue, setDownloadQueue] = useState<{ url: string; subfolder?: string }[]>(() => {
                const saved = localStorage.getItem('downloadQueue');
                return saved ? JSON.parse(saved) : [];
        });
        const [activePage, setActivePage] = useState<'download' | 'queueHistory'>('download');

	// Binary Status State
	const [binariesExist, setBinariesExist] = useState<boolean | null>(null);
	const [binaryStatus, setBinaryStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
	const [binaryUpdateProgress, setBinaryUpdateProgress] = useState<BinaryUpdateProgress | null>(null);
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

        useEffect(() => {
                localStorage.setItem('downloadQueue', JSON.stringify(downloadQueue));
        }, [downloadQueue]);

        // Download History State
        const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>(() => {
                const saved = localStorage.getItem('downloadHistory');
                return saved ? JSON.parse(saved) : [];
        });

        const [showConsole, setShowConsole] = useState(false);

	// Download Progress State
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [currentDownloadUrl, setCurrentDownloadUrl] = useState('');

	// Download Progress Details
	const [downloadSpeed, setDownloadSpeed] = useState<string>('');
	const [downloadedSize, setDownloadedSize] = useState<string>('');
	const [totalSize, setTotalSize] = useState<string>('');
	const [eta, setEta] = useState<string>('');

	// Video Preview State
	const [videoPreviewLoading, setVideoPreviewLoading] = useState(false);
	const [videoPreviewError, setVideoPreviewError] = useState<string | null>(null);
	const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
	const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
	const [isVideoPreviewExpanded, setIsVideoPreviewExpanded] = useState(true);

	const isMac = navigator.userAgent.includes('Mac');

	// Calculate estimated size based on format options and video info
	const estimatedSize = useMemo(() => {
		const currentVideo = videoInfo || playlistInfo?.entries?.[0];
		if (!currentVideo) return undefined;

		const duration = currentVideo.duration || 0;
		const formats = currentVideo.formats || [];

		if (formatOptions.type === 'video') {
			const videoFormats = formats.filter(f => f.vcodec && f.vcodec !== 'none');
			const audioFormats = formats.filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'));

			if (!videoFormats.length) return currentVideo.filesize;

			// Find matching video format based on resolution
			let matchingVideoFormat;
			if (formatOptions.videoResolution === 'best') {
				matchingVideoFormat = [...videoFormats].sort((a, b) => (b.height || 0) - (a.height || 0))[0];
			} else {
				const targetHeight = parseInt(formatOptions.videoResolution, 10);
				if (Number.isFinite(targetHeight)) {
					matchingVideoFormat = [...videoFormats].sort((a, b) =>
						Math.abs((a.height || 0) - targetHeight) - Math.abs((b.height || 0) - targetHeight)
					)[0];
				} else {
					matchingVideoFormat = videoFormats[0];
				}
			}

			// Get video size
			let videoSize = matchingVideoFormat?.filesize || matchingVideoFormat?.filesize_approx || 0;

			// If no filesize, estimate from bitrate and duration
			if (!videoSize && matchingVideoFormat?.tbr && duration > 0) {
				// tbr is total bitrate in kbps
				videoSize = Math.round((matchingVideoFormat.tbr * 1000 * duration) / 8);
			}

			// Get best audio size
			let audioSize = 0;
			if (audioFormats.length > 0) {
				const bestAudio = [...audioFormats].sort((a, b) =>
					(b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0)
				)[0];
				audioSize = bestAudio?.filesize || bestAudio?.filesize_approx || 0;

				// If no audio filesize, estimate (assume ~128kbps audio)
				if (!audioSize && duration > 0) {
					audioSize = Math.round((128 * 1000 * duration) / 8);
				}
			}

			const totalSize = videoSize + audioSize;
			return totalSize > 0 ? totalSize : currentVideo.filesize;
		}

		// For audio, calculate based on duration and bitrate
		if (!duration || duration <= 0) return undefined;

		let bitrateKbps = 320; // default
		const bitrateMatch = formatOptions.audioBitrate?.match(/(\d+)/);
		if (bitrateMatch) {
			bitrateKbps = parseInt(bitrateMatch[1], 10);
		}

		if (formatOptions.audioFormat === 'flac') {
			bitrateKbps = 900; // ~900 kbps average for FLAC
		} else if (formatOptions.audioFormat === 'wav') {
			const bitDepth = parseInt(formatOptions.audioBitDepth || '16', 10);
			const sampleRate = parseInt(formatOptions.audioSampleRate || '48000', 10);
			const bytesPerSecond = (sampleRate * bitDepth * 2) / 8;
			return Math.round(duration * bytesPerSecond);
		}

		const estimatedBytes = Math.round((bitrateKbps * 1000 * duration) / 8 * 1.05);
		return estimatedBytes;
	}, [videoInfo, playlistInfo, formatOptions]);

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
		// Match patterns like "[download]  45.2% of 100.00MiB at 5.00MiB/s ETA 00:10"
		const downloadMatch = log.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*\w+)\s+at\s+(\d+\.?\d*\w+\/s)\s+ETA\s+(\S+)/i);
		if (downloadMatch) {
			setDownloadProgress(parseFloat(downloadMatch[1]));
			setTotalSize(downloadMatch[2]);
			setDownloadSpeed(downloadMatch[3]);
			setEta(downloadMatch[4]);

			// Calculate downloaded size
			const percent = parseFloat(downloadMatch[1]) / 100;
			const totalMatch = downloadMatch[2].match(/(\d+\.?\d*)/);
			if (totalMatch) {
				const total = parseFloat(totalMatch[1]);
				const downloaded = total * percent;
				const unit = downloadMatch[2].replace(/[\d.]/g, '');
				setDownloadedSize(`${downloaded.toFixed(1)}${unit}`);
			}
			return;
		}

		// Match simpler pattern "[download]  45.2% of 100.00MiB"
		const simpleMatch = log.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*\w+)/i);
		if (simpleMatch) {
			setDownloadProgress(parseFloat(simpleMatch[1]));
			setTotalSize(simpleMatch[2]);
		}

		// Also match ffmpeg conversion progress
		const ffmpegMatch = log.match(/time=(\d+):(\d+):(\d+)/);
		if (ffmpegMatch) {
			// Just indicate activity during conversion
			setDownloadProgress(prev => Math.min(prev + 0.1, 99));
		}
	}, []);

	// Fetch video info when URL changes
	const fetchVideoInfoDebounced = useCallback(
		(() => {
			let timeoutId: NodeJS.Timeout | null = null;
			return (urlToFetch: string) => {
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
				timeoutId = setTimeout(async () => {
					if (!urlToFetch || !urlToFetch.startsWith('http')) {
						setVideoInfo(null);
						setPlaylistInfo(null);
						setVideoPreviewError(null);
						return;
					}

					setVideoPreviewLoading(true);
					setVideoPreviewError(null);
					setVideoInfo(null);
					setPlaylistInfo(null);

					try {
						const result = await window.electron.fetchVideoInfo(urlToFetch);

						if (result.error) {
							setVideoPreviewError(result.error);
						} else if (result.isPlaylist && result.playlist) {
							setPlaylistInfo(result.playlist as PlaylistInfo);
						} else if (result.video) {
							setVideoInfo(result.video as VideoInfo);
						}
					} catch (err: any) {
						setVideoPreviewError(err.message || 'Failed to fetch video info');
					} finally {
						setVideoPreviewLoading(false);
					}
				}, 800); // Debounce 800ms
			};
		})(),
		[]
	);

	// Trigger video info fetch when URL changes
	useEffect(() => {
		if (url && binariesExist) {
			setIsVideoPreviewExpanded(true); // Expand preview when URL changes
			fetchVideoInfoDebounced(url);
		} else {
			setVideoInfo(null);
			setPlaylistInfo(null);
		}
	}, [url, binariesExist, fetchVideoInfoDebounced]);

	const checkBinaries = async () => {
		try {
			const result = await window.electron.checkBinaries();
			console.log('checkBinaries result:', result);
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

		// Set default download location if not already set
		if (!location) {
			window.electron.getDefaultDownloadPath().then(defaultPath => {
				setLocation(defaultPath);
				localStorage.setItem('lastLocation', defaultPath);
			}).catch(err => console.error('Failed to get default download path', err));
		}

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

			if (result.message.toLowerCase().includes('cancel')) {
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
					title: result.title || '',
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


        // Refactor handleDownload to accept URL override
        const startDownloadProcess = useCallback((targetUrl: string, subfolder?: string) => {
                if (!targetUrl) return;
		if (!location) {
			alert(t('selectDestination'));
			return;
		}

		setIsDownloading(true);
		setStatus('downloading');
		setDownloadProgress(0);
		setCurrentDownloadUrl(targetUrl);
		setLogs([t('startingDownload')]);

		// Reset progress details
		setDownloadSpeed('');
		setDownloadedSize('');
		setTotalSize('');
		setEta('');

		const args: string[] = [];
		const customArgsInput = document.getElementById('custom-args') as HTMLInputElement;
		const customArgs = customArgsInput?.value ? customArgsInput.value.split(' ').filter(a => a) : [];

		// Determine final output template
		let finalOutputTemplate = outputTemplate;

		// If subfolder is provided (Batch Import), prepend it
		if (subfolder) {
			// Use forward slash for template, yt-dlp handles OS path separators
			finalOutputTemplate = `${subfolder}/` + finalOutputTemplate;
		}
		// If it's a playlist (and not a batch import with explicit subfolder), append playlist folder
		else if (advancedOptions.playlist === 'all' || (playlistInfo && playlistInfo.entries.length > 1)) {
			finalOutputTemplate = '%(playlist_title)s/' + finalOutputTemplate;
		}

		window.electron.startDownload({
			url: targetUrl,
			format: formatOptions.type,
			location,
			args: customArgs,
			options: formatOptions,
			advancedOptions,
			outputTemplate: finalOutputTemplate,
			notificationsEnabled
		});
	}, [location, formatOptions, advancedOptions, outputTemplate, notificationsEnabled, t, playlistInfo]);

	// Update original handleDownload to use the new function
        const handleDownload = useCallback(() => {
                startDownloadProcess(url);
        }, [startDownloadProcess, url]);

        const handleAddToQueue = useCallback(() => {
                if (!url) return;
                if (!location) {
                        alert(t('selectDestination'));
                        return;
                }

                setDownloadQueue(prev => [...prev, { url }]);
                setLogs(prev => [...prev, t('queuedForDownload', { url })]);
        }, [location, t, url]);

        const handleRemoveQueueItem = useCallback((index: number) => {
                setDownloadQueue(prev => prev.filter((_, i) => i !== index));
        }, []);

        const handleMoveQueueItem = useCallback((index: number, direction: 'up' | 'down') => {
                setDownloadQueue(prev => {
                        const newQueue = [...prev];
                        const targetIndex = direction === 'up' ? index - 1 : index + 1;
                        if (targetIndex < 0 || targetIndex >= newQueue.length) return prev;
                        [newQueue[index], newQueue[targetIndex]] = [newQueue[targetIndex], newQueue[index]];
                        return newQueue;
                });
        }, []);

        const handleClearQueue = useCallback(() => {
                setDownloadQueue([]);
        }, []);

        // Queue processing effect - improved
        useEffect(() => {
                if (!isDownloading && downloadQueue.length > 0) {
                        const nextItem = downloadQueue[0];
                        setDownloadQueue(prev => prev.slice(1));
                        // Update URL state for UI consistency
                        setUrl(nextItem.url);
                        setLogs(prev => [...prev, t('startingQueuedDownload', { url: nextItem.url })]);
                        // Start download
                        startDownloadProcess(nextItem.url, nextItem.subfolder);
                }
        }, [isDownloading, downloadQueue, startDownloadProcess, t]);

	const handleBatchImport = async () => {
		try {
			const result = await window.electron.openFileDialog();
			if (result && result.content) {
				const urls = result.content.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));

				// Extract filename without extension for subfolder
				// We need to handle both Windows (\) and Unix (/) paths
				const filePath = result.filePath;
				const fileName = filePath.split(/[/\\]/).pop() || 'Batch Download';
				const subfolder = fileName.replace(/\.[^/.]+$/, ""); // Remove extension

				if (urls.length > 0) {
					const queueItems = urls.map(url => ({ url, subfolder }));
					setDownloadQueue(prev => [...prev, ...queueItems]);
					setLogs(prev => [...prev, `Added ${urls.length} URLs to queue (Folder: ${subfolder})`]);
				}
			}
		} catch (e) {
			console.error('Failed to import file', e);
		}
	};

        // Keyboard shortcuts - must be after handleDownload definition
        useEffect(() => {
                const handleKeyDown = (e: KeyboardEvent) => {
                        // Cmd/Ctrl + Enter to start download
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                if (!isDownloading && url && location && binariesExist !== false && !isSettingsOpen) {
                                        handleDownload();
                                }
                        }
                };

                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
        }, [isDownloading, url, location, binariesExist, isSettingsOpen, handleDownload]);

	const handleUpdateBinaries = async () => {
		setIsUpdatingBinaries(true);
		setBinaryUpdateProgress({ type: 'ytdlp', percent: 0, statusKey: 'startingYtDlpUpdate' });
		setBinaryStatus(null);
		setLogs(prev => [...prev, t('startingYtDlpUpdate')]);
		const result = await window.electron.updateYtDlp();
		setIsUpdatingBinaries(false);
		setBinaryUpdateProgress(null);
		if (result === true) {
			setBinaryStatus({ message: t('updateComplete'), type: 'success' });
			setLogs(prev => [...prev, t('ytDlpUpdateComplete')]);
		} else if (result === 'cancelled') {
			setBinaryStatus({ message: t('updateCancelled'), type: 'info' });
			setLogs(prev => [...prev, t('ytDlpUpdateCancelled')]);
		} else {
			setBinaryStatus({ message: t('updateFailed'), type: 'error' });
			setLogs(prev => [...prev, t('ytDlpUpdateFailed')]);
		}
	};

	const handleUpdateFfmpeg = async () => {
		setIsUpdatingBinaries(true);
		setBinaryUpdateProgress({ type: 'ffmpeg', percent: 0, statusKey: 'startingFfmpegUpdate' });
		setBinaryStatus(null);
		setLogs(prev => [...prev, t('startingFfmpegUpdate')]);
		const result = await window.electron.updateFfmpeg();
		setIsUpdatingBinaries(false);
		setBinaryUpdateProgress(null);
		if (result === true) {
			setBinaryStatus({ message: t('updateComplete'), type: 'success' });
			setLogs(prev => [...prev, t('ffmpegUpdateComplete')]);
		} else if (result === 'cancelled') {
			setBinaryStatus({ message: t('updateCancelled'), type: 'info' });
			setLogs(prev => [...prev, t('ffmpegUpdateCancelled')]);
		} else {
			setBinaryStatus({ message: t('updateFailed'), type: 'error' });
			setLogs(prev => [...prev, t('ffmpegUpdateFailed')]);
		}
	};

	const handleCancelDownload = async () => {
		await window.electron.cancelBinaryDownload();
	};

	const handleDownloadBinaries = async () => {
		setIsUpdatingBinaries(true);
		setBinaryUpdateProgress({ type: 'ytdlp', percent: 0, statusKey: 'startingBinaryDownload' });
		setBinaryStatus(null);
		setLogs(prev => [...prev, t('startingBinaryDownload')]);
		const success = await window.electron.downloadBinaries();
		setIsUpdatingBinaries(false);
		setBinaryUpdateProgress(null);
		if (success) {
			setBinaryStatus({ message: t('downloadComplete2'), type: 'success' });
			setLogs(prev => [...prev, t('binaryDownloadComplete')]);
			checkBinaries(); // Re-check status
		} else {
			setBinaryStatus({ message: t('downloadFailed'), type: 'error' });
			setLogs(prev => [...prev, t('binaryDownloadFailed')]);
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
                                                        title={t('settings')}
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
								<option value="" disabled>{t('preset')}</option>
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
                                        <p className="text-gray-400 text-xs font-light tracking-wide">{t('appSubtitle')}</p>
                                        <div className="flex justify-center gap-2 pt-3">
                                                <button
                                                        onClick={() => setActivePage('download')}
                                                        className={`px-4 py-2 rounded-full border text-sm transition-colors ${activePage === 'download'
                                                                ? `${theme.activeTab} border-white/30`
                                                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                                                >
                                                        {t('downloadTab')}
                                                </button>
                                                <button
                                                        onClick={() => setActivePage('queueHistory')}
                                                        className={`px-4 py-2 rounded-full border text-sm transition-colors ${activePage === 'queueHistory'
                                                                ? `${theme.activeTab} border-white/30`
                                                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                                                >
                                                        {t('queueHistoryTab')}
                                                </button>
                                        </div>
                                </motion.div>

                                <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
                                        {activePage === 'download' ? (
                                                <motion.div
                                                        initial={{ opacity: 0, y: -20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar pb-4"
                                                >
						<div className="glass rounded-3xl p-5 shadow-2xl flex flex-col gap-4 flex-1">
							{binariesExist === false && (
								<div className={`bg-red-500/10 border ${theme.border} text-red-400 p-3 rounded-xl flex items-center gap-3 text-xs shrink-0`}>
									<AlertCircle size={16} />
									<span>{t('binaryNotFound')}</span>
								</div>
							)}

							<div className="shrink-0 space-y-3">
								<UrlInput url={url} setUrl={setUrl} theme={{ icon: theme.icon }} onImport={handleBatchImport} />

								{/* Video Preview */}
								{url && (
									<VideoPreview
										url={url}
										isLoading={videoPreviewLoading}
										error={videoPreviewError}
										videoInfo={videoInfo}
										playlistInfo={playlistInfo}
										onToggle={() => setIsVideoPreviewExpanded(!isVideoPreviewExpanded)}
										isExpanded={isVideoPreviewExpanded}
										theme={{
											icon: theme.icon,
											primary: theme.primary,
											secondary: theme.secondary,
											accent: theme.accent
										}}
									/>
								)}

								{/* Clipboard Monitor Toggle */}
								<div className="flex items-center justify-end px-1">
									<div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsClipboardMonitorEnabled(!isClipboardMonitorEnabled)}>
										<div className={`w-2 h-2 rounded-full transition-colors ${isClipboardMonitorEnabled ? `${theme.toggle} animate-pulse` : 'bg-gray-600'}`} />
										<span className="text-xs text-gray-400 select-none">{t('clipboardMonitoring')}</span>
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
									theme={{
										tabActive: theme.activeTab.split(' ')[0],
										tabActiveText: theme.activeTab.split(' ')[1],
										tabInactive: 'bg-white/5',
										tabInactiveText: 'text-gray-400',
										toggleActive: theme.toggle,
										toggleTrack: theme.toggleBg,
										icon: theme.icon
									}}
									estimatedSize={estimatedSize}
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
												{t('customArgs')}
											</summary>
											<div className="mt-1">
												<input
													type="text"
													placeholder={t('customArgsPlaceholder')}
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
													{t('processing')} {downloadProgress > 0 && `${downloadProgress.toFixed(1)}%`}
												</>
											) : (
												<>
													<Download size={18} />
													{t('startDownload')}
													<span className="text-xs opacity-60 ml-1">({isMac ? '⌘' : 'Ctrl'}+Enter)</span>
												</>
											)}
                                                                                </span>
                                                                        </motion.button>

                                                                        <motion.button
                                                                                whileHover={{ scale: 1.05 }}
                                                                                whileTap={{ scale: 0.97 }}
                                                                                onClick={handleAddToQueue}
                                                                                disabled={!url || !location || binariesExist === false}
                                                                                className={`px-4 rounded-2xl border transition-all flex items-center gap-2 text-sm font-medium ${!url || !location || binariesExist === false
                                                                                        ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed'
                                                                                        : 'bg-white/10 border-white/20 text-white hover:bg-white/15'}`}
                                                                        >
                                                                                <ListPlus size={18} />
                                                                                {isDownloading ? t('addToQueue') : t('queueDownload')}
                                                                                {downloadQueue.length > 0 && (
                                                                                        <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-xs text-gray-200">
                                                                                                {downloadQueue.length}
                                                                                        </span>
                                                                                )}
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
											title={t('cancel')}
										>
											<XCircle size={20} />
										</motion.button>
									)}
								</div>

                                                                {/* Download Progress Details */}
                                                                <AnimatePresence>
                                                                        {isDownloading && (downloadSpeed || downloadedSize || eta) && (
                                                                                <motion.div
                                                                                        initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											className="overflow-hidden"
										>
											<div className="glass rounded-xl p-3 flex items-center justify-between text-xs">
												<div className="flex items-center gap-4">
													{downloadSpeed && (
														<div className="flex items-center gap-1.5">
															<Zap size={12} className="text-yellow-400" />
															<span className="text-gray-400">{t('downloadSpeed')}:</span>
															<span className="text-white font-medium">{downloadSpeed}</span>
														</div>
													)}
													{downloadedSize && totalSize && (
														<div className="flex items-center gap-1.5">
															<Download size={12} className="text-emerald-400" />
															<span className="text-gray-400">{t('downloadedSize')}:</span>
															<span className="text-white font-medium">{downloadedSize} / {totalSize}</span>
														</div>
													)}
												</div>
												{eta && eta !== 'Unknown' && (
													<div className="flex items-center gap-1.5">
														<span className="text-gray-400">{t('remainingTime')}:</span>
														<span className="text-white font-medium">{eta}</span>
													</div>
												)}
                                                                                        </div>
                                                                                </motion.div>
                                                                        )}
                                                                </AnimatePresence>

                                                                <div className="flex items-center justify-between text-xs text-gray-300">
                                                                        <div className="flex items-center gap-2">
                                                                                <History size={14} className="text-amber-400" />
                                                                                <span>{t('queueCount', { count: String(downloadQueue.length) })}</span>
                                                                        </div>

                                                                        <button
                                                                                onClick={() => setActivePage('queueHistory')}
                                                                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 transition"
                                                                        >
                                                                                <ClipboardList size={14} />
                                                                                <span>{t('viewQueue')}</span>
                                                                        </button>
                                                                </div>

                                                                {/* Console Toggle & Output */}
                                                                <div className="space-y-2">
									<div className="flex items-center justify-between">
										<button
											onClick={() => setShowConsole(!showConsole)}
											className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
										>
											<Terminal size={12} />
											<span>{t('consoleOutput')}</span>
											<motion.div
												animate={{ rotate: showConsole ? 180 : 0 }}
												transition={{ duration: 0.2 }}
											>
												<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<path d="M6 9l6 6 6-6" />
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
																status === 'complete' ? t('downloadCompleteMsg') :
																	status === 'downloading' ? t('downloadingMsg') :
																		status === 'cancelled' ? t('cancelledMsg') :
																			t('downloadErrorMsg')
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
															title={t('clearLogs')}
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
																<span>{t('waiting')}</span>
															</div>
														) : (
															<>
																{logs.map((log, i) => (
																	<motion.div
																		key={i}
																		initial={{ opacity: 0, y: -3 }}
																		animate={{ opacity: 1, y: 0 }}
																		transition={{ duration: 0.15, ease: "easeOut" }}
																		className="break-all border-l-2 border-transparent hover:border-white/20 pl-2 transition-colors leading-relaxed"
																	>
																		{log}
																	</motion.div>
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
                                        ) : (
                                                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-4 space-y-4">
                                                        <div className="glass rounded-3xl border border-white/10 shadow-2xl p-6 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2 text-lg font-semibold text-white">
                                                                                <ClipboardList size={20} className="text-amber-400" />
                                                                                <span>{t('queueManagerTitle')}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                                                <History size={14} className="text-amber-300" />
                                                                                <span>{t('queueCount', { count: String(downloadQueue.length) })}</span>
                                                                        </div>
                                                                </div>

                                                                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                                                                        {downloadQueue.length === 0 ? (
                                                                                <div className="flex flex-col items-center justify-center text-gray-400 py-8 gap-2">
                                                                                        <ClipboardList size={32} className="text-white/30" />
                                                                                        <span>{t('queueEmpty')}</span>
                                                                                </div>
                                                                        ) : (
                                                                                downloadQueue.map((item, index) => (
                                                                                        <div
                                                                                                key={`${item.url}-${index}`}
                                                                                                className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
                                                                                        >
                                                                                                <div className="text-xs text-gray-400 w-10 shrink-0">
                                                                                                        #{index + 1}
                                                                                                </div>
                                                                                                <div className="flex-1 min-w-0">
                                                                                                        <div className="text-sm text-white break-all font-medium">
                                                                                                                {item.url}
                                                                                                        </div>
                                                                                                        {item.subfolder && (
                                                                                                                <div className="text-xs text-gray-400 mt-1">
                                                                                                                        {t('queueSubfolder', { subfolder: item.subfolder })}
                                                                                                                </div>
                                                                                                        )}
                                                                                                </div>
                                                                                                <div className="flex items-center gap-1">
                                                                                                        <button
                                                                                                                onClick={() => handleMoveQueueItem(index, 'up')}
                                                                                                                disabled={index === 0}
                                                                                                                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                                                                                aria-label={t('moveUp')}
                                                                                                        >
                                                                                                                <ArrowUp size={16} />
                                                                                                        </button>
                                                                                                        <button
                                                                                                                onClick={() => handleMoveQueueItem(index, 'down')}
                                                                                                                disabled={index === downloadQueue.length - 1}
                                                                                                                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                                                                                aria-label={t('moveDown')}
                                                                                                        >
                                                                                                                <ArrowDown size={16} />
                                                                                                        </button>
                                                                                                        <button
                                                                                                                onClick={() => handleRemoveQueueItem(index)}
                                                                                                                className="p-2 rounded-full hover:bg-red-500/20 text-red-300 hover:text-red-200"
                                                                                                                aria-label={t('removeFromQueue')}
                                                                                                        >
                                                                                                                <Trash2 size={16} />
                                                                                                        </button>
                                                                                                </div>
                                                                                        </div>
                                                                                ))
                                                                        )}
                                                                </div>

                                                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                                                                        <button
                                                                                onClick={handleClearQueue}
                                                                                disabled={downloadQueue.length === 0}
                                                                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                                                        >
                                                                                <Trash2 size={16} />
                                                                                <span>{t('clearQueue')}</span>
                                                                        </button>

                                                                        <button
                                                                                onClick={() => setActivePage('download')}
                                                                                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/20"
                                                                        >
                                                                                {t('downloadTab')}
                                                                        </button>
                                                                </div>
                                                        </div>

                                                        <div className="glass rounded-3xl border border-white/10 shadow-2xl p-4">
                                                                <DownloadHistory
                                                                        history={downloadHistory}
                                                                        onClearHistory={handleClearHistory}
                                                                        onRemoveItem={handleRemoveHistoryItem}
                                                                />
                                                        </div>
                                                </div>
                                        )}

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
					onClearBinaryStatus={() => setBinaryStatus(null)}
					notificationsEnabled={notificationsEnabled}
					setNotificationsEnabled={setNotificationsEnabled}
				/>

			</div>
		</div>
	);
}

export default App;

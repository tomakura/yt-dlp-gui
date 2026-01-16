import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell';
import type { DownloadPayload, DownloadResult, VideoInfoResult, HwEncoderResult, BinaryUpdateProgress } from '../types/electron';

// Polyfill window.electron using Tauri APIs
export const setupTauriShim = () => {
	window.electron = {
		selectDirectory: async () => {
			return await invoke('select_directory');
		},
		openFileDialog: async () => {
			return await invoke('open_file_dialog');
		},
		getDefaultDownloadPath: async () => {
			return await invoke('get_default_download_path');
		},
		checkBinaries: async () => {
			return await invoke('check_binaries');
		},
		getBinaryVersions: async () => {
			return await invoke('get_binary_versions');
		},
		getLatestBinaryVersions: async () => {
			return await invoke('get_latest_binary_versions');
		},
		startDownload: async (payload: DownloadPayload) => {
			await invoke('start_download', { payload });
		},
		cancelDownload: async () => {
			return await invoke('cancel_download');
		},
		onDownloadProgress: (callback: (data: string) => void) => {
			const unlistenPromise = listen<string>('download-progress', (event) => {
				callback(event.payload);
			});

			// Return a cleanup function that handles the promise
			let unlisten: UnlistenFn | undefined;
			unlistenPromise.then(fn => { unlisten = fn; });

			return () => {
				if (unlisten) unlisten();
			};
		},
		onDownloadComplete: (callback: (result: DownloadResult) => void) => {
			const unlistenPromise = listen<DownloadResult>('download-complete', (event) => {
				callback(event.payload);
			});

			let unlisten: UnlistenFn | undefined;
			unlistenPromise.then(fn => { unlisten = fn; });

			return () => {
				if (unlisten) unlisten();
			};
		},
		onBinaryUpdateProgress: (callback: (data: BinaryUpdateProgress | null) => void) => {
			const unlistenPromise = listen<BinaryUpdateProgress | null>('binary-update-progress', (event) => {
				callback(event.payload);
			});

			let unlisten: UnlistenFn | undefined;
			unlistenPromise.then(fn => { unlisten = fn; });

			return () => {
				if (unlisten) unlisten();
			};
		},
		updateYtDlp: async () => {
			return await invoke('update_ytdlp');
		},
		updateFfmpeg: async () => {
			return await invoke('update_ffmpeg');
		},
		cancelBinaryDownload: async () => {
			return await invoke('cancel_binary_download');
		},
		checkAppUpdate: async () => {
			return await invoke('check_app_update');
		},
		openExternal: async (url: string) => {
			await open(url);
		},
		downloadBinaries: async () => {
			return await invoke('download_binaries');
		},
		openFolder: async (folderPath: string) => {
			await invoke('open_folder', { folderPath });
		},
		fetchVideoInfo: async (url: string) => {
			try {
				const data: any = await invoke('fetch_video_info', { url });

				// Handle error returned as object with error property (if any)
				if (data.error) {
					return { isPlaylist: false, error: data.error };
				}

				const isPlaylist = data._type === 'playlist' || data.entries?.length > 0;

				if (isPlaylist) {
					return {
						isPlaylist: true,
						playlist: {
							id: data.id,
							title: data.title,
							channel: data.uploader || data.channel || data.uploader_id,
							thumbnail: data.thumbnails?.[data.thumbnails.length - 1]?.url || data.thumbnail,
							videoCount: data.playlist_count || data.entries?.length || 0,
							entries: (data.entries || []).map((entry: any) => ({
								id: entry.id,
								title: entry.title,
								channel: entry.uploader || entry.channel || entry.uploader_id,
								thumbnail: entry.thumbnails?.[entry.thumbnails.length - 1]?.url || entry.thumbnail,
								duration: entry.duration,
								viewCount: entry.view_count,
								filesize: entry.filesize || entry.filesize_approx
							}))
						}
					};
				} else {
					return {
						isPlaylist: false,
						video: {
							id: data.id,
							title: data.title,
							channel: data.uploader || data.channel || data.uploader_id,
							channelUrl: data.channel_url || data.uploader_url,
							thumbnail: data.thumbnail || data.thumbnails?.[data.thumbnails.length - 1]?.url,
							duration: data.duration,
							viewCount: data.view_count,
							uploadDate: data.upload_date,
							description: data.description,
							filesize: data.filesize || data.filesize_approx,
							bestResolution: (data.height ? `${data.height}p` : undefined) || data.resolution || data.format_note,
							formats: (data.formats || []).map((f: any) => ({
								format_id: f.format_id,
								ext: f.ext,
								resolution: (f.height ? `${f.height}p` : undefined) || f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : undefined),
								filesize: f.filesize,
								filesize_approx: f.filesize_approx,
								vcodec: f.vcodec,
								acodec: f.acodec,
								tbr: f.tbr,
								height: f.height,
								width: f.width,
								fps: f.fps
							}))
						}
					};
				}
			} catch (e: any) {
				console.error("fetchVideoInfo error:", e);
				return { isPlaylist: false, error: e.toString() };
			}
		},
		detectHwEncoders: async () => {
			return await invoke('detect_hw_encoders');
		},
	};
};

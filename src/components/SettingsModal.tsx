import React, { useState } from 'react';
import { X, Save, FolderOpen, Plus, Trash2, Film, Music, Terminal, Palette, Layout, Monitor, HardDrive, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Preset } from '../types/Preset';

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
	onDownloadBinaries: () => void;
	binaryStatus: { message: string; type: 'info' | 'success' | 'error' } | null;
	currentTheme: any;
	setTheme: (theme: any) => void;
	themes: any;
}

type Tab = 'general' | 'appearance' | 'binaries' | 'presets';

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
	onDownloadBinaries,
	binaryStatus,
	currentTheme,
	setTheme,
	themes
}) => {
	const [newPresetName, setNewPresetName] = useState('');
	const [activeTab, setActiveTab] = useState<Tab>('general');

	const handleSave = () => {
		if (newPresetName.trim()) {
			onSavePreset(newPresetName);
			setNewPresetName('');
		}
	};

	const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
		{ id: 'general', label: '一般', icon: SettingsIcon },
		{ id: 'appearance', label: '外観', icon: Palette },
		{ id: 'binaries', label: 'バイナリ', icon: Terminal },
		{ id: 'presets', label: 'プリセット', icon: FolderOpen },
	];

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className="fixed inset-0 m-auto w-full max-w-4xl h-[80vh] bg-[#111] border border-white/10 rounded-3xl shadow-2xl z-[70] overflow-hidden flex flex-col md:flex-row"
					>
						{/* Sidebar */}
						<div className="w-full md:w-64 bg-black/20 border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-col gap-2">
							<div className="mb-6 px-2 pt-2 hidden md:block">
								<h2 className="text-xl font-bold text-white">設定</h2>
								<p className="text-xs text-gray-500">アプリケーション設定</p>
							</div>

							<div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
								{tabs.map((tab) => {
									const Icon = tab.icon;
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
													className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full hidden md:block"
												/>
											)}
										</button>
									);
								})}
							</div>
						</div>

						{/* Content Area */}
						<div className="flex-1 flex flex-col min-w-0 bg-[#111]">
							{/* Mobile Header (Close Button) */}
							<div className="p-4 border-b border-white/5 flex justify-between items-center md:hidden">
								<span className="font-bold text-white">{tabs.find(t => t.id === activeTab)?.label}</span>
								<button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10">
									<X size={20} />
								</button>
							</div>

							{/* Desktop Close Button */}
							<div className="hidden md:flex justify-end p-4 absolute top-0 right-0 z-10">
								<button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10 bg-black/20 backdrop-blur-md">
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
												<h3 className="text-lg font-semibold text-white mb-1">一般設定</h3>
												<p className="text-sm text-gray-500">基本的なアプリケーションの動作設定</p>
											</div>

											<div className="space-y-4">
												<div className="space-y-2">
													<label className="text-sm font-medium text-gray-300 flex items-center gap-2">
														<Save size={16} className="text-blue-400" />
														保存ファイル名テンプレート
													</label>
													<p className="text-xs text-gray-500">yt-dlpの出力テンプレート形式で指定してください。</p>
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
															デフォルト
														</button>
														<button
															onClick={() => setOutputTemplate('%(upload_date)s - %(title)s.%(ext)s')}
															className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-400 transition-colors"
														>
															日付 - タイトル
														</button>
														<button
															onClick={() => setOutputTemplate('%(uploader)s/%(title)s.%(ext)s')}
															className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-400 transition-colors"
														>
															投稿者フォルダ
														</button>
													</div>
												</div>
											</div>
										</div>
									)}

									{activeTab === 'appearance' && (
										<div className="space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-white mb-1">外観設定</h3>
												<p className="text-sm text-gray-500">アプリケーションのテーマと表示設定</p>
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
												<h3 className="text-lg font-semibold text-white mb-1">バイナリ管理</h3>
												<p className="text-sm text-gray-500">yt-dlp および ffmpeg の管理</p>
											</div>

											<div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-3">
														<div className={`p-3 rounded-xl ${binariesExist ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
															<Terminal size={24} />
														</div>
														<div>
															<div className="text-sm font-medium text-gray-200">ステータス</div>
															<div className={`text-xs ${binariesExist ? 'text-green-400' : 'text-red-400'}`}>
																{binariesExist === null ? '確認中...' : binariesExist ? 'インストール済み' : '未検出'}
															</div>
														</div>
													</div>
												</div>

												<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
													{binariesExist ? (
														<>
															<button
																onClick={onUpdateBinaries}
																disabled={!!binaryStatus}
																className="px-4 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium transition-colors border border-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
															>
																<Terminal size={16} />
																yt-dlpを更新
															</button>
															<button
																onClick={onUpdateFfmpeg}
																disabled={!!binaryStatus}
																className="px-4 py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm font-medium transition-colors border border-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
															>
																<Film size={16} />
																ffmpegを更新
															</button>
														</>
													) : (
														<button
															onClick={onDownloadBinaries}
															disabled={!!binaryStatus}
															className="col-span-2 px-4 py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium transition-colors border border-green-500/20 animate-pulse disabled:animate-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
														>
															<Download size={16} />
															バイナリを自動ダウンロード
														</button>
													)}
												</div>

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
												<h3 className="text-lg font-semibold text-white mb-1">プリセット管理</h3>
												<p className="text-sm text-gray-500">よく使う設定を保存・読み込み</p>
											</div>

											<div className="flex gap-2">
												<input
													type="text"
													value={newPresetName}
													onChange={(e) => setNewPresetName(e.target.value)}
													placeholder="プリセット名 (例: 高画質保存)"
													className="flex-1 glass-input rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none"
												/>
												<button
													onClick={handleSave}
													disabled={!newPresetName.trim()}
													className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
												>
													<Plus size={16} />
													保存
												</button>
											</div>

											<div className="space-y-3">
												{presets.length === 0 ? (
													<div className="text-center py-12 text-gray-600 text-sm border border-dashed border-white/10 rounded-2xl">
														<FolderOpen size={32} className="mx-auto mb-3 opacity-50" />
														プリセットがありません
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
																			<span>{preset.format.type === 'video' ? '動画' : '音声'}</span>
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
								</motion.div>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};

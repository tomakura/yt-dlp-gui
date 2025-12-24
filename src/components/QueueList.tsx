import React from 'react';
import { X, Play, Trash2, GripVertical, ListVideo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../i18n';

interface QueueListProps {
	queue: { url: string; subfolder?: string }[];
	onRemove: (index: number) => void;
	onMove: (index: number, direction: 'up' | 'down') => void;
	onClear: () => void;
	onClose: () => void;
	isDownloading: boolean;
}

export const QueueList: React.FC<QueueListProps> = ({
	queue,
	onRemove,
	onMove,
	onClear,
	onClose,
	isDownloading
}) => {
	const { t } = useI18n();

	return (
		<motion.div
			initial={{ opacity: 0, y: 10, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 10, scale: 0.95 }}
			className="absolute bottom-16 right-4 w-80 max-h-[400px] flex flex-col glass rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
		>
			<div className="flex items-center justify-between p-3 border-b border-white/5 bg-[#0b0b0b]/50 backdrop-blur-md">
				<div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
					<ListVideo size={14} className="text-blue-400" />
					{t('downloadQueue')}
					<span className="text-[10px] text-gray-500 font-normal">({queue.length})</span>
				</div>
				<div className="flex items-center gap-1">
					{queue.length > 0 && (
						<button
							onClick={onClear}
							disabled={isDownloading}
							className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
							title={t('clearQueue')}
						>
							<Trash2 size={12} />
						</button>
					)}
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
					>
						<X size={14} />
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 bg-[#050505]/80">
				<AnimatePresence>
					{queue.length === 0 ? (
						<div className="text-center py-8 text-gray-600 text-xs">
							{t('queueEmpty')}
						</div>
					) : (
						queue.map((item, index) => (
							<motion.div
								key={`${item.url}-${index}`}
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="group relative bg-white/5 rounded-xl p-2.5 border border-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
							>
								<div className="flex flex-col gap-0.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
									<button
										onClick={() => onMove(index, 'up')}
										disabled={index === 0 || isDownloading}
										className="hover:text-blue-400 disabled:opacity-30"
									>
										<GripVertical size={10} className="rotate-90" />
									</button>
									<button
										onClick={() => onMove(index, 'down')}
										disabled={index === queue.length - 1 || isDownloading}
										className="hover:text-blue-400 disabled:opacity-30"
									>
										<GripVertical size={10} className="rotate-90" />
									</button>
								</div>

								<div className="flex-1 min-w-0">
									<div className="text-[10px] text-gray-300 truncate font-medium" title={item.url}>
										{item.url}
									</div>
									{item.subfolder && (
										<div className="text-[9px] text-gray-600 truncate">
											📂 {item.subfolder}
										</div>
									)}
								</div>

								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<button
										onClick={() => onRemove(index)}
										disabled={isDownloading}
										className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
									>
										<Trash2 size={10} />
									</button>
								</div>
							</motion.div>
						))
					)}
				</AnimatePresence>
			</div>

			{queue.length > 0 && !isDownloading && (
				<div className="p-2 border-t border-white/5 bg-[#0b0b0b]/50 backdrop-blur-md">
					<div className="text-[10px] text-center text-blue-400/80">
						{t('queueReady')}
					</div>
				</div>
			)}
		</motion.div>
	);
};

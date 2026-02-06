"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueList = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var framer_motion_1 = require("framer-motion");
var i18n_1 = require("../i18n");
var QueueList = function (_a) {
    var queue = _a.queue, onRemove = _a.onRemove, onMove = _a.onMove, onClear = _a.onClear, onClose = _a.onClose, isDownloading = _a.isDownloading;
    var t = (0, i18n_1.useI18n)().t;
    return (<framer_motion_1.motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-16 right-4 w-80 max-h-[400px] flex flex-col glass rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden">
			<div className="flex items-center justify-between p-3 border-b border-white/5 bg-[#0b0b0b]/50 backdrop-blur-md">
				<div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
					<lucide_react_1.ListVideo size={14} className="text-blue-400"/>
					{t('downloadQueue')}
					<span className="text-[10px] text-gray-500 font-normal">({queue.length})</span>
				</div>
				<div className="flex items-center gap-1">
					{queue.length > 0 && (<button onClick={onClear} disabled={isDownloading} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50" title={t('clearQueue')}>
							<lucide_react_1.Trash2 size={12}/>
						</button>)}
					<button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
						<lucide_react_1.X size={14}/>
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 bg-[#050505]/80">
				<framer_motion_1.AnimatePresence>
					{queue.length === 0 ? (<div className="text-center py-8 text-gray-600 text-xs">
							{t('queueEmpty')}
						</div>) : (queue.map(function (item, index) { return (<framer_motion_1.motion.div key={"".concat(item.url, "-").concat(index)} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="group relative bg-white/5 rounded-xl p-2.5 border border-white/5 hover:bg-white/10 transition-colors flex items-center gap-2">
								<div className="flex flex-col gap-0.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
									<button onClick={function () { return onMove(index, 'up'); }} disabled={index === 0 || isDownloading} className="hover:text-blue-400 disabled:opacity-30">
										<lucide_react_1.GripVertical size={10} className="rotate-90"/>
									</button>
									<button onClick={function () { return onMove(index, 'down'); }} disabled={index === queue.length - 1 || isDownloading} className="hover:text-blue-400 disabled:opacity-30">
										<lucide_react_1.GripVertical size={10} className="rotate-90"/>
									</button>
								</div>

								<div className="flex-1 min-w-0">
									<div className="text-[10px] text-gray-300 truncate font-medium" title={item.url}>
										{item.url}
									</div>
									{item.subfolder && (<div className="text-[9px] text-gray-600 truncate">
											📂 {item.subfolder}
										</div>)}
								</div>

								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<button onClick={function () { return onRemove(index); }} disabled={isDownloading} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50">
										<lucide_react_1.Trash2 size={10}/>
									</button>
								</div>
							</framer_motion_1.motion.div>); }))}
				</framer_motion_1.AnimatePresence>
			</div>

			{queue.length > 0 && !isDownloading && (<div className="p-2 border-t border-white/5 bg-[#0b0b0b]/50 backdrop-blur-md">
					<div className="text-[10px] text-center text-blue-400/80">
						{t('queueReady')}
					</div>
				</div>)}
		</framer_motion_1.motion.div>);
};
exports.QueueList = QueueList;

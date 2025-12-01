import React from 'react';
import { History, Folder, Trash2, ExternalLink, Clock, HardDrive, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DownloadHistoryItem } from '../types/options';

interface DownloadHistoryProps {
  history: DownloadHistoryItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  history,
  onClearHistory,
  onRemoveItem
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '不明';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨日';
    } else if (days < 7) {
      return `${days}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  const openFolder = (filepath: string) => {
    // Extract directory from filepath
    const dir = filepath.substring(0, filepath.lastIndexOf('/')) || filepath;
    window.electron.openFolder(dir);
  };

  const getFolderName = (path: string) => {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  };

  if (history.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <History size={16} className="text-blue-400" />
          ダウンロード履歴
        </div>
        <div className="text-center py-8 text-gray-600 text-xs border border-dashed border-white/10 rounded-xl">
          <History size={24} className="mx-auto mb-2 opacity-50" />
          履歴はありません
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <History size={16} className="text-blue-400" />
          ダウンロード履歴
          <span className="text-[10px] text-gray-500 font-normal">({history.length}件)</span>
        </div>
        <button
          onClick={onClearHistory}
          className="text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
        >
          <Trash2 size={12} />
          すべて削除
        </button>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {history.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="group bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.success ? (
                      <CheckCircle size={12} className="text-green-400 shrink-0" />
                    ) : (
                      <XCircle size={12} className="text-red-400 shrink-0" />
                    )}
                    <span className="text-xs text-gray-200 truncate font-medium">
                      {item.title || 'タイトル不明'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(item.timestamp)}
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive size={10} />
                      {formatFileSize(item.fileSize)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Folder size={10} />
                      <span className="truncate max-w-[120px]" title={item.location}>
                        {getFolderName(item.location)}
                      </span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                      item.format === 'video' 
                        ? 'bg-purple-500/20 text-purple-300' 
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {item.format === 'video' ? '動画' : '音声'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.filename && item.success && (
                    <button
                      onClick={() => openFolder(item.filename)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-colors"
                      title="フォルダを開く"
                    >
                      <ExternalLink size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                    title="履歴から削除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

import React from 'react';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

export type Status = 'idle' | 'downloading' | 'complete' | 'error' | 'cancelled';

interface StatusToastProps {
  status: Status;
  message: string;
  onClose: () => void;
}

export const StatusToast: React.FC<StatusToastProps> = ({ status, message, onClose }) => {
  if (status === 'idle') return null;

  const tone =
    status === 'complete'
      ? { color: 'text-green-300', bg: 'bg-green-500/10', border: 'border-green-500/20', Icon: CheckCircle2 }
      : status === 'downloading'
        ? { color: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/20', Icon: Loader2 }
        : status === 'cancelled'
          ? { color: 'text-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', Icon: AlertCircle }
          : { color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20', Icon: XCircle };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${tone.bg} ${tone.border} ${tone.color} text-xs`}>
      <tone.Icon size={16} className={status === 'downloading' ? 'animate-spin' : ''} />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
        ✕
      </button>
    </div>
  );
};

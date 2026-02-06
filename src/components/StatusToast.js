"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusToast = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var framer_motion_1 = require("framer-motion");
var StatusToast = function (_a) {
    var status = _a.status, message = _a.message, onClose = _a.onClose;
    if (status === 'idle')
        return null;
    var tone = status === 'complete'
        ? { color: 'text-green-300', bg: 'bg-green-500/10', border: 'border-green-500/20', Icon: lucide_react_1.CheckCircle2 }
        : status === 'downloading'
            ? { color: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/20', Icon: lucide_react_1.Loader2 }
            : status === 'cancelled'
                ? { color: 'text-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', Icon: lucide_react_1.AlertCircle }
                : { color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20', Icon: lucide_react_1.XCircle };
    return (<framer_motion_1.motion.div key={message} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className={"flex items-center gap-2 px-3 py-2 rounded-xl border ".concat(tone.bg, " ").concat(tone.border, " ").concat(tone.color, " text-xs")}>
      <tone.Icon size={16} className={status === 'downloading' ? 'animate-spin' : ''}/>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
        ✕
      </button>
    </framer_motion_1.motion.div>);
};
exports.StatusToast = StatusToast;

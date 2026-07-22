"use client";

import { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

// Drop-in replacement for alert() — same "tell the user something went
// wrong and they need to notice it" job, but as an inline notification
// instead of a blocking native browser dialog. Auto-dismisses on its own
// after a few seconds, and can also be dismissed manually.
export default function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-start gap-3 bg-slate-900 text-white px-4 py-3.5 rounded-2xl shadow-xl">
        <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
        <p className="text-sm leading-snug flex-1">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-slate-400 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
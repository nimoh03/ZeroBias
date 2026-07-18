"use client";

import { useState, useTransition } from "react";
import { PauseCircle, PlayCircle, Loader2 } from "lucide-react";
import { setJobStatusAction } from "./[id]/edit/action";

export default function JobStatusToggle({ jobId, status }: { jobId: string; status: "active" | "paused" }) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const next = current === "paused" ? "active" : "paused";
    startTransition(async () => {
      try {
        await setJobStatusAction(jobId, next);
        setCurrent(next);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title={current === "paused" ? "Resume — start accepting applications again" : "Pause — stop accepting new applications"}
      className={`px-4 py-2.5 text-sm font-bold rounded-xl border transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 ${
        current === "paused"
          ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-amber-700"
      }`}
    >
      {isPending ? <Loader2 size={16} className="animate-spin" /> : current === "paused" ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
      {current === "paused" ? "Resume" : "Pause"}
    </button>
  );
}

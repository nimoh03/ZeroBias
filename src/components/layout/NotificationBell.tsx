"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X, AlertTriangle, Ban, CalendarClock } from "lucide-react";
import Link from "next/link";

type Props = {
  pendingInterviews: number;
  quota: {
    completed: number;
    limit: number;
    remaining: number;
    isOverLimit: boolean;
    isNearLimit: boolean;
    resetsOn: string;
  };
  recruiterId: string;
};

// Dismissal is scoped to the calendar month (via the key below), not
// permanent — so if a recruiter dismisses the 80% warning this month,
// it naturally comes back if they cross 80% again next month, rather
// than being silenced forever after the first dismiss.
function dismissKey(recruiterId: string) {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}`;
  return `zerobias_quota_warning_dismissed:${recruiterId}:${monthKey}`;
}

export default function NotificationBell({ pendingInterviews, quota, recruiterId }: Props) {
  const [open, setOpen] = useState(false);
  const [nearLimitDismissed, setNearLimitDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setNearLimitDismissed(localStorage.getItem(dismissKey(recruiterId)) === "1");
    } catch {
      // localStorage unavailable (private browsing, etc.) — just don't
      // persist dismissal; the warning will simply reappear next load,
      // which is a safe default (over-showing, not under-showing).
    }
  }, [recruiterId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showNearLimitWarning = quota.isNearLimit && !nearLimitDismissed;
  // The over-limit message is never dismissible — it reflects an active,
  // ongoing blocked state (new screenings genuinely aren't starting),
  // not a one-time heads-up, so it should keep showing until it's no
  // longer true.
  const showOverLimitWarning = quota.isOverLimit;

  const badgeCount = pendingInterviews + (showNearLimitWarning || showOverLimitWarning ? 1 : 0);

  function dismissNearLimit() {
    try {
      localStorage.setItem(dismissKey(recruiterId), "1");
    } catch {
      // Best-effort only — see note above.
    }
    setNearLimitDismissed(true);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {badgeCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {showOverLimitWarning && (
              <div className="p-4 bg-red-50/50 flex gap-3">
                <Ban size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">Monthly screening limit reached</p>
                  <p className="text-xs text-slate-600 mt-1">
                    New candidate screenings are paused until {quota.resetsOn}. In-progress conversations aren't affected.
                  </p>
                  <Link href="/settings" className="text-xs font-bold text-primary mt-2 inline-block hover:underline">
                    View usage →
                  </Link>
                </div>
              </div>
            )}

            {showNearLimitWarning && (
              <div className="p-4 bg-amber-50/50 flex gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">Approaching your monthly limit</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {quota.completed} of {quota.limit} screenings used this month — {quota.remaining} remaining.
                  </p>
                  <Link href="/settings" className="text-xs font-bold text-primary mt-2 inline-block hover:underline">
                    View usage →
                  </Link>
                </div>
                <button
                  onClick={dismissNearLimit}
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                  title="Dismiss for this month"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <Link href="/candidates" className="p-4 flex gap-3 hover:bg-slate-50 transition-colors">
              <CalendarClock size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  {pendingInterviews > 0
                    ? `${pendingInterviews} interview${pendingInterviews === 1 ? "" : "s"} coming up`
                    : "No upcoming interviews"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Starting within 24 hours</p>
              </div>
            </Link>

            {!showOverLimitWarning && !showNearLimitWarning && pendingInterviews === 0 && (
              <p className="p-6 text-center text-sm text-slate-400">You're all caught up.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
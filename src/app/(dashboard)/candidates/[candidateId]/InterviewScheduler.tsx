"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Link2, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export type SlotRow = { time: string; link: string };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

function formatSlotLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

/** Small self-contained month-grid calendar, styled to feel like a modern
 * design-system date picker (rounded card, pill-selected day, soft states)
 * rather than a native browser input. */
function MiniCalendar({ value, onSelect }: { value: Date | null; onSelect: (d: Date) => void }) {
  const [viewDate, setViewDate] = useState(value || new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="w-64 select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-bold text-slate-800">{MONTH_NAMES[month]} {year}</p>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 mb-1">
        {DAY_NAMES.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isPast = d < today;
          const isSelected = !!value && d.toDateString() === value.toDateString();
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div key={i} className="flex items-center justify-center">
              <button
                type="button"
                disabled={isPast}
                onClick={() => onSelect(d)}
                className={`h-8 w-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all
                  ${isSelected ? "bg-primary text-white shadow-sm shadow-primary/30" : isPast ? "text-slate-300 cursor-not-allowed" : "text-slate-700 hover:bg-primary/10 hover:text-primary"}
                  ${isToday && !isSelected ? "ring-1 ring-inset ring-primary/40" : ""}
                `}
              >
                {d.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Lets a recruiter offer one or more real interview times, all sharing a
 * single meeting link by default ("Use the same link for every time") or
 * each with its own. Reports a normalized {time (ISO), link}[] back to the
 * parent on every change via onChange. Times are picked from a small
 * calendar + time popover rather than the native browser datetime input.
 */
export default function InterviewSlotsEditor({
  initialSlots = [],
  onChange,
}: {
  initialSlots?: SlotRow[];
  onChange: (slots: SlotRow[]) => void;
}) {
  const [rows, setRows] = useState<SlotRow[]>(initialSlots);
  const [sameLink, setSameLink] = useState(true);
  const [sharedLink, setSharedLink] = useState(initialSlots[0]?.link || "");

  const [open, setOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [pendingTime, setPendingTime] = useState("09:00");
  const [pendingLink, setPendingLink] = useState("");

  const wrapRef = useRef<HTMLDivElement>(null);
  const didMount = useRef(false);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    onChange(rows.filter(r => r.time && r.link));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sameLink, sharedLink]);

  const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx));

  const handleAdd = () => {
    if (!pendingDate) return;
    const link = (sameLink ? sharedLink : pendingLink).trim();
    if (!link) return;
    const [hh, mm] = pendingTime.split(":").map(Number);
    const combined = new Date(pendingDate);
    combined.setHours(hh || 0, mm || 0, 0, 0);
    setRows(r => [...r, { time: combined.toISOString(), link }]);
    setPendingDate(null);
    setPendingTime("09:00");
    setPendingLink("");
    setOpen(false);
  };

  const sorted = [...rows].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const canAdd = !!pendingDate && (sameLink ? !!sharedLink.trim() : !!pendingLink.trim());

  return (
    <div className="space-y-4" ref={wrapRef}>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <input
          type="checkbox"
          checked={sameLink}
          onChange={(e) => setSameLink(e.target.checked)}
          className="accent-primary"
        />
        Use the same meeting link for every time
      </label>

      {sameLink && (
        <div className="flex items-center gap-2">
          <Link2 size={14} className="text-slate-400 shrink-0" />
          <input
            type="url"
            placeholder="https://meet.google.com/... or Zoom/Calendly link"
            value={sharedLink}
            onChange={(e) => setSharedLink(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      )}

      {sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((row) => {
            const originalIdx = rows.indexOf(row);
            return (
              <div
                key={`${row.time}-${originalIdx}`}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <CalendarIcon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{formatSlotLabel(row.time)}</p>
                    {!sameLink && <p className="text-xs text-slate-400 truncate">{row.link}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(originalIdx)}
                  className="text-slate-400 hover:text-red-500 shrink-0 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 text-xs font-bold text-primary px-3 py-2 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Plus size={14} /> Schedule another time
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-4 animate-in fade-in zoom-in-95 duration-150">
            <MiniCalendar value={pendingDate} onSelect={setPendingDate} />
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <input
                  type="time"
                  value={pendingTime}
                  onChange={(e) => setPendingTime(e.target.value)}
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              {!sameLink && (
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="url"
                    placeholder="Meeting link for this time"
                    value={pendingLink}
                    onChange={(e) => setPendingLink(e.target.value)}
                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!canAdd}
                  className="px-4 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add time
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400">
        Every candidate who qualifies is offered this same list of times and picks whichever works for them. This isn't shared availability across candidates — if two people pick the same slot you'll see both on their candidate pages, so double-check before confirming either.
      </p>
    </div>
  );
}
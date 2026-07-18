"use client";

import { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Plus, Trash2, Link2, Calendar as CalendarIcon, Clock } from "lucide-react";

export type SlotRow = { time: string; link: string };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalInputValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseLocalValue(value: string): Date | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart) return null;
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart || "00:00").split(":").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, hh || 0, mm || 0);
}

function toLocalValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplay(value: string) {
  const d = parseLocalValue(value);
  if (!d) return "";
  const dateStr = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timeStr = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr}, ${timeStr}`;
}

/**
 * A self-contained, dependency-free date + time picker styled to match the
 * antd design language: a floating rounded card, a month grid with a
 * circular primary-colored selection, and scrollable hour/minute columns.
 */
function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const initial = parseLocalValue(value) || new Date();
  const [draft, setDraft] = useState<Date>(initial);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const d = parseLocalValue(value) || new Date();
    setDraft(d);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    hourListRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "center" });
    minuteListRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pickDay = (d: Date | undefined) => {
    if (!d) return;
    const next = new Date(d);
    next.setHours(draft.getHours(), draft.getMinutes(), 0, 0);
    setDraft(next);
  };
  const pickHour = (h: number) => {
    const next = new Date(draft);
    next.setHours(h);
    setDraft(next);
  };
  const pickMinute = (m: number) => {
    const next = new Date(draft);
    next.setMinutes(m);
    setDraft(next);
  };

  const confirm = () => {
    onChange(toLocalValue(draft));
    setOpen(false);
  };
  const goNow = () => {
    setDraft(new Date());
  };

  return (
    <div className="relative flex-1" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border bg-white outline-none transition-all text-left ${
          open ? "border-primary ring-2 ring-primary/20" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <CalendarIcon size={15} className="text-slate-400 shrink-0" />
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 left-0 w-[300px] bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-900/10 overflow-hidden animate-in fade-in slide-in-from-top-1">
          <div className="px-2 pt-2">
            <DayPicker
              mode="single"
              selected={draft}
              onSelect={pickDay}
              disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
              showOutsideDays
              classNames={{
                months: "flex",
                month: "space-y-2",
                month_caption: "flex justify-center items-center h-9 px-2 text-sm font-bold text-slate-800",
                nav: "flex items-center justify-between absolute inset-x-2 top-1.5",
                button_previous: "p-1 rounded-md hover:bg-slate-100 text-slate-500 transition-colors",
                button_next: "p-1 rounded-md hover:bg-slate-100 text-slate-500 transition-colors",
                weekdays: "flex",
                weekday: "text-[11px] font-semibold text-slate-400 w-9 h-7 flex items-center justify-center",
                week: "flex",
                day: "w-9 h-9 flex items-center justify-center p-0",
                day_button: "w-8 h-8 text-xs rounded-full text-slate-700 hover:bg-slate-100 transition-colors",
                selected: "[&>button]:bg-primary [&>button]:text-white [&>button]:font-bold [&>button]:hover:bg-primary",
                today: "[&>button]:border [&>button]:border-primary/50 [&>button]:text-primary [&>button]:font-semibold",
                outside: "[&>button]:text-slate-300",
                disabled: "[&>button]:text-slate-200 [&>button]:hover:bg-transparent [&>button]:cursor-not-allowed",
              }}
            />
          </div>

          <div className="border-t border-slate-100 flex">
            <div className="flex-1 border-r border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 text-center pt-1.5">Hour</p>
              <div ref={hourListRef} className="h-32 overflow-y-auto scroll-smooth px-1 py-1">
                {Array.from({ length: 24 }, (_, h) => (
                  <button
                    key={h}
                    type="button"
                    data-active={draft.getHours() === h}
                    onClick={() => pickHour(h)}
                    className={`w-full text-center text-xs py-1.5 rounded-md transition-colors ${
                      draft.getHours() === h ? "bg-primary/10 text-primary font-bold" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pad(h)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-slate-400 text-center pt-1.5">Minute</p>
              <div ref={minuteListRef} className="h-32 overflow-y-auto scroll-smooth px-1 py-1">
                {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                  <button
                    key={m}
                    type="button"
                    data-active={draft.getMinutes() === m}
                    onClick={() => pickMinute(m)}
                    className={`w-full text-center text-xs py-1.5 rounded-md transition-colors ${
                      draft.getMinutes() === m ? "bg-primary/10 text-primary font-bold" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pad(m)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100">
            <button type="button" onClick={goNow} className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors">
              Now
            </button>
            <button type="button" onClick={confirm} className="text-xs font-bold bg-primary text-white px-3.5 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * "Schedule" — lets a recruiter offer one or more real interview times,
 * all sharing one meeting link. Nova hands this list to each qualified
 * candidate and they pick whichever works for them. Reports a normalized
 * list of {time, link} back to the parent on every change via onChange.
 */
export default function InterviewSlotsEditor({
  initialSlots = [],
  onChange,
}: {
  initialSlots?: SlotRow[];
  onChange: (slots: SlotRow[]) => void;
}) {
  const [rows, setRows] = useState<{ time: string }[]>(
    initialSlots.length > 0
      ? initialSlots.map(s => ({ time: toLocalInputValue(s.time) }))
      : [{ time: "" }]
  );
  const [link, setLink] = useState(initialSlots[0]?.link || "");

  const didMount = useRef(false);

  const addRow = () => setRows(r => [...r, { time: "" }]);
  const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx));
  const updateRow = (idx: number, value: string) =>
    setRows(r => r.map((row, i) => (i === idx ? { time: value } : row)));

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const normalized = rows
      .filter(r => r.time && link.trim())
      .map(r => ({ time: r.time, link: link.trim() }));
    onChange(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, link]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 size={14} className="text-slate-400 shrink-0" />
        <input
          type="url"
          placeholder="Meeting link — https://meet.google.com/... or Zoom/Calendly"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Clock size={14} className="text-slate-300 shrink-0 hidden sm:block" />
            <DateTimePicker value={row.time} onChange={(v) => updateRow(idx, v)} />
            {rows.length > 1 && (
              <button type="button" onClick={() => removeRow(idx)} className="text-slate-400 hover:text-red-500 shrink-0 transition-colors">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs font-bold text-primary"
      >
        <Plus size={14} /> Add another time
      </button>

      <p className="text-[11px] text-slate-400">
        Every candidate who qualifies is offered this same list of times and picks whichever works for them. This isn't shared availability across candidates — if two people pick the same slot you'll see both on their candidate pages, so double-check before confirming either.
      </p>
    </div>
  );
}
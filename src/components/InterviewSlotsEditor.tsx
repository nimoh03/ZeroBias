"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Link2 } from "lucide-react";

export type SlotRow = { time: string; link: string };

// Turns an ISO timestamp into the value a <input type="datetime-local">
// expects. Only used to hydrate existing rows (e.g. editing a job that
// already has a template) — new rows just start blank.
function toLocalInputValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // already a local-input-shaped string
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Lets a recruiter offer one or more interview times, all sharing a single
 * meeting link by default ("Use the same link for every time") or each
 * with its own. Reports a normalized, de-duped list of {time, link} back
 * to the parent on every change via onChange — the parent decides what to
 * do with it (save straight to a job's default template, or to a specific
 * candidate). Whenever a candidate later picks one of these times, that's
 * final for them — this component only ever edits the *offered* set.
 */
export default function InterviewSlotsEditor({
  initialSlots = [],
  onChange,
}: {
  initialSlots?: SlotRow[];
  onChange: (slots: SlotRow[]) => void;
}) {
  const [rows, setRows] = useState<SlotRow[]>(
    initialSlots.length > 0
      ? initialSlots.map(s => ({ time: toLocalInputValue(s.time), link: s.link }))
      : [{ time: "", link: "" }]
  );
  const [sameLink, setSameLink] = useState(true);
  const [sharedLink, setSharedLink] = useState(initialSlots[0]?.link || "");

  // Avoid firing onChange on the very first render with the exact same
  // value the parent already has — only report actual edits.
  const didMount = useRef(false);

  const addRow = () => setRows(r => [...r, { time: "", link: sameLink ? sharedLink : "" }]);
  const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: keyof SlotRow, value: string) =>
    setRows(r => r.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const normalized = rows
      .filter(r => r.time && (sameLink ? sharedLink.trim() : r.link.trim()))
      .map(r => ({ time: r.time, link: (sameLink ? sharedLink : r.link).trim() }));
    onChange(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sameLink, sharedLink]);

  return (
    <div className="space-y-3">
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
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      )}

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={row.time}
              onChange={(e) => updateRow(idx, "time", e.target.value)}
              className="flex-1 text-sm px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            {!sameLink && (
              <input
                type="url"
                placeholder="Meeting link for this time"
                value={row.link}
                onChange={(e) => updateRow(idx, "link", e.target.value)}
                className="flex-1 text-sm px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            )}
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
        <Plus size={14} /> Schedule another time
      </button>

      <p className="text-[11px] text-slate-400">
        Every candidate who qualifies is offered this same list of times and picks whichever works for them. This isn't shared availability across candidates — if two people pick the same slot you'll see both on their candidate pages, so double-check before confirming either.
      </p>
    </div>
  );
}

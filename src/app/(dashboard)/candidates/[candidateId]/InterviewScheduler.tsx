"use client";

import { useState } from "react";
import { CalendarClock, Plus, Trash2, Loader2, Link2 } from "lucide-react";
import { setInterviewSlots, clearInterviewSlots } from "./action";

type Slot = { id: string; time: string; link: string };
type Row = { time: string; link: string };

export default function InterviewScheduler({
  candidateId,
  existingSlots,
  selectedSlot,
}: {
  candidateId: string;
  existingSlots: Slot[];
  selectedSlot: Slot | null;
}) {
  const [rows, setRows] = useState<Row[]>(
    existingSlots.length > 0
      ? existingSlots.map(s => ({ time: toLocalInputValue(s.time), link: s.link }))
      : [{ time: "", link: "" }]
  );
  const [sameLink, setSameLink] = useState(true);
  const [sharedLink, setSharedLink] = useState(existingSlots[0]?.link || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toLocalInputValue(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const addRow = () => setRows(r => [...r, { time: "", link: sameLink ? sharedLink : "" }]);
  const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: keyof Row, value: string) =>
    setRows(r => r.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));

  const handleSave = async () => {
    setError(null);
    const payload = rows
      .filter(r => r.time)
      .map(r => ({ time: r.time, link: sameLink ? sharedLink : r.link }));

    if (payload.length === 0 || (sameLink && !sharedLink.trim())) {
      setError("Add at least one time, and a meeting link.");
      return;
    }
    if (!sameLink && payload.some(p => !p.link.trim())) {
      setError("Every slot needs its own link, or turn on \"same link for all\".");
      return;
    }

    setIsSaving(true);
    try {
      await setInterviewSlots(candidateId, payload);
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      await clearInterviewSlots(candidateId);
      setRows([{ time: "", link: "" }]);
      setSharedLink("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-on-surface">Schedule Interview</h3>
      </div>

      {selectedSlot && (
        <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-on-surface">
          <span className="font-bold">Candidate booked: </span>
          {new Date(selectedSlot.time).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
      )}

      <label className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-3">
        <input
          type="checkbox"
          checked={sameLink}
          onChange={(e) => setSameLink(e.target.checked)}
        />
        Use the same meeting link for every time
      </label>

      {sameLink && (
        <div className="mb-3 flex items-center gap-2">
          <Link2 size={14} className="text-on-surface-variant shrink-0" />
          <input
            type="url"
            placeholder="https://meet.google.com/..."
            value={sharedLink}
            onChange={(e) => setSharedLink(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
          />
        </div>
      )}

      <div className="space-y-2 mb-3">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={row.time}
              onChange={(e) => updateRow(idx, "time", e.target.value)}
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
            />
            {!sameLink && (
              <input
                type="url"
                placeholder="Meeting link"
                value={row.link}
                onChange={(e) => updateRow(idx, "link", e.target.value)}
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
              />
            )}
            {rows.length > 1 && (
              <button type="button" onClick={() => removeRow(idx)} className="text-on-surface-variant hover:text-error shrink-0">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs font-bold text-primary mb-4"
      >
        <Plus size={14} /> Add another time
      </button>

      {error && <p className="text-xs text-error mb-3">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
          {existingSlots.length > 0 ? "Update times" : "Send times to candidate"}
        </button>
        {existingSlots.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isSaving}
            className="py-2.5 px-4 border border-outline-variant text-on-surface-variant rounded-xl text-sm font-bold hover:bg-surface-container-high transition-all disabled:opacity-60"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
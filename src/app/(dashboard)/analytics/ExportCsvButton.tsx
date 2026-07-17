"use client";

import { Download } from "lucide-react";

type Row = {
  name: string | null;
  email: string | null;
  job: string;
  status: string;
  score: number | null;
  source: string;
  created_at: string;
};

function csvValue(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export default function ExportCsvButton({ rows }: { rows: Row[] }) {
  const handleExport = () => {
    const header = ["Name", "Email", "Job", "Status", "Score", "Source", "Applied On"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          csvValue(r.name || "Anonymous"),
          csvValue(r.email || ""),
          csvValue(r.job),
          csvValue(r.status),
          csvValue(r.score ?? ""),
          csvValue(r.source),
          csvValue(new Date(r.created_at).toLocaleDateString()),
        ].join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidates-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={rows.length === 0}
      className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download size={16} /> Export CSV
    </button>
  );
}
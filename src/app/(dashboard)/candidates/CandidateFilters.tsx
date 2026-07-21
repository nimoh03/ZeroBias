"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Search, Filter, Briefcase } from "lucide-react";

// Replaces a plain <form method="GET"> — that caused a full native
// browser page reload (white flash, lost scroll position) on every
// search keystroke-then-enter or filter change, since a native GET
// submit is a real navigation, not a Next.js soft one. This does the
// same job (URL carries q/status/job so the server component still
// reads searchParams normally) but via router.push, which is a
// client-side transition — no reload, no flash.
export default function CandidateFilters({
  q,
  status,
  job,
  statusOptions,
  jobOptions,
}: {
  q?: string;
  status?: string;
  job?: string;
  statusOptions: { value: string; label: string }[];
  jobOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(q || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function navigate(next: { q?: string; status?: string; job?: string }) {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.status && next.status !== "all") sp.set("status", next.status);
    if (next.job && next.job !== "all") sp.set("job", next.job);
    const qs = sp.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    // Debounce so it doesn't navigate on every single keystroke — waits
    // for a brief pause in typing before updating the URL/results.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ q: value, status, job });
    }, 400);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-6 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center gap-3 shadow-sm">
        <Search className="text-outline shrink-0" size={20} />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name or job title..."
          className="bg-transparent border-none focus:ring-0 w-full text-sm outline-none placeholder:text-outline text-on-surface"
        />
      </div>
      <div className="md:col-span-3 relative">
        <select
          defaultValue={status || "all"}
          onChange={(e) => navigate({ q: searchValue, status: e.target.value, job })}
          className="w-full h-full bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm text-sm font-medium text-on-surface-variant cursor-pointer appearance-none hover:border-primary transition-colors outline-none pl-11"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none" size={18} />
      </div>
      <div className="md:col-span-3 relative">
        <select
          defaultValue={job || "all"}
          onChange={(e) => navigate({ q: searchValue, status, job: e.target.value })}
          className="w-full h-full bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm text-sm font-medium text-on-surface-variant cursor-pointer appearance-none hover:border-primary transition-colors outline-none pl-11"
        >
          {jobOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none" size={18} />
      </div>
    </div>
  );
}
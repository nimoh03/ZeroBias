import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
  Users, CheckCircle2, TrendingUp, Target,
  Briefcase, Radio, ArrowRight,
} from "lucide-react";
import ExportCsvButton from "./ExportCsvButton";

const PLATFORM_LABELS: Record<string, string> = {
  direct: "Direct / Unspecified",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
};

function platformLabel(key: string) {
  if (PLATFORM_LABELS[key]) return PLATFORM_LABELS[key];
  return key.split("-").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("recruiter_id", user?.id);

  const jobIds = jobs?.map(j => j.id) || [];

  let candidates: any[] = [];
  if (jobIds.length > 0) {
    const { data } = await supabase
      .from("candidates")
      .select("*, jobs(title)")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });
    candidates = data || [];
  }

  const totalCandidates = candidates.length;
  const qualified = candidates.filter(c => c.status === "qualified").length;
  const rejected = candidates.filter(c => c.status === "rejected").length;
  const needsReview = candidates.filter(c => c.status === "needs_review").length;
  const totalActions = qualified + rejected + needsReview;

  const scored = candidates.filter(c => typeof c.score === "number");
  const avgScore = scored.length
    ? Math.round(scored.reduce((sum, c) => sum + c.score, 0) / scored.length)
    : null;

  const conversionRate = totalCandidates
    ? Math.round((qualified / totalCandidates) * 1000) / 10
    : 0;

  // Top performing jobs
  const jobStats: Record<string, { id: string; title: string; applications: number; qualified: number }> = {};
  for (const j of jobs || []) jobStats[j.id] = { id: j.id, title: j.title, applications: 0, qualified: 0 };
  for (const c of candidates) {
    if (!c.job_id || !jobStats[c.job_id]) continue;
    jobStats[c.job_id].applications += 1;
    if (c.status === "qualified") jobStats[c.job_id].qualified += 1;
  }
  const topJobs = Object.values(jobStats)
    .filter(j => j.applications > 0)
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 6)
    .map(j => ({ ...j, conversion: Math.round((j.qualified / j.applications) * 1000) / 10 }));

  // Platform effectiveness (from candidates.source)
  const platformStats: Record<string, { source: string; count: number; qualified: number }> = {};
  for (const c of candidates) {
    const src = c.source || "direct";
    if (!platformStats[src]) platformStats[src] = { source: src, count: 0, qualified: 0 };
    platformStats[src].count += 1;
    if (c.status === "qualified") platformStats[src].qualified += 1;
  }
  const platforms = Object.values(platformStats)
    .sort((a, b) => b.count - a.count)
    .map(p => ({ ...p, conversion: p.count ? Math.round((p.qualified / p.count) * 1000) / 10 : 0 }));
  const maxPlatformCount = Math.max(1, ...platforms.map(p => p.count));
  const bestPlatform = platforms.length
    ? [...platforms].sort((a, b) => b.conversion - a.conversion || b.count - a.count)[0]
    : null;

  // Applications over the last 14 days
  const days: { label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const count = candidates.filter(c => {
      const t = new Date(c.created_at).getTime();
      return t >= start.getTime() && t < end.getTime();
    }).length;
    days.push({ label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count });
  }
  const maxDayCount = Math.max(1, ...days.map(d => d.count));

  const exportRows = candidates.map(c => ({
    name: c.name,
    email: c.email,
    job: c.jobs?.title || "—",
    status: c.status,
    score: typeof c.score === "number" ? c.score : null,
    source: c.source || "direct",
    created_at: c.created_at,
  }));

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Hiring performance across every job, shareable straight to your clients.
          </p>
        </div>
        <ExportCsvButton rows={exportRows} />
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
            <Users size={22} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Total Candidates</p>
            <p className="text-2xl font-extrabold text-slate-900 truncate">{totalCandidates}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Total Actions Taken</p>
            <p className="text-2xl font-extrabold text-slate-900 truncate">{totalActions}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Target size={22} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Avg. AI Score</p>
            <p className="text-2xl font-extrabold text-slate-900 truncate">{avgScore ?? "—"}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <TrendingUp size={22} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Conversion Rate</p>
            <p className="text-2xl font-extrabold text-slate-900 truncate">{conversionRate}%</p>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Application volume */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Application Volume</h3>
          <p className="text-xs font-medium text-slate-500 mb-6">Last 14 days</p>

          {totalCandidates === 0 ? (
            <p className="text-sm text-slate-500 py-16 text-center">No applications yet.</p>
          ) : (
            <div className="flex items-end gap-1.5 md:gap-2 h-48">
              {days.map((d, i) => (
                <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2 group">
                  <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.count}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-primary/80 group-hover:bg-primary transition-colors"
                    style={{ height: `${Math.max(4, (d.count / maxDayCount) * 100)}%` }}
                  />
                  <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap hidden md:block">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform effectiveness */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Where Applicants Come From</h3>
          <p className="text-xs font-medium text-slate-500 mb-6">By source link</p>

          {platforms.length === 0 ? (
            <p className="text-sm text-slate-500 py-16 text-center flex-1">No source data yet.</p>
          ) : (
            <div className="flex-1 flex flex-col gap-4">
              {platforms.map((p) => (
                <div key={p.source} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{platformLabel(p.source)}</span>
                    <span className="text-slate-400">{p.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${(p.count / maxPlatformCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {bestPlatform && bestPlatform.count > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Radio size={16} className="text-primary shrink-0" />
                <p className="text-xs font-semibold text-primary">
                  {platformLabel(bestPlatform.source)} is your most effective channel — {bestPlatform.conversion}% of its applicants get qualified.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Top performing jobs */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Top Performing Jobs</h3>
          <Link href="/jobs" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
            View all jobs <ArrowRight size={16} />
          </Link>
        </div>

        {topJobs.length === 0 ? (
          <p className="text-sm text-slate-500 py-12 text-center">No applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Job Title</th>
                  <th className="px-6 py-3">Applications</th>
                  <th className="px-6 py-3">Qualified</th>
                  <th className="px-6 py-3">Conversion</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-primary border border-blue-100 shrink-0">
                          <Briefcase size={16} />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{j.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{j.applications}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{j.qualified}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {j.conversion}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/candidates?job=${j.id}`}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        View candidates
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
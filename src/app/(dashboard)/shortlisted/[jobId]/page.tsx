import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Star, UserX, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { findMatchingCandidatesForJob, type CandidateForJobMatch } from "@/utils/matching";
import { aiRefineMatch } from "@/utils/matching-ai";

const statusLabel: Record<string, string> = {
  rejected: "Failed",
  needs_review: "Needs review",
  screening: "Still screening",
  qualified: "Qualified",
};

export default async function ShortlistedJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, location, must_haves, nice_to_haves, recruiter_id")
    .eq("id", jobId)
    .single();

  if (!job || job.recruiter_id !== user?.id) notFound();

  // All other jobs owned by this recruiter, so we can label which job
  // each matched candidate originally applied to.
  const { data: allJobs } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("recruiter_id", user?.id);

  const jobTitleById: Record<string, string> = {};
  for (const j of allJobs ?? []) jobTitleById[j.id] = j.title;

  const otherJobIds = (allJobs ?? []).map((j) => j.id).filter((id) => id !== jobId);

  const { data: candidates } = otherJobIds.length
    ? await supabase
        .from("candidates")
        .select("id, name, job_id, status, summary, strengths, concerns, cv_summary")
        .in("job_id", otherJobIds)
    : { data: [] as CandidateForJobMatch[] };

  const keywordMatches = findMatchingCandidatesForJob(job, (candidates ?? []) as CandidateForJobMatch[]);

  // AI backup: only the top slice gets a second look, so cost stays
  // near-zero regardless of how many candidates are in the pool. This
  // catches fits keyword-overlap misses (different words, same meaning)
  // without running an AI call on every candidate.
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const topSlice = keywordMatches.slice(0, 5);
  const refined = await Promise.all(
    topSlice.map(async (m) => {
      const ai = await aiRefineMatch(job, m.candidate, deepseekKey, geminiKey);
      if (!ai) return { ...m, aiRefined: false };

      // Log usage same as every other AI call site — this one was
      // previously the one gap where usage went untracked.
      const { error: usageError } = await supabase.from("usage_events").insert({
        source: "shortlist_match",
        candidate_id: m.candidate.id,
        recruiter_id: user?.id,
        job_id: jobId,
        provider: ai.provider,
        model: ai.model,
        prompt_tokens: ai.usage.promptTokens,
        completion_tokens: ai.usage.completionTokens,
        total_tokens: ai.usage.totalTokens,
        cache_hit_tokens: ai.usage.cacheHitTokens,
        cache_miss_tokens: ai.usage.cacheMissTokens,
      });
      if (usageError) console.error("⚠️ COULD NOT LOG USAGE EVENT:", usageError.message);

      return { ...m, score: ai.score / 100, reason: ai.reason, aiRefined: true };
    })
  );
  const matches = [...refined, ...keywordMatches.slice(5).map((m) => ({ ...m, aiRefined: false }))]
    .sort((a, b) => b.score - a.score);

  return (
    <div className="p-6 md:p-10 max-w-[1280px] mx-auto animate-in fade-in duration-500">
      <Link href="/shortlisted" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4">
        <ArrowLeft size={16} /> Back to Shortlisted
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{job.title}</h1>
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500 mt-1">
          <MapPin size={14} /> {job.location}
        </span>
      </div>

      {matches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {matches.map(({ candidate, score, reason, aiRefined }) => (
            <Link
              key={candidate.id}
              href={`/candidates/${candidate.id}`}
              className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
                  {candidate.name || "Unnamed candidate"}
                  {aiRefined && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                      <Sparkles size={10} /> AI checked
                    </span>
                  )}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  {statusLabel[candidate.status || ""] || candidate.status} on{" "}
                  <span className="font-semibold text-slate-700">
                    {jobTitleById[candidate.job_id || ""] || "another role"}
                  </span>
                  {" — "}
                  {reason.toLowerCase()}
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
                <Star size={13} /> {Math.round(score * 100)}% match
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 min-h-[300px] flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 shadow-inner mb-6 border border-slate-100">
            <UserX size={36} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">No cross-role matches yet</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">
            As candidates apply to your other jobs, anyone whose profile overlaps this role&apos;s requirements will show up here.
          </p>
        </div>
      )}
    </div>
  );
}
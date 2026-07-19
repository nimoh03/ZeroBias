import Link from "next/link";
import { Briefcase, MapPin, Star, FolderOpen } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { findMatchingCandidatesForJob, type CandidateForJobMatch } from "@/utils/matching";

// Job-first view of cross-matches: for each active job, how many
// candidates who applied to OTHER jobs (and didn't necessarily qualify
// there) have a profile that overlaps this job's requirements. Zero AI
// calls — reuses the same deterministic word-overlap scoring already
// powering "Other Roles This Candidate Might Fit" on the candidate page.
export default async function ShortlistedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, location, must_haves, nice_to_haves")
    .eq("recruiter_id", user?.id)
    .order("created_at", { ascending: false });

  const jobIds = (jobs ?? []).map((j) => j.id);

  const { data: candidates } = jobIds.length
    ? await supabase
        .from("candidates")
        .select("id, name, job_id, status, summary, strengths, concerns, cv_summary")
        .in("job_id", jobIds)
    : { data: [] as CandidateForJobMatch[] };

  const pool = (candidates ?? []) as CandidateForJobMatch[];

  const matchCounts: Record<string, number> = {};
  for (const job of jobs ?? []) {
    matchCounts[job.id] = findMatchingCandidatesForJob(job, pool).length;
  }

  const hasJobs = (jobs?.length ?? 0) > 0;

  return (
    <div className="p-6 md:p-10 max-w-[1280px] mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shortlisted</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Candidates who applied elsewhere but whose profile matches one of your other open roles.
        </p>
      </div>

      {hasJobs ? (
        <div className="grid grid-cols-1 gap-4">
          {(jobs ?? []).map((job) => {
            const count = matchCounts[job.id] ?? 0;
            return (
              <Link
                key={job.id}
                href={`/shortlisted/${job.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-6 group"
              >
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary border border-blue-100 shrink-0">
                    <Briefcase size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                      <MapPin size={14} /> {job.location}
                    </span>
                  </div>
                </div>
                <span
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
                    count > 0 ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Star size={13} /> {count} match{count === 1 ? "" : "es"}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 min-h-[400px] flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 shadow-inner mb-6 border border-slate-100">
            <FolderOpen size={36} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">No jobs yet</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">
            Create a job posting first — once you have more than one, cross-role matches will show up here.
          </p>
        </div>
      )}
    </div>
  );
}
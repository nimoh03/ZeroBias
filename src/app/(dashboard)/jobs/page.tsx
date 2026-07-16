import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { 
  Plus, MoreVertical, Link as LinkIcon, 
  MapPin, Briefcase, Pencil, FolderOpen, Users
} from "lucide-react";
import CopyLinkButton from "@/components/CopyLinkButton";

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch jobs ordered by newest first
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('recruiter_id', user?.id)
    .order('created_at', { ascending: false });

  const hasJobs = jobs && jobs.length > 0;

  // Candidate counts per job. Fetched separately (rather than a nested
  // select) so a single count query covers every job in one round trip.
  const candidateCounts: Record<string, number> = {};
  if (hasJobs) {
    const { data: candidateRows } = await supabase
      .from('candidates')
      .select('job_id')
      .in('job_id', jobs.map((j) => j.id));

    for (const row of candidateRows ?? []) {
      if (!row.job_id) continue;
      candidateCounts[row.job_id] = (candidateCounts[row.job_id] ?? 0) + 1;
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-[1280px] mx-auto animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Active Jobs</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your postings and copy screening links.</p>
        </div>
        <Link 
          href="/jobs/new" 
          className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-full hover:bg-primary transition-all shadow-md hover:shadow-primary/30 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Create New Job
        </Link>
      </div>

      {/* Jobs List */}
      {hasJobs ? (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6 group"
            >
              {/* Job Info — wrapped in a Link so clicking the job jumps
                  straight to its filtered candidate pipeline. Only this
                  block is a link (not the whole card), since the Edit
                  button and Copy Link button below need to stay
                  independently clickable — nesting a link around them
                  too would create invalid nested <a> tags. */}
              <Link
                href={`/candidates?job=${job.id}`}
                className="flex items-start gap-4 md:gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary border border-blue-100 shrink-0">
                  <Briefcase size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <MapPin size={14} /> {job.location}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {job.job_type}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Users size={12} /> {candidateCounts[job.id] ?? 0} Candidates
                    </span>
                  </div>
                </div>
              </Link>

              {/* Actions (Copy Link & Edit) */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                
                {/* REAL COPY LINK BUTTON INJECTED HERE */}
                <CopyLinkButton slug={job.public_slug} />
                
                <Link 
                  href={`/jobs/${job.id}/edit`}
                  className="px-4 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Pencil size={16} /> Edit
                </Link>

                <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Graceful Empty State */
        <div className="bg-white border border-slate-200 rounded-3xl p-10 min-h-[400px] flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 shadow-inner mb-6 border border-slate-100">
            <FolderOpen size={36} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">No jobs created yet</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mb-8">
            Create your first job posting to generate a public application link.
          </p>
          <Link 
            href="/jobs/new" 
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-full hover:bg-primary transition-colors shadow-md"
          >
            <Plus size={18} strokeWidth={2.5} /> Create First Job
          </Link>
        </div>
      )}
    </div>
  );
}
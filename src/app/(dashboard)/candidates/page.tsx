import {
  Search, Filter, MoreVertical, Eye,
  CheckCircle2, XCircle, Clock, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import StatusFilterSelect from './StatusFilterSelect';

const statusStyles: Record<string, { label: string; icon: any; classes: string }> = {
  screening: { label: 'Screening', icon: Clock, classes: 'bg-blue-50 text-primary' },
  qualified: { label: 'Qualified', icon: Sparkles, classes: 'bg-primary/10 text-primary' },
  rejected: { label: 'Rejected', icon: XCircle, classes: 'bg-error-container text-on-error-container' },
  needs_review: { label: 'Needs Review', icon: Clock, classes: 'bg-orange-100 text-orange-700' },
};

function initials(name: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

function scoreBarColor(status: string) {
  if (status === 'rejected') return 'bg-error';
  if (status === 'needs_review') return 'bg-orange-500';
  return 'bg-primary';
}

export default async function CandidatesList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; job?: string }>;
}) {
  const { q, status, job } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetching title too now (not just id) so we can show which job
  // the list is filtered by, and offer a way to clear it.
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('recruiter_id', user?.id);

  const jobIds = jobs?.map(j => j.id) || [];
  const activeJob = job ? jobs?.find(j => j.id === job) : null;

  let candidates: any[] = [];
  if (jobIds.length > 0) {
    let query = supabase
      .from('candidates')
      .select('*, jobs(title)')
      .in('job_id', jobIds)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Restrict to a single job when arriving from a job card click.
    // Only applied if the job actually belongs to this recruiter
    // (guards against a stale/tampered job id in the URL).
    if (job && activeJob) {
      query = query.eq('job_id', job);
    }

    const { data } = await query;
    candidates = data || [];

    // Filtered here (not in the query) because it needs to match either
    // the candidate's name or their joined job title.
    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      candidates = candidates.filter(c =>
        (c.name || '').toLowerCase().includes(needle) ||
        (c.jobs?.title || '').toLowerCase().includes(needle)
      );
    }
  }

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'screening', label: 'Screening' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'needs_review', label: 'Needs Review' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-container-max mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Candidate Pipeline</h2>
          <p className="text-sm text-on-surface-variant mt-1">Review and manage AI-screened applicants.</p>
        </div>
      </div>

      {/* Active job filter chip — shown only when arriving from a job card click */}
      {activeJob && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
            Filtered: {activeJob.title}
            <Link href="/candidates" className="hover:opacity-70">
              <XCircle size={14} />
            </Link>
          </span>
        </div>
      )}

      {/* Filters & Search */}
      <form method="GET" className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center gap-3 shadow-sm">
          <Search className="text-outline shrink-0" size={20} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name or job title..."
            className="bg-transparent border-none focus:ring-0 w-full text-sm outline-none placeholder:text-outline text-on-surface"
          />
        </div>
        <div className="md:col-span-4 relative">
          <StatusFilterSelect name="status" defaultValue={status || 'all'} options={statusOptions} />
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none" size={18} />
        </div>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>

      {/* Candidates Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Applied Role</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">AI Score</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                    No applicants yet. Share a job link to start collecting candidates.
                  </td>
                </tr>
              )}

              {candidates.map((c) => {
                const style = statusStyles[c.status] || statusStyles.screening;
                const StatusIcon = style.icon;
                const score = typeof c.score === 'number' ? c.score : null;

                return (
                  <tr key={c.id} className="hover:bg-surface-container-low/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shadow-sm uppercase">
                          {initials(c.name)}
                        </div>
                        <div>
                          <div className="font-bold text-on-surface">{c.name || 'Anonymous candidate'}</div>
                          <div className="text-xs text-on-surface-variant mt-0.5">
                            {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-on-surface">{c.jobs?.title || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {score === null ? (
                        <span className="text-xs text-on-surface-variant">In progress</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                            <div className={`h-full ${scoreBarColor(c.status)}`} style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-sm font-bold text-on-surface">{score}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${style.classes}`}>
                        <StatusIcon size={12} /> {style.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/candidates/${c.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high hover:bg-outline-variant text-on-surface rounded-lg text-xs font-bold transition-colors"
                        >
                          <Eye size={14} /> Review
                        </Link>
                        <button className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
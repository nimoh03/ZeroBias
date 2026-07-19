import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { findMatchingJobs, CandidateForMatching } from '@/utils/matching';

// Split out so this (a second round-trip, plus scoring work) never delays
// the profile/action-buttons column from painting first.
export default async function JobMatchesPanel({
  candidateId,
  jobId,
  recruiterId,
  candidate,
}: {
  candidateId: string;
  jobId: string;
  recruiterId: string | null | undefined;
  candidate: CandidateForMatching;
}) {
  const supabase = await createClient();
  const { data: otherJobs } = await supabase
    .from('jobs')
    .select('id, title, location, must_haves, nice_to_haves')
    .eq('recruiter_id', recruiterId);

  const jobMatches = otherJobs ? findMatchingJobs(candidate, otherJobs, jobId).slice(0, 3) : [];
  if (jobMatches.length === 0) return null;

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-on-surface">Other Roles This Candidate Might Fit</h3>
      </div>
      <div className="space-y-2">
        {jobMatches.map(({ job, score, reason }) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}/edit`}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div>
              <span className="text-sm font-medium text-on-surface">{job.title}</span>
              <p className="text-xs text-on-surface-variant mt-0.5">{reason}</p>
            </div>
            <span className="text-xs font-bold text-primary shrink-0 ml-3">{Math.round(score * 100)}% match</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
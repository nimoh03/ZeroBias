import {
  ArrowLeft, CheckCircle2, XCircle, UserCheck,
  Sparkles, ThumbsUp, AlertTriangle, Clock
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { updateCandidateStatus, resetIfInterviewExpired } from './action';
import InterviewScheduler from './InterviewScheduler';
import TranscriptPanel from './TranscriptPanel';
import JobMatchesPanel from './JobMatchesPanel';
import { SkeletonBlock } from '@/components/Skeleton';

const statusLabel: Record<string, string> = {
  screening: 'Screening in progress',
  qualified: 'Strong Match',
  rejected: 'Not a Match',
  needs_review: 'Needs Human Review',
};

function InterviewStatusBadge({ time }: { time: string }) {
  const diffMs = new Date(time).getTime() - Date.now();
  const hours = Math.abs(diffMs) / (1000 * 60 * 60);

  let label: string;
  let classes: string;
  if (diffMs < 0) {
    label = 'Interview time has passed';
    classes = 'bg-orange-100 text-orange-700';
  } else if (hours <= 3) {
    label = 'Interview coming up soon';
    classes = 'bg-red-100 text-red-700';
  } else if (hours <= 24) {
    label = 'Interview within 24 hours';
    classes = 'bg-blue-50 text-primary';
  } else {
    label = 'Interview scheduled';
    classes = 'bg-surface-container-high text-on-surface-variant';
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold ${classes}`}>
      <Clock size={14} />
      {label} — {new Date(time).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
    </div>
  );
}

function TranscriptPanelSkeleton() {
  return (
    <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm h-[800px] p-6 space-y-4">
      <SkeletonBlock className="h-5 w-48" />
      <SkeletonBlock className="h-16 w-2/3" />
      <SkeletonBlock className="h-16 w-2/3 ml-auto" />
      <SkeletonBlock className="h-16 w-1/2" />
    </div>
  );
}

function JobMatchesSkeleton() {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-3">
      <SkeletonBlock className="h-4 w-1/2" />
      <SkeletonBlock className="h-10 w-full rounded-xl" />
      <SkeletonBlock className="h-10 w-full rounded-xl" />
    </div>
  );
}

export default async function CandidateDetail({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params;
  const supabase = await createClient();

  const { data: candidate, error } = await supabase
    .from('candidates')
    .select('*, jobs(title, recruiter_id)')
    .eq('id', candidateId)
    .single();

  if (error || !candidate) {
    console.error('🔥 CANDIDATE NOT FOUND:', error?.message);
    return notFound();
  }

  const wasReset = await resetIfInterviewExpired(candidateId, candidate.selected_slot || null);
  if (wasReset) {
    candidate.selected_slot = null;
    candidate.interview_slots = [];
    candidate.interview_scheduled_at = null;
  }

  const initials = candidate.name
    ? candidate.name.trim().split(/\s+/).map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const strengths: string[] = candidate.strengths || [];
  const concerns: string[] = candidate.concerns || [];
  const hasScore = typeof candidate.score === 'number';
  const showJobMatches = candidate.status === 'rejected' || candidate.status === 'needs_review';

  return (
    <div className="p-6 md:p-8 max-w-container-max mx-auto space-y-6">

      <div className="flex items-center gap-4 text-sm font-medium">
        <Link href="/candidates" className="text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={16} /> Back to Pipeline
        </Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant">{candidate.jobs?.title || 'Unknown role'}</span>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface font-bold">{candidate.name || 'Anonymous candidate'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <div className="lg:col-span-4 space-y-6">

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-inner">
              {initials}
            </div>
            <h2 className="text-xl font-bold text-on-surface">{candidate.name || 'Anonymous candidate'}</h2>
            <p className="text-sm text-on-surface-variant mt-1">Applied for {candidate.jobs?.title || 'this role'}</p>
            {candidate.email && <p className="text-xs text-on-surface-variant mt-0.5">{candidate.email}</p>}
            {candidate.cv_url ? (
              <a
                href={candidate.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-surface-container-high hover:bg-outline-variant text-on-surface rounded-lg text-xs font-bold transition-colors"
              >
                📎 View CV
              </a>
            ) : (
              <p className="text-xs text-on-surface-variant mt-4">No CV uploaded</p>
            )}
          </div>

          <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-primary" size={20} />
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">AI Recommendation</h3>
            </div>

            {!hasScore ? (
              <p className="text-sm text-on-surface-variant">Nova hasn't reached a verdict yet — screening is still in progress.</p>
            ) : (
              <>
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-4xl font-black text-on-surface">{candidate.score}%</span>
                  <span className="text-sm font-bold text-green-600 mb-1">{statusLabel[candidate.status] || candidate.status}</span>
                </div>

                {candidate.summary && (
                  <p className="text-sm text-on-surface-variant mb-4">{candidate.summary}</p>
                )}

                <div className="space-y-4">
                  {strengths.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                        <ThumbsUp size={14} className="text-green-600" /> Key Strengths
                      </h4>
                      <ul className="text-sm space-y-2 text-on-surface">
                        {strengths.map((s, i) => (
                          <li key={i} className="flex gap-2"><span className="text-green-600">•</span> {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {concerns.length > 0 && (
                    <div className="pt-4 border-t border-primary/10">
                      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                        <AlertTriangle size={14} className="text-orange-500" /> Growth Areas
                      </h4>
                      <ul className="text-sm space-y-2 text-on-surface">
                        {concerns.map((c, i) => (
                          <li key={i} className="flex gap-2"><span className="text-orange-500">•</span> {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            <form action={async () => { "use server"; await updateCandidateStatus(candidateId, "qualified"); }}>
              <button
                type="submit"
                className="w-full py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 size={18} /> Proceed to Interview
              </button>
            </form>
            <form action={async () => { "use server"; await updateCandidateStatus(candidateId, "needs_review"); }}>
              <button
                type="submit"
                className="w-full py-3 bg-surface-container-high text-on-surface-variant rounded-xl text-sm font-bold hover:bg-outline-variant transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <UserCheck size={18} /> Request Team Review
              </button>
            </form>
            <form action={async () => { "use server"; await updateCandidateStatus(candidateId, "rejected"); }}>
              <button
                type="submit"
                className="w-full py-3 border border-error text-error rounded-xl text-sm font-bold hover:bg-error-container/50 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <XCircle size={18} /> Reject Candidate
              </button>
            </form>
          </div>

          {candidate.status === 'qualified' && (
            <>
              {candidate.selected_slot && (
                <InterviewStatusBadge time={candidate.selected_slot.time} />
              )}
              <InterviewScheduler
                candidateId={candidateId}
                existingSlots={candidate.interview_slots || []}
                selectedSlot={candidate.selected_slot || null}
              />
            </>
          )}

          {showJobMatches && (
            <Suspense fallback={<JobMatchesSkeleton />}>
              <JobMatchesPanel
                candidateId={candidateId}
                jobId={candidate.job_id}
                recruiterId={candidate.jobs?.recruiter_id}
                candidate={{
                  summary: candidate.summary,
                  strengths: candidate.strengths,
                  concerns: candidate.concerns,
                  cv_summary: candidate.cv_summary,
                }}
              />
            </Suspense>
          )}

        </div>

        <Suspense fallback={<TranscriptPanelSkeleton />}>
          <TranscriptPanel candidateId={candidateId} />
        </Suspense>

      </div>
    </div>
  );
}
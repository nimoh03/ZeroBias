import {
  ArrowLeft, CheckCircle2, XCircle, UserCheck,
  Sparkles, MessageSquare, Bot, User,
  ThumbsUp, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { updateCandidateStatus } from './action';

const statusLabel: Record<string, string> = {
  screening: 'Screening in progress',
  qualified: 'Strong Match',
  rejected: 'Not a Match',
  needs_review: 'Needs Human Review',
};

export default async function CandidateDetail({ params }: { params: { candidateId: string } }) {
  const { candidateId } = await params;
  const supabase = await createClient();

  const { data: candidate, error } = await supabase
    .from('candidates')
    .select('*, jobs(title)')
    .eq('id', candidateId)
    .single();

  if (error || !candidate) {
    console.error('🔥 CANDIDATE NOT FOUND:', error?.message);
    return notFound();
  }

  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: true });

  const initials = candidate.name
    ? candidate.name.trim().split(/\s+/).map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const strengths: string[] = candidate.strengths || [];
  const concerns: string[] = candidate.concerns || [];
  const hasScore = typeof candidate.score === 'number';

  return (
    <div className="p-6 md:p-8 max-w-container-max mx-auto space-y-6">

      {/* Top Navigation */}
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

        {/* Left Column: AI Analysis & Profile (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Profile Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-inner">
              {initials}
            </div>
            <h2 className="text-xl font-bold text-on-surface">{candidate.name || 'Anonymous candidate'}</h2>
            <p className="text-sm text-on-surface-variant mt-1">Applied for {candidate.jobs?.title || 'this role'}</p>
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

          {/* AI Recommendation (The "Wow" Feature) */}
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

          {/* Action Buttons */}
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

        </div>

        {/* Right Column: Chat Transcript (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col h-[800px]">

          <div className="p-4 border-b border-outline-variant flex items-center gap-2 shrink-0">
            <MessageSquare size={18} className="text-on-surface-variant" />
            <h3 className="text-sm font-bold text-on-surface">Screening Transcript</h3>
            <span className="ml-auto text-xs text-on-surface-variant">
              {transcripts && transcripts.length > 0
                ? new Date(transcripts[transcripts.length - 1].created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                : 'No messages yet'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {(!transcripts || transcripts.length === 0) && (
              <p className="text-sm text-on-surface-variant text-center py-12">No transcript yet.</p>
            )}

            {transcripts?.map((m) => (
              <div
                key={m.id}
                className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${
                  m.role === 'user' ? 'bg-surface-container-highest' : 'bg-primary'
                }`}>
                  {m.role === 'user'
                    ? <User size={16} className="text-on-surface-variant" />
                    : <Bot size={16} className="text-on-primary" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-on-primary rounded-tr-sm shadow-sm'
                    : 'bg-surface-container-high text-on-surface rounded-tl-sm border border-outline-variant/30'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
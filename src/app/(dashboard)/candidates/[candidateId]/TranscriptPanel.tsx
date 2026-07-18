import { MessageSquare, Bot, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

// Split out from the main page so the transcript query (often the slowest
// part — can be a long conversation) streams in on its own via <Suspense>
// instead of blocking the profile card / action buttons from appearing.
export default async function TranscriptPanel({ candidateId }: { candidateId: string }) {
  const supabase = await createClient();
  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: true });

  return (
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
  );
}
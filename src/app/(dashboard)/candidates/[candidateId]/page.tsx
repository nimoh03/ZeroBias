import { 
  ArrowLeft, CheckCircle2, XCircle, UserCheck, 
  FileText, Sparkles, MessageSquare, Bot, User,
  ThumbsUp, AlertTriangle, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function CandidateDetail() {
  return (
    <div className="p-6 md:p-8 max-w-container-max mx-auto space-y-6">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-4 text-sm font-medium">
        <Link href="/jobs" className="text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={16} /> Back to Pipeline
        </Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface-variant">Senior Frontend Engineer</span>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface font-bold">Alex Chen</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: AI Analysis & Profile (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-inner">
              AC
            </div>
            <h2 className="text-xl font-bold text-on-surface">Alex Chen</h2>
            <p className="text-sm text-on-surface-variant mt-1">San Francisco, CA</p>
            
            <div className="mt-6 pt-6 border-t border-outline-variant flex justify-center gap-4">
              <button className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
                <FileText size={16} /> View CV
              </button>
              <button className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
                <ExternalLink size={16} /> LinkedIn
              </button>
            </div>
          </div>

          {/* AI Recommendation (The "Wow" Feature) */}
          <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-primary" size={20} />
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">AI Recommendation</h3>
            </div>
            
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-black text-on-surface">94%</span>
              <span className="text-sm font-bold text-green-600 mb-1">Strong Match</span>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                  <ThumbsUp size={14} className="text-green-600" /> Key Strengths
                </h4>
                <ul className="text-sm space-y-2 text-on-surface">
                  <li className="flex gap-2"><span className="text-green-600">•</span> 5 years of production React experience.</li>
                  <li className="flex gap-2"><span className="text-green-600">•</span> Led architecture migration to Next.js.</li>
                  <li className="flex gap-2"><span className="text-green-600">•</span> Matches expected salary range.</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-primary/10">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle size={14} className="text-orange-500" /> Growth Areas
                </h4>
                <ul className="text-sm space-y-2 text-on-surface">
                  <li className="flex gap-2"><span className="text-orange-500">•</span> Limited direct team management experience.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full py-3 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95">
              <CheckCircle2 size={18} /> Proceed to Interview
            </button>
            <button className="w-full py-3 bg-surface-container-high text-on-surface-variant rounded-xl text-sm font-bold hover:bg-outline-variant transition-all flex items-center justify-center gap-2 active:scale-95">
              <UserCheck size={18} /> Request Team Review
            </button>
            <button className="w-full py-3 border border-error text-error rounded-xl text-sm font-bold hover:bg-error-container/50 transition-all flex items-center justify-center gap-2 active:scale-95">
              <XCircle size={18} /> Reject Candidate
            </button>
          </div>

        </div>

        {/* Right Column: Chat Transcript (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col h-[800px]">
          
          <div className="p-4 border-b border-outline-variant flex items-center gap-2 shrink-0">
            <MessageSquare size={18} className="text-on-surface-variant" />
            <h3 className="text-sm font-bold text-on-surface">Screening Transcript</h3>
            <span className="ml-auto text-xs text-on-surface-variant">Completed: Oct 14, 2:30 PM</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* AI Message */}
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot size={16} className="text-on-primary" />
              </div>
              <div className="bg-surface-container-high p-4 rounded-2xl rounded-tl-sm text-sm text-on-surface leading-relaxed border border-outline-variant/30">
                Hi Alex! I see you've spent the last 3 years at TechCorp. Can you describe the most complex React architecture problem you solved there?
              </div>
            </div>

            {/* Candidate Message */}
            <div className="flex gap-4 max-w-[85%] ml-auto flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <User size={16} className="text-on-surface-variant" />
              </div>
              <div className="bg-primary text-on-primary p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
                Absolutely. We were dealing with massive re-render issues on our main data grid. I led the migration from Redux to a more atomic state management pattern using Jotai, and implemented virtualized rendering which cut our load times by 60%.
              </div>
            </div>

            {/* AI Highlight / Note inside the transcript */}
            <div className="flex justify-center my-6">
              <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-4 py-2 rounded-full font-medium flex items-center gap-2">
                <Sparkles size={14} /> AI identified strong architectural knowledge
              </div>
            </div>

            {/* AI Message */}
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot size={16} className="text-on-primary" />
              </div>
              <div className="bg-surface-container-high p-4 rounded-2xl rounded-tl-sm text-sm text-on-surface leading-relaxed border border-outline-variant/30">
                That's a massive performance gain. How did you get buy-in from the rest of the engineering team to adopt Jotai, given they were used to Redux?
              </div>
            </div>

             {/* Candidate Message */}
             <div className="flex gap-4 max-w-[85%] ml-auto flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <User size={16} className="text-on-surface-variant" />
              </div>
              <div className="bg-primary text-on-primary p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
                I built a small proof-of-concept on a secondary page first to show the performance metrics. Once the team saw the bundle size reduction and how much less boilerplate code was needed, the data spoke for itself.
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
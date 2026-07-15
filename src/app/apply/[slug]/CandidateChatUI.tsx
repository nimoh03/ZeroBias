"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, User, Loader2, Paperclip, CheckCircle2, Clock } from "lucide-react";

const STORAGE_KEY_PREFIX = "hireflow_chat_";

export default function CandidateChatUI({ job }: { job: any }) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [finalStatus, setFinalStatus] = useState<"qualified" | "rejected" | "needs_review" | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${job.public_slug}`;
  const greeting = {
    role: 'assistant',
    content: `Hi there! 👋 I'm Nova, the AI recruiter for ${job.profiles?.company_name || 'this team'}. We are looking for a **${job.title}** based in ${job.location}.\n\nBefore we begin the actual interview, could you tell me your first and last name?`
  };

  // Standard React State for messages
  const [messages, setMessages] = useState([greeting]);

  // On mount, resume a previous in-progress conversation for this job
  // (same browser) instead of losing it on refresh.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length) setMessages(parsed.messages);
        if (parsed.candidateId) setCandidateId(parsed.candidateId);
        if (parsed.isDone) setIsDone(parsed.isDone);
        if (parsed.finalStatus) setFinalStatus(parsed.finalStatus);
        if (parsed.cvFileName) setCvFileName(parsed.cvFileName);
      }
    } catch (error) {
      console.error("Could not restore saved conversation:", error);
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage any time the conversation changes, once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ messages, candidateId, isDone, finalStatus, cvFileName }));
    } catch (error) {
      console.error("Could not save conversation:", error);
    }
  }, [messages, candidateId, isDone, finalStatus, cvFileName, hydrated, storageKey]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || isDone) return;

    // 1. Add user message to UI immediately
    const userMessage = { role: 'user', content: inputText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setIsLoading(true); // Trigger the WhatsApp-style spinner

    try {
      // 2. Send standard fetch request to our API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          jobContext: job,
          candidateId,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch");
      
      const data = await response.json();

      // 3. Add AI response to UI, and remember the candidate record
      // the server created/used so the next turn only sends the delta.
      if (data.candidateId && data.candidateId !== candidateId) {
        setCandidateId(data.candidateId);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      if (data.done) {
        setIsDone(true);
        setFinalStatus(data.status ?? null);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having a little trouble connecting right now. Could you repeat that?" }]);
    } finally {
      setIsLoading(false); // Stop the spinner
    }
  };

  const handleCvSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later if needed
    if (!file || !candidateId || isUploading) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("candidateId", candidateId);

      const response = await fetch('/api/upload-cv', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${data.error || "Couldn't upload that file. Please try a PDF or Word doc under 5MB."}` }]);
        return;
      }

      setCvFileName(data.filename);
      setMessages(prev => [...prev, { role: 'user', content: `📎 Uploaded resume: ${data.filename}` }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Something went wrong uploading your CV. Please try again." }]);
    } finally {
      setIsUploading(false);
    }
  };

  const finalActionIsLink = typeof job.final_action === 'string' && /^https?:\/\//i.test(job.final_action.trim());

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white border-x border-slate-100 shadow-2xl relative overflow-hidden">
      
      {/* Header */}
      <header className="h-20 shrink-0 px-6 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-700 rounded-full flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Nova</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Recruiter</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-900">{job.title}</p>
          <p className="text-xs font-medium text-slate-500">{job.location}</p>
        </div>
      </header>

      {/* Chat Transcript Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth pb-32">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            
            {/* Avatar */}
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-slate-100 text-slate-500' : 'bg-primary text-white'}`}>
              {msg.role === 'user' ? <User size={18} /> : <Sparkles size={18} />}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[80%] px-5 py-4 rounded-3xl ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-sm' 
                : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm'
            }`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {/* Real-time Typing Indicator (The Spinner) */}
        {isLoading && (
          <div className="flex gap-4 animate-in fade-in">
             <div className="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
              <Sparkles size={18} />
            </div>
            <div className="px-5 py-4 rounded-3xl bg-slate-50 border border-slate-200 rounded-tl-sm flex items-center gap-2">
               <Loader2 size={16} className="animate-spin text-slate-400" />
               <span className="text-sm text-slate-500 font-medium">Nova is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-6">
        {isDone ? (
          <div className="max-w-2xl mx-auto text-center bg-slate-50 border border-slate-200 rounded-2xl py-5 px-6">
            {finalStatus === 'qualified' ? (
              <>
                <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={28} />
                <p className="text-sm font-bold text-slate-900">You're through to the next stage 🎉</p>
                {job.final_action ? (
                  finalActionIsLink ? (
                    <a
                      href={job.final_action.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 px-6 py-3 bg-primary text-white rounded-full text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      Continue →
                    </a>
                  ) : (
                    <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap">{job.final_action}</p>
                  )
                ) : (
                  <p className="text-xs text-slate-500 mt-1">The team will be in touch with next steps shortly.</p>
                )}
              </>
            ) : finalStatus === 'needs_review' ? (
              <>
                <Clock className="mx-auto text-orange-500 mb-2" size={28} />
                <p className="text-sm font-bold text-slate-900">Thanks — we'll be in touch soon</p>
                <p className="text-xs text-slate-500 mt-1">A member of the team is reviewing your answers.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-900">Screening complete</p>
                <p className="text-xs text-slate-500 mt-1">Thanks for your time — we wish you the best.</p>
              </>
            )}
          </div>
        ) : (
        <form onSubmit={handleSend} className="relative max-w-2xl mx-auto flex items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleCvSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!candidateId || isUploading}
            title={!candidateId ? "Send your first message before attaching a CV" : "Attach your CV"}
            className="absolute left-2.5 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={isLoading ? "Nova is thinking..." : cvFileName ? "Type your message..." : "Type your message... (📎 to attach your CV)"}
            className="w-full bg-white border border-slate-300 rounded-full pl-14 pr-16 py-4 text-[15px] shadow-lg shadow-slate-200/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-50 disabled:bg-slate-50"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2.5 w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-slate-300"
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
        )}
        <p className="text-center text-[11px] font-medium text-slate-400 mt-4">
          Powered by HireFlow AI. Messages are analyzed by artificial intelligence.
        </p>
      </div>

    </div>
  );
}
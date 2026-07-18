"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Loader2, Plus, FileText } from "lucide-react";

const STORAGE_KEY_PREFIX = "hireflow_chat_";

export default function CandidateChatUI({ job, source }: { job: any; source?: string }) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [finalStatus, setFinalStatus] = useState<"qualified" | "rejected" | "needs_review" | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [interviewSlots, setInterviewSlots] = useState<{ id: string; time: string; link: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ id: string; time: string; link: string } | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${job.public_slug}`;
  const companyName = job.profiles?.company_name || "the hiring team";
  const greeting = {
    role: 'assistant',
    content: `Hi, I'm Nova with ${companyName}. We're hiring for a ${job.title} based in ${job.location}. To get started, could I get your full name and email address?`
  };

  const [messages, setMessages] = useState([greeting]);

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
        if (parsed.interviewSlots) setInterviewSlots(parsed.interviewSlots);
        if (parsed.selectedSlot) setSelectedSlot(parsed.selectedSlot);
      }
    } catch (error) {
      console.error("Could not restore saved conversation:", error);
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ messages, candidateId, isDone, finalStatus, cvFileName, interviewSlots, selectedSlot }));
    } catch (error) {
      console.error("Could not save conversation:", error);
    }
  }, [messages, candidateId, isDone, finalStatus, cvFileName, interviewSlots, selectedSlot, hydrated, storageKey]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, interviewSlots, selectedSlot]);

  // Once the screening chat is done, the recruiter may schedule an
  // interview at any point afterward (they're reviewing async, not live).
  // Poll cheaply for that rather than requiring the candidate to guess
  // when to refresh. Pure DB reads — no AI calls involved. Stops once a
  // slot has been picked (nothing left to wait for).
  useEffect(() => {
    if (!hydrated || !isDone || !candidateId || selectedSlot) return;

    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`/api/interview-slot?candidateId=${candidateId}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.selectedSlot) setSelectedSlot(data.selectedSlot);
        else if (data.interviewSlots?.length) setInterviewSlots(data.interviewSlots);
      } catch {
        // Silent — this is a background convenience poll, not a critical path.
      }
    };

    check();
    const interval = setInterval(check, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [hydrated, isDone, candidateId, selectedSlot]);

  const handlePickSlot = async (slotId: string) => {
    if (!candidateId || isBooking) return;
    setIsBooking(true);
    try {
      const res = await fetch('/api/interview-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, slotId }),
      });
      const data = await res.json();
      if (res.ok && data.selectedSlot) {
        setSelectedSlot(data.selectedSlot);
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert("Couldn't save your selection — please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const formatSlotTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || isDone) return;

    const userMessage = { role: 'user', content: inputText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          jobContext: job,
          candidateId,
          source,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();

      if (data.usage) {
        console.log("🔢 TOKEN USAGE (chat):", data.usage);
      }

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
      setMessages(prev => [...prev, { role: 'assistant', content: "Having trouble connecting right now — could you try sending that again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCvSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !candidateId || isUploading) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("candidateId", candidateId);
      if (job.recruiter_id) formData.append("recruiterId", job.recruiter_id);

      const response = await fetch('/api/upload-cv', { method: 'POST', body: formData });
      const data = await response.json();

      if (data.usage) {
        console.log("🔢 TOKEN USAGE (cv upload):", data.usage);
      }

      if (!response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || "Couldn't upload that file — try a PDF or Word doc under 5MB." }]);
        return;
      }

      setCvFileName(data.filename);
      setMessages(prev => [...prev, { role: 'user', content: `Attached: ${data.filename}` }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong uploading that file. Please try again." }]);
    } finally {
      setIsUploading(false);
    }
  };

  // Note: job.final_action (a recruiter-set custom redirect link/message for
  // qualified candidates) is no longer surfaced here now that the banner is
  // gone. If you still want that link shown somewhere, it needs a new home —
  // flag it and we can add it back in.

  return (
    <div
      className="flex flex-col h-screen max-w-3xl mx-auto bg-white border-x border-slate-100 shadow-2xl"
      style={{ height: '100dvh' }}
    >
      {/*
        height: 100vh from the Tailwind class is the baseline that works
        everywhere, including old Safari (e.g. iPhone 6s, capped at iOS 15).
        The inline 100dvh style is a progressive enhancement — modern
        browsers use it (keyboard-aware height), and browsers that don't
        understand the dvh unit simply ignore that single invalid
        declaration and keep using the 100vh class instead of breaking.
      */}
      {/* Header */}
      <header className="shrink-0 h-16 px-5 flex items-center justify-between border-b border-slate-100 bg-white z-10">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">{job.title}</h1>
          <p className="text-xs font-medium text-slate-500">{job.location}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500">{companyName}</p>
        </div>
      </header>

      {/* Chat Transcript Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${msg.role === 'user' ? 'bg-slate-100 text-slate-500' : 'bg-primary text-white'}`}>
              {msg.role === 'user' ? <User size={15} /> : 'N'}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
              msg.role === 'user'
                ? 'bg-slate-900 text-white rounded-tr-sm'
                : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm'
            }`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">N</div>
            <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 rounded-tl-sm flex items-center gap-2">
              <Loader2 size={15} className="animate-spin text-slate-400" />
              <span className="text-sm text-slate-500">Typing...</span>
            </div>
          </div>
        )}

        {/* Interview slot picker — deterministic, no AI call involved. */}
        {isDone && !selectedSlot && interviewSlots.length > 0 && (
          <div className="flex gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">N</div>
            <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm">
              <p className="text-[15px] leading-relaxed mb-3">
                Good news — we'd like to set up an interview. Pick whichever time works for you:
              </p>
              <div className="space-y-2">
                {interviewSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={isBooking}
                    onClick={() => handlePickSlot(slot.id)}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium text-slate-800 disabled:opacity-50"
                  >
                    {formatSlotTime(slot.time)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedSlot && (
          <div className="flex gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">N</div>
            <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm">
              <p className="text-[15px] leading-relaxed">
                You're booked for <span className="font-semibold">{formatSlotTime(selectedSlot.time)}</span>.
              </p>
              <a
                href={selectedSlot.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm font-semibold text-primary underline"
              >
                Join the interview link
              </a>
            </div>
          </div>
        )}
        {isDone && finalStatus === 'qualified' && !selectedSlot && interviewSlots.length === 0 && (
          <div className="flex gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">N</div>
            <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm">
              <p className="text-[15px] leading-relaxed">Our team will get back to you shortly with next steps.</p>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area — normal flex flow, not absolute, so mobile keyboards don't break it */}
      <div className="shrink-0 bg-white border-t border-slate-100 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-4">
        {isDone ? (
          <form className="relative flex items-end">
            <button
              type="button"
              disabled
              className="absolute left-1.5 bottom-1.5 w-9 h-9 flex items-center justify-center rounded-full text-slate-300 shrink-0"
            >
              <Plus size={20} />
            </button>
            <textarea
              disabled
              rows={1}
              value=""
              placeholder="This screening has been completed"
              style={{ fontSize: '16px' }}
              className="w-full bg-slate-100 border border-transparent rounded-3xl pl-12 pr-14 py-3.5 leading-snug outline-none resize-none opacity-60 cursor-not-allowed"
            />
            <button
              type="button"
              disabled
              className="absolute right-1.5 bottom-1.5 w-9 h-9 bg-slate-300 text-white rounded-full flex items-center justify-center shrink-0"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSend} className="relative flex items-end">
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
                className="absolute left-1.5 bottom-1.5 w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent shrink-0"
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
              </button>
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as unknown as React.FormEvent);
                  }
                }}
                disabled={isLoading}
                rows={1}
                placeholder={isLoading ? "..." : "Type your message..."}
                // fontSize is pinned inline (not just via Tailwind) so it can
                // never drop below 16px — iOS Safari auto-zooms the page on
                // focus into any input/textarea under 16px. touch-action
                // kills the extra double-tap-to-zoom delay on the button too.
                style={{ fontSize: '16px', touchAction: 'manipulation' }}
                className="w-full bg-slate-100 border border-transparent rounded-3xl pl-12 pr-14 py-3.5 leading-snug focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-50 resize-none overflow-y-auto max-h-[120px]"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                style={{ touchAction: 'manipulation' }}
                className="absolute right-1.5 bottom-1.5 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:bg-slate-300 shrink-0"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </form>
            {cvFileName && (
              <p className="text-center text-[11px] font-medium text-slate-400 mt-2 flex items-center justify-center gap-1">
                <FileText size={11} /> {cvFileName} attached
              </p>
            )}
          </>
        )}
      </div>

    </div>
  );
}
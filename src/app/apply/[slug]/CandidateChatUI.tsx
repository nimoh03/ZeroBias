"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Loader2, Plus, FileText } from "lucide-react";

const STORAGE_KEY_PREFIX = "hireflow_chat_";

// How long to wait after a message before actually calling the AI —
// catches someone firing off 2-3 quick follow-up messages and combines
// them into a single AI call/reply instead of racing several calls.
// Long enough to catch a genuine follow-up thought, short enough that a
// candidate who sends one message and waits isn't left staring at
// nothing before Nova even starts "typing."
const DEBOUNCE_MS = 3000;

// Once the AI reply is actually ready, hold it behind the typing
// indicator for at least this long. Replies that come back near-
// instantly (cache hit, short reply) otherwise feel jarring/robotic —
// this floors the perceived response time without adding real latency
// to slower replies (it only ever adds the remaining gap, never doubles up).
const MIN_TYPING_MS = 1200;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  // True for the one file-chip message created after a confirmed CV
  // upload. Lets the bubble render as a file chip instead of prose —
  // never set on anything the candidate actually typed.
  isFile?: boolean;
};

export default function CandidateChatUI({ job, source }: { job: any; source?: string }) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Separate from isLoading on purpose: isLoading only covers the actual
  // AI call and gates the input/send button (disabled while a call is
  // genuinely in flight). showTyping covers everything from the moment
  // a candidate hits send — including the 3s debounce window before the
  // AI call even starts — so there's never a silent gap where nothing
  // on screen indicates Nova is about to respond. Two real candidates
  // (Samuel, Fortune) sent confused "what next?" / "Hello..." messages
  // into exactly that gap during testing.
  const [showTyping, setShowTyping] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [finalStatus, setFinalStatus] = useState<"qualified" | "rejected" | "needs_review" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // File the candidate picked but hasn't confirmed sending yet. This is
  // the only "attached" state now — once confirmCvUpload() runs it's
  // cleared and the file chip message in `messages` is the sole record,
  // so there's never a separate persistent "X attached" strip alongside it.
  const [pendingCvFile, setPendingCvFile] = useState<File | null>(null);
  const [interviewSlots, setInterviewSlots] = useState<{ id: string; time: string; link: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ id: string; time: string; link: string } | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${job.public_slug}`;
  const companyName = job.profiles?.company_name || "the hiring team";
  const greeting: ChatMessage[] = [
  {
    role: 'assistant',
    content: `Hi, I'm Nova, an AI assistant handling the initial screening for ${companyName} for the ${job.title} role.`,
  },
  {
    role: 'assistant',
    content: `To get started, could I get your email, full name, and phone number?`,
  },
];

const [messages, setMessages] = useState<ChatMessage[]>(greeting);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length) setMessages(parsed.messages);
        if (parsed.candidateId) setCandidateId(parsed.candidateId);
        if (parsed.isDone) setIsDone(parsed.isDone);
        if (parsed.finalStatus) setFinalStatus(parsed.finalStatus);
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
      localStorage.setItem(storageKey, JSON.stringify({ messages, candidateId, isDone, finalStatus, interviewSlots, selectedSlot }));
    } catch (error) {
      console.error("Could not save conversation:", error);
    }
  }, [messages, candidateId, isDone, finalStatus, interviewSlots, selectedSlot, hydrated, storageKey]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, showTyping, interviewSlots, selectedSlot, pendingCvFile]);

  // Clear any pending debounced send if the candidate navigates away
  // mid-window — otherwise a stray timer could fire against an unmounted
  // component.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

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

  // The actual AI call — only ever fired once the debounce window in
  // handleSend has gone quiet, using whatever messages have accumulated
  // by then (could be one message, could be several rapid ones combined
  // into a single call/reply).
  const sendToAI = async (allMessages: ChatMessage[]) => {
    setIsLoading(true);
    const startedAt = Date.now();

    // Small helper so a genuine network blip (dropped connection, brief
    // timeout — common on mobile data) gets one silent retry before the
    // candidate ever sees an error. Only retries on an actual fetch/
    // network failure, not on a normal error response from the server
    // (those already have their own handling below).
    const doFetch = () => fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: allMessages,
        jobContext: job,
        candidateId,
        source,
      }),
    });

    try {
      let response: Response;
      try {
        response = await doFetch();
      } catch {
        // First attempt failed outright (network error, not an HTTP
        // error response) — wait briefly and try once more before
        // giving up.
        await new Promise((resolve) => setTimeout(resolve, 1200));
        response = await doFetch();
      }

      if (!response.ok) {
        // Rate-limit (429) and other handled error responses still come
        // back with a real, candidate-friendly `text` — show that
        // instead of the generic fallback, which would otherwise make a
        // deliberate "slow down" message look like a broken connection.
        const errorData = await response.json().catch(() => null);
        if (errorData?.text) {
          const elapsed = Date.now() - startedAt;
          const remaining = MIN_TYPING_MS - elapsed;
          if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
          setMessages(prev => [...prev, { role: 'assistant', content: errorData.text }]);
          return;
        }
        throw new Error("Failed to fetch");
      }

      const data = await response.json();

      if (data.usage) {
        console.log("🔢 TOKEN USAGE (chat):", data.usage);
      }

      // Floor the perceived response time so a fast/cached reply doesn't
      // feel like it fired instantly — never adds delay beyond what's
      // already elapsed, only tops it up to the minimum.
      const elapsed = Date.now() - startedAt;
      const remaining = MIN_TYPING_MS - elapsed;
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));

      if (data.candidateId && data.candidateId !== candidateId) {
        setCandidateId(data.candidateId);
      }
      const bubbles: string[] = Array.isArray(data.texts) && data.texts.length > 0 ? data.texts : [data.text];
      setMessages(prev => [...prev, ...bubbles.map((content: string) => ({ role: 'assistant' as const, content }))]);
      if (data.done) {
        setIsDone(true);
        setFinalStatus(data.status ?? null);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Having trouble connecting right now — could you try sending that again?" }]);
    } finally {
      setIsLoading(false);
      setShowTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || isDone) return;

    const userMessage: ChatMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setShowTyping(true);

    // Debounce: don't call the AI immediately. If another message comes
    // in before the window closes, this timer resets and both messages
    // go out together in one call once things go quiet — catches
    // rapid-fire typing without ever dropping or racing a message.
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      // Read the latest messages via the functional updater rather than
      // the closed-over `messages` value, which could be stale if more
      // than one message queued up during the window.
      setMessages(current => {
        sendToAI(current);
        return current;
      });
    }, DEBOUNCE_MS);
  };

  // Stage a picked file — nothing is uploaded or sent to chat yet. The
  // candidate has to hit "Send" on the preview bar below the input
  // before anything leaves the browser.
  const handleCvSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !candidateId || isUploading) return;
    setPendingCvFile(file);
  };

  const cancelCvUpload = () => setPendingCvFile(null);

  const confirmCvUpload = async () => {
    const file = pendingCvFile;
    if (!file || !candidateId || isUploading) return;
    setPendingCvFile(null);
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

      // Single source of truth for "a CV was attached": one file-chip
      // bubble in the transcript, WhatsApp-style. No separate persistent
      // strip anywhere else — that was the duplicate.
      const fileMessage: ChatMessage = { role: 'user', content: data.filename, isFile: true };
      setShowTyping(true);
      setMessages(prev => {
        const updated = [...prev, fileMessage];
        sendToAI(updated);
        return updated;
      });
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
              {msg.isFile ? (
                // File chip — just the filename, no "Attached:" prose.
                // This is the only place an uploaded CV shows up.
                <span className="flex items-center gap-2 text-[15px]">
                  <FileText size={16} className="shrink-0" />
                  <span className="truncate">{msg.content}</span>
                </span>
              ) : (
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {showTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">N</div>
            <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 rounded-tl-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
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
            {/* Confirm-before-send preview — the only place an "attached"
                file shows before it's actually uploaded. Cancel clears it
                with no request ever made; Send is the one thing that
                triggers confirmCvUpload(). */}
            {pendingCvFile && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
                <FileText size={16} className="text-slate-400 shrink-0" />
                <span className="text-sm text-slate-700 truncate flex-1">{pendingCvFile.name}</span>
                <button type="button" onClick={cancelCvUpload} className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmCvUpload}
                  disabled={isUploading}
                  className="text-xs font-semibold text-white bg-primary rounded-full px-3 py-1.5 disabled:opacity-50"
                >
                  {isUploading ? "Sending…" : "Send"}
                </button>
              </div>
            )}
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
                  // Most mobile soft keyboards have no practical way to hold
                  // Shift while tapping Enter, so intercepting plain Enter
                  // as "submit" there silently removes a candidate's ability
                  // to ever add a newline for a multi-part answer. Only
                  // apply the submit-on-Enter convention on devices with a
                  // real keyboard; mobile just falls through to the
                  // textarea's default (insert newline) and submits via
                  // the send button instead.
                  const isTouchDevice = typeof window !== "undefined" && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
                  if (e.key === 'Enter' && !e.shiftKey && !isTouchDevice) {
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
          </>
        )}
      </div>

    </div>
  );
}
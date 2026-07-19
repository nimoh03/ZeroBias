"use client";

import { useState, useTransition, KeyboardEvent, useRef, useEffect } from "react";
import { Sparkles, Loader2, X, ArrowRight, ArrowLeft as ArrowLeftIcon, CheckCircle2, FileText, Brain, Send, Calendar, ChevronDown } from "lucide-react";
import { createJobAction } from "./action";
import InterviewSlotsEditor, { type SlotRow } from "@/components/InterviewSlotsEditor";

type Requirement = { text: string; excusable: boolean };

export default function ConversationalBuilder() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();

  // Step 1: basics + freeform requirement chat
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [chatEntries, setChatEntries] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Step 2: requirements with excusable toggle
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [description, setDescription] = useState("");

  // Step 3: final phase
  const [finalAction, setFinalAction] = useState("");
  const [scheduleInterview, setScheduleInterview] = useState(false);
  const [interviewSlots, setInterviewSlots] = useState<SlotRow[]>([]);
  const [requestCv, setRequestCv] = useState(false);
  const [screeningRigor, setScreeningRigor] = useState<"thorough" | "trusting">("thorough");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatEntries]);

  const addChatEntry = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim()) {
        setChatEntries(prev => [...prev, chatInput.trim()]);
        setChatInput("");
      }
    }
  };

  const removeChatEntry = (index: number) => {
    setChatEntries(prev => prev.filter((_, i) => i !== index));
  };

  const processRequirements = async () => {
    if (chatInput.trim()) {
      setChatEntries(prev => [...prev, chatInput.trim()]);
      setChatInput("");
    }
    const combined = [...chatEntries, chatInput.trim()].filter(Boolean).join(". ");
    if (combined.trim().length < 5 || !title.trim() || !location.trim()) {
      setProcessError("Add a title, location, and at least one thing you want the candidate to have.");
      return;
    }
    setIsProcessing(true);
    setProcessError("");
    try {
      const response = await fetch("/api/job-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: combined, title, location }),
      });
      const data = await response.json();
      if (!response.ok) {
        setProcessError(data.error || "Couldn't process that. Try again or use the guided form.");
        return;
      }
      setRequirements((data.requirements || []).map((text: string) => ({ text, excusable: false })));
      if (data.description) setDescription(data.description);
      setStep(2);
    } catch {
      setProcessError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const setRequirementExcusable = (index: number, excusable: boolean) => {
    setRequirements(prev => prev.map((r, i) => i === index ? { ...r, excusable } : r));
  };

  const requireEverything = () => {
    setRequirements(prev => prev.map(r => ({ ...r, excusable: false })));
  };

  const handlePublish = () => {
    const mustHaves = requirements.filter(r => !r.excusable).map(r => r.text);
    const niceToHaves = requirements.filter(r => r.excusable).map(r => r.text);

    if (mustHaves.length === 0) {
      alert("At least one requirement needs to stay a dealbreaker. Mark fewer items as excusable, or go back and add more.");
      return;
    }
    if (scheduleInterview && interviewSlots.length === 0) {
      alert("Add at least one interview time and a meeting link, or turn off interview scheduling.");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          title,
          location,
          jobType,
          description: description || `We're hiring a ${title} in ${location}.`,
          mustHaves: mustHaves.map(item => `- ${item}`).join("\n"),
          niceToHaves: niceToHaves.map(item => `- ${item}`).join("\n"),
          finalAction: scheduleInterview ? "" : finalAction,
          interviewSlots: scheduleInterview ? interviewSlots : [],
          requestCv,
          screeningRigor,
        };
        await createJobAction(payload);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="space-y-6 md:space-y-8">

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
        <span className={step === 1 ? "text-primary" : ""}>1. Tell Nova what you want</span>
        <ArrowRight size={14} />
        <span className={step === 2 ? "text-primary" : ""}>2. What can slide?</span>
        <ArrowRight size={14} />
        <span className={step === 3 ? "text-primary" : ""}>3. Final details</span>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-5 md:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Job Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Where is this job? e.g. Remote, Lagos, or London office" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Employment Type</label>
            <div className="relative">
              <select value={jobType} onChange={e => setJobType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer pr-10">
                <option>Full-time</option>
                <option>Contract</option>
                <option>Part-time</option>
                <option>Internship</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <label className="text-sm font-bold text-slate-700">What do you want the candidate to have?</label>
            </div>
            <p className="text-xs text-slate-500">
              Just tell Nova, one thing at a time — "must be in Lagos or close by", "5+ years in backend engineering", "comfortable leading a small team". Press Enter after each one. Nova will sort it out from here.
            </p>

            <div className={`rounded-2xl overflow-y-auto transition-all ${chatEntries.length === 0 ? "border-2 border-dashed border-slate-200 bg-white flex items-center justify-center py-6" : "bg-slate-50 border border-slate-200 p-4 space-y-2 max-h-72"}`}>
              {chatEntries.length === 0 && (
                <p className="text-xs text-slate-400 text-center px-4">Nothing added yet — start typing below.</p>
              )}
              {chatEntries.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm animate-in fade-in slide-in-from-bottom-1">
                  <span className="text-sm text-slate-800 flex-1">{entry}</span>
                  <button type="button" onClick={() => removeChatEntry(i)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0 mt-0.5">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="flex items-end gap-2">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={addChatEntry}
                rows={2}
                placeholder="Type one requirement and hit Enter..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              />
              <button
                type="button"
                onClick={() => { if (chatInput.trim()) { setChatEntries(prev => [...prev, chatInput.trim()]); setChatInput(""); } }}
                className="shrink-0 w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Send size={16} />
              </button>
            </div>

            {processError && <p className="text-xs text-red-600 font-medium">{processError}</p>}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={processRequirements}
              disabled={isProcessing}
              className="bg-slate-900 text-white font-bold px-8 py-3.5 rounded-full hover:bg-primary transition-all shadow-lg hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isProcessing ? <><Loader2 size={18} className="animate-spin" /> Reading through it...</> : <>That's everything <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-5 md:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">What can the candidate be missing?</h2>
            <p className="text-sm text-slate-500 mt-1">Here's what Nova heard. Check anything the candidate can lack and still be considered — everything left unchecked is a dealbreaker.</p>
          </div>

          <button
            type="button"
            onClick={requireEverything}
            className="text-xs font-bold text-primary hover:underline"
          >
            They need all of it — nothing's negotiable
          </button>

          <div className="space-y-2">
            {requirements.map((req, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${req.excusable ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
                <p className="flex-1 text-sm font-medium text-slate-900">{req.text}</p>
                <div className="inline-flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRequirementExcusable(i, false)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${!req.excusable ? "bg-red-500 text-white" : "text-slate-400 hover:text-red-500"}`}
                  >
                    Must have
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequirementExcusable(i, true)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${req.excusable ? "bg-primary text-white" : "text-slate-400 hover:text-primary"}`}
                  >
                    Nice to have
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-bold text-slate-700">Candidate-Facing Summary</label>
            <p className="text-xs text-slate-500">Nova drafted this from what you typed — edit as needed.</p>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">
              <ArrowLeftIcon size={16} /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="bg-slate-900 text-white font-bold px-8 py-3.5 rounded-full hover:bg-primary transition-all shadow-lg hover:shadow-primary/30 active:scale-95 flex items-center gap-2"
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-5 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><CheckCircle2 size={20} /></div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">What happens when they qualify?</h2>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3 items-start">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-600 shrink-0"><Calendar size={18} /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">Enable AI Interview Scheduling</p>
                <p className="text-xs text-slate-500 mt-1">Set real times and Nova offers them to every candidate who qualifies, right in the chat.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input type="checkbox" className="sr-only peer" checked={scheduleInterview} onChange={() => setScheduleInterview(!scheduleInterview)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {scheduleInterview ? (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-top-2">
              <InterviewSlotsEditor onChange={setInterviewSlots} />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Or just paste a link (Calendly, Google Meet, a WhatsApp group invite) or type plain instructions. Leave blank to just say we&apos;ll be in touch.
              </p>
              <input
                value={finalAction}
                onChange={e => setFinalAction(e.target.value)}
                placeholder="e.g. https://calendly.com/you/interview"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100">
            <div className="flex gap-3 items-start">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-600 shrink-0"><FileText size={18} /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">Ask for a CV during screening</p>
                <p className="text-xs text-slate-500 mt-1">Nova will ask for it to back up claims (like a degree or years of experience) and skip questions the CV already answers.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" className="sr-only peer" checked={requestCv} onChange={() => setRequestCv(!requestCv)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex gap-3 items-start pt-6 border-t border-slate-100">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-600 shrink-0"><Brain size={18} /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Screening style</p>
              <p className="text-xs text-slate-500 mt-1 mb-3">Should Nova double-check what the candidate says, or just take their word for it?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" onClick={() => setScreeningRigor('thorough')} className={`text-left p-3.5 rounded-xl border-2 transition-all ${screeningRigor === 'thorough' ? 'border-primary bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <p className="text-sm font-bold text-slate-900">Thorough</p>
                  <p className="text-xs text-slate-500 mt-0.5">For skill-based must-haves, one quick question anyone real in that field would find easy. Facts like location or a degree are never probed either way.</p>
                </button>
                <button type="button" onClick={() => setScreeningRigor('trusting')} className={`text-left p-3.5 rounded-xl border-2 transition-all ${screeningRigor === 'trusting' ? 'border-primary bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <p className="text-sm font-bold text-slate-900">Trusting</p>
                  <p className="text-xs text-slate-500 mt-0.5">Keeps it chill on skill claims — asks once, takes a clear answer at face value.</p>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button type="button" onClick={() => setStep(2)} className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">
              <ArrowLeftIcon size={16} /> Back
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPending}
              className="bg-slate-900 text-white font-bold px-8 py-3.5 rounded-full hover:bg-primary transition-all shadow-lg hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isPending ? <><Loader2 size={18} className="animate-spin" /> Publishing...</> : <><CheckCircle2 size={18} /> Publish Job Post</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useTransition, KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Briefcase, Target, CheckCircle2, Loader2, X, FileText, Gauge, MessageSquareText, ListChecks, Calendar, AlertTriangle } from "lucide-react";
import { createJobAction } from "./action";
import ConversationalBuilder from "./ConversationalBuilder";

export default function NewJobPage() {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'manual' | 'conversational'>('manual');

  // Basic Info State
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    jobType: "Full-time",
    description: "",
  });

  // Scheduling States
  const [scheduleInterview, setScheduleInterview] = useState(false);
  const [schedulingType, setSchedulingType] = useState<'single_link' | 'multiple_links' | 'time_slots'>('single_link');
  const [singleLink, setSingleLink] = useState("");
  const [multipleLinks, setMultipleLinks] = useState<string[]>([]);
  const [multipleLinksInput, setMultipleLinksInput] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [timeSlotInput, setTimeSlotInput] = useState("");

  const [requestCv, setRequestCv] = useState(false);
  const [screeningRigor, setScreeningRigor] = useState<"thorough" | "trusting">("thorough");

  // Premium List States
  const [mustHaves, setMustHaves] = useState<string[]>([]);
  const [mustHaveInput, setMustHaveInput] = useState("");
  const [niceToHaves, setNiceToHaves] = useState<string[]>([]);
  const [niceToHaveInput, setNiceToHaveInput] = useState("");

  const [showAutofill, setShowAutofill] = useState(false);
  const [autofillText, setAutofillText] = useState("");
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillError, setAutofillError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>, type: 'must' | 'nice' | 'link' | 'slot') => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      if (type === 'must' && mustHaveInput.trim()) {
        setMustHaves(prev => [...prev, mustHaveInput.trim()]);
        setMustHaveInput("");
      } else if (type === 'nice' && niceToHaveInput.trim()) {
        setNiceToHaves(prev => [...prev, niceToHaveInput.trim()]);
        setNiceToHaveInput("");
      } else if (type === 'link' && multipleLinksInput.trim()) {
        setMultipleLinks(prev => [...prev, multipleLinksInput.trim()]);
        setMultipleLinksInput("");
      } else if (type === 'slot' && timeSlotInput.trim()) {
        setTimeSlots(prev => [...prev, timeSlotInput.trim()]);
        setTimeSlotInput("");
      }
    }
  };

  const removeTag = (index: number, type: 'must' | 'nice' | 'link' | 'slot') => {
    if (type === 'must') setMustHaves(prev => prev.filter((_, i) => i !== index));
    else if (type === 'nice') setNiceToHaves(prev => prev.filter((_, i) => i !== index));
    else if (type === 'link') setMultipleLinks(prev => prev.filter((_, i) => i !== index));
    else if (type === 'slot') setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mustHaves.length === 0) {
      alert("Please add at least one Absolute Dealbreaker.");
      return;
    }

    let computedFinalAction = "";
    if (scheduleInterview) {
      if (schedulingType === 'single_link') computedFinalAction = singleLink;
      else if (schedulingType === 'multiple_links') computedFinalAction = `Please choose one of the following interview links:\n${multipleLinks.map(l => `- ${l}`).join('\n')}`;
      else if (schedulingType === 'time_slots') computedFinalAction = `Please let me know which of these times works best for you:\n${timeSlots.map(t => `- ${t}`).join('\n')}`;
    }

    startTransition(async () => {
      try {
        const payload = {
          ...formData,
          finalAction: computedFinalAction,
          scheduleInterview,
          mustHaves: mustHaves.map(item => `- ${item}`).join('\n'),
          niceToHaves: niceToHaves.map(item => `- ${item}`).join('\n'),
          requestCv,
          screeningRigor,
        };
        await createJobAction(payload);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  };

  const handleAutoFillClick = () => {
    setAutofillError("");
    setShowAutofill(true);
  };

  const runAutofill = async () => {
    if (autofillText.trim().length < 20) {
      setAutofillError("Paste a bit more of the job description first.");
      return;
    }
    setIsAutofilling(true);
    setAutofillError("");
    try {
      const response = await fetch('/api/autofill-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: autofillText }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAutofillError(data.error || "Couldn't parse that. Please try again or fill in manually.");
        return;
      }
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        location: data.location || prev.location,
        jobType: data.jobType || prev.jobType,
        description: data.description || prev.description,
      }));
      if (Array.isArray(data.mustHaves)) setMustHaves(data.mustHaves);
      if (Array.isArray(data.niceToHaves)) setNiceToHaves(data.niceToHaves);
      setShowAutofill(false);
      setAutofillText("");
    } catch (error) {
      setAutofillError("Something went wrong. Please try again or fill in manually.");
    } finally {
      setIsAutofilling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2 md:mb-4">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Create AI Job Post</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium mt-1">Define the role and let Nova handle the screening.</p>
        </div>
      </div>

      {/* Format toggle */}
      <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-full mb-8">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ListChecks size={15} /> Guided Form
        </button>
        <button
          type="button"
          onClick={() => setMode('conversational')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === 'conversational' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <MessageSquareText size={15} /> Just Tell Nova
        </button>
      </div>

      {mode === 'conversational' && <ConversationalBuilder />}

      {mode === 'manual' && (
      <>
      {/* AI Auto-fill Magic Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-5 md:p-6 mb-8 flex flex-col md:flex-row items-center gap-4 md:gap-6 shadow-sm">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0">
          <Sparkles size={24} strokeWidth={2.5} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">Have a Job Description?</h3>
          <p className="text-xs md:text-sm text-slate-600 font-medium mt-1">Paste your messy JD and we'll instantly extract the dealbreakers and requirements.</p>
        </div>
        <button 
          type="button"
          onClick={handleAutoFillClick}
          className="w-full md:w-auto shrink-0 bg-white text-primary font-bold px-6 py-3 rounded-full shadow-sm hover:shadow-md border border-blue-100 transition-all active:scale-95"
        >
          Auto-fill with AI
        </button>
      </div>

      {/* Autofill Modal */}
      {showAutofill && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !isAutofilling && setShowAutofill(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 md:p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Paste the job description</h3>
            <p className="text-xs text-slate-500 mb-4">Paste it as-is, messy formatting and all — we'll pull out the structured fields.</p>
            <textarea
              value={autofillText}
              onChange={e => setAutofillText(e.target.value)}
              rows={10}
              placeholder="Paste the full job description here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            />
            {autofillError && <p className="text-xs text-red-600 mt-2 font-medium">{autofillError}</p>}
            <div className="flex items-center justify-end gap-3 mt-5">
              <button type="button" onClick={() => setShowAutofill(false)} disabled={isAutofilling} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={runAutofill}
                disabled={isAutofilling}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-full hover:bg-primary transition-all disabled:opacity-70 flex items-center gap-2"
              >
                {isAutofilling ? <><Loader2 size={16} className="animate-spin" /> Reading...</> : "Extract Details"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        
        {/* Section 1: The Basics */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Briefcase size={20} /></div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">1. The Basics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-5 md:mb-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Job Title</label>
              <input required name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Senior Frontend Engineer" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Location</label>
              <input required name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Remote, Lagos, London" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
          </div>

          <div className="space-y-2 mb-5 md:mb-6">
            <label className="text-sm font-bold text-slate-700">Employment Type</label>
            <select name="jobType" value={formData.jobType} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer">
              <option>Full-time</option>
              <option>Contract</option>
              <option>Part-time</option>
              <option>Internship</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Candidate-Facing Summary</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="We are looking for a developer to build modern web interfaces..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" />
          </div>
        </div>

        {/* Section 2: AI Guardrails */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-50 p-2 rounded-lg text-red-500"><Target size={20} /></div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">2. AI Screening Guardrails</h2>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                Absolute Dealbreakers <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Must Have</span>
              </label>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all">
                {mustHaves.map((tag, index) => (
                  <div key={index} className="bg-white border border-red-200 text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm animate-in zoom-in-50 duration-200">
                    {tag}
                    <button type="button" onClick={() => removeTag(index, 'must')} className="text-red-400 hover:text-red-700 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <input 
                  type="text" 
                  value={mustHaveInput}
                  onChange={e => setMustHaveInput(e.target.value)}
                  onKeyDown={e => handleAddTag(e, 'must')}
                  placeholder={mustHaves.length === 0 ? "e.g. Minimum 3 years React (Press Enter)" : "Add another..."} 
                  className="flex-1 min-w-[200px] bg-transparent border-none outline-none px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                Nice-to-Haves <span className="bg-blue-100 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Bonus</span>
              </label>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                {niceToHaves.map((tag, index) => (
                  <div key={index} className="bg-white border border-blue-200 text-primary text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm animate-in zoom-in-50 duration-200">
                    {tag}
                    <button type="button" onClick={() => removeTag(index, 'nice')} className="text-blue-400 hover:text-primary transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <input 
                  type="text" 
                  value={niceToHaveInput}
                  onChange={e => setNiceToHaveInput(e.target.value)}
                  onKeyDown={e => handleAddTag(e, 'nice')}
                  placeholder={niceToHaves.length === 0 ? "e.g. Experience with Supabase (Press Enter)" : "Add another..."} 
                  className="flex-1 min-w-[200px] bg-transparent border-none outline-none px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: What happens when they qualify */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><CheckCircle2 size={20} /></div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">3. What happens when they qualify?</h2>
          </div>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex gap-3 items-start">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-600 shrink-0"><Calendar size={18} /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">Enable AI Interview Scheduling</p>
                <p className="text-xs text-slate-500 mt-1">If enabled, Nova will handle handing over the scheduling links or time slots.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input type="checkbox" className="sr-only peer" checked={scheduleInterview} onChange={() => setScheduleInterview(!scheduleInterview)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Conditional Scheduling Configuration */}
          {!scheduleInterview ? (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex gap-3 items-start animate-in fade-in">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p><strong>Note:</strong> Nova will not schedule interviews. You will need to manually reach out to qualified candidates yourself to coordinate the next steps.</p>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-5 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="radio" className="text-primary focus:ring-primary" checked={schedulingType === 'single_link'} onChange={() => setSchedulingType('single_link')} /> Single Link
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="radio" className="text-primary focus:ring-primary" checked={schedulingType === 'multiple_links'} onChange={() => setSchedulingType('multiple_links')} /> Multiple Links
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="radio" className="text-primary focus:ring-primary" checked={schedulingType === 'time_slots'} onChange={() => setSchedulingType('time_slots')} /> Specific Times
                </label>
              </div>

              {schedulingType === 'single_link' && (
                <div className="animate-in fade-in">
                  <input
                    value={singleLink}
                    onChange={(e) => setSingleLink(e.target.value)}
                    placeholder="e.g. Please book a time here: https://calendly.com/you/interview"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              )}

              {schedulingType === 'multiple_links' && (
                <div className="animate-in fade-in space-y-2">
                  <p className="text-xs text-slate-500">Add options (e.g. "Tech Interview: link1" or "Cultural Fit: link2"). Press Enter to add.</p>
                  <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                    {multipleLinks.map((tag, index) => (
                      <div key={index} className="bg-slate-100 border border-slate-200 text-slate-800 text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
                        {tag}
                        <button type="button" onClick={() => removeTag(index, 'link')} className="text-slate-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                      </div>
                    ))}
                    <input 
                      type="text" 
                      value={multipleLinksInput}
                      onChange={e => setMultipleLinksInput(e.target.value)}
                      onKeyDown={e => handleAddTag(e, 'link')}
                      placeholder="Add a link and press Enter..." 
                      className="flex-1 min-w-[200px] bg-transparent border-none outline-none px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              {schedulingType === 'time_slots' && (
                <div className="animate-in fade-in space-y-2">
                  <p className="text-xs text-slate-500">Provide specific dates and times (e.g. "Oct 12 at 2:00 PM"). Press Enter to add.</p>
                  <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                    {timeSlots.map((tag, index) => (
                      <div key={index} className="bg-slate-100 border border-slate-200 text-slate-800 text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
                        {tag}
                        <button type="button" onClick={() => removeTag(index, 'slot')} className="text-slate-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                      </div>
                    ))}
                    <input 
                      type="text" 
                      value={timeSlotInput}
                      onChange={e => setTimeSlotInput(e.target.value)}
                      onKeyDown={e => handleAddTag(e, 'slot')}
                      placeholder="Add a time slot and press Enter..." 
                      className="flex-1 min-w-[200px] bg-transparent border-none outline-none px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="flex gap-3 items-start">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-600 shrink-0"><FileText size={18} /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">Ask for a CV during screening</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" className="sr-only peer" checked={requestCv} onChange={() => setRequestCv(!requestCv)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

        </div>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-3 md:gap-4 pt-4">
          <Link href="/dashboard" className="w-full md:w-auto text-center px-6 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full md:w-auto bg-slate-900 text-white font-bold px-8 py-3.5 rounded-full hover:bg-primary transition-all shadow-lg hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <><Loader2 size={18} className="animate-spin" /> Publishing...</>
            ) : (
              <><CheckCircle2 size={18} /> Publish Job Post</>
            )}
          </button>
        </div>

      </form>
      </>
      )}
    </div>
  );
}

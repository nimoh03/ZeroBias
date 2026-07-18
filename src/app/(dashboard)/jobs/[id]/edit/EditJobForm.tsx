"use client";

import { useState, useTransition, KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Target, CheckCircle2, Loader2, X, FileText, Trash2, Calendar, AlertTriangle, PauseCircle, PlayCircle } from "lucide-react";
import { updateJobAction, deleteJobAction, setJobStatusAction } from "./action";
import InterviewSlotsEditor, { type SlotRow } from "@/components/InterviewSlotsEditor";

type InitialData = {
  title: string;
  location: string;
  jobType: string;
  description: string;
  finalAction: string;
  interviewSlots?: SlotRow[];
  status?: "active" | "paused";
  scheduleInterview?: boolean;
  requestCv: boolean;
  screeningRigor: "thorough" | "trusting";
  mustHaves: string[];
  niceToHaves: string[];
};

export default function EditJobForm({
  jobId,
  initialData,
  publicSlug,
}: {
  jobId: string;
  initialData: InitialData;
  publicSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const [formData, setFormData] = useState({
    title: initialData.title,
    location: initialData.location,
    jobType: initialData.jobType,
    description: initialData.description,
  });

  // Setup schedule parsing (if a previous finalAction or slot template
  // existed, default to the mode that matches what's already saved)
  const hasExistingSlots = (initialData.interviewSlots?.length ?? 0) > 0;
  const hasExistingAction = !!initialData.finalAction;
  const [scheduleInterview, setScheduleInterview] = useState(initialData.scheduleInterview ?? (hasExistingSlots || hasExistingAction));
  const [schedulingType, setSchedulingType] = useState<'single_link' | 'multiple_links' | 'time_slots'>(hasExistingSlots ? 'time_slots' : 'single_link');
  const [singleLink, setSingleLink] = useState(hasExistingSlots ? "" : initialData.finalAction || "");
  const [multipleLinks, setMultipleLinks] = useState<string[]>([]);
  const [multipleLinksInput, setMultipleLinksInput] = useState("");
  const [interviewSlots, setInterviewSlots] = useState<SlotRow[]>(initialData.interviewSlots || []);

  const [requestCv, setRequestCv] = useState(initialData.requestCv);
  const [screeningRigor, setScreeningRigor] = useState<"thorough" | "trusting">(initialData.screeningRigor);

  const [jobStatus, setJobStatus] = useState<"active" | "paused">(initialData.status || "active");
  const [isTogglingStatus, startStatusTransition] = useTransition();

  const handleToggleStatus = (jobIdForToggle: string) => {
    const next = jobStatus === "paused" ? "active" : "paused";
    startStatusTransition(async () => {
      try {
        await setJobStatusAction(jobIdForToggle, next);
        setJobStatus(next);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  };

  const [mustHaves, setMustHaves] = useState<string[]>(initialData.mustHaves);
  const [mustHaveInput, setMustHaveInput] = useState("");
  const [niceToHaves, setNiceToHaves] = useState<string[]>(initialData.niceToHaves);
  const [niceToHaveInput, setNiceToHaveInput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>, type: 'must' | 'nice' | 'link') => {
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
      }
    }
  };

  const removeTag = (index: number, type: 'must' | 'nice' | 'link') => {
    if (type === 'must') setMustHaves(prev => prev.filter((_, i) => i !== index));
    else if (type === 'nice') setNiceToHaves(prev => prev.filter((_, i) => i !== index));
    else if (type === 'link') setMultipleLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mustHaves.length === 0) {
      alert("Please add at least one Absolute Dealbreaker.");
      return;
    }

    let computedFinalAction = "";
    let computedInterviewSlots: SlotRow[] = [];
    if (scheduleInterview) {
      if (schedulingType === 'single_link') computedFinalAction = singleLink;
      else if (schedulingType === 'multiple_links') computedFinalAction = `Please choose one of the following interview links:\n${multipleLinks.map(l => `- ${l}`).join('\n')}`;
      else if (schedulingType === 'time_slots') {
        computedInterviewSlots = interviewSlots;
        if (computedInterviewSlots.length === 0) {
          alert("Add at least one interview time and a meeting link, or switch to Single Link.");
          return;
        }
      }
    }

    startTransition(async () => {
      try {
        const payload = {
          ...formData,
          finalAction: computedFinalAction,
          interviewSlots: computedInterviewSlots,
          mustHaves: mustHaves.map(item => `- ${item}`).join('\n'),
          niceToHaves: niceToHaves.map(item => `- ${item}`).join('\n'),
          requestCv,
          screeningRigor,
        };
        await updateJobAction(jobId, payload);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this job posting? This can't be undone.")) return;
    startDeleteTransition(async () => {
      try {
        await deleteJobAction(jobId);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2 md:mb-4">
            <ArrowLeft size={16} /> Back to Jobs
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Edit Job Post</h1>
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${jobStatus === "paused" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
              {jobStatus === "paused" ? "Paused" : "Active"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleToggleStatus(jobId)}
          disabled={isTogglingStatus}
          className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-full border transition-all disabled:opacity-60 ${
            jobStatus === "paused"
              ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
              : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
          }`}
        >
          {isTogglingStatus ? (
            <Loader2 size={16} className="animate-spin" />
          ) : jobStatus === "paused" ? (
            <PlayCircle size={16} />
          ) : (
            <PauseCircle size={16} />
          )}
          {jobStatus === "paused" ? "Resume Job" : "Pause Job"}
        </button>
      </div>

      {jobStatus === "paused" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex gap-3 items-start">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>This job is paused. The public application link stays live but shows candidates it's no longer accepting applications. Existing candidates and their interview bookings are unaffected.</p>
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
              <input required name="title" value={formData.title} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Location</label>
              <input required name="location" value={formData.location} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
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
            <textarea required name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" />
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
                    <button type="button" onClick={() => removeTag(index, 'must')} className="text-red-400 hover:text-red-700 transition-colors"><X size={14} /></button>
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
                    <button type="button" onClick={() => removeTag(index, 'nice')} className="text-blue-400 hover:text-primary transition-colors"><X size={14} /></button>
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
                <div className="animate-in fade-in">
                  <p className="text-xs text-slate-500 mb-3">Set real dates and times — Nova will let each qualified candidate pick whichever one works for them, right in the chat.</p>
                  <InterviewSlotsEditor initialSlots={initialData.interviewSlots} onChange={setInterviewSlots} />
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

        {publicSlug && (
          <p className="text-xs text-slate-400 text-center">
            Public screening link stays the same: <span className="font-mono">/apply/{publicSlug}</span>
          </p>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-3 md:gap-4 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isPending}
            className="w-full md:w-auto text-center px-6 py-3.5 text-sm font-bold text-red-500 hover:text-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete Job
          </button>

          <div className="flex flex-col-reverse md:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
            <Link href="/jobs" className="w-full md:w-auto text-center px-6 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending || isDeleting}
              className="w-full md:w-auto bg-slate-900 text-white font-bold px-8 py-3.5 rounded-full hover:bg-primary transition-all shadow-lg hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <><Loader2 size={18} className="animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle2 size={18} /> Save Changes</>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

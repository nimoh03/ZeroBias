"use client";

import { useState, useTransition, KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Briefcase, Target, CheckCircle2, Loader2, X } from "lucide-react";
import { createJobAction } from "./action";

export default function NewJobPage() {
  const [isPending, startTransition] = useTransition();
  
  // Basic Info State
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    jobType: "Full-time",
    description: "",
    finalAction: "",
  });

  // Premium List States (Arrays instead of strings)
  const [mustHaves, setMustHaves] = useState<string[]>([]);
  const [mustHaveInput, setMustHaveInput] = useState("");
  
  const [niceToHaves, setNiceToHaves] = useState<string[]>([]);
  const [niceToHaveInput, setNiceToHaveInput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Magic Enter-to-Add Logic
  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>, type: 'must' | 'nice') => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Stop the form from submitting
      
      if (type === 'must' && mustHaveInput.trim()) {
        setMustHaves(prev => [...prev, mustHaveInput.trim()]);
        setMustHaveInput("");
      } else if (type === 'nice' && niceToHaveInput.trim()) {
        setNiceToHaves(prev => [...prev, niceToHaveInput.trim()]);
        setNiceToHaveInput("");
      }
    }
  };

  const removeTag = (index: number, type: 'must' | 'nice') => {
    if (type === 'must') {
      setMustHaves(prev => prev.filter((_, i) => i !== index));
    } else {
      setNiceToHaves(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure they added at least one dealbreaker for the AI
    if (mustHaves.length === 0) {
      alert("Please add at least one Absolute Dealbreaker.");
      return;
    }

    startTransition(async () => {
      try {
        // Format the arrays into clean text for the database/AI
        const payload = {
          ...formData,
          mustHaves: mustHaves.map(item => `- ${item}`).join('\n'),
          niceToHaves: niceToHaves.map(item => `- ${item}`).join('\n'),
        };
        await createJobAction(payload);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  };

  const handleAutoFillClick = () => {
    alert("AI Auto-fill will be wired up to Groq in the next phase! For now, please type manually.");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        
        {/* Section 1: The Basics */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-5 md:p-8 shadow-sm">
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
            <p className="text-xs text-slate-500 mb-2">If the candidate asks "What is this role?", the AI will reply with this.</p>
            <textarea required name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="We are looking for a developer to build modern web interfaces..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" />
          </div>
        </div>

        {/* Section 2: AI Guardrails */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-5 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-50 p-2 rounded-lg text-red-500"><Target size={20} /></div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">2. AI Screening Guardrails</h2>
          </div>

          <div className="space-y-8">
            
            {/* Must Haves Input */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                Absolute Dealbreakers <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Must Have</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">If they fail any of these, the AI rejects them. Type a requirement and hit Enter.</p>
              
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
                  placeholder={mustHaves.length === 0 ? "e.g. Minimum 3 years React experience (Press Enter)" : "Add another..."} 
                  className="flex-1 min-w-[200px] bg-transparent border-none outline-none px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Nice to Haves Input */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                Nice-to-Haves <span className="bg-blue-100 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Bonus</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">The AI will probe for these to boost scores, but won't reject if they are missing.</p>
              
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
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-5 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><CheckCircle2 size={20} /></div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">3. What happens when they qualify?</h2>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Paste a link (Calendly, Google Meet, a WhatsApp group invite — anything) or just type plain instructions.
            Qualified candidates see this the moment Nova finishes screening them. Leave blank to just say "we'll be in touch."
          </p>
          <input
            name="finalAction"
            value={formData.finalAction}
            onChange={handleChange}
            placeholder="e.g. https://calendly.com/you/interview or 'Reply to this WhatsApp group: ...'"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
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
    </div>
  );
}
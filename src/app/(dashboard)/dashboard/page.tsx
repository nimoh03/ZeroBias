import { createClient } from "@/utils/supabase/server";
import Link from 'next/link';
import { 
  FileText, Users, Activity, Sparkles, 
  Plus, FolderOpen, Briefcase, CheckCircle2, XCircle, Clock, ArrowRight,
} from 'lucide-react';

export default async function DashboardOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();
  const { data: jobs } = await supabase.from('jobs').select('*').eq('recruiter_id', user?.id);

  const firstName = profile?.full_name?.split(' ')[0] || 'Recruiter';
  const hasJobs = jobs && jobs.length > 0;
  const activeJobsCount = jobs?.length || 0;

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back, {firstName}</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {hasJobs ? `You have ${activeJobsCount} active job posts running.` : "Let's get your AI recruiting engine started."}
        </p>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
            <FileText size={22} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Applications Today</p>
            <p className="text-2xl font-extrabold text-slate-900 truncate">0</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Qualified</p>
            <p className="text-2xl font-extrabold text-slate-900 truncate">0</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <XCircle size={22} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Rejected</p>
            <p className="text-2xl font-extrabold text-slate-900 truncate">0</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock size={22} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Needs Review</p>
            <p className="text-2xl font-extrabold text-slate-900 truncate">0</p>
          </div>
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Job Listings Column */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Active Job Openings</h3>
            {hasJobs && (
              <button className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                View all jobs <ArrowRight size={16} />
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {hasJobs ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-12">
                <p className="text-slate-500 font-medium">Jobs will appear here once fully wired up.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 min-h-[300px] flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 shadow-inner group-hover:scale-105 transition-transform duration-500 mb-6 border border-slate-100">
                  <FolderOpen size={36} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">No jobs active yet</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mb-8">
                  HireFlow AI is standing by. Create your first job posting to generate a public link.
                </p>
                <Link 
                  href="/jobs/new" 
                  className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-primary transition-colors shadow-md hover:shadow-primary/20"
                >
                  <Plus size={18} strokeWidth={2.5} /> Create First Job
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar Activity & Insights */}
        <aside className="lg:col-span-4 space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
          
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 text-center py-12">
              <p className="text-sm font-medium text-slate-500">No recent activity yet.<br/>Your AI assistant is waiting.</p>
            </div>
            <button className="w-full py-3.5 bg-slate-50 text-sm font-bold text-slate-500 hover:text-primary transition-colors border-t border-slate-200">
              View Full Activity Log
            </button>
          </div>

          {/* AI Insights Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary to-blue-700 p-6 rounded-2xl text-white shadow-lg shadow-primary/20">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-blue-200" />
                <p className="text-xs font-extrabold uppercase tracking-widest text-blue-200">AI Insights</p>
              </div>
              <h4 className="text-lg font-bold leading-tight mb-2">Ready to screen candidates.</h4>
              <p className="text-sm text-blue-100 font-medium leading-relaxed">
                Once candidates apply, Nova will highlight "Diamond" matches based on your criteria.
              </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
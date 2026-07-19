"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, LayoutDashboard, Briefcase, Users, BarChart3, Settings, Plus, HelpCircle, LogOut, Star } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 p-5 w-64 bg-[#f8fafc] border-r border-slate-200 z-50">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm shrink-0">
          <Zap size={18} className="text-white" fill="currentColor" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">HireFlow AI</h1>
      </div>
      
      <nav className="flex-1 space-y-1.5">
        <Link 
          href="/dashboard" 
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
            pathname === '/dashboard' 
              ? 'bg-primary text-white shadow-md shadow-primary/20' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard size={18} strokeWidth={pathname === '/dashboard' ? 2.5 : 2} />
          <span className="text-sm font-semibold">Dashboard</span>
        </Link>
        
        <Link 
          href="/jobs" 
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
            pathname.startsWith('/jobs') 
              ? 'bg-primary text-white shadow-md shadow-primary/20' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase size={18} strokeWidth={pathname.startsWith('/jobs') ? 2.5 : 2} />
          <span className="text-sm font-semibold">Jobs</span>
        </Link>

        <Link 
          href="/candidates" 
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
            pathname.startsWith('/candidates') 
              ? 'bg-primary text-white shadow-md shadow-primary/20' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users size={18} strokeWidth={pathname.startsWith('/candidates') ? 2.5 : 2} />
          <span className="text-sm font-semibold">Candidates</span>
        </Link>

        <Link
          href="/shortlisted"
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
            pathname.startsWith('/shortlisted')
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Star size={18} strokeWidth={pathname.startsWith('/shortlisted') ? 2.5 : 2} />
          <span className="text-sm font-semibold">Shortlisted</span>
        </Link>

      <Link 
  href="/analytics" 
  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
    pathname.startsWith('/analytics') 
      ? 'bg-primary text-white shadow-md shadow-primary/20' 
      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
  }`}
>
  <BarChart3 size={18} strokeWidth={pathname.startsWith('/analytics') ? 2.5 : 2} />
  <span className="text-sm font-semibold">Analytics</span>
</Link>

        <Link 
          href="/settings" 
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
            pathname.startsWith('/settings') 
              ? 'bg-primary text-white shadow-md shadow-primary/20' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings size={18} strokeWidth={pathname.startsWith('/settings') ? 2.5 : 2} />
          <span className="text-sm font-semibold">Settings</span>
        </Link>
      </nav>
      
      <div className="mt-auto space-y-4">
        <Link href="/jobs/new" className="w-full bg-blue-50 text-primary py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors border border-blue-100">
          <Plus size={18} strokeWidth={2.5} />
          New Job Post
        </Link>
        
        <div className="pt-4 border-t border-slate-200 space-y-1">
          <Link href="/help" className="flex items-center gap-3 text-slate-500 px-4 py-2 hover:bg-slate-100 transition-colors rounded-xl">
            <HelpCircle size={18} />
            <span className="text-sm font-medium">Help Center</span>
          </Link>
          <button className="w-full flex items-center gap-3 text-slate-500 px-4 py-2 hover:bg-slate-100 hover:text-red-600 transition-colors rounded-xl">
            <LogOut size={18} />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
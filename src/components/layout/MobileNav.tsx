"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Users, BarChart3, Settings, Star } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-outline-variant pb-safe">
      <div className="flex justify-around items-center px-1 py-3">
        <Link 
          href="/dashboard" 
          className={`flex flex-col items-center gap-1 transition-colors ${pathname === '/dashboard' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <div className={pathname === '/dashboard' ? 'bg-primary-container/10 p-1.5 rounded-full' : 'p-1.5'}>
            <LayoutDashboard size={20} />
          </div>
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        <Link 
          href="/jobs" 
          className={`flex flex-col items-center gap-1 transition-colors ${pathname.startsWith('/jobs') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <div className={pathname.startsWith('/jobs') ? 'bg-primary-container/10 p-1.5 rounded-full' : 'p-1.5'}>
            <Briefcase size={20} />
          </div>
          <span className="text-[10px] font-medium">Jobs</span>
        </Link>
        
        <Link 
          href="/candidates" 
          className={`flex flex-col items-center gap-1 transition-colors ${pathname.startsWith('/candidates') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <div className={pathname.startsWith('/candidates') ? 'bg-primary-container/10 p-1.5 rounded-full' : 'p-1.5'}>
            <Users size={20} />
          </div>
          <span className="text-[10px] font-medium">Candidates</span>
        </Link>

        <Link
          href="/shortlisted"
          className={`flex flex-col items-center gap-1 transition-colors ${pathname.startsWith('/shortlisted') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <div className={pathname.startsWith('/shortlisted') ? 'bg-primary-container/10 p-1.5 rounded-full' : 'p-1.5'}>
            <Star size={20} />
          </div>
          <span className="text-[10px] font-medium">Shortlist</span>
        </Link>

        <Link 
  href="/analytics" 
  className={`flex flex-col items-center gap-1 transition-colors ${pathname.startsWith('/analytics') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
>
  <div className={pathname.startsWith('/analytics') ? 'bg-primary-container/10 p-1.5 rounded-full' : 'p-1.5'}>
    <BarChart3 size={20} />
  </div>
  <span className="text-[10px] font-medium">Analytics</span>
</Link>
        
        <Link 
          href="/settings" 
          className={`flex flex-col items-center gap-1 transition-colors ${pathname.startsWith('/settings') ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <div className={pathname.startsWith('/settings') ? 'bg-primary-container/10 p-1.5 rounded-full' : 'p-1.5'}>
            <Settings size={20} />
          </div>
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </div>
    </nav>
  );
}
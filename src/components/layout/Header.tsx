import { createClient } from "@/utils/supabase/server";
import { Bell } from "lucide-react";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_name')
    .eq('id', user?.id)
    .single();

  const fullName = profile?.full_name || 'Recruiter';
  const role = profile?.company_name || 'Enterprise Recruiter';
  
  // Extract initials (e.g., "Jane Doe" -> "JD")
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="h-20 px-6 md:px-10 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-100">
      <div className="flex-1 min-w-0 pr-4">
        <h2 className="text-xl font-bold text-slate-900 truncate">Dashboard</h2>
      </div>
      
      <div className="flex items-center gap-5 shrink-0">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-5 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{fullName}</p>
            <p className="text-xs font-medium text-slate-500 truncate max-w-[150px]">{role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
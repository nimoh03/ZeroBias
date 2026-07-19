import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getMonthlyScreeningStatus } from "@/utils/quota";
import NotificationBell from "./NotificationBell";

// "Pending" = an interview scheduled and starting within the next 24
// hours, or overdue by less than the 30-minute grace window used in
// candidates/[candidateId]/action.ts before it's auto-reset. Anything
// older than that has already been lazily cleared elsewhere.
const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000;
const GRACE_MS = 30 * 60 * 1000;

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: jobs }] = await Promise.all([
    supabase.from('profiles').select('full_name, company_name').eq('id', user?.id).single(),
    supabase.from('jobs').select('id').eq('recruiter_id', user?.id),
  ]);

  const fullName = profile?.full_name || 'Recruiter';
  const role = profile?.company_name || 'Enterprise Recruiter';

  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Count candidates (across this recruiter's jobs) with an interview
  // starting soon or just now. Cheap: only candidates with a selected_slot
  // are considered, filtered client-side since it's a small set.
  let pendingCount = 0;
  const jobIds = jobs?.map(j => j.id) || [];
  if (jobIds.length > 0) {
    const { data: scheduled } = await supabase
      .from('candidates')
      .select('selected_slot')
      .in('job_id', jobIds)
      .not('selected_slot', 'is', null);

    const now = Date.now();
    pendingCount = (scheduled || []).filter((c) => {
      const t = new Date((c.selected_slot as any)?.time).getTime();
      if (Number.isNaN(t)) return false;
      const diff = t - now;
      return diff <= UPCOMING_WINDOW_MS && diff >= -GRACE_MS;
    }).length;
  }

  // Quota status via the admin client, same reasoning as the chat
  // route's enforcement check — this is a "how many, against what
  // limit" read that should work reliably regardless of whatever RLS
  // policies do or don't exist yet on jobs/candidates.
  const quotaStatus = user?.id
    ? await getMonthlyScreeningStatus(createAdminClient(), user.id)
    : { completed: 0, limit: 100, remaining: 100, isOverLimit: false, isNearLimit: false, resetsOn: "" };

  return (
    <header className="h-20 px-6 md:px-10 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-100">
      <div className="flex-1 min-w-0 pr-4">
        <h2 className="text-xl font-bold text-slate-900 truncate">Dashboard</h2>
      </div>

      <div className="flex items-center gap-5 shrink-0">
        <NotificationBell pendingInterviews={pendingCount} quota={quotaStatus} recruiterId={user?.id ?? "anonymous"} />

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
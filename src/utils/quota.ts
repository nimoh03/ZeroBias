import { SupabaseClient } from "@supabase/supabase-js";

export type QuotaStatus = {
  completed: number;
  limit: number;
  remaining: number;
  pctUsed: number;
  isOverLimit: boolean;
  isNearLimit: boolean;
  resetsOn: string;
};

// Computes a recruiter's monthly screening quota status directly via the
// ADMIN (service-role) client, filtered explicitly by recruiterId rather
// than relying on auth.uid(). This is deliberately separate from the
// auth.uid()-based get_completed_screenings_count RPC used on the
// Settings page: this version is for contexts with no logged-in user
// session at all (the public candidate chat route, enforcing a block;
// the header, which already has an admin-fetched recruiter id handy) —
// auth.uid() would just be null there and the RPC would silently return
// zero rows for everyone. Both compute the same underlying number, just
// through the auth path each context actually has available.
export async function getMonthlyScreeningStatus(
  supabaseAdmin: SupabaseClient,
  recruiterId: string
): Promise<QuotaStatus> {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const resetsOn = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    .toLocaleDateString(undefined, { month: "long", day: "numeric" });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("monthly_screening_limit")
    .eq("id", recruiterId)
    .single();

  const limit = profile?.monthly_screening_limit ?? 100;

  const { data: jobs } = await supabaseAdmin.from("jobs").select("id").eq("recruiter_id", recruiterId);
  const jobIds = (jobs ?? []).map((j) => j.id);

  let completed = 0;
  if (jobIds.length > 0) {
    const { count } = await supabaseAdmin
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .in("job_id", jobIds)
      .neq("status", "screening")
      .gte("created_at", startOfMonth);
    completed = count ?? 0;
  }

  const remaining = Math.max(limit - completed, 0);
  const pctUsed = limit > 0 ? Math.min((completed / limit) * 100, 100) : 0;

  return {
    completed,
    limit,
    remaining,
    pctUsed,
    isOverLimit: completed >= limit,
    isNearLimit: pctUsed >= 80 && completed < limit,
    resetsOn,
  };
}
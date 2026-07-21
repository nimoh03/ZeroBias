import { createClient } from "@/utils/supabase/server";
import SettingsClient from "./SettingsClient";

// Quota resets on the calendar month, not a rolling 30-day window — the
// number a recruiter sees should match "this billing month," not a
// window that quietly drifts day by day.
function startOfCurrentMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function nextResetDate(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // get_completed_screenings_count filters to the calling recruiter
  // internally via auth.uid() — see the migration for why that's safe
  // regardless of what we pass here.
  const [{ data: completedThisMonth }, { data: profile }] = await Promise.all([
    supabase.rpc("get_completed_screenings_count", { p_since: startOfCurrentMonth() }),
    supabase.from("profiles").select("monthly_screening_limit").eq("id", user?.id).single(),
  ]);

  const completed = Number(completedThisMonth) || 0;
  const limit = profile?.monthly_screening_limit ?? 100;
  const remaining = Math.max(limit - completed, 0);

  return (
    <SettingsClient
      quota={{
        completed,
        limit,
        remaining,
        resetsOn: nextResetDate(),
      }}
    />
  );
}
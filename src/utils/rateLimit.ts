import { SupabaseClient } from "@supabase/supabase-js";

// Thin wrapper around the check_rate_limit Postgres function (see
// supabase/migrations/20260719_add_rate_limiting.sql). Keeping this as
// its own function rather than inlining the .rpc() call at each site
// means every limit check fails the same way (open, not closed — see
// below) and is easy to find/adjust in one place.
//
// IMPORTANT: on error (DB unreachable, function missing, etc.) this
// fails OPEN — it allows the request through rather than blocking it.
// A rate limiter that's down should never be the thing that takes your
// whole app down for every candidate/recruiter. It logs loudly so the
// failure is visible without holding anyone's screening hostage.
export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string,
  windowSeconds: number,
  maxRequests: number
): Promise<{ allowed: boolean; count: number }> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });

  if (error) {
    console.error("⚠️ RATE LIMIT CHECK FAILED (failing open):", error.message);
    return { allowed: true, count: 0 };
  }

  const count = data as number;
  return { allowed: count <= maxRequests, count };
}

// Best-effort extraction of the caller's IP from standard proxy headers.
// Vercel/most reverse proxies set x-forwarded-for; falls back to a
// constant if neither is present (rare, but shouldn't crash the route —
// worst case a handful of unidentifiable requests share one IP bucket).
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
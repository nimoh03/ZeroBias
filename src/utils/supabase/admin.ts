import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * SERVICE-ROLE client — bypasses Row Level Security entirely.
 *
 * Only use this in server-only code (API routes, Server Actions) for
 * operations that must work for anonymous/unauthenticated visitors,
 * like candidates writing to `candidates` / `transcripts` from the
 * public /apply/[slug] chat.
 *
 * NEVER import this into a Client Component and never send
 * SUPABASE_SERVICE_ROLE_KEY to the browser — it grants full database
 * access with no permission checks.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in your environment (.env.local)");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
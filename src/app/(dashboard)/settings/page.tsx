import { createClient } from "@/utils/supabase/server";
import { estimateCostUsd } from "@/utils/pricing";
import SettingsClient from "./SettingsClient";

const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

export default async function SettingsPage() {
  const supabase = await createClient();

  // Both RPCs filter to the calling recruiter internally (auth.uid()),
  // not by anything we pass — see the migration for why that matters.
  const [{ data: completedScreenings }, { data: usageRows }] = await Promise.all([
    supabase.rpc("get_completed_screenings_count", { p_since: THIRTY_DAYS_AGO }),
    supabase.rpc("get_usage_summary", { p_since: THIRTY_DAYS_AGO }),
  ]);

  const rows = (usageRows ?? []).map((r: any) => {
    const cacheHitTokens = Number(r.cache_hit_tokens) || 0;
    const cacheMissTokens = Number(r.cache_miss_tokens) || 0;
    const completionTokens = Number(r.completion_tokens) || 0;
    const costUsd = estimateCostUsd({
      provider: r.provider,
      model: r.model,
      cacheHitTokens,
      cacheMissTokens,
      completionTokens,
    });
    return {
      provider: r.provider as string,
      model: r.model as string,
      callCount: Number(r.call_count) || 0,
      promptTokens: Number(r.prompt_tokens) || 0,
      completionTokens,
      cacheHitTokens,
      cacheMissTokens,
      costUsd,
    };
  });

  // null costUsd rows (Gemini — no confirmed pricing) are excluded from
  // the dollar total rather than silently treated as $0, so the total
  // never understates real spend if that tier starts being billed later.
  const totalCostUsd = rows.reduce((sum: number, r: typeof rows[number]) => sum + (r.costUsd ?? 0), 0);
  const hasUnpricedUsage = rows.some((r: typeof rows[number]) => r.costUsd === null && r.callCount > 0);
  const screeningsCount = Number(completedScreenings) || 0;
  const costPerScreening = screeningsCount > 0 ? totalCostUsd / screeningsCount : null;

  return (
    <SettingsClient
      usage={{
        rows,
        totalCostUsd,
        hasUnpricedUsage,
        completedScreenings: screeningsCount,
        costPerScreening,
      }}
    />
  );
}
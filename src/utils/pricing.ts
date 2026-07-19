// Per-million-token pricing, from DeepSeek's published pricing page.
// Update these if DeepSeek changes pricing — nothing else needs to
// change, since usage_events stores raw token counts, not pre-computed
// dollar amounts, precisely so historical usage can be re-priced if
// needed rather than being locked to whatever the price was that day.
const DEEPSEEK_PRICING: Record<string, { cacheHit: number; cacheMiss: number; output: number }> = {
  "deepseek-v4-flash": { cacheHit: 0.0028, cacheMiss: 0.14, output: 0.28 },
  "deepseek-v4-pro": { cacheHit: 0.003625, cacheMiss: 0.435, output: 0.87 },
};

// Gemini is fallback-only in this app and typically run on a free tier
// — no confirmed production pricing to compute against, so Gemini usage
// is reported as token counts only, not converted to a dollar figure.
// Flagged explicitly in the dashboard rather than silently shown as $0,
// which would understate cost if that tier ever starts being billed.
export function estimateCostUsd(row: {
  provider: string;
  model: string;
  cacheHitTokens: number;
  cacheMissTokens: number;
  completionTokens: number;
}): number | null {
  if (row.provider !== "deepseek") return null;
  const pricing = DEEPSEEK_PRICING[row.model];
  if (!pricing) return null;

  const cost =
    (row.cacheHitTokens / 1_000_000) * pricing.cacheHit +
    (row.cacheMissTokens / 1_000_000) * pricing.cacheMiss +
    (row.completionTokens / 1_000_000) * pricing.output;

  return cost;
}
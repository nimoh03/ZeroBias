// AI backup for cross-job candidate matching. Keyword overlap (matching.ts)
// stays the primary, free, instant scorer for every candidate. This file
// is ONLY called for a small top slice of candidates per job (see
// shortlisted/[jobId]/page.tsx) to catch matches keyword-overlap misses —
// e.g. "led a team" vs "management experience" share zero words but are
// the same claim. One DeepSeek Flash call per candidate here costs a
// fraction of a cent (see utils/ai.ts pricing notes), so capping to a
// small top slice keeps this effectively free even at 30-40 agencies.

import { getAIReply } from "@/utils/ai";
import type { JobForMatching, CandidateForJobMatch } from "@/utils/matching";

export type AiMatchResult = { score: number; reason: string };

export async function aiRefineMatch(
  job: JobForMatching,
  candidate: CandidateForJobMatch,
  deepseekKey?: string | null,
  geminiKey?: string | null
): Promise<AiMatchResult | null> {
  const candidateProfile = [
    candidate.summary || "",
    (candidate.strengths || []).join(", "),
    candidate.cv_summary || "",
  ].filter(Boolean).join(" | ");

  if (!candidateProfile.trim()) return null;

  const systemPrompt = `Compare one candidate profile against one job's requirements. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"score": 0-100, "reason": "one short sentence, under 15 words, plain language a recruiter would read"}

Rules:
- Score reflects genuine fit for THIS job, not the job the candidate originally applied to.
- Don't invent skills or experience the profile doesn't support.
- If the profile is a poor fit, give a low score and say why plainly — don't inflate to be polite.`;

  const userContent = `JOB: ${job.title}
MUST HAVES: ${job.must_haves || "none listed"}
NICE TO HAVES: ${job.nice_to_haves || "none listed"}

CANDIDATE PROFILE: ${candidateProfile.slice(0, 1500)}`;

  try {
    const { text } = await getAIReply({
      deepseekKey,
      geminiKey,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      maxTokens: 120,
    });

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.score !== "number" || typeof parsed.reason !== "string") return null;

    return { score: Math.max(0, Math.min(100, parsed.score)), reason: parsed.reason };
  } catch {
    // AI backup is best-effort — if it fails, callers should just keep
    // the keyword-overlap score instead of breaking the page.
    return null;
  }
}
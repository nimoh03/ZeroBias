import { createClient } from "@/utils/supabase/server";
import { getAIReply } from "@/utils/ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { rawText } = await req.json();
    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 20) {
      return Response.json({ error: "Paste a bit more of the job description first." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }

    // Keys — platform-managed only, no per-recruiter override.
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const systemPrompt = `You extract structured job posting data from messy, pasted job descriptions. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"title":"...","location":"...","jobType":"Full-time|Contract|Part-time|Internship","description":"a 2-3 sentence candidate-facing summary in plain prose","mustHaves":["short requirement","short requirement"],"niceToHaves":["short requirement","short requirement"]}

Rules: mustHaves are hard dealbreakers only (years of experience, required certifications, required skills explicitly stated as required/must-have). niceToHaves are anything stated as a plus/preferred/bonus. Keep each item short (under 12 words). If jobType isn't stated, infer the most likely one. If something genuinely isn't in the text, use an empty string or empty array rather than inventing details.`;

    const { text, provider, model, usage } = await getAIReply({
      deepseekKey,
      geminiKey,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText.slice(0, 6000) },
      ],
      maxTokens: 600,
    });

    // Persist usage for this call — no job_id/candidate_id yet at this
    // stage (this runs before a job exists), just tagged to the recruiter.
    const { error: usageError } = await supabase.from("usage_events").insert({
      source: "autofill_job",
      recruiter_id: user.id,
      provider,
      model,
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: usage.totalTokens,
      cache_hit_tokens: usage.cacheHitTokens,
      cache_miss_tokens: usage.cacheMissTokens,
    });
    if (usageError) {
      console.error("⚠️ COULD NOT LOG USAGE EVENT:", usageError.message);
    }

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return Response.json({ ...parsed, usage });
  } catch (error: any) {
    console.error("🔥 AUTOFILL FAILED:", error.message || error);
    return Response.json({ error: "Couldn't parse that just now. Please try again or fill it in manually." }, { status: 500 });
  }
}
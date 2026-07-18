import { createClient } from "@/utils/supabase/server";
import { getAIReply } from "@/utils/ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { rawText, title, location } = await req.json();
    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 5) {
      return Response.json({ error: "Add at least one requirement first." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }

    // Keys — platform-managed only, no per-recruiter override.
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const systemPrompt = `A recruiter is hiring for "${title}" in "${location}" and typed a list of things they want in a candidate, one line at a time (each line below is one thing they typed). Clean it up. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"requirements":["short requirement","short requirement"],"description":"a 2-3 sentence candidate-facing summary in plain prose"}

Rules for requirements:
- If one line actually contains two distinct requirements (e.g. "Lagos and knows React"), split it into two items.
- Rewrite vague or rambling lines into a short, clean requirement (under 12 words) — but don't invent details that weren't implied.
- Merge exact duplicate lines into one.
- Keep the original order as much as possible.
- Don't drop anything the recruiter actually said, even if it seems minor.

Rules for description:
- Write a short, plain-prose summary a candidate would read, based on the title, location, and what the recruiter listed.
- Don't invent responsibilities or perks that weren't implied.`;

    const { text, provider, model, usage } = await getAIReply({
      deepseekKey,
      geminiKey,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText.slice(0, 3000) },
      ],
      maxTokens: 500,
    });

    // Persist usage for this call, tagged to the recruiter.
    const { error: usageError } = await supabase.from("usage_events").insert({
      source: "job_builder",
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

    if (!Array.isArray(parsed.requirements)) {
      throw new Error("Model did not return a requirements array.");
    }

    return Response.json({
      requirements: parsed.requirements.filter((i: unknown) => typeof i === "string" && i.trim()),
      description: typeof parsed.description === "string" ? parsed.description : "",
      usage,
    });
  } catch (error: any) {
    console.error("🔥 JOB BUILDER PARSE FAILED:", error.message || error);
    return Response.json({ error: "Couldn't clean that list up just now. Please try again or use the guided form." }, { status: 500 });
  }
}
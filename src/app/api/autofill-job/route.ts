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

    let groqKey: string | null | undefined = process.env.GROQ_API_KEY;
    let geminiKey: string | null | undefined = process.env.GEMINI_API_KEY;

    const { data: profile } = await supabase
      .from("profiles")
      .select("use_own_keys, groq_api_key, gemini_api_key")
      .eq("id", user.id)
      .single();
    if (profile?.use_own_keys) {
      if (profile.groq_api_key) groqKey = profile.groq_api_key;
      if (profile.gemini_api_key) geminiKey = profile.gemini_api_key;
    }

    const systemPrompt = `You extract structured job posting data from messy, pasted job descriptions. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"title":"...","location":"...","jobType":"Full-time|Contract|Part-time|Internship","description":"a 2-3 sentence candidate-facing summary in plain prose","mustHaves":["short requirement","short requirement"],"niceToHaves":["short requirement","short requirement"]}

Rules: mustHaves are hard dealbreakers only (years of experience, required certifications, required skills explicitly stated as required/must-have). niceToHaves are anything stated as a plus/preferred/bonus. Keep each item short (under 12 words). If jobType isn't stated, infer the most likely one. If something genuinely isn't in the text, use an empty string or empty array rather than inventing details.`;

    const { text, provider, model, usage } = await getAIReply({
      groqKey,
      geminiKey,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText.slice(0, 6000) },
      ],
      maxTokens: 600,
    });

    // Token usage for this autofill call — was previously discarded entirely.
    console.log("🔢 TOKEN USAGE:", {
      source: "autofill_job",
      userId: user.id,
      provider,
      model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
    });

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return Response.json({ ...parsed, usage });
  } catch (error: any) {
    console.error("🔥 AUTOFILL FAILED:", error.message || error);
    return Response.json({ error: "Couldn't parse that just now. Please try again or fill it in manually." }, { status: 500 });
  }
}
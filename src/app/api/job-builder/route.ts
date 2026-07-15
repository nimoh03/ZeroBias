import { createClient } from "@/utils/supabase/server";
import { getAIReply } from "@/utils/ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "Add at least one requirement first." }, { status: 400 });
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

    const rawText = items.map((i: string) => `- ${i}`).join("\n");

    const systemPrompt = `A recruiter typed a list of things they want in a candidate, one line at a time. Clean it up into a final list of separate, discrete, screenable requirements. Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this shape:
{"items":["short requirement","short requirement"]}

Rules:
- If one line actually contains two distinct requirements (e.g. "Lagos and knows React"), split it into two items.
- Rewrite vague or rambling lines into a short, clean requirement (under 12 words) — but don't invent details that weren't implied.
- Merge exact duplicate lines into one.
- Keep the original order as much as possible.
- Don't drop anything the recruiter actually said, even if it seems minor.`;

    const { text } = await getAIReply({
      groqKey,
      geminiKey,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText.slice(0, 3000) },
      ],
      maxTokens: 500,
    });

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed.items)) {
      throw new Error("Model did not return an items array.");
    }

    return Response.json({ items: parsed.items.filter((i: unknown) => typeof i === "string" && i.trim()) });
  } catch (error: any) {
    console.error("🔥 JOB BUILDER PARSE FAILED:", error.message || error);
    return Response.json({ error: "Couldn't clean that list up just now. Please try again or use the guided form." }, { status: 500 });
  }
}
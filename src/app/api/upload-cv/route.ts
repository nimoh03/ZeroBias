import { createAdminClient } from "@/utils/supabase/admin";
import { extractCvSummaryWithGemini, TokenUsage } from "@/utils/ai";

export const maxDuration = 30;

const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const candidateId = formData.get("candidateId") as string | null;
    const recruiterId = formData.get("recruiterId") as string | null;

    if (!file || !candidateId) {
      return Response.json({ error: "Missing file or candidateId." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: "Please upload a PDF or Word document." }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return Response.json({ error: "File is too large (5MB max)." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${candidateId}/${Date.now()}-${safeName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(path, fileBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("🔥 CV UPLOAD FAILED:", uploadError.message);
      return Response.json({ error: "Upload failed. Try again." }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from("cvs").getPublicUrl(path);
    const cvUrl = publicUrlData.publicUrl;

    // Try to get a recruiter-facing summary via Gemini — Gemini can read
    // PDFs natively. This is best-effort: if it's unavailable (no key,
    // rate limited, or a Word doc it can't parse), we still keep the
    // upload and just skip the summary. Never block on this.
    let cvSummary: string | null = null;
    let cvUsage: TokenUsage | null = null;
    if (file.type === "application/pdf") {
      const geminiKey = process.env.GEMINI_API_KEY;

      const cvResult = await extractCvSummaryWithGemini({
        geminiKey,
        fileBase64: fileBuffer.toString("base64"),
        mimeType: file.type,
        prompt: "You are extracting a short recruiter-facing summary from this CV/resume for a pre-interview screening assistant to use as verified context. In under 120 words, plain text, no markdown: list highest education/qualification, total years of relevant experience, key skills/technologies, and most recent role/employer. Be factual and concise — this will be treated as verified fact, so only include what the document actually states.",
      });

      if (cvResult) {
        cvSummary = cvResult.text;
        cvUsage = cvResult.usage;
        const { error: usageError } = await supabase.from("usage_events").insert({
          source: "cv_extract",
          candidate_id: candidateId,
          recruiter_id: recruiterId,
          provider: "gemini",
          model: cvResult.model,
          prompt_tokens: cvResult.usage.promptTokens,
          completion_tokens: cvResult.usage.completionTokens,
          total_tokens: cvResult.usage.totalTokens,
          cache_hit_tokens: cvResult.usage.cacheHitTokens,
          cache_miss_tokens: cvResult.usage.cacheMissTokens,
        });
        if (usageError) {
          console.error("⚠️ COULD NOT LOG USAGE EVENT:", usageError.message);
        }
      }
    }

    const { error: updateError } = await supabase
      .from("candidates")
      .update({ cv_url: cvUrl, ...(cvSummary ? { cv_summary: cvSummary } : {}) })
      .eq("id", candidateId);

    if (updateError) {
      console.error("🔥 COULD NOT SAVE CV DATA:", updateError.message);
    }

    return Response.json({ url: cvUrl, filename: file.name, summary: cvSummary, usage: cvUsage });
  } catch (error: any) {
    console.error("🔥 CV UPLOAD ROUTE CRASHED:", error.message || error);
    return Response.json({ error: "Something went wrong uploading your CV." }, { status: 500 });
  }
}
import { createAdminClient } from "@/utils/supabase/admin";
import { getAIReply } from "@/utils/ai";
import { checkRateLimit, getClientIp } from "@/utils/rateLimit";

export const maxDuration = 30;

const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Pull raw text out of the uploaded file with a plain parsing library —
// no AI model involved in this step at all. Almost every real-world
// resume is text underneath (even when it looks "designed"), so this
// covers the large majority of uploads without ever needing a vision
// model or paying for one. Old-format .doc (pre-2007 binary Word) isn't
// reliably parseable by mammoth (that's a docx-only library) — treated
// as unsupported for summarization, same as a scanned/image-only PDF:
// the file still uploads and is still viewable by the recruiter, it
// just won't get an AI-generated summary.
async function extractTextFromFile(buffer: Buffer, mimeType: string, fileName: string): Promise<string | null> {
  try {
    if (mimeType === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      return result.text?.trim() || null;
    }
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value?.trim() || null;
    }
    // application/msword (legacy .doc) — no reliable text extraction
    // library for this format without shelling out to something heavier
    // (e.g. LibreOffice). Skip summarization rather than guess.
    return null;
  } catch (err) {
    console.error(`⚠️ CV TEXT EXTRACTION FAILED (pdf-parse) [${fileName}, ${buffer.length}b]:`, (err as Error).message || err);
    // pdf-parse's bundled pdf.js can't recover a broken xref table.
    // Retry with pdfjs-dist directly, which rebuilds the xref by
    // scanning objects linearly when the table itself is corrupt.
    if (mimeType === "application/pdf") {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), stopAtErrors: false }).promise;
        let text = "";
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((it: any) => it.str).join(" ") + "\n";
        }
        return text.trim() || null;
      } catch (fallbackErr) {
        console.error(`⚠️ CV TEXT EXTRACTION FAILED (pdfjs fallback) [${fileName}, ${buffer.length}b]:`, (fallbackErr as Error).message || fallbackErr);
        return null;
      }
    }
    return null;
  }
}

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

    // Upload spam guard, keyed per IP — file uploads + an AI summary
    // call are the most expensive thing this route does, so this is the
    // one most worth protecting. 10/hour per IP comfortably covers a
    // real candidate (nobody uploads their CV 10 times), while blocking
    // a script from repeatedly burning storage + AI cost. Scoped to IP
    // only, never affects any other candidate or agency.
    const clientIp = getClientIp(req);
    const { allowed } = await checkRateLimit(supabase, `upload-cv:${clientIp}`, 3600, 10);
    if (!allowed) {
      return Response.json({ error: "Too many uploads from this connection — please try again later." }, { status: 429 });
    }

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

    // Try to get a recruiter-facing summary. This is best-effort: if
    // extraction fails (scanned PDF, legacy .doc) or the AI call fails,
    // we still keep the upload and just skip the summary. Never block on
    // this — CV verification is a nice-to-have, not something that
    // should break the upload itself.
    let cvSummary: string | null = null;
    let cvUsage: import("@/utils/ai").TokenUsage | null = null;

const extractedText = await extractTextFromFile(fileBuffer, file.type, file.name);

    if (extractedText && extractedText.length > 20) {
      const deepseekKey = process.env.DEEPSEEK_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;

      const systemPrompt = "You are extracting a short recruiter-facing summary from a CV/resume's raw extracted text, for a pre-interview screening assistant to use as verified context. In under 120 words, plain text, no markdown: list highest education/qualification, total years of relevant experience, key skills/technologies, and most recent role/employer. Be factual and concise — this will be treated as verified fact, so only include what the document actually states. If the extracted text is garbled or clearly not a resume, say so in one short sentence instead of guessing.";

      try {
        const { text, provider, model, usage } = await getAIReply({
          deepseekKey,
          geminiKey,
          messages: [
            { role: "system", content: systemPrompt },
            // Raw extracted text can run long for multi-page CVs — cap it
            // well within context limits rather than trust every upload
            // to be reasonably sized.
            { role: "user", content: extractedText.slice(0, 12000) },
          ],
          maxTokens: 400,
        });

        cvSummary = text;
        cvUsage = usage;

        const { error: usageError } = await supabase.from("usage_events").insert({
          source: "cv_extract",
          candidate_id: candidateId,
          recruiter_id: recruiterId,
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
      } catch (err) {
        console.error("⚠️ CV SUMMARY AI CALL FAILED:", (err as Error).message || err);
      }
    }

    const { error: updateError } = await supabase
  .from("candidates")
  .update({
    cv_url: cvUrl,
    // Always overwrite — a null/failed summary on re-upload must
    // clear the previous file's summary, not leave it stale.
    cv_summary: cvSummary,
  })
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
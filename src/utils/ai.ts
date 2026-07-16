// Centralized AI calling with automatic failover.
//
// Order: try every Gemini model in GEMINI_MODELS first, in order. Gemini
// is the primary provider for candidate-facing screening — it doesn't
// have the reasoning-leak behavior Groq's small/preview models do, and
// is more consistent at following the strict one-question-per-message /
// JSON-block instructions in the system prompt. If Gemini is completely
// unavailable (no key, or every model fails — rate limited, down, etc.),
// silently fall through to Groq and try every model in GROQ_MODELS. The
// caller never needs to know which one actually answered — candidates
// and recruiters never see a provider hiccup.
//
// Model lists deliberately kept short and current. Free-tier catalogs on
// both providers churn every few months — if requests start failing here,
// check console.groq.com/docs/models and ai.google.dev/gemini-api/docs/models
// for renamed/retired models before assuming the code is broken.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// qwen/qwen3.6-27b deliberately left out of the fallback list: it's a
// preview/vision model, not meant for production text screening, and it
// was the source of raw <think> reasoning tokens leaking into candidate
// messages. gpt-oss models stay as the Groq fallback with reasoning
// explicitly suppressed below.
const GROQ_MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"];
const GEMINI_MODELS = ["gemini-flash-latest", "gemini-2.5-flash"];

// Defense in depth: even with reasoning suppressed via API params, strip
// any <think>...</think> block that slips through before it ever reaches
// a candidate. Same philosophy as the ###DECISION### stripping in the
// chat route — never trust a model to honor a param 100% of the time.
export function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// Defense against small/free-tier models looping on themselves mid-
// generation and sending the same question 2-3 times in one reply
// (seen from gpt-oss-20b). Splits on sentence-ending punctuation and
// drops any sentence that's a near-duplicate of one already kept.
// Conservative on purpose — only catches exact-ish repeats, never
// touches genuinely different sentences even if topically similar.
export function dedupeRepeatedSentences(text: string): string {
  // Split on sentence-ending punctuation followed by EITHER whitespace
  // (the normal case) OR directly by a capital letter with no space at
  // all — small free-tier models occasionally loop/repeat a clause mid-
  // generation and jam the repeat straight onto the previous sentence
  // with no separating space ("...one project?Got it. If so...").
  // Without the second branch, that boundary is invisible to the
  // splitter and the repeat sails through undetected. The lookahead
  // keeps the delimiter attached to the following part.
  const parts = text.split(/(?<=[.?!])\s+(?=\S)|(?<=[.?!])(?=[A-Z])/);
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalized.length > 8 && seen.has(normalized)) continue;
    if (normalized.length > 8) seen.add(normalized);
    kept.push(trimmed);
  }
  // Always join with a real space — this also repairs any jammed
  // "project?Got" boundaries that survive because they weren't exact
  // repeats, so the candidate never sees punctuation-glued text.
  return kept.join(" ").trim();
}

async function callGroq(apiKey: string, model: string, messages: ChatMessage[], maxTokens: number): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      max_completion_tokens: maxTokens,
      // gpt-oss models don't support reasoning_format, but do support
      // include_reasoning — keep reasoning tokens out of the main content
      // field entirely rather than trusting a <think>-tag convention.
      include_reasoning: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq/${model} ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Groq/${model} returned no content`);
  return stripThinkTags(text);
}

async function callGemini(apiKey: string, model: string, messages: ChatMessage[], maxTokens: number): Promise<string> {
  const systemMsg = messages.find(m => m.role === "system");
  const turns = messages.filter(m => m.role !== "system");

  const body: any = {
    contents: turns.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: { temperature: 0.6, maxOutputTokens: maxTokens },
  };
  if (systemMsg) {
    body.system_instruction = { parts: [{ text: systemMsg.content }] };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini/${model} ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("");
  if (!text) throw new Error(`Gemini/${model} returned no content`);
  return stripThinkTags(text);
}

// Status codes worth a second try — rate limits and transient server-side
// hiccups on the provider's end. Auth/config errors (401/403/404) won't
// fix themselves by waiting, so those fail fast instead of stalling the
// candidate for no reason.
const RETRYABLE_STATUS = /\s(429|500|502|503|504)\b/;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptAllProviders({
  groqKey,
  geminiKey,
  messages,
  maxTokens,
}: {
  groqKey?: string | null;
  geminiKey?: string | null;
  messages: ChatMessage[];
  maxTokens: number;
}): Promise<{ text: string; provider: string; model: string } | { errors: string[] }> {
  const errors: string[] = [];

  if (geminiKey) {
    for (const model of GEMINI_MODELS) {
      try {
        const text = await callGemini(geminiKey, model, messages, maxTokens);
        return { text, provider: "gemini", model };
      } catch (err: any) {
        errors.push(err.message || String(err));
      }
    }
  }

  if (groqKey) {
    for (const model of GROQ_MODELS) {
      try {
        const text = await callGroq(groqKey, model, messages, maxTokens);
        return { text, provider: "groq", model };
      } catch (err: any) {
        errors.push(err.message || String(err));
      }
    }
  }

  return { errors };
}

export async function getAIReply({
  groqKey,
  geminiKey,
  messages,
  maxTokens = 450,
}: {
  groqKey?: string | null;
  geminiKey?: string | null;
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<{ text: string; provider: string; model: string }> {
  const first = await attemptAllProviders({ groqKey, geminiKey, messages, maxTokens });
  if (!("errors" in first)) return first;

  // Every model on both providers failed. If it looks transient (rate
  // limit or a provider-side hiccup, not a bad key or missing model),
  // wait briefly — this is usually a shared free-tier rate limit that
  // clears in a second or two — and take one more full pass before
  // giving up on the candidate's message entirely.
  const looksTransient = first.errors.some((e) => RETRYABLE_STATUS.test(e));
  if (looksTransient) {
    console.error("⚠️ ALL AI PROVIDERS FAILED ON FIRST PASS, RETRYING:", first.errors.join(" | "));
    await sleep(1500);
    const second = await attemptAllProviders({ groqKey, geminiKey, messages, maxTokens });
    if (!("errors" in second)) return second;
    console.error("🔥 ALL AI PROVIDERS FAILED ON RETRY:", second.errors.join(" | "));
    throw new Error("All AI providers are currently unavailable.");
  }

  console.error("🔥 ALL AI PROVIDERS FAILED:", first.errors.join(" | "));
  throw new Error("All AI providers are currently unavailable.");
}

// Multimodal: send a PDF directly to Gemini (Groq doesn't reliably accept
// raw document bytes on free-tier chat models, so this path is Gemini-only).
// Returns null instead of throwing on failure — CV verification is a nice-to-have,
// never something that should break the upload itself.
export async function extractCvSummaryWithGemini({
  geminiKey,
  fileBase64,
  mimeType,
  prompt,
}: {
  geminiKey?: string | null;
  fileBase64: string;
  mimeType: string;
  prompt: string;
}): Promise<string | null> {
  if (!geminiKey) return null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [
                { inline_data: { mime_type: mimeType, data: fileBase64 } },
                { text: prompt },
              ],
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
          }),
        }
      );
      if (!response.ok) continue;
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("");
      if (text) return text;
    } catch {
      // try next model
    }
  }
  return null;
}
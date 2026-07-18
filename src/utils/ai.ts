// Centralized AI calling with automatic failover.
//
// Order: try DeepSeek (deepseek-v4-flash) first — it's now the primary
// provider for candidate-facing screening. If DeepSeek is completely
// unavailable (no key, or the call fails — rate limited, down, etc.),
// silently fall through to every model in GEMINI_MODELS. The caller
// never needs to know which one actually answered — candidates and
// recruiters never see a provider hiccup.
//
// Groq has been removed as a provider entirely (previously the final
// fallback) — DeepSeek Flash's pricing and concurrency make a second
// fallback tier unnecessary, and it simplifies the failover chain to
// two providers instead of three.
//
// Model lists deliberately kept short and current. Free-tier catalogs
// churn every few months — if requests start failing here, check
// api-docs.deepseek.com and ai.google.dev/gemini-api/docs/models for
// renamed/retired models before assuming the code is broken.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Token usage returned alongside every AI reply so callers can log/sum
// cost per candidate/conversation. Both providers report the base three
// fields natively. cacheHitTokens/cacheMissTokens are DeepSeek-specific
// (its disk cache reports which portion of the prompt was a cache hit) —
// they default to 0 for Gemini, which doesn't expose an equivalent.
export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cacheHitTokens: number;
  cacheMissTokens: number;
};

// deepseek-v4-flash is the primary model for candidate-facing screening:
// short conversational turns against a big rule-dense system prompt is
// exactly its use case, and it's far cheaper (and higher concurrency)
// than deepseek-v4-pro. Only one DeepSeek model is tried — if it fails,
// we drop straight to Gemini rather than trying Pro, since Pro doesn't
// meaningfully change reliability here, only cost.
const DEEPSEEK_MODELS = ["deepseek-v4-flash"];
// gemini-3.5-flash tried first — strongest instruction-following of the
// Flash tier, which matters most for holding a long, rule-dense system
// prompt without drifting (the "asks two questions" / "repeats itself"
// failure modes seen from smaller models). gemini-3-flash and
// gemini-2.5-flash stay as same-provider fallbacks at lower cost if 3.5
// is unavailable or rate limited. Gemini is now the last stop in the
// chain — if every model here fails too, the request fails.
const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3-flash", "gemini-2.5-flash", "gemini-flash-latest"];

// Defense in depth: even with reasoning suppressed via API params, strip
// any <think>...</think> block that slips through before it ever reaches
// a candidate. Same philosophy as the ###DECISION### stripping in the
// chat route — never trust a model to honor a param 100% of the time.
export function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// Defense against a Groq-specific leak: gpt-oss models internally format
// their output using OpenAI's "harmony" response format, which wraps
// content in tokens like <|start|>, <|channel|>, <|message|>, <|end|>.
// The chat completions endpoint is supposed to already strip these and
// return clean text in the content field, but on occasion — usually
// when the model's own generation goes slightly off-script — a raw
// token slips through into what we get back. A candidate should never
// see something like "###END<|message|>Got it, thanks." Strip any of
// these tokens outright; they never carry meaning for a candidate
// either way.
export function stripHarmonyTokens(text: string): string {
  return text.replace(/<\|[a-z_]+\|>/gi, "").trim();
}

// Common filler/connector words stripped before comparing questions for
// near-duplicates. Deliberately small — this only needs to strip enough
// scaffolding ("could you tell me", "let me know", "do you have") that
// two rewordings of the same underlying question collapse onto the same
// bag of meaningful words (e.g. "react", "years", "experience").
const QUESTION_STOPWORDS = new Set([
  "a", "an", "the", "do", "does", "did", "you", "your", "have", "has", "had",
  "could", "would", "can", "will", "tell", "let", "me", "know", "please",
  "and", "or", "of", "for", "to", "in", "on", "is", "are", "that", "this",
  "so", "if", "just", "one", "about", "like", "with",
]);

function questionWordSet(sentence: string): Set<string> {
  return new Set(
    sentence
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2 && !QUESTION_STOPWORDS.has(w))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Defense against small/free-tier models looping on themselves mid-
// generation and sending the same question 2-3 times in one reply (seen
// from both gpt-oss-20b and gemini-2.5-flash). Splits on sentence-ending
// punctuation and drops any sentence that's a near-duplicate of one
// already kept.
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
  const seenQuestionWords: Set<string>[] = [];
  const kept: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Pass 1: exact-ish repeat (unchanged from before).
    if (normalized.length > 8 && seen.has(normalized)) continue;

    // Pass 2: reworded repeat — same question asked with different
    // scaffolding words ("how many years..." vs "could you tell me how
    // many years..."). Only applies to sentences that are actually
    // questions, and only compares against other questions already kept,
    // so it never touches genuinely different statements.
    if (trimmed.endsWith("?")) {
      const words = questionWordSet(trimmed);
      const isNearDuplicate = words.size >= 2 && seenQuestionWords.some(prev => jaccard(prev, words) >= 0.6);
      if (isNearDuplicate) continue;
      seenQuestionWords.push(words);
    }

    if (normalized.length > 8) seen.add(normalized);
    kept.push(trimmed);
  }
  // Always join with a real space — this also repairs any jammed
  // "project?Got" boundaries that survive because they weren't exact
  // repeats, so the candidate never sees punctuation-glued text.
  return kept.join(" ").trim();
}

// Defense against a different (and more common, on small/free-tier
// models) failure than the repeat loop above: the model simulates a
// WHOLE extra conversational turn in one completion instead of stopping
// after its own turn. The tell is always the same shape — one real
// question, then a sentence that only makes sense as a reply to an
// answer that was never actually given ("Thanks for letting me know.",
// "Got it, thanks.", "Perfect."), then a second, DIFFERENT question.
// dedupeRepeatedSentences doesn't catch this because the two questions
// aren't near-duplicates of each other (they ask for different info —
// e.g. "how long have you used it" vs "give an example project") — the
// word-overlap check above is deliberately narrow so it never merges two
// genuinely different questions, which is exactly why this one slips
// through it.
//
// Rule enforced here: once a real question has been asked, if a
// non-question sentence follows it (i.e. the model appears to have
// moved on, as if it got a reply), stop the message right there — that
// non-question sentence and everything after it is never shown to the
// candidate. Two questions in a row with nothing but the allowed combo
// pattern between them (name+email, skill+duration) are still permitted,
// since the system prompt explicitly allows those pairs to share one
// message and they don't have a fake-acknowledgment sentence wedged
// between them.
export function enforceSingleQuestion(text: string): string {
  const parts = text.split(/(?<=[.?!])\s+(?=\S)|(?<=[.?!])(?=[A-Z])/);
  const kept: string[] = [];
  let questionCount = 0;
  let sawStatementAfterQuestion = false;

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const isQuestion = trimmed.endsWith("?");

    // A statement has already shown up after at least one question was
    // asked — that's the "Thanks for letting me know." tell. Anything
    // from here on is the model faking a second turn. Stop for good.
    if (sawStatementAfterQuestion) break;

    // Already have two consecutive questions (the allowed combo). A
    // third question — even with no fake-ack sentence between — is never
    // legitimate under the one-question rule, so stop instead of
    // appending it.
    if (questionCount >= 2 && isQuestion) break;

    kept.push(trimmed);

    if (isQuestion) {
      questionCount++;
    } else if (questionCount >= 1) {
      sawStatementAfterQuestion = true;
    }
  }

  return kept.join(" ").trim();
}

async function callDeepSeek(apiKey: string, model: string, messages: ChatMessage[], maxTokens: number): Promise<{ text: string; usage: TokenUsage }> {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      max_tokens: maxTokens,
      // deepseek-v4-flash defaults to thinking mode on. We want plain
      // conversational replies for the candidate-facing chat, not
      // reasoning traces, and disabling it also shaves latency/cost
      // off every turn.
      thinking: { type: "disabled" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek/${model} ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`DeepSeek/${model} returned no content`);

  // OpenAI-compatible usage block, plus DeepSeek's disk-cache fields —
  // prompt_cache_hit_tokens / prompt_cache_miss_tokens — which only
  // DeepSeek reports. Defaults to 0 if a response ever omits them.
  const usage: TokenUsage = {
    promptTokens: data?.usage?.prompt_tokens ?? 0,
    completionTokens: data?.usage?.completion_tokens ?? 0,
    totalTokens: data?.usage?.total_tokens ?? 0,
    cacheHitTokens: data?.usage?.prompt_cache_hit_tokens ?? 0,
    cacheMissTokens: data?.usage?.prompt_cache_miss_tokens ?? 0,
  };

  return { text: stripThinkTags(text), usage };
}

async function callGemini(apiKey: string, model: string, messages: ChatMessage[], maxTokens: number): Promise<{ text: string; usage: TokenUsage }> {
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

  // Gemini reports usage under usageMetadata rather than an
  // OpenAI-style usage block — different field names, same idea.
  // Gemini has no equivalent to DeepSeek's disk-cache reporting, so
  // cache fields always default to 0 here.
  const usage: TokenUsage = {
    promptTokens: data?.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
    totalTokens: data?.usageMetadata?.totalTokenCount ?? 0,
    cacheHitTokens: 0,
    cacheMissTokens: 0,
  };

  return { text: stripThinkTags(text), usage };
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
  deepseekKey,
  geminiKey,
  messages,
  maxTokens,
}: {
  deepseekKey?: string | null;
  geminiKey?: string | null;
  messages: ChatMessage[];
  maxTokens: number;
}): Promise<{ text: string; provider: string; model: string; usage: TokenUsage } | { errors: string[] }> {
  const errors: string[] = [];

  if (deepseekKey) {
    for (const model of DEEPSEEK_MODELS) {
      try {
        const { text, usage } = await callDeepSeek(deepseekKey, model, messages, maxTokens);
        return { text, provider: "deepseek", model, usage };
      } catch (err: any) {
        errors.push(err.message || String(err));
      }
    }
  }

  if (geminiKey) {
    for (const model of GEMINI_MODELS) {
      try {
        const { text, usage } = await callGemini(geminiKey, model, messages, maxTokens);
        return { text, provider: "gemini", model, usage };
      } catch (err: any) {
        errors.push(err.message || String(err));
      }
    }
  }

  return { errors };
}

export async function getAIReply({
  deepseekKey,
  geminiKey,
  messages,
  maxTokens = 450,
}: {
  deepseekKey?: string | null;
  geminiKey?: string | null;
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<{ text: string; provider: string; model: string; usage: TokenUsage }> {
  const first = await attemptAllProviders({ deepseekKey, geminiKey, messages, maxTokens });
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
    const second = await attemptAllProviders({ deepseekKey, geminiKey, messages, maxTokens });
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
}): Promise<{ text: string; model: string; usage: TokenUsage } | null> {
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
      if (text) {
        const usage: TokenUsage = {
          promptTokens: data?.usageMetadata?.promptTokenCount ?? 0,
          completionTokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
          totalTokens: data?.usageMetadata?.totalTokenCount ?? 0,
          cacheHitTokens: 0,
          cacheMissTokens: 0,
        };
        return { text, model, usage };
      }
    } catch {
      // try next model
    }
  }
  return null;
}
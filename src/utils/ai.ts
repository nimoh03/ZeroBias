// Centralized AI calling with automatic failover.
//
// Order: try every Groq model in GROQ_MODELS, in order. If Groq is
// completely unavailable (no key, or every model fails — rate limited,
// down, etc.), silently fall through to Gemini and try every model in
// GEMINI_MODELS. The caller never needs to know which one actually
// answered — candidates and recruiters never see a provider hiccup.
//
// Model lists deliberately kept short and current. Free-tier catalogs on
// both providers churn every few months — if requests start failing here,
// check console.groq.com/docs/models and ai.google.dev/gemini-api/docs/models
// for renamed/retired models before assuming the code is broken.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const GROQ_MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"];
const GEMINI_MODELS = ["gemini-flash-latest", "gemini-2.5-flash"];

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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq/${model} ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Groq/${model} returned no content`);
  return text;
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
  return text;
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
  const errors: string[] = [];

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

  console.error("🔥 ALL AI PROVIDERS FAILED:", errors.join(" | "));
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
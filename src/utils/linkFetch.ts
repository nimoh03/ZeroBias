// Fetches a candidate-provided link and extracts plain text from it, for
// Nova to actually read instead of ever fabricating that it "checked."
// This has a real abuse surface (a stranger can paste any URL into a
// public form), so every guardrail here is load-bearing, not decorative:
//
// - Scheme/host validation blocks anything that isn't a normal public
//   http(s) address — no internal/private network ranges, no localhost.
//   Note: this is a baseline check (exact hostname/IP-literal match), not
//   full SSRF hardening — it doesn't defend against DNS rebinding (a
//   hostname that resolves to a private IP only at fetch time). Good
//   enough for "candidate accidentally or lazily pastes something odd,"
//   not a substitute for network-level egress controls if this ever
//   needs to be bulletproof.
// - A timeout so one slow/hanging site can't tie up the request.
// - A hard cap on how much of the page we ever read, so a huge page
//   can't blow up token cost downstream.
const FETCH_TIMEOUT_MS = 6000;
const MAX_RESPONSE_BYTES = 1_000_000; // 1MB raw HTML, well before we ever extract/trim text from it
const MAX_EXTRACTED_CHARS = 3000; // hard cap on what actually reaches the AI — cost control, not a UX limit

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateOrBlockedHost(hostname: string): boolean {
  if (BLOCKED_HOSTS.has(hostname.toLowerCase())) return true;
  // Private/reserved IPv4 ranges (RFC 1918 + link-local + loopback).
  const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const [a, b] = [Number(ipMatch[1]), Number(ipMatch[2])];
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 127) return true;
  }
  return false;
}

export async function extractTextFromUrl(rawUrl: string): Promise<{ text: string } | { error: string }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { error: "not a valid URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { error: "unsupported scheme" };
  }
  if (isPrivateOrBlockedHost(url.hostname)) {
    return { error: "blocked host" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZeroBiasScreeningBot/1.0)" },
    });

    if (!response.ok) return { error: `page returned ${response.status}` };

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return { error: "not a readable page (not HTML/text)" };
    }

    // Read only up to the byte cap rather than trusting Content-Length
    // (which can be absent or lied about) — stop reading once we've hit
    // the limit regardless of how big the page claims to be.
    const reader = response.body?.getReader();
    if (!reader) return { error: "could not read response" };

    let received = 0;
    const chunks: Uint8Array[] = [];
    while (received < MAX_RESPONSE_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.length;
      }
    }
    reader.cancel().catch(() => {});

    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");

    // Best-effort plain-text extraction — strips scripts/styles/tags.
    // Won't handle JS-rendered sites (nothing meaningful in the raw HTML
    // for those), which is a real limitation, not a bug — flagged to the
    // caller via a short/empty result rather than pretending to succeed.
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, MAX_EXTRACTED_CHARS);

    if (text.length < 40) {
      return { error: "page had little to no readable text (likely JS-rendered or empty)" };
    }

    return { text };
  } catch (err: any) {
    if (err?.name === "AbortError") return { error: "timed out" };
    return { error: err?.message || "fetch failed" };
  } finally {
    clearTimeout(timeout);
  }
}
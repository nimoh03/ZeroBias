import { createAdminClient } from "@/utils/supabase/admin";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, jobContext, candidateId: incomingCandidateId } = await req.json();
    const supabase = createAdminClient();

    // 1. Make sure a candidate record exists for this conversation.
    // First turn from a given visitor: no candidateId yet, so create one
    // and backfill the transcript with everything that happened before
    // this request (the hardcoded greeting + the candidate's first reply).
    // Every turn after that: just append the newest message.
    let candidateId = incomingCandidateId as string | null;

    if (!candidateId) {
      const { data: candidate, error: candidateError } = await supabase
        .from("candidates")
        .insert({ job_id: jobContext.id, status: "screening" })
        .select("id")
        .single();

      if (candidateError || !candidate) {
        console.error("🔥 COULD NOT CREATE CANDIDATE:", candidateError?.message);
        throw new Error("Failed to start a candidate record.");
      }

      candidateId = candidate.id;

      // Backfill full history so far (greeting + first candidate message).
      const backfillRows = messages.map((m: { role: string; content: string }) => ({
        candidate_id: candidateId,
        role: m.role,
        content: m.content,
      }));

      const { error: backfillError } = await supabase.from("transcripts").insert(backfillRows);
      if (backfillError) {
        console.error("🔥 COULD NOT BACKFILL TRANSCRIPT:", backfillError.message);
      }
    } else {
      // Every later turn: only the newest message needs saving —
      // everything before it is already in the transcripts table.
      const latestMessage = messages[messages.length - 1];
      const { error: appendError } = await supabase.from("transcripts").insert({
        candidate_id: candidateId,
        role: latestMessage.role,
        content: latestMessage.content,
      });
      if (appendError) {
        console.error("🔥 COULD NOT APPEND MESSAGE:", appendError.message);
      }
    }

    const systemPrompt = `You are Nova, an expert AI recruiter. You are interviewing a candidate for the role of ${jobContext.title} in ${jobContext.location}.

    Role Description: ${jobContext.description}

    ABSOLUTE DEALBREAKERS (Must Have):
    ${jobContext.must_haves}
    If the candidate explicitly lacks any of these, politely let them know they aren't a fit and end the interview.

    NICE TO HAVES:
    ${jobContext.nice_to_haves}
    Probe for these to boost their score, but do not reject them if they lack them.

    RULES:
    1. Keep responses under 3 sentences. Be warm, human, and professional. 
    2. Ask ONLY ONE question at a time. Never overwhelm the candidate with multiple questions in a single message.
    3. Wait for the candidate's answer before moving to the next requirement.
    4. Get the candidate's full name early (you already have this if they've answered), then cover every dealbreaker, then probe 1-2 nice-to-haves if time allows.

    ENDING THE SCREENING:
    Once you have enough information to make a final call — either a dealbreaker was clearly missed, or you've covered the dealbreakers and enough nice-to-haves — write your normal closing message to the candidate (thank them, tell them next steps in plain terms), then on a NEW LINE after it, append a machine-readable decision block in EXACTLY this format and nothing else after it:

    ###DECISION###
    {"status":"qualified" | "rejected" | "needs_review","score":0-100,"candidate_name":"their full name","summary":"one or two sentence recruiter-facing summary","strengths":["short phrase","short phrase"],"concerns":["short phrase"]}
    ###END###

    Use "needs_review" instead of a hard qualified/rejected call whenever the answers are ambiguous, conflicting, or you're genuinely unsure. Do NOT include the decision block until you have truly reached a final verdict — while still asking questions, never include it.`;

    // 0. Work out which Groq key to use: the recruiter's own key if they've
    // opted in and saved one, otherwise our platform key.
    let groqApiKey = process.env.GROQ_API_KEY;

    if (jobContext?.recruiter_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("use_own_keys, groq_api_key")
        .eq("id", jobContext.recruiter_id)
        .single();

      if (profile?.use_own_keys && profile?.groq_api_key) {
        groqApiKey = profile.groq_api_key;
      }
    }

    if (!groqApiKey) {
      console.error("🔥 No Groq key available (no platform key set and recruiter has no key on file)");
      throw new Error("Missing GROQ_API_KEY");
    }

    // 1. Format the messages exactly how the Groq API expects them
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // 2. Make a raw, standard HTTP request to Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // llama3-8b-8192 was decommissioned by Groq (May 2025), and its recommended
        // replacement llama-3.1-8b-instant was itself deprecated June 17, 2026.
        // openai/gpt-oss-20b is the current recommendation: fast, cheap, and active.
        model: "openai/gpt-oss-20b",
        messages: apiMessages,
        temperature: 0.7,
        max_completion_tokens: 450
      })
    });

    // 3. Catch raw HTTP errors immediately and log the actual reason
    if (!response.ok) {
      const errorText = await response.text();
      console.error("🔥 GROQ HTTP ERROR:", errorText);
      throw new Error(`Groq API returned status ${response.status}: ${errorText}`);
    }

    // 4. Parse the response
    const data = await response.json();
    const rawText: string = data.choices[0].message.content;

    // 4b. Check if Nova reached a final verdict this turn. If so, the reply
    // contains a hidden ###DECISION### ... ###END### block after the
    // candidate-facing message — pull it out and never show it to the candidate.
    let aiResponseText = rawText;
    let decision: {
      status: "qualified" | "rejected" | "needs_review";
      score: number;
      candidate_name?: string;
      summary?: string;
      strengths?: string[];
      concerns?: string[];
    } | null = null;

    const decisionMatch = rawText.match(/###DECISION###([\s\S]*?)###END###/);
    if (decisionMatch) {
      aiResponseText = rawText.replace(decisionMatch[0], "").trim();
      try {
        decision = JSON.parse(decisionMatch[1].trim());
      } catch (parseError) {
        console.error("🔥 COULD NOT PARSE DECISION JSON:", decisionMatch[1], parseError);
      }
    }

    // 4c. If we got a valid decision, write the verdict to the candidate record.
    if (decision) {
      const { error: decisionSaveError } = await supabase
        .from("candidates")
        .update({
          status: decision.status,
          score: decision.score,
          name: decision.candidate_name,
          summary: decision.summary,
          strengths: decision.strengths ?? [],
          concerns: decision.concerns ?? [],
        })
        .eq("id", candidateId);

      if (decisionSaveError) {
        console.error("🔥 COULD NOT SAVE DECISION:", decisionSaveError.message);
      }
    }

    // 5. Save the assistant's reply too (candidate-facing text only, no hidden
    // block), so the transcript is complete even if the candidate never
    // sends another message.
    const { error: assistantSaveError } = await supabase.from("transcripts").insert({
      candidate_id: candidateId,
      role: "assistant",
      content: aiResponseText,
    });
    if (assistantSaveError) {
      console.error("🔥 COULD NOT SAVE ASSISTANT REPLY:", assistantSaveError.message);
    }

    return Response.json({ text: aiResponseText, candidateId, done: !!decision, status: decision?.status ?? null });

  } catch (error: any) {
    console.error("🔥 ROUTE CRASHED:", error.message || error);
    return Response.json(
      { text: "System error: I couldn't connect to the AI engine. Check the VS Code terminal." }, 
      { status: 500 }
    );
  }
}
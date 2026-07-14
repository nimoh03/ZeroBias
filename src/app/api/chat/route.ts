import { createClient } from "@/utils/supabase/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, jobContext, candidateId: incomingCandidateId } = await req.json();
    const supabase = await createClient();

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
    3. Wait for the candidate's answer before moving to the next requirement.`;

    // 0. Fail fast and loud if the key is missing, instead of letting fetch throw a vague error later
    if (!process.env.GROQ_API_KEY) {
      console.error("🔥 GROQ_API_KEY is missing from your environment (.env.local)");
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
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // llama3-8b-8192 was decommissioned by Groq (May 2025), and its recommended
        // replacement llama-3.1-8b-instant was itself deprecated June 17, 2026.
        // openai/gpt-oss-20b is the current recommendation: fast, cheap, and active.
        model: "openai/gpt-oss-20b",
        messages: apiMessages,
        temperature: 0.7,
        max_completion_tokens: 250
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
    const aiResponseText = data.choices[0].message.content;

    // 5. Save the assistant's reply too, so the transcript is complete
    // even if the candidate never sends another message.
    const { error: assistantSaveError } = await supabase.from("transcripts").insert({
      candidate_id: candidateId,
      role: "assistant",
      content: aiResponseText,
    });
    if (assistantSaveError) {
      console.error("🔥 COULD NOT SAVE ASSISTANT REPLY:", assistantSaveError.message);
    }

    return Response.json({ text: aiResponseText, candidateId });

  } catch (error: any) {
    console.error("🔥 ROUTE CRASHED:", error.message || error);
    return Response.json(
      { text: "System error: I couldn't connect to the AI engine. Check the VS Code terminal." }, 
      { status: 500 }
    );
  }
}
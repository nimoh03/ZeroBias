export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, jobContext } = await req.json();

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

    // 4. Parse the response and send it to your frontend
    const data = await response.json();
    const aiResponseText = data.choices[0].message.content;

    return Response.json({ text: aiResponseText });

  } catch (error: any) {
    console.error("🔥 ROUTE CRASHED:", error.message || error);
    return Response.json(
      { text: "System error: I couldn't connect to the AI engine. Check the VS Code terminal." }, 
      { status: 500 }
    );
  }
}
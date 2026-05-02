import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  transcript?: string;
  prompt?: string; // optional topic guidance
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY on server" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const { transcript, prompt }: Body = await req.json();
    if (!transcript || !transcript.trim()) {
      return new Response(
        JSON.stringify({ error: "No transcript provided" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const model = process.env.OPENAI_SUMMARY_MODEL || "gpt-4o-mini";
    const openai = new OpenAI({ apiKey });

    // Guard very large transcripts (approximate character cap)
    const MAX_CHARS = 200_000; // ~100-150k tokens across models; keeps request reliable
    const clipped = transcript.length > MAX_CHARS
      ? transcript.slice(0, MAX_CHARS) + "\n\n[...clipped due to length...]"
      : transcript;

    const system = [
      "You are an expert note-taker for university lectures.",
      "Produce concise notes with:",
      "- A 2-4 sentence high-level summary",
      "- 5-12 bullet key points",
      "- Action items (if any)",
      "Write clearly and accessibly.",
    ].join(" ");

    const user = [
      prompt ? `Context: ${prompt}` : "",
      "Transcript:",
      clipped,
      "Output format (markdown):",
      "# Summary\n<summary>\n\n# Key Points\n- <point>\n\n# Action Items\n- <action or 'None'>",
    ]
      .filter(Boolean)
      .join("\n\n");

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const content = completion.choices?.[0]?.message?.content?.trim() || "";
    return new Response(
      JSON.stringify({ summary: content }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    console.error("/api/summarize error", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Summarization failed" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

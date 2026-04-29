import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  transcript: string;
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

    const { transcript }: Body = await req.json();
    if (!transcript || !transcript.trim()) {
      return new Response(
        JSON.stringify({ error: "No transcript provided" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const model = process.env.OPENAI_SUMMARY_MODEL || "gpt-4o-mini";
    const openai = new OpenAI({ apiKey });

    const system = [
      "You annotate lecture transcripts with approximate speaker labels.",
      "Assign speakers as Speaker 1, Speaker 2, etc. Merge obvious continuations.",
      "Do not invent content; keep text intact other than adding labels and paragraphing.",
    ].join(" ");

    const user = `Transcript (raw):\n\n${transcript}\n\nOutput format (markdown):\n\n# Diarized Transcript\n\nSpeaker 1: <text>\n\nSpeaker 2: <text>\n...`;

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const content = completion.choices?.[0]?.message?.content?.trim() || "";
    return new Response(
      JSON.stringify({ diarized: content }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    console.error("/api/diarize error", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Diarization failed" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

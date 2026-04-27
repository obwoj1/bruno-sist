import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 300; // seconds, allow larger uploads

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY on server" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    const prompt = (form.get("prompt") as string) || undefined;
    const language = (form.get("language") as string) || undefined;

    if (!(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: "No audio file provided" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const openai = new OpenAI({ apiKey });
    const model =
      process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe";

    // The OpenAI SDK accepts a web File directly in Node 18+
    const transcription = await openai.audio.transcriptions.create({
      file,
      model,
      // Provide optional guidance
      prompt,
      // If a specific language is known (e.g., "en"), set it for better accuracy
      language,
      temperature: 0.2,
    } as any);

    // SDK returns { text: string, ... } for transcription
    const text = (transcription as any).text ?? String(transcription);

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    console.error("/api/transcribe error", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Transcription failed" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

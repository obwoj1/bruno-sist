export const runtime = "nodejs";

export async function GET() {
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const transcriptionModel =
    process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe";
  const summaryModel = process.env.OPENAI_SUMMARY_MODEL || "gpt-4o-mini";
  const body = {
    openaiConfigured,
    transcriptionModel,
    summaryModel,
    nodeVersion: process.version,
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

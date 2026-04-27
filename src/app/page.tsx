"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Status =
  | "idle"
  | "recording"
  | "paused"
  | "processing"
  | "ready";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [mediaType, setMediaType] = useState<string>("audio/webm");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const recorderRef = useRef<MediaRecorder | null>(null);

  // Simple session management (localStorage)
  type Session = {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    transcript: string;
    summary: string;
    prompt: string;
    language: string;
  };

  const [sessionId, setSessionId] = useState<string>("");
  const [sessionName, setSessionName] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    // Feature-detect supported mime types (Safari often prefers mp4)
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
    ];
    for (const c of candidates) {
      if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(c)) {
        setMediaType(c);
        break;
      }
    }
  }, []);

  useEffect(() => {
    // Load saved sessions list
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("bruno-sist:sessions") : null;
      if (raw) setSessions(JSON.parse(raw));
    } catch {}
  }, []);

  function persistSessions(next: Session[]) {
    setSessions(next);
    try {
      localStorage.setItem("bruno-sist:sessions", JSON.stringify(next));
    } catch {}
  }

  function newId() {
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    ).toUpperCase();
  }

  function newSession() {
    setSessionId("");
    setSessionName("");
    setPrompt("");
    setLanguage("");
    setTranscript("");
    setSummary("");
    setError(null);
    setStatus("idle");
  }

  function saveSession() {
    const id = sessionId || newId();
    const now = Date.now();
    const name = sessionName || `Session ${new Date(now).toLocaleString()}`;
    const payload: Session = {
      id,
      name,
      createdAt: sessionId ? sessions.find(s => s.id === sessionId)?.createdAt ?? now : now,
      updatedAt: now,
      transcript,
      summary,
      prompt,
      language,
    };
    const others = sessions.filter(s => s.id !== id);
    const next = [payload, ...others].sort((a, b) => b.updatedAt - a.updatedAt);
    setSessionId(id);
    setSessionName(name);
    persistSessions(next);
  }

  function loadSession(id: string) {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    setSessionId(s.id);
    setSessionName(s.name);
    setPrompt(s.prompt);
    setLanguage(s.language);
    setTranscript(s.transcript);
    setSummary(s.summary);
    setError(null);
    setStatus(s.transcript ? "ready" : "idle");
  }

  function reset() {
    setChunks([]);
    setTranscript("");
    setSummary("");
    setError(null);
    setStatus("idle");
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: mediaType });
      setStatus("recording");
      setChunks([]);
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) setChunks((prev) => [...prev, e.data]);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = rec;
      rec.start(1000);
    } catch (e: any) {
      setError(e?.message || "Unable to access microphone");
    }
  }

  function pauseRecording() {
    recorderRef.current?.pause();
    setStatus("paused");
  }

  function resumeRecording() {
    recorderRef.current?.resume();
    setStatus("recording");
  }

  async function stopRecording() {
    const rec = recorderRef.current;
    if (!rec) return;
    return new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.stop();
      setStatus("processing");
    });
  }

  const audioBlob = useMemo(() => {
    if (!chunks.length) return null;
    return new Blob(chunks, { type: mediaType });
  }, [chunks, mediaType]);

  async function transcribe(blob: Blob) {
    setError(null);
    try {
      const fd = new FormData();
      const ext = mediaType.includes("mp4")
        ? "m4a"
        : mediaType.includes("mpeg")
        ? "mp3"
        : "webm";
      fd.append("file", new File([blob], `recording.${ext}`, { type: blob.type }));
      if (prompt) fd.append("prompt", prompt);
      if (language) fd.append("language", language);

      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTranscript(data.text || "");
      setStatus("ready");
    } catch (e: any) {
      setError(e?.message || "Transcription failed");
      setStatus("idle");
    }
  }

  async function handleStopAndTranscribe() {
    await stopRecording();
    if (audioBlob) await transcribe(audioBlob);
  }

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("processing");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (prompt) fd.append("prompt", prompt);
      if (language) fd.append("language", language);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTranscript(data.text || "");
      setStatus("ready");
    } catch (e: any) {
      setError(e?.message || "Upload failed");
      setStatus("idle");
    }
  }

  async function summarize() {
    if (!transcript) return;
    setError(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript, prompt }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSummary(data.summary || "");
    } catch (e: any) {
      setError(e?.message || "Summarization failed");
    }
  }

  function speak(text: string) {
    try {
      const synth = window.speechSynthesis;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      u.pitch = 1;
      synth.cancel();
      synth.speak(u);
    } catch {}
  }

  function download(name: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportMarkdown() {
    const header = `# ${sessionName || "Untitled Session"}`;
    const meta = `\n\n> Prompt: ${prompt || "(none)"}\n> Language: ${language || "(auto)"}`;
    const body = `\n\n## Summary\n\n${summary || "(No summary yet)"}\n\n## Transcript\n\n${transcript || "(No transcript yet)"}`;
    download(`${sessionName || "session"}.md`, `${header}${meta}${body}`);
  }

  function exportJSON() {
    const data = {
      id: sessionId || null,
      name: sessionName || "Untitled Session",
      prompt,
      language,
      transcript,
      summary,
      exportedAt: new Date().toISOString(),
    };
    download(`${sessionName || "session"}.json`, JSON.stringify(data, null, 2));
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Bruno‑Sist · AI Lecture Transcriber</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Record or upload lecture audio. Transcribe, summarize, and listen back.
        </p>

        <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium">Session name</label>
              <input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., COSC 354 – Lecture 5"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveSession}
                className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
              >
                Save
              </button>
              <button
                onClick={newSession}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                New Session
              </button>
            </div>
          </div>

          {sessions.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="text-sm text-zinc-600 dark:text-zinc-400">Load:</label>
              <select
                className="rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                onChange={(e) => e.target.value && loadSession(e.target.value)}
                value=""
              >
                <option value="" disabled>
                  Select a saved session
                </option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {new Date(s.updatedAt).toLocaleString()}
                  </option>
                ))}
              </select>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={exportMarkdown}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Export .md
                </button>
                <button
                  onClick={exportJSON}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Export .json
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 space-y-4">
          <label className="block text-sm font-medium">Context Prompt (optional)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Linear algebra lecture on eigenvalues and eigenvectors"
            className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm outline-none ring-0 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
            rows={3}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Language hint (optional)</label>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g., en, es, fr"
                className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Upload audio</label>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={handleUploadFile}
                className="block w-full cursor-pointer text-sm file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-white hover:file:bg-zinc-800 dark:file:bg-zinc-100 dark:file:text-black dark:hover:file:bg-zinc-200"
              />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium">Recorder</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {status === "idle" && (
              <button
                onClick={startRecording}
                className="rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
              >
                Start Recording
              </button>
            )}
            {status === "recording" && (
              <>
                <button
                  onClick={pauseRecording}
                  className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Pause
                </button>
                <button
                  onClick={handleStopAndTranscribe}
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-500"
                >
                  Stop & Transcribe
                </button>
              </>
            )}
            {status === "paused" && (
              <>
                <button
                  onClick={resumeRecording}
                  className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Resume
                </button>
                <button
                  onClick={handleStopAndTranscribe}
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-500"
                >
                  Stop & Transcribe
                </button>
              </>
            )}
            {(status === "processing" || status === "recording" || status === "paused") && (
              <span className="self-center text-sm text-zinc-600 dark:text-zinc-400">
                {status === "processing" ? "Processing…" : status === "paused" ? "Paused" : "Recording…"}
              </span>
            )}
            {(status === "ready" || transcript) && (
              <button
                onClick={reset}
                className="ml-auto rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Reset
              </button>
            )}
          </div>

          {audioBlob && (
            <audio controls className="mt-4 w-full">
              <source src={URL.createObjectURL(audioBlob)} type={mediaType} />
            </audio>
          )}
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Transcript</h2>
              <div className="flex gap-2">
                <button
                  disabled={!transcript}
                  onClick={() => transcript && navigator.clipboard.writeText(transcript)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Copy
                </button>
                <button
                  disabled={!transcript}
                  onClick={() => transcript && download("transcript.txt", transcript)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Download
                </button>
                <button
                  disabled={!transcript}
                  onClick={() => speak(transcript)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Speak
                </button>
              </div>
            </div>
            <div className="mt-3 min-h-[160px] whitespace-pre-wrap rounded-md border border-dashed border-zinc-300 p-3 text-sm dark:border-zinc-700">
              {transcript || <span className="text-zinc-500">Your transcription will appear here…</span>}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Summary</h2>
              <div className="flex gap-2">
                <button
                  disabled={!transcript}
                  onClick={summarize}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
                >
                  Summarize
                </button>
                <button
                  disabled={!summary}
                  onClick={() => speak(summary)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Speak
                </button>
              </div>
            </div>
            <div className="prose prose-zinc dark:prose-invert mt-3 min-h-[160px] rounded-md border border-dashed border-zinc-300 p-3 text-sm dark:border-zinc-700">
              {summary ? (
                <article dangerouslySetInnerHTML={{ __html: markedToHtml(summary) }} />
              ) : (
                <span className="text-zinc-500">Your summary will appear here…</span>
              )}
            </div>
          </div>
        </section>

        {error && (
          <p className="mt-6 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            {String(error)}
          </p>
        )}
      </main>
    </div>
  );
}

// Very small markdown-to-HTML helper for basic formatting (no external deps)
function markedToHtml(md: string) {
  // Extremely minimal: headers and bullet points to HTML
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  for (const ln of lines) {
    if (/^#\s+/.test(ln)) out.push(`<h2>${esc(ln.replace(/^#\s+/, ""))}</h2>`);
    else if (/^##\s+/.test(ln)) out.push(`<h3>${esc(ln.replace(/^##\s+/, ""))}</h3>`);
    else if (/^\-\s+/.test(ln)) out.push(`<li>${esc(ln.replace(/^\-\s+/, ""))}</li>`);
    else if (!ln.trim()) out.push("");
    else out.push(`<p>${esc(ln)}</p>`);
  }
  // Wrap any <li> blocks with <ul>
  const html = out
    .join("\n")
    .replace(/(?:^|\n)(<li>.*?<\/li>)(?=\n|$)/gs, (m) => `<ul>\n${m}\n</ul>`);
  return html;
}

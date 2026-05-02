"use client";

import { useEffect, useMemo, useState } from "react";
import { markedToHtml } from "@/lib/markdown";

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

export default function LabsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("bruno-sist:sessions") : null;
      if (raw) {
        const list: Session[] = JSON.parse(raw);
        setSessions(list.sort((a, b) => b.updatedAt - a.updatedAt));
        if (list.length) setSelected(list[0].id);
      }
    } catch {}
  }, []);

  const current = useMemo(() => sessions.find(s => s.id === selected) || null, [sessions, selected]);

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

  function exportMarkdown(s: Session) {
    const header = `# ${s.name || "Untitled Session"}`;
    const meta = `\n\n> Prompt: ${s.prompt || "(none)"}\n> Language: ${s.language || "(auto)"}`;
    const body = `\n\n## Summary\n\n${s.summary || "(No summary)"}\n\n## Transcript\n\n${s.transcript || "(No transcript)"}`;
    download(`${s.name || "session"}.md`, `${header}${meta}${body}`);
  }

  function exportJSON(s: Session) {
    const data = {
      ...s,
      exportedAt: new Date().toISOString(),
    };
    download(`${s.name || "session"}.json`, JSON.stringify(data, null, 2));
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Bruno‑Sist Labs · Sessions</h1>
          <a href="/" className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">Back to Recorder</a>
        </div>

        {sessions.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            No saved sessions yet. Create one on the home page.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <aside className="sm:col-span-1 space-y-2">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${selected === s.id ? "border-zinc-900 dark:border-zinc-100" : "border-zinc-300 dark:border-zinc-700"}`}
                >
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {new Date(s.updatedAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </aside>

            <section className="sm:col-span-2">
              {current ? (
                <div className="space-y-6">
                  <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium">{current.name}</h2>
                      <div className="flex gap-2">
                        <button onClick={() => exportMarkdown(current)} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Export .md</button>
                        <button onClick={() => exportJSON(current)} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Export .json</button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      Prompt: <span className="font-mono">{current.prompt || "(none)"}</span> · Language: <span className="font-mono">{current.language || "(auto)"}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Transcript</h3>
                        <div className="flex gap-2">
                          <button
                            disabled={!current.transcript}
                            onClick={() => current.transcript && navigator.clipboard.writeText(current.transcript)}
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          >
                            Copy
                          </button>
                          <button
                            disabled={!current.transcript}
                            onClick={() => current.transcript && speak(current.transcript)}
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          >
                            Speak
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 min-h-[160px] whitespace-pre-wrap rounded-md border border-dashed border-zinc-300 p-3 text-sm dark:border-zinc-700">
                        {current.transcript || <span className="text-zinc-500">(empty)</span>}
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Summary</h3>
                        <div className="flex gap-2">
                          <button
                            disabled={!current.summary}
                            onClick={() => current.summary && navigator.clipboard.writeText(current.summary)}
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          >
                            Copy
                          </button>
                          <button
                            disabled={!current.summary}
                            onClick={() => current.summary && speak(current.summary)}
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          >
                            Speak
                          </button>
                        </div>
                      </div>
                      <div className="prose prose-zinc dark:prose-invert mt-3 min-h-[160px] rounded-md border border-dashed border-zinc-300 p-3 text-sm dark:border-zinc-700">
                        {current.summary ? (
                          <article dangerouslySetInnerHTML={{ __html: markedToHtml(current.summary) }} />
                        ) : (
                          <span className="text-zinc-500">(empty)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

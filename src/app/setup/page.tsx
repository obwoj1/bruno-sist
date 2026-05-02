"use client";

import { useEffect, useState } from "react";

type Health = {
  openaiConfigured: boolean;
  transcriptionModel: string;
  summaryModel: string;
  nodeVersion: string;
};

export default function SetupPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) throw new Error(await res.text());
        setHealth(await res.json());
      } catch (e: any) {
        setError(e?.message || "Failed to check health");
      }
    })();
  }, []);

  const template = `OPENAI_API_KEY=\n# Optional\n# OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe\n# OPENAI_SUMMARY_MODEL=gpt-4o-mini`;

  function copyTemplate() {
    navigator.clipboard.writeText(template);
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Setup</h1>
          <a href="/" className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">Back to Recorder</a>
        </div>

        <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium">Environment Check</h2>
          {error && (
            <p className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}
          {health && (
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                OpenAI API Key: {health.openaiConfigured ? (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-green-800 dark:bg-green-900/30 dark:text-green-300">Configured</span>
                ) : (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Missing</span>
                )}
              </li>
              <li>Transcription model: <span className="font-mono">{health.transcriptionModel}</span></li>
              <li>Summary model: <span className="font-mono">{health.summaryModel}</span></li>
              <li>Node: <span className="font-mono">{health.nodeVersion}</span></li>
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium">Quick Start</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm">
            <li>Open a terminal and run: <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">cp .env.example .env.local</code></li>
            <li>Edit <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">.env.local</code> and set <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">OPENAI_API_KEY</code></li>
            <li>Restart the dev server if it was running, then refresh this page</li>
          </ol>
          <div className="mt-3">
            <label className="block text-sm font-medium">.env.local template</label>
            <pre className="mt-2 overflow-x-auto rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950"><code>{template}</code></pre>
            <button onClick={copyTemplate} className="mt-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Copy</button>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium">Helpful Links</h2>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
            <li><a className="underline" href="/labs">Browse saved sessions (offline)</a></li>
            <li><a className="underline" target="_blank" href="https://github.com/obwoj1/bruno-sist">GitHub repository</a></li>
            <li><a className="underline" target="_blank" href="https://platform.openai.com/api-keys">Get an OpenAI API key</a></li>
          </ul>
        </section>
      </main>
    </div>
  );
}

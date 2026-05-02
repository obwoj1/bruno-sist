Bruno‑Sist — AI Lecture Transcriber

Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- OpenAI SDK (transcription + summarization)

Getting Started
1. Install deps: `npm install`
2. Create env file: `cp .env.example .env.local`
3. Set `OPENAI_API_KEY` in `.env.local`
4. Run dev server: `npm run dev`
5. Open http://localhost:3000 (recorder), http://localhost:3000/labs (offline sessions), http://localhost:3000/setup (env help)

Features
- Record/upload audio; optional context prompt and language hint
- Transcribe via OpenAI, summarize into structured notes
- Session save/load (localStorage); export Markdown/JSON
- Segmented transcription for recordings with rough timestamps; export SRT/VTT
- Diarization (heuristic speaker labeling)

Environment
- `OPENAI_API_KEY` is required for `/api/transcribe`, `/api/summarize`, `/api/diarize`
- Optional: `OPENAI_TRANSCRIPTION_MODEL` (default: gpt-4o-mini-transcribe)
- Optional: `OPENAI_SUMMARY_MODEL` (default: gpt-4o-mini)

Testing & CI
- Run tests: `npm test` (Vitest)
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- GitHub Actions CI runs on pushes and PRs to `main` (build, lint, typecheck, test)

Deploying
- Recommended: Vercel. Connect the GitHub repo, add `OPENAI_API_KEY` in Project Settings → Environment Variables, then deploy.
- Build command: `npm run build`. Framework preset: Next.js. No extra config required.

Repo
- https://github.com/obwoj1/bruno-sist

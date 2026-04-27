Bruno‑Sist Roadmap

Day 1 (MVP Enhancements)
- Session management: name, save/load to localStorage
- Export: Markdown and JSON
- Basic UI polish and recorder states

Day 2 (Analysis Features)
- Timestamps and segmenting long audio for chunk-based transcription
- Heuristic speaker separation and per-segment notes
- Exports: SRT/VTT for captions

Day 3 (Stability & Delivery)
- Tests for API routes and critical UI flows
- Optional deployment to Vercel and GitHub Actions workflow
- Performance tuning and accessibility pass

Notes
- Transcription model: gpt-4o-mini-transcribe (override with OPENAI_TRANSCRIPTION_MODEL)
- Summarization model: gpt-4o-mini (override with OPENAI_SUMMARY_MODEL)

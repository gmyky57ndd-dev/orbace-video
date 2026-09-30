# CLAUDE.md — orbace-video

This repo is the golden source for all Orbace Tech (Orbace Sudoku) video generation and publishing. Read `README.md` for the layout and rules; this file is the short version for Claude sessions.

## Before making or changing a video

1. Read `standards/ORBACE-VIDEO-GENERATION-STANDARD-v2.0.md` (it inherits `standards/ORBACE-REPLAY-TRAILER-STANDARD-v1.0.md`). Follow it exactly: genuine replay footage only, never fabricate UI/moves/techniques, trailers never show the solved board, CTA "Watch the complete replay", brand line "Replay the thinking."
2. Put the work in the right type folder: `videos/full-replay/<SUPU-ID>/`, `videos/journal-lesson/lessonN/`, `videos/trailer/<SUPU-ID>-<level>[-slug]/`, or `videos/brand-product/<campaign>/`. Use the standard inner layout (brief, script, source, production, review, renders/vN, renders/final, publishing) and keep the video's README current.
3. Su-pu videos are built with `tools/supu-replay-pipeline/` (Playwright capture of the real replay page → Python/PIL render → numpy audio → ffmpeg). Journal lessons of the older lineage use `tools/remotion/`.
4. Required formats: 9:16 + 16:9 for every su-pu video (4K masters), plus 1:1 for trailers. Render each format from its own capture; never crop.

## Files and naming

- Finals: `renders/final/<SUPU-ID>_<full|lesson|trailer>_<169|916|11>_<4k|1080p>.mp4`, captions `<SUPU-ID>_<type>.en.srt`. Finals are Git LFS (`.gitattributes`).
- Iterations go in a new `renders/vN/` and are git-ignored (local-only), as are WAV stems, raw captures, frames and node_modules. Never commit other video/audio files; never overwrite a numbered render.
- Su-pu IDs keep the form `SP-YYYYMMDD-NNNNNN`; other names are lowercase kebab-case.

## Publishing

- Every upload or post gets a row in `publishing/publish-log.csv` via `python3 tools/scripts/log-publish.py …` in the same change. Do not rewrite past rows except `status`/`notes`.
- Showcase data: `publishing/showcase-manifest.json` (schema in `docs/plans/SUPU-SHOWCASE-ENHANCEMENT-PLAN.md`).
- Only publish, post, or upload when the user explicitly asks. YouTube channel: https://www.youtube.com/@OrbaceSudoku (channel UCMGkE8fPreuJNxqqR3A33qg).
- r/sudoku forbids commercial links and full solves; community posts go to r/orbace_sudoku.

## Working in a cloud session

- The repo clones with LFS finals; iteration media is not available in the cloud, so rebuild what you need with the pipeline (live site: https://orbacesudoku.com/su-pu/<SUPU-ID>; su-pu data API: https://justinzero.fly.dev/supu/<SUPU-ID>).
- Run `bash tools/cloud-setup.sh` first (git-lfs, ffmpeg, Python deps, Playwright). It is also the setup script for the Claude cloud environment.
- Record every move/rename in `docs/REORGANIZATION-MAP.md`.

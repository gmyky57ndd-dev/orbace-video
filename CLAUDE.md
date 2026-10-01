# CLAUDE.md — orbace-video

This repo is the golden source for all Orbace Tech (Orbace Sudoku) video generation and publishing. Read `README.md` for the layout and rules; this file is the short version for Claude sessions.

## Before making or changing a video

1. Read `standards/ORBACE-VIDEO-GENERATION-STANDARD-v2.0.md` (it inherits `standards/ORBACE-REPLAY-TRAILER-STANDARD-v1.0.md`). Follow it exactly: genuine replay footage only, never fabricate UI/moves/techniques, trailers never show the solved board, CTA "Watch the complete replay", brand line "Replay the thinking."
2. Put the work in the right type folder: `videos/full-replay/<SUPU-ID>/`, `videos/journal-lesson/lessonN/`, `videos/trailer/<SUPU-ID>-<level>[-slug]/`, or `videos/brand-product/<campaign>/`. Use the standard inner layout (brief, script, source, production, review, renders/vN, renders/final, publishing) and keep the video's README current.
3. Su-pu videos are built with `tools/supu-replay-pipeline/` (Playwright capture of the real replay page → Python/PIL render → numpy audio → ffmpeg). Journal lessons of the older lineage use `tools/remotion/`.
4. Required formats: 9:16 + 16:9 for every su-pu video (4K masters), plus 1:1 for trailers. Render each format from its own capture; never crop.

## Files and naming

- Finals: `renders/final/<SUPU-ID>_<full|lesson|trailer>_<169|916|11>_<4k|1080p>.mp4`, captions `<SUPU-ID>_<type>.en.srt`. **Videos stay local: never commit or push any video/audio file** (see "Videos stay local" below).
- Iterations go in a new `renders/vN/`; never overwrite a numbered render. Everything below is git-ignored and local-only: `renders/vN/`, `renders/final/` videos, WAV stems, raw captures, frames, node_modules.

## Videos stay local (decision 2026-10-01)

Video files are large and get iterated constantly, so they are **never** pushed to GitHub, LFS or any server. Git holds only the text around them: briefs, scripts, captions (`.srt`), JSON, thumbnails, copy, READMEs, code.

- Do not `git add -f`, do not work around `.gitignore`, do not set up LFS uploads, and do not retry a push that fails over a video. If a video is staged, unstage it (`git reset -q -- <file>`); `tools/githooks/pre-commit` blocks new video/audio commits.
- Finals still go in `renders/final/` with the standard names (git-ignored). Record each file's size, duration and `sha256sum` in the video's README so the local copy can be verified.
- In a cloud session the container is temporary: hand finished videos to the user with the file-delivery tool (`SendUserFile`) before the session ends, and say that they are not in the PR.
- The PR carries everything except the videos. Do not wait on, or block a PR for, video upload.
- Legacy: the 12 finals committed before this decision stay tracked as Git LFS pointers; do not add more.
- Su-pu IDs keep the form `SP-YYYYMMDD-NNNNNN`; other names are lowercase kebab-case.

## Publishing

- Every upload or post gets a row in `publishing/publish-log.csv` via `python3 tools/scripts/log-publish.py …` in the same change. Do not rewrite past rows except `status`/`notes`.
- Showcase data: `publishing/showcase-manifest.json` (schema in `docs/plans/SUPU-SHOWCASE-ENHANCEMENT-PLAN.md`).
- Only publish, post, or upload when the user explicitly asks. YouTube channel: https://www.youtube.com/@OrbaceSudoku (channel UCMGkE8fPreuJNxqqR3A33qg).
- r/sudoku forbids commercial links and full solves; community posts go to r/orbace_sudoku.

## Working in a cloud session

- Video media is not in the repo (only 12 legacy LFS pointers), so rebuild what you need with the pipeline (live site: https://orbacesudoku.com/su-pu/<SUPU-ID>; su-pu data API: https://justinzero.fly.dev/supu/<SUPU-ID>).
- Run `bash tools/cloud-setup.sh` first (ffmpeg, Python deps, Playwright; sets the video guard hook). It is also the setup script for the Claude cloud environment.
- Record every move/rename in `docs/REORGANIZATION-MAP.md`.

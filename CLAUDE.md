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
- In a cloud session the container is temporary: send the finished videos to the PM in chat with the file-delivery tool (`SendUserFile`) before the session ends, and say that they are not in the PR. The PM downloads them from the chat and stores them locally (see "Video package and handoff").
- The PR carries everything except the videos. Do not wait on, or block a PR for, video upload.
- Legacy: the 12 finals committed before this decision stay tracked as Git LFS pointers; do not add more.
- Su-pu IDs keep the form `SP-YYYYMMDD-NNNNNN`; other names are lowercase kebab-case.

## Video package and handoff (playbook, 2026-10-01)

Roles: **Claude** makes the package; the **PM** collects the videos and uploads them. Claude never uploads or posts.

A finished video is a package, not just an MP4. Claude delivers all of it:

| Item | Where | How the PM gets it |
| --- | --- | --- |
| 4K finals (9:16 + 16:9; + 1:1 for trailers) | `renders/final/` (local-only) | Sent in chat with `SendUserFile`; PM downloads |
| Captions `<SUPU-ID>_<type>.en.srt` | `renders/final/` | In the PR |
| **YouTube copy**: title (+2 alternates), description (UTM-tagged su-pu link first, chapters if over 1 min, hashtags), pinned comment, one set per format (16:9 upload, 9:16 Short) | `publishing/youtube-copy.md` | In the PR |
| **Thumbnails**: 1280×720 (16:9), 1080×1920 (9:16), 1080×1080 (1:1, trailers), each from a real replay frame, as JPG | `publishing/thumbnails/` | In the PR; also send the JPGs in chat with the videos |
| README: su-pu, steps, length, file sizes, sha256 | video's `README.md` | In the PR |

Handoff steps:
1. Claude opens the PR (text, captions, copy, thumbnails, scripts; no videos), sends the videos and thumbnails in chat stating each file's name and sha256, and adds the render rows to the production log (see "Production log").
2. **PM downloads the videos from the chat** and saves them to the matching local path in their own clone: `videos/<type>/<id>/renders/final/` (checks the sha256 in the README), then merges the PR and pulls.
3. **PM uploads to YouTube** (16:9 as a regular video, 9:16 as a Short linked to the 16:9) using `publishing/youtube-copy.md` and the thumbnails.
4. **PM logs every upload** (`python3 tools/scripts/log-publish.py …`, in the same change) and sets the showcase entry live. Claude can prepare the log row and the `showcase-manifest.json` change on request once the PM gives the YouTube IDs.
5. Claude does not upload, post or change YouTube settings unless the PM explicitly asks.

## Production log (shared Google Sheet)

[Orbace video production log](https://docs.google.com/spreadsheets/d/1P3-K7YcRJpS9sSG-beBCmZ0rTcyYPnuTeIYT3SeWQJU/edit) is the one list of every render: what it is, which version, size, length, sha256, status, where it was made, and which branch or PR carries its files. Videos are not in Git, so this Sheet (not Git) is how everyone knows what exists. It is separate from `publishing/publish-log.csv`, which stays upload-only.

- **One row per render that leaves draft** (sent to the PM, approved, or final). Superseded versions keep their row with status `superseded`; never delete rows.
- **Cloud or local, the same way:** run `python3 tools/scripts/production-log.py row <file> --status final --made-in cloud|local --branch <branch or PR> --notes "…"` (add `--work`, `--version`, `--date`, `--youtube` as needed). It measures the file and prints a tab-separated row. If the session has the Google Sheets connector, append the row to the Sheet directly (Drive alone can create but not edit a sheet). Otherwise print the row in the final message so the PM can paste it at the bottom of the Sheet. Do this in the same session that produced the render.
- **Statuses:** `draft`, `ready for review`, `approved`, `final`, `superseded`. The PM updates Status and the YouTube ID in the Sheet as work moves on; Claude does not upload.
- **Reconcile on the machine that holds the videos:** download the Sheet as CSV and run `python3 tools/scripts/production-log.py check <file.csv>`. It lists renders that are not logged, logged files that are not on this machine, and hash mismatches. `production-log.py scan --csv` rebuilds rows for every local render.

## Publishing

- Every upload or post gets a row in `publishing/publish-log.csv` via `python3 tools/scripts/log-publish.py …` in the same change. Do not rewrite past rows except `status`/`notes`.
- Showcase data: `publishing/showcase-manifest.json` (schema in `docs/plans/SUPU-SHOWCASE-ENHANCEMENT-PLAN.md`).
- Only publish, post, or upload when the user explicitly asks. YouTube channel: https://www.youtube.com/@OrbaceSudoku (channel UCMGkE8fPreuJNxqqR3A33qg).
- r/sudoku forbids commercial links and full solves; community posts go to r/orbace_sudoku.

## Working in a cloud session

- Video media is not in the repo (only 12 legacy LFS pointers), so rebuild what you need with the pipeline (live site: https://orbacesudoku.com/su-pu/<SUPU-ID>; su-pu data API: https://justinzero.fly.dev/supu/<SUPU-ID>).
- Run `bash tools/cloud-setup.sh` first (ffmpeg, Python deps, Playwright; sets the video guard hook). It is also the setup script for the Claude cloud environment.
- Record every move/rename in `docs/REORGANIZATION-MAP.md`.

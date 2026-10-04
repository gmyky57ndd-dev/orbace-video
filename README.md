# Orbace Video — golden source

The single source of truth for **all Orbace Tech video generation and publishing**: standards, briefs, scripts, source data, production code, every numbered render, the approved finals, and the publish log. GitHub: https://github.com/gmyky57ndd-dev/orbace-video

Everything is organized by the **video type** defined in the standard:

```text
orbace-video/
├── CLAUDE.md                instructions for Claude sessions working in this repo
├── standards/               the rules every video follows (versioned)
├── videos/
│   ├── full-replay/         every step of a real Extreme su-pu, no voice      → <SUPU-ID>/
│   ├── journal-lesson/      a Journal study paired with its replay              → lessonN/, _template/
│   ├── trailer/             hook → turning point → invitation to the replay     → <SUPU-ID>-<level>[-slug]/
│   └── brand-product/       brand films, promo shorts, App Store / Play videos  → <campaign>/
├── publishing/              publish-log.csv (every upload/post), showcase manifest, checklist
├── docs/                    plans (docs/plans/), process notes, reorganization map, archive notes
├── tools/                   supu-replay-pipeline/ (su-pu videos), remotion/ (Journal, brand), scripts/
├── shared-assets/           material used by more than one video (su-pu artwork, captures, manifests)
└── _archive/                superseded or legacy trees kept for traceability
```

## Every video folder looks the same

```text
videos/<type>/<id>/
  README.md        what it is, su-pu, final files, lineage, where it is published
  brief/           prompts, briefs, revision notes (all versions)
  script/          narration, captions, voice files
  source/          su-pu data, page snapshots, cover art
  production/      plans, config, audio stems (stems are local-only, see below)
  review/          QA stills, auditions, feedback
  renders/v1, v2…  iterations (local-only, never overwritten)
  renders/final/   approved deliverables (local-only, git-ignored; never pushed)
  publishing/      titles, descriptions, thumbnails, post copy
```

## Formats

| Type | Required formats | Master |
| --- | --- | --- |
| full-replay | 9:16 + 16:9 | 4K |
| journal-lesson | 9:16 + 16:9 | 4K |
| trailer | 9:16 + 16:9 + 1:1 | 4K (current trailers are 1080p) |
| brand-product | per brief | per brief |

9:16 is primary (≈90% of marketing viewers are on phones). Each format is rendered from its own capture, never cropped from another. Full rules: `standards/ORBACE-VIDEO-GENERATION-STANDARD-v2.0.md`.

## Rules

1. **Finals live only in `renders/final/`**, named `<SUPU-ID>_<type>_<format>_<res>.mp4` (type `full`/`lesson`/`trailer`; format `169`/`916`/`11`; res `4k`/`1080p`). Captions `<SUPU-ID>_<type>.en.srt`.
2. **Never overwrite a numbered render.** Promote by copying into `final/` and updating the README (size, duration, sha256).
   **Videos stay local.** Never commit or push a video/audio file (no Git, no LFS, no server): files are large and iterated often. Git carries only the text, captions, JSON, thumbnails and code.
3. **Log every publish** in `publishing/publish-log.csv` (use `tools/scripts/log-publish.py`), in the same change.
4. **Standards change by new version file**, never by editing in place.
5. **Downloads, chat attachments and cloud scratch folders are not sources** — file everything here before publishing.
6. Names: su-pu IDs keep `SP-YYYYMMDD-NNNNNN`; everything else lowercase kebab-case; Journal lessons `lessonN`.

## What is in Git and what stays local

| Kind | Where it lives |
| --- | --- |
| Docs, briefs, scripts, captions, code, JSON, thumbnails, voice MP3s | Git |
| `renders/final/**` videos | **Local only** (git-ignored, never pushed). Record size/duration/sha256 in the video's README. In a cloud session, send them to the user with the file-delivery tool. Twelve finals committed before 2026-10-01 remain as legacy Git LFS pointers |
| Iteration renders (`renders/v*`, `renders/review`), previews, raw captures, WAV stems, `node_modules`, frame caches | **Local only** (git-ignored). Kept on the production Mac; rebuildable or superseded |

> **Videos stay local.** `tools/githooks/pre-commit` (enabled by `tools/cloud-setup.sh`; on a Mac run `git config core.hooksPath tools/githooks` once) refuses new video/audio commits. A PR never contains videos.

## Production log

Every render is listed in the shared Google Sheet [Orbace video production log](https://docs.google.com/spreadsheets/d/1P3-K7YcRJpS9sSG-beBCmZ0rTcyYPnuTeIYT3SeWQJU/edit) (columns: date, su-pu, work, type, format, version, resolution, length, file, size, sha256, status, made in, branch or PR, YouTube ID, notes). Cloud sessions add their rows (or hand them to the PM to paste); local work adds its own; `tools/scripts/production-log.py` measures a file and prints the row, and checks a machine's renders against the Sheet. Details: `CLAUDE.md` → "Production log". `publishing/publish-log.csv` remains the upload record.

## Roles and handoff

- **Claude** (cloud or local) produces the full video package: 4K videos, captions, YouTube title/description/chapters/pinned comment, thumbnails (1280×720, 1080×1920, 1:1 for trailers), README. Copy and thumbnails go in `videos/<type>/<id>/publishing/` and ship in the PR.
- **PM** downloads the videos from the chat (cloud sessions send them with the file-delivery tool), stores them in `videos/<type>/<id>/renders/final/` locally, **uploads to YouTube**, and logs each upload in `publishing/publish-log.csv`. Claude never uploads.
- Full steps and package contents: `CLAUDE.md` → "Video package and handoff".

## Workflows

- Agent playbook (cloud and local, end to end, including logs): `docs/MARKETING-VIDEO-AGENT-PLAYBOOK.md`
- Su-pu videos (full replay, lesson, trailer): `tools/supu-replay-pipeline/README.md`
- Journal lessons (Remotion lineage): `videos/journal-lesson/_template/JOURNAL-VIDEO-PRODUCTION-TEMPLATE.md`
- Publishing: `publishing/README.md`
- Provenance of every move: `docs/REORGANIZATION-MAP.md`

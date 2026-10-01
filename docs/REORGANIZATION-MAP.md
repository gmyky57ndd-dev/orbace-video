# Orbace Video Reorganization Map

Date: 2026-08-24  
Scope: `/Users/justinzero/orbacetech/DevProjects/orbace-sudoku/orbace-video`

This map records the non-destructive consolidation performed from the original project tree and the earlier staging tree. The exact attached task specification is saved as `docs/archive/CODEX-TASK-REORGANIZE-ORBACE-VIDEO-SOURCE.md`.

## Significant moves/copies

| Original | Canonical destination | Treatment |
|---|---|---|
| `lesson07/src/series/` | `tools/remotion/src/series/` | Shared Journal composition copied out of Lesson 7 |
| authored `lesson07` Remotion project (excluding dependencies, caches, and generated outputs) | `os-journal/lesson7/production/remotion/` | Complete Lesson 7 build context retained with its `src/`, `public/`, scripts, and lockfile |
| `lesson07/scripts/journal-video.mjs` | `tools/remotion/scripts/journal-video.mjs` | Parameterized lesson command |
| `lesson07/package*.json`, `remotion.config.ts`, `tsconfig.json` | `tools/remotion/` | Reproducible shared project configuration |
| `lesson07/src/lessons/lesson-01/` | `os-journal/lesson1/production/remotion/lesson/` | Lesson 1-specific implementation |
| `lesson07/sources/lesson-01/` | `os-journal/lesson1/source/html/` and `source/metadata/` | Published snapshot and manifest |
| `lesson07/public/lessons/lesson-01/` | `os-journal/lesson1/production/config/` plus `renders/` support | Existing staged voice, music, captions, and screenshots |
| `lesson07/renders/lesson-01/` | `os-journal/lesson1/renders/` | Historical review/final renders |
| `os-journal/lesson1` through `lesson7` | `os-journal/lesson1/source/screenshots/` and source packages | External source copied; original remains intact |
| `lesson07/src/film*`, board states, generated voice, output, exports, QA/QC, docs | `os-journal/lesson7/` | Lesson 7 V1/V2/V3/V4 lineage and final material |
| root replay `assets/`, `config/`, `exports/`, `review/`, `scripts/`, QC docs | `marketing/replay-v1/` | Non-Journal replay acquisition project |
| Journal template output | `os-journal/templates/JOURNAL-VIDEO-PRODUCTION-TEMPLATE.md` | Canonical reusable workflow |
| source-preparation utility and README | `tools/scripts/source-preparation/` | Reusable screenshot tooling |

All entries are copies or reorganized copies. The original `lesson07`, `project`, and external `os-journal` trees are retained.

## External dependencies

- Lesson screenshot origins: `/Users/justinzero/orbacetech/DevProjects/os-journal/lessonN` for N=1..7.
- Lesson 1 published URL: `https://orbacesudoku.com/journal/two-homes-for-a-nine/journal-two-homes-for-a-nine`.
- Original Lesson 7 source archive: `.../os-journal/ibtree-lesson07-20260822T185755Z-1-001.zip` (copied to `_archive/source-packages/`).
- Remotion dependencies are described by `tools/remotion/package-lock.json`; `node_modules` is not copied.

## Duplicates and archive decisions

No files were automatically removed. The previous `project/` staging tree is retained under `_archive/staging-project-live/` (with an earlier copied snapshot under `_archive/staging-project/`) for traceability. Root `tmp/` and `lesson07/node_modules/` remain at their original locations but are excluded from canonical content as rebuildable/transient material. Files with `v1-v2-comparison` are treated as review evidence, not a V1 render.

Hash-based duplicate review found no safe deletion candidate: similar screenshots and renders are either source/derived pairs, alternate voice treatments, or versioned outputs.

## Broken references and follow-up

- Historical source files may still contain absolute paths to the original external `os-journal` tree; those paths are intentionally retained in provenance and source manifests. New builds should use the canonical copied paths.
- Existing scripts were not rewritten in place because the legacy project remains runnable as a coherent archived snapshot under `_archive/legacy-root/lesson07/`. The canonical shared Remotion copy is the migration target for future updates.
- No distinct product/store video package was found in the inspected trees. `product/README.md` records that status.
- The parent repository had unrelated pre-existing mobile changes. They were not modified.

## Intentionally unchanged

- `/Users/justinzero/orbacetech/DevProjects/orbace-sudoku/apps/...` and all other non-video repositories.
- Original external `/Users/justinzero/orbacetech/DevProjects/os-journal` source folders.
- Legacy root video source folders and files, including `lesson07`, `assets`, `config`, `exports`, `review`, `scripts`, and `tmp`, are preserved together under `_archive/legacy-root/` so their relative layout remains runnable as an archived snapshot.

## 2026-09-30 — golden-source consolidation

Scope: make `orbace-video` the single source for all Orbace Tech video generation and publishing. All video work from 2026-09-25…09-30 (su-pu trailers, full replay, standards, plans, pipeline) was produced outside this folder and is now filed here. Sources were **copied**; nothing was deleted from `~/Downloads`.

| Original | Destination | Treatment |
|---|---|---|
| Claude doc "Orbace Video Generation Standard v2.0" | `standards/ORBACE-VIDEO-GENERATION-STANDARD-v2.0.md` | Markdown export (rev 9) |
| `~/Downloads/Orbace-Replay-Trailer-Standard-v1.0.md` | `standards/ORBACE-REPLAY-TRAILER-STANDARD-v1.0.md` | Copy |
| Claude docs: Showcase Enhancement Plan, Trailer Distribution Plan, Launch Campaign | `docs/plans/SUPU-*.md` | Markdown exports |
| `~/Downloads/orbace_video_creative_plan_revised.md` | `docs/plans/orbace-video-creative-plan-revised-2026-08-20.md` | Copy |
| Cloud production workspace (`/home/claude/v`: scripts, site snapshots, fonts, schedules) | `tools/supu-replay-pipeline/` | Source only; frames, node_modules, out/ excluded (rebuildable) |
| Cloud audio stems (`out/*.wav`) | `<video>/production/audio/` | Copy |
| `marketing/os-sudoku-video/orbace_trailer_v6_{169,916}.mp4` (untracked) | `marketing/supu-trailer-extreme-683633/renders/final/SP-20260925-683633_trailer_{169,916}_1080p.mp4` | Moved + renamed (md5 identical to `~/Downloads/orbace-trailer-v6/`) |
| `marketing/os-sudoku-video/orbace_easy_trailer_v4_{169,916}.mp4` (untracked) | `marketing/supu-trailer-easy-047554/renders/final/SP-20260924-047554_trailer_{169,916}_1080p.mp4` | Moved + renamed (md5 identical to `~/Downloads/orbace-easy-trailer-v4/`) |
| `~/Downloads/orbace-trailer-v5.1/*` | `marketing/supu-trailer-extreme-683633/renders/v5.1/`, `script/` | Copy |
| `~/Downloads/orbace_trailer_v5.1_{169,916}.mp4` (earlier render, different md5) | `…/renders/v5.1/orbace_trailer_v5.1_{169,916}_r1.mp4` | Copy, renamed `_r1` |
| `~/Downloads/orbace-trailer-v6/*_preview.mp4`, `orbace_trailer_v6.srt` | `…/renders/v6/`, `…/renders/final/SP-20260925-683633_trailer.en.srt` | Copy |
| `~/Downloads/extreme supu video {english,chinese} 925[-v5.1].txt`, V6 notes | `marketing/supu-trailer-extreme-683633/brief/` | Copy, renamed `v4-brief-*`, `v5.1-brief-*`, `v6-*` |
| `~/Downloads/Generic 925.mp3`, `Generic 925 v6.mp3`, voice auditions | `…/script/voice/`, `…/review/voice-auditions/` | Copy |
| `~/Downloads/orbace-supu-bundle.json`, cover `image.png` | `…/source/` | Copy |
| `~/Downloads/orbace-easy-trailer-v4/*`, `easy supu video english 925-v4.md`, `generic easy 926.mp3`, easy artwork | `marketing/supu-trailer-easy-047554/` | Copy |
| `~/Downloads/orbace-full-replays/*` | `supu-replays/sp-20260928-355762/renders/{v1,v2,v3,final}/`, `publishing/` | Copy; 4K finals renamed to standard |
| `~/Downloads/orbace-supu-355762*.json` | `supu-replays/sp-20260928-355762/source/` | Copy |
| `~/Downloads/orbace-su-pu-replay-002-{wide,vertical}.mp4` | `os-journal/lesson7/renders/published-su-pu-replay-002/` | Copy (YouTube fk18qqlLIPU) |
| `~/Downloads/su-pu banner*.png`, `orbace supu background.png`, `Su-Pu Replay  Orbace Sudoku*.png`, `su-pu icon for reddit.png` | `shared-assets/su-pu-artwork/` | Copy |
| `lesson07/` (legacy root, 105 MB) | `_archive/legacy-root/lesson07/` | Moved; the 2026-08-24 map already names this location, and its canonical content is in `os-journal/lesson7/` and `tools/remotion/` |

Duplicates left in `~/Downloads` (safe to remove once this folder is committed): `orbace_*_1.mp4`, `_2.mp4`, `orbace_supu_355762_full_replay_*` root copies, `orbace_trailer_v6_916*.mp4`, `orbace_easy_trailer_v4_*`, and the `orbace-trailer-v5.1/`, `orbace-trailer-v6/`, `orbace-easy-trailer-v4/`, `orbace-full-replays/` folders.

Not recoverable here: LinkedIn/Reddit post drafts for SP-20260928-355762 (chat only); trailer V4 renders (none were made).

## 2026-09-30 (later) — type-first layout, publish log, GitHub

Reorganized by the video types in standard v2.0 and prepared for GitHub (github.com/gmyky57ndd-dev/orbace-video) with Git LFS for finals.

| Before | After |
|---|---|
| `supu-replays/sp-20260928-355762/` | `videos/full-replay/SP-20260928-355762/` |
| `os-journal/lesson1` … `lesson7` | `videos/journal-lesson/lesson1` … `lesson7` |
| `os-journal/templates/` | `videos/journal-lesson/_template/` |
| `marketing/supu-trailer-extreme-683633/` | `videos/trailer/SP-20260925-683633-extreme-ibtree/` |
| `marketing/supu-trailer-easy-047554/` | `videos/trailer/SP-20260924-047554-easy/` |
| `marketing/{brand-film-v1,replay-v1,replay-v2,solve-record-v1}/` | `videos/brand-product/…` (same names) |
| `marketing/review/` | `videos/brand-product/_capture-review-2026-08-24/` |
| `product/store-assets/replay-v2/` | `videos/brand-product/store-replay-v2/` (the empty `product/README.md` placeholder was dropped) |
| `os-journal/lesson7/renders/published-su-pu-replay-002/orbace-su-pu-replay-002-{wide,vertical}.mp4` | `videos/journal-lesson/lesson7/renders/final/SP-20260801-567421_lesson_{169,916}_1080p.mp4`; notes in `lesson7/publishing/su-pu-replay-002.md` |
| `publishing/PUBLISH-LOG.md` | `publishing/publish-log.csv` (seeded with the 14 YouTube uploads from @OrbaceSudoku) |

Path updates: `tools/remotion/package.json` render outputs, `tools/remotion/scripts/build-replay-store-v2.mjs`, `tools/remotion/scripts/journal-video.mjs`, the Journal template, the store shot list, and all READMEs.

Git: the pre-GitHub local history (one commit, 2026-09-13, with videos committed as plain blobs) was set aside as `.git-local-history-2026-09-13/` on the Mac and ignored. The GitHub repo starts fresh from this layout. Iteration renders, WAV stems, raw captures and other media outside `renders/final/` are git-ignored and remain only on the Mac.

## 2026-10-01 — videos stay local

Decision: video/audio files are never pushed to Git, LFS or any server (size, constant iteration). `.gitignore` no longer un-ignores `renders/final/*.mp4|mov`; `.gitattributes` LFS rules are kept only for the 12 legacy finals; `tools/githooks/pre-commit` blocks new video/audio commits; `tools/cloud-setup.sh` no longer runs `git lfs pull`. Rules updated in `CLAUDE.md`, `README.md`, `publishing/README.md`, `tools/supu-replay-pipeline/README.md`.

| From | To | Note |
|---|---|---|
| `videos/full-replay/SP-20260930-610092/renders/v1/*_4k.mp4` | `…/renders/final/` | Moved; local-only |

## 2026-10-01 — SP-20260930-610092 story trailer

New folder `videos/trailer/SP-20260930-610092-extreme-stuck-try-one-path/` (brief from Drive production package; 9:16 v1 render is local-only in `renders/v1/`). Pipeline additions under `tools/supu-replay-pipeline/trailer3/`.

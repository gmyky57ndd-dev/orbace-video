# Full replay — SP-20260930-610092

"Three levels of nested trial branches." Opening question: "What do you do to get out of stuck quickly?" Sub-level not yet assigned by the expert (the su-pu is `unrated`). 125 steps: hidden singles, a hidden triple and a hidden pair, then trial branch a (r8c3 = 7, abandoned), branch b (r3c5 = 6, confirmed) and branch c (r4c5 = 3, nested in b and merged).

Replay: https://orbacesudoku.com/su-pu/SP-20260930-610092

## Final (`renders/final/`)

The two 4K MP4s are kept local for now in `renders/v1/` (git-ignored; Git LFS upload was refused with 403). Move them to `renders/final/` and commit via LFS once upload works; only the captions are committed so far.

| File | Size | Length |
| --- | --- | --- |
| `renders/v1/SP-20260930-610092_full_169_4k.mp4` | 3840×2160 | 2:00 |
| `renders/v1/SP-20260930-610092_full_916_4k.mp4` | 2160×3840 | 2:00 |
| `SP-20260930-610092_full.en.srt` | callout captions | — |

Loudness −13.8 LUFS; QR on 16:9 decodes at full and half size. Each format is rendered from its own capture (desktop 1280 px at 4×, phone 390 px at 6×).

## Other material

- `source/` — su-pu data from the API (2026-09-30)
- `production/plan/sched.json` — step timing and callouts; every callout is a recorded note, trial seed/resolution or story chapter label
- `publishing/youtube-copy.md`, `publishing/thumbnails/` — drafts only; **not uploaded**
- Built with `tools/supu-replay-pipeline/` (`SITE=site3`, `full_sched3.py`, `cap2.js`, `render_hd3.py`, `music_full3.py`, `thumbs3.py`)
- Not yet published: add a row to `publishing/publish-log.csv` when it is.

# Trailer — Extreme IB Tree, SP-20260925-683633

"Using ibtree to identify a quick contradiction." Extreme · Hell (per the cover art; confirm with the expert). 110 steps; contradiction at step 49. Narrated by the "Generic" synthetic voice. Replay: https://orbacesudoku.com/su-pu/SP-20260925-683633

## Final (`renders/final/`) — V6

| File | Size | Length | End card |
| --- | --- | --- | --- |
| `SP-20260925-683633_trailer_916_1080p.mp4` | 1080×1920 | 0:43 | URL only, no QR |
| `SP-20260925-683633_trailer_169_1080p.mp4` | 1920×1080 | 0:43 | URL + QR |
| `SP-20260925-683633_trailer_11_4k.mp4` | 2160×2160 (4K square, 2026-10-02) | 0:43 | URL as text, no QR |
| `SP-20260925-683633_trailer.en.srt` | captions | | |

Gaps against standard v2.0: the 9:16 and 16:9 masters are 1080p, not 4K. The 1:1 is produced (below).

## 1:1 square (2026-10-02)

`renders/final/SP-20260925-683633_trailer_11_4k.mp4` — 2160×2160, 30 fps, 43.0 s, H.264 CRF 14, **local only (git-ignored, never pushed)**, 9.3M, sha256 `bf786b7d2edaf58f33a80ce52b48361b6730da85fb8212f169becf30f00077dd`. Rendered from its own desktop-layout capture (1280 px at 4×, current replay UI with the r1–r9 / c1–c9 labels), not cropped from the other formats. Timeline, captions, camera moves, the rewind, the three chapter holds and the end card follow V6 exactly; the audio is the existing V6 track copied unchanged (identical in the 9:16 and 16:9; −15.4 LUFS). Standard v2.0 square treatment: caption band on top, board centred, soft CTA pill "Watch the full replay", end card with the link as text and no QR. The chapter close-ups zoom less than in 16:9 so the whole story panel fits the square. It is the same content as the published trailer, for ads and feeds, not a new upload. Build: `tools/supu-replay-pipeline/trailer3/capture_v6_sq.js`, `render_v6_square.py`.

## Lineage

| Version | Brief | Renders | Notes |
| --- | --- | --- | --- |
| V4 | `brief/v4-brief-en.txt`, `-zh.txt` | — | Critiqued; superseded by V5.1 before render |
| V5.1 | `brief/v5.1-brief-en.txt`, `-zh.txt`; `script/v5.1-vo-recording-sheet.md` | `renders/v5.1/` (draft, r1, final) | Voice `script/voice/generic-925-v5.1.mp3` |
| V6 | `brief/v6-revision-notes.md`, `brief/v6-final-implementation-notes.md` | `renders/v6/` previews → `renders/final/` | New hook, "Let's replay it." + rewind, chapter holds +0.5 s, "Watch the complete replay", QR on 16:9 only. Voice `script/voice/generic-925-v6.mp3` |

Voice choice: "Generic" picked over the auditions in `review/voice-auditions/`. Audio stems: `production/audio/`. Cover: `source/ibtree-cover-image.png`.

Published 2026-09-26: YouTube 0Zh2wJWnCrI (16:9) and Short oOBIhpPqBd4 (9:16).

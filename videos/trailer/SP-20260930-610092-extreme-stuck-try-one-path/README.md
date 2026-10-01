# Story trailer — SP-20260930-610092 · "Stuck? Try One Path."

Round 2 campaign story (brief: `brief/round-2-brief.md`, from the Drive production package). v2 cut of the real replay: steps 1–62 (opening accelerated to step 38, branch A at 39–60, return and two moves 61–62), frozen unfinished at step 62. (v1 was the steps 63–93 working cut.) Replay: https://orbacesudoku.com/su-pu/SP-20260930-610092 (Extreme · Hell; 125 steps; branches A abandoned, B open, C nested in B).

## Final (2026-10-01) — `renders/final/` (local only, git-ignored, never pushed)

Approved v3 plus one change: the pulse on the two confirmed 7s is a brief solid **green** ring, so red dashed outlines are reserved for the contradiction (the two 5s). Nothing else changed. Each format is composed and rendered separately from its own capture of the real replay (phone layout 390 px at 7× for 9:16; desktop 1280 px at 4× for 16:9 and 1:1). 38.0 s, 30 fps, H.264 High CRF 14, AAC 256 kb/s, −14.4 LUFS.

| File | Size | Weight | sha256 |
| --- | --- | --- | --- |
| `SP-20260930-610092_trailer_916_4k.mp4` | 2160×3840 | 3.2 MB | `f5bfcee08e9445fbfebaa40be5c7ff061c355da887ed9abe6c466ce39683f8f2` |
| `SP-20260930-610092_trailer_169_4k.mp4` | 3840×2160 | 3.1 MB | `9561856dd7c0f0bd3307a40a7d4cf4d3f05710aba8aed5e3405dd3a716cd7c4f` |
| `SP-20260930-610092_trailer_11_4k.mp4` | 2160×2160 | 2.6 MB | `eb81b7f0b7cdd91e37b83b94cc5ffa569a510c4544226f29a8686295e8a67135` |
| `SP-20260930-610092_trailer.en.srt` | spoken lines (committed) | | |

The 16:9 end card carries a QR for the canonical replay URL (decodes at full and half size); 9:16 and 1:1 show the link as text. Plan: `production/plan/trailer_final_plan.json`. Thumbnails: `publishing/thumbnails/` (1080×1920, 1280×720, 1080×1080). YouTube copy: `publishing/youtube-copy.md`. PM uploads; Claude does not.

## Status history (v3)
- **9:16 v3** (1080×1920, 30 fps, 38.0 s, −14.4 LUFS): `renders/v3/SP-20260930-610092_trailer_916_1080p_v3.mp4` — local only, sent in chat. PM review refinements on v2: (1) the replay's gold cleared-cell outlines at the return fade out over 0.6 s (24.0–24.8 s; digits, candidates, trial styling and pin markers untouched) so the restored board is quiet for about a second before R9C1=7 at 26.0 s; (2) R2C3=7 arrives earlier (28.2 s, was 30.6 s) with a subtle dashed pulse ring (R9C1 also pulses briefly); (3) no small caption under "Follow the consequences." and "Two 5s. One column." (the SRT still carries every spoken line). Voice, script and CTA timing unchanged.
- v2 (below) is historical.
- **9:16 v2** (1080×1920, 30 fps, 38.0 s, −14.4 LUFS): `renders/v2/SP-20260930-610092_trailer_916_1080p_v2.mp4` — local only, sent in chat. Follows the PM's v2 script (branch A contradiction, return, two moves) with the supplied natural-speech voice. Editorial annotation: dashed outlines on the two 5s (not app UI). v1 below is historical.

- **9:16 v1 for review and voice development** (1080×1920, 30 fps, 37.5 s, −13.7 LUFS): `renders/v1/SP-20260930-610092_trailer_916_1080p_v1.mp4` — local only, sent in chat. Voice is a scratch guide (pico2wave en-GB) to fix timing; the release voice is "Generic".
- Next: PM review of v2; then 16:9 (and 1:1 for ads) from their own captures and 4K masters; after the vertical master is approved, recompose 16:9 (and 1:1 for ads) from their own captures and render 4K masters.

## Files in Git
`brief/`, `script/` (narration, VO status, the supplied take `script/voice/natural_speech_for_610092.mp3`), `production/plan/` (edit plan, VO timing report), `source/` (su-pu data), `publishing/` (YouTube copy, 3 thumbnails), `renders/final/…_trailer.en.srt`.
Build: `tools/supu-replay-pipeline/trailer3/` (`plan_610092_v1.py`, `render_trailer.py`, `audio_trailer.py`, `thumbs_trailer.py`). Videos are never in Git.

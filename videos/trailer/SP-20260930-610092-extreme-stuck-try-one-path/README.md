# Story trailer — SP-20260930-610092 · "Stuck? Try One Path."

Round 2 campaign story (brief: `brief/round-2-brief.md`, from the Drive production package). v2 cut of the real replay: steps 1–62 (opening accelerated to step 38, branch A at 39–60, return and two moves 61–62), frozen unfinished at step 62. (v1 was the steps 63–93 working cut.) Replay: https://orbacesudoku.com/su-pu/SP-20260930-610092 (Extreme · Hell; 125 steps; branches A abandoned, B open, C nested in B).

## Status (2026-10-01, v2)
- **9:16 v2** (1080×1920, 30 fps, 38.0 s, −14.4 LUFS): `renders/v2/SP-20260930-610092_trailer_916_1080p_v2.mp4` — local only, sent in chat. Follows the PM's v2 script (branch A contradiction, return, two moves) with the supplied natural-speech voice. Editorial annotation: dashed outlines on the two 5s (not app UI). v1 below is historical.

- **9:16 v1 for review and voice development** (1080×1920, 30 fps, 37.5 s, −13.7 LUFS): `renders/v1/SP-20260930-610092_trailer_916_1080p_v1.mp4` — local only, sent in chat. Voice is a scratch guide (pico2wave en-GB) to fix timing; the release voice is "Generic".
- Next: PM review of v2; then 16:9 (and 1:1 for ads) from their own captures and 4K masters; after the vertical master is approved, recompose 16:9 (and 1:1 for ads) from their own captures and render 4K masters.

## Files in Git
`brief/`, `script/` (narration, VO status, the supplied take `script/voice/natural_speech_for_610092.mp3`), `production/plan/` (edit plan, VO timing report), `source/` (su-pu data), `publishing/` (YouTube copy, 3 thumbnails), `renders/final/…_trailer.en.srt`.
Build: `tools/supu-replay-pipeline/trailer3/` (`plan_610092_v1.py`, `render_trailer.py`, `audio_trailer.py`, `thumbs_trailer.py`). Videos are never in Git.

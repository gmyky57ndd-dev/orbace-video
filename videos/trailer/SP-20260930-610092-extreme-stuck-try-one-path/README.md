# Story trailer — SP-20260930-610092 · "Stuck? Try One Path."

Round 2 campaign story (brief: `brief/round-2-brief.md`, from the Drive production package). Source-faithful working cut of the real replay: steps 63 → 93, frozen unfinished; no contradiction or "breakthrough" claim. Replay: https://orbacesudoku.com/su-pu/SP-20260930-610092 (Extreme · Hell; 125 steps; branches A abandoned, B open, C nested in B).

## Status
- **9:16 v1 for review and voice development** (1080×1920, 30 fps, 37.5 s, −13.7 LUFS): `renders/v1/SP-20260930-610092_trailer_916_1080p_v1.mp4` — local only, sent in chat. Voice is a scratch guide (pico2wave en-GB) to fix timing; the release voice is "Generic".
- Next: regenerate the VO with the "Generic" voice used for the other two trailers (`script/vo-recording-sheet.md`) → v2 mix; after the vertical master is approved, recompose 16:9 (and 1:1 for ads) from their own captures and render 4K masters.

## Files in Git
`brief/`, `script/` (recording sheet, narration), `production/plan/` (edit plan, VO timing report), `source/` (su-pu data), `publishing/` (YouTube copy, 3 thumbnails), `renders/final/…_trailer.en.srt`.
Build: `tools/supu-replay-pipeline/trailer3/` (`plan_610092_v1.py`, `render_trailer.py`, `audio_trailer.py`, `thumbs_trailer.py`). Videos are never in Git.

# Lesson 05 creative test: SP-20261005-922508

Two review videos from one replay, differing only in narrative order (Video A: choice first; Video B: contradiction first). Brief: `brief/lesson05-creative-test-brief.md` (from the Drive production brief). Replay: https://orbacesudoku.com/su-pu/SP-20261005-922508

**Read `brief/source-check.md` first.** The brief says the contradiction is "Box 3 has no place for 6". The recording shows **two 7s in row 3** (and 6 still has legal cells in Box 3), so on-screen text and three narration sentences were corrected.

## Status (2026-10-05): v1 review cuts, 9:16

| File (local only, `renders/v1/`) | Video | Format | sha256 |
| --- | --- | --- | --- |
| `SP-20261005-922508_lesson_A_916_1080p_v1.mp4` | A: choice first | 1080p (1080x1920), 41.7 s, 4.5 MB | `ed01e50a4ae3c43f9463de9e859838d956898eefcc18e53d89fd6d39639c958b` |
| `SP-20261005-922508_lesson_B_916_1080p_v1.mp4` | B: contradiction first | 1080p (1080x1920), 41.7 s, 5.0 MB | `b7b39dcf9ed207ea2441b3794968c7bd863a5276339c032c671b36bfc75a4edb` |

- 41.7 s, 30 fps, H.264, about −14.5 LUFS. Each is rendered from its own phone-layout capture of the real replay (6×). Both end on the same unsolved board with r5c1=9 confirmed, after the same 6-second end card (paid wording, "Tap Play now").
- Voice: the supplied takes (`script/voice/`), cut per sentence and not stretched. Three sentences use a **scratch voice** (pico) until re-recorded: `script/vo-rerecord-sheet.md`.
- Same music bed, caption typography, subscribe cue, replay colours and end card in both; only the opening order and the matching headline text differ.

## Not done yet
- 16:9 and 1:1 (and 4K masters) after approval of the vertical cuts; the organic end card ("Replay link below") needs its own end-line recording.
- Thumbnails, YouTube copy, pinned comment, end-screens. Note for the thumbnails: B's "NO PLACE FOR 6" must become "TWO 7s IN ROW 3"; the brief's B titles that say "9 made a 6 impossible" are not accurate for this recording.

## Files in Git
`brief/`, `script/` (narration, scratch/re-record sheet, SRTs, supplied voice takes), `production/plan/` (edit plans and voice timing), `source/` (su-pu data), `review/` (contact sheets). Build: `tools/supu-replay-pipeline/trailer3/` (`capture_l5.js`, `plan_l5.py`, `render_l5.py`, `audio_l5.py`). Videos are local only.

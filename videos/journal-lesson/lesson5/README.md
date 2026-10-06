# Lesson 05 creative test: SP-20261005-922508

## Current: v3 forward proof with the real voice (2026-10-06)

Built from `brief/lesson05-revised-forward-script-v4.md` and the PM's real narration take (`lesson_5_video_script_v4.mp3`, sha256 `b0dec010…b39e`, not committed). The contradiction is **Box 1 has no place for 7** at step 35, as recorded. Replay steps 36–38 (r3c2=7) are never shown. Validation: `review/v3-validation-report.md`. Captions: `script/SP-20261005-922508_lesson.en.srt`. Plan: `production/plan/plan_V3.json` (`trailer3/plan_l5_v3.py`, then `VIDEO=V3 render_l5.py`, then `audio_l5.py plan_l5_V3.json <take>`).

| File (local only, `renders/v3/`) | Format | Length | Size | sha256 |
| --- | --- | --- | --- | --- |
| `SP-20261005-922508_lesson_916_1080p_v3.mp4` | 9:16, 1080x1920, H.264 High CRF 8, AAC 48 kHz stereo | 41.9 s, −14.3 LUFS | 7.1 MB (7,094,013 bytes) | `dc19bad882cbdcc456231e568c44bb392ce463b02e1222e65301d6614d06822c` |

Next, after approval: native 4K (2160x3840) master, 16:9 from its own capture, thumbnails, YouTube copy.

---

## Superseded: v2 revised forward cut (Video F, 2026-10-06)

One forward-chronological journal-style proof, "Where Does the 9 Go? A Failed Trial Proves It", built from `brief/lesson05-revised-forward-script.md`. It replaces the A/B pair for review.

| File (local only, `renders/v2/`) | Format | Length | Size | sha256 |
| --- | --- | --- | --- | --- |
| `SP-20261005-922508_lesson_916_1080p_v2.mp4` | 9:16, 1080x1920 review | 41.8 s, 30 fps, −14.4 LUFS | 2.6 MB (2,562,346 bytes) | `1ecf2da25a4fd7582d10d9a5552c2371d70350202573c7e03162904da2cfd9d1` |

- Full 9×9 grid on screen in every scene. Box 4 amber wash for the fork, ink rings on r5c1/r6c2, amber ring on the temporary r6c2=9, red dashed on the two 7s in row 3, green pulse on r5c1=9. The event rail shows each coordinate with its technique. It stops after r6c8=9 and r6c9=2: no second fork, no solved grid. No subscribe card. The end card reads PLAY THIS EXACT REPLAY / Tap Play now / orbacesudoku.com/su-pu/SP-20261005-922508 / The next fork is still waiting.
- **Source correction (read `brief/source-check.md`):** the script's "BOX 3: NO PLACE FOR 6" comes from the Journal's hand-pencilled chain. The recorded replay fails on **two 7s in row 3**, so the headline and line F5 say that.
- **Voice: all scratch (pico).** No recording was supplied for this narration. Lines to record: `script/vo-rerecord-sheet.md` (Video F section). Captions: `script/SP-20261005-922508_lesson_F.en.srt`. Plan: `production/plan/plan_F.json`. Build: `trailer3/plan_l5_fwd.py`, then `VIDEO=F render_l5.py`, then `audio_l5.py plan_l5_F.json -`.
- After approval and recording: re-cut to the real voice, 4K masters, 16:9 (and 1:1 if needed) from their own captures, thumbnails, YouTube copy.

---

## Earlier: v1 A/B creative test

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

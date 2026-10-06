# Lesson 05 v3 validation report (2026-10-06)

File: `renders/v3/SP-20261005-922508_lesson_916_1080p_v3.mp4` (local only)
sha256 `dc19bad882cbdcc456231e568c44bb392ce463b02e1222e65301d6614d06822c`, 7,094,013 bytes, 41.9 s.

Inputs:
- Script: `brief/lesson05-revised-forward-script-v4.md` (PM, 2026-10-06).
- Voice: `lesson_5_video_script_v4.mp3` (PM upload). sha256 `b0dec010ee231a776dfdd1b6867cc7329b23025999fa5cfa09f8e77c5ce9b39e`, 37.7 s, MP3 32 kHz mono 128 kb/s. Not committed, because audio stays out of Git; the PM holds the original.
- Replay: production su-pu data for SP-20261005-922508, re-fetched 2026-10-06 (143 events, identical to `site3/data_922508.json`).

## Script review
| Item | Finding | Action in v3 |
| --- | --- | --- |
| Contradiction scene on-screen text | Still reads "BOX 3: NO PLACE FOR 6" (left over from the earlier draft); narration and acceptance criteria say Box 1 / 7 | Used **BOX 1: NO PLACE FOR 7 / TRIAL FAILS** |
| Per-scene line in "Forward consequences" | Says "The trial forces ordinary placements across the grid"; the complete narration and the recording say "Now follow the chain to step thirty-five" | Followed the recording |
| Contradiction claim | Verified: after step 35 (r2c2=1), 7 has no legal cell in Box 1, row 2 or column 2. The blockers are r1c5=7 (step 27), r3c7=7 (given), r9c1=7 (given) and r5c3=7 (step 24) | Box 1 framed red dashed; the four 7s ringed; lines along rows 1 and 3 and columns 1 and 3 |
| Contextual inset (Box 1 + row 2 / column 2) | Not built; the whole board is 902 px wide and Box 1 reads at full size | Open: add an inset if the PM still wants one |
| "Hell-tier" | Data says `unrated`; spoken only, not on screen | Unchanged, PM's call |

## Story-boundary check
- Replay steps used: 0–35, 39, 40, 44, 45 (from `production/plan/plan_V3.json`). **Steps 36–38 (r3c2=7, the "two 7s in row 3" note, the end pin) are never shown**, and neither is anything after step 45: the second fork (step 57) and the solved grid never appear.
- The strings "TWO 7", "ROW 3" and "r3c2" appear in no on-screen text, in the plan or in the captions (checked by script).
- Order: start board → pencil 9s r5c1, r6c2 (steps 1–2) → trial r6c2=9 (3–5) → chain (7–35) → contradiction → trial cleared (39) → r5c1=9 (40) → r6c8=9 (44), r6c9=2 (45) → CTA.
- r5c1=9 appears only at 33.2 s, after the trial is cleared at 29.6 s.
- App UI left as recorded: from step 39 on, the app shows its path pins (a small red flag on r6c2 and on r3c2, the trial's start and end cells) and the pin outlines. No digit is shown at r3c2. Fading these is possible (the same treatment as the cleared-cell outlines), but it was not done because it was not asked.

## Voice check
- The take was transcribed with speech recognition (pocketsphinx) before cutting and again from the final export. Both give the same ten sentences in the same order as the "Complete narration" in the script: "This Hell-tier grid…" through "…trace the proof yourself". There is no subscribe line and no other voice.
- The take is one continuous file in one voice, cut at its own silences into 10 pieces. Nothing is stretched or synthesized; only the gaps between sentences are widened to fit the picture. Placement times are in `production/plan/vo_report_V3.json`.
- Not verifiable by me: narrator identity and a human listen-through. **PM: please listen to the full export before approval.**

## Export metadata (ffprobe)
| Field | Value |
| --- | --- |
| Video | H.264 High, 1080×1920, 30/1 fps, progressive, yuv420p |
| Video bitrate | ~1.07 Mb/s at CRF 8 (near-lossless), 1 s GOP, maxrate 12 Mb/s |
| Audio | AAC-LC, 48 kHz, stereo, ~256 kb/s, −14.3 LUFS integrated |
| Duration | 41.9 s |

Bitrate note: v2's 218 kb/s came from CRF 16 on flat, mostly still frames. v3 is near-lossless (CRF 8). The encoder cannot usefully spend 8–12 Mb/s on this content. Reaching that figure would only add filler bits, not detail. If an upload spec still needs it, a constant-bitrate re-encode is a one-liner. A native 2160×3840 master (rendered at 2×) can follow approval.

## Visual check
- Phone-size contact sheet: `review/v3-contact-sheet-phone.png` (frames at 390 px wide, every 3 s). The grid, headline, event rail and CTA are readable. Two things are small at that size: the app's own pencil 9s (r5c1, r6c2) and the end-card URL.
- Replay URL https://orbacesudoku.com/su-pu/SP-20261005-922508 returned HTTP 200 and the data API 200 (2026-10-06).

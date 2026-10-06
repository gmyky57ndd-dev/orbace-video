# Lesson 05 finals: validation report (2026-10-06)

The finals are the approved v3 cut with the PM's last feedback applied, in three formats. Each format is rendered at 4K from its own capture of the production replay; none is cropped from another.

| File (local only, `renders/final/`) | Size | Video | Bytes | sha256 |
| --- | --- | --- | --- | --- |
| `SP-20261005-922508_lesson_916_4k.mp4` | 2160×3840 | H.264 High, 30 fps, progressive, yuv420p, ~1.90 Mb/s | 11,417,224 | `1313c4f5ea0cb4a6bc4382619048d25c91fe89a9d40b877514b308a6b3080fbd` |
| `SP-20261005-922508_lesson_169_4k.mp4` | 3840×2160 | same, ~1.67 Mb/s | 10,217,063 | `1a4c7dec28c45b1dba2406704040e4032ad0d5cfe18c5513d0ceda94d2ef99d6` |
| `SP-20261005-922508_lesson_11_4k.mp4` | 2160×2160 | same, ~1.31 Mb/s | 8,349,015 | `2b097ac289403950597eaf63e41103aa276c3c297ec4e9fdaddaca244df7853c` |

All three are 41.9 s long. Audio is AAC-LC, 48 kHz stereo, ~256 kb/s, −14.3 LUFS integrated. Captions are in `SP-20261005-922508_lesson.en.srt`.

## PM feedback applied
| Feedback | Done |
| --- | --- |
| Accept ~1.1 Mb/s; no padded CBR | Encoded at CRF 10 with a 1 s GOP and no bitrate floor. The 4K finals land at 1.3–1.9 Mb/s. |
| Full board, no inset | Kept. |
| Fade the red markers on r6c2 and r3c2 after the contradiction | From the trial clearing (29.6 → 30.1 s) the app's path pins and their pink outlines fade out, together with the gold cleared-cell outlines. They are gone from 30.1 s on. Method: quiet captures of steps 39–46 from the real page with only `.og-pin` and the `.haspin`/`.justplaced` outline styles hidden (`trailer3/capture_l5_final.js`). Values, pencil notes and colours are untouched. |
| Enlarge pencil notes and the end-card URL without shrinking the board | Pencil notes are captured at 14 px bold instead of ~9.8 px regular (CSS on the real page). The URL is about 30% larger: 9:16 42 px (was 32 px mono), 16:9 40 px, 1:1 34 px. Board sizes are unchanged in 9:16 (902 px at 1080 width). The 16:9 board is 867 px tall at 1080 height and the 1:1 board is 608 px. |

## Story-boundary check
- Replay steps used: 0–35, 39, 40, 44, 45 (steps 39 onward from the quiet captures). Steps 36–38 (r3c2=7 and the "two 7s" note) and anything after 45 are never shown. There is no second fork and no solved grid.
- The plan, the captions and the on-screen text contain no "TWO 7", "ROW 3" or "r3c2" (checked by script).
- The contradiction is Box 1 with no place for 7 after step 35, verified against the production replay data (143 events, re-fetched 2026-10-06).

## Phone-size check
Frames come from a YouTube-like 1080p re-encode (1.2 Mb/s) and are scaled to phone size: 9:16 and 1:1 at 390 px wide, 16:9 at 844 px. The sheets are `review/final-phone-check-916.png`, `-169.png` and `-11.png`. Headlines, the event rail, the Box 1 frame, the blocking 7s and the CTA all read. The enlarged pencil 9s are readable in 9:16 and 16:9 and small but visible in 1:1. In 1:1 the end card's last line ("The next fork is still waiting.") is small. A 480p, 350 kb/s re-encode of the busiest frames (20.5 s, 27.8 s) shows no smearing of digits or labels.

## YouTube upload check
- **Private upload: not done.** This session has no YouTube access (no connector or credentials), and the playbook keeps uploads with the PM.
- **What was done instead:** each final was re-encoded the way YouTube serves it: 1080p at ~1.2 Mb/s and 480p at ~350 kb/s. Frames were inspected at the fork, the chain, the contradiction, the resolution and the CTA. All are clean: flat backgrounds show no banding and text edges show no ringing.
- **PM: please do the private upload check.** Upload each file as Private. After processing, check the 9:16 Short on a phone and the 16:9 at 1080p and 4K. Confirm the captions file loads, and check the thumbnail crop on the Short cover.

## Voice
Same mix as the approved v3: the PM's recorded take `lesson_5_video_script_v4.mp3` (sha256 `b0dec010…b39e`), cut per sentence, not stretched. The audio track is identical in all three formats.

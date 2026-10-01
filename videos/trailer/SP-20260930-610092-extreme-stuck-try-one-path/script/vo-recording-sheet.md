# SP-20260930-610092 story trailer — VO status

**v2 voice received** (2026-10-01): `script/voice/natural_speech_for_610092.mp3` — one continuous natural take of the v2 script (20.1 s, mp3, 32 kHz mono). Claude cut it at the silences between lines and placed each line on its cue window without stretching any word (forced alignment with pocketsphinx; line timings in `production/plan/trailer_v2_vo_report.json`).

The voice is the same synthetic voice family as the other trailers (per the PM). If a final master needs it, regenerate the lines at 48 kHz WAV, with separate clips N01–N08 plus the full dry take, as in `brief/v1-review-v2-script.md`.

| Cue | Speech starts | Line |
|---|---|---|
| N01 | 3.15 s | Stuck? Try one path. |
| N02 | 6.75 s | Suppose this seven is true, just for now. |
| N03 | 10.20 s | Don't guess the answer. Follow the consequences. |
| N04 | 15.20 s | One deduction leads to another… |
| N05 | 19.50 s | Two fives in one column. That starting seven can't be right. |
| N06 | 24.30 s | Return to the board. |
| N07 | 28.30 s | Now we can move again. |
| N08 | 33.50 s | See where the solve goes next. |

The v1 scratch voice (pico2wave) is retired.

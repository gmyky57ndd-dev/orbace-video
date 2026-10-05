# Source check: SP-20261005-922508 (2026-10-05)

Checked against the su-pu data (`source/supu-data-SP-20261005-922508.json`, 143 recorded events) before building.

## Verified
- Box 4 has exactly two possible homes for 9: **r5c1 and r6c2** (peer elimination on the givens).
- The recording starts with pencil 9s at r5c1 and r6c2 (steps 1–2), pins r6c2 (3), opens a trial (4) and places **r6c2=9** (5). Steps 5–36 are trial placements (the solver's own notes: "chain trigger - cross hatching a lot of digits", "engaging 5 and 6").
- The trial closes as **abandoned** at step 39. Step 40 places **r5c1=9**; the solver's note at step 43 reads "r5c1 = 9 is confirmed".
- After the 9, the recording continues r6c8=9, r6c9=2, r6c5=3 (steps 44–46), and later notes and a second trial (step 57, r2c6=7) which is the "second fork". The videos stop at step 46.
- The final board of both videos matches: incomplete, r5c1=9 visible, no second fork shown.

## Does not match the brief (corrected)
The brief says the chain ends with **Box 3 having no legal cell for 6**. The recording does not show that:
- The contradiction the solver recorded at step 37 is **"conflict - two 7s in row 3"**: the trial 7 at r3c2 (step 36) against the given 7 at r3c7. The trial board has that one duplicate and nothing else.
- In the trial board after step 36, **6 still has legal cells in Box 3 (r1c7 and r2c7)**, so "6 has nowhere to go" and "Box 3 has no place for 6" are not supported.

Corrections applied in both review cuts:
- On-screen text: "BOX 3 HAS NO PLACE FOR 6" and "NO PLACE FOR 6" became **"TWO 7s IN ROW 3"**; B's opening "6 HAS NOWHERE TO GO" became "TWO 7s IN ROW 3".
- The contradiction mark is a red dashed outline on the two 7s (r3c2 and r3c7); red dashed means contradiction in every Orbace video.
- Narration: three sentences in the supplied voice files state the false claim (A: "But the chain reaches Box Three, and now six has nowhere to go."; B: "Six has nowhere to go."; B: "The chain returns us to the problem: Box Three has no legal place for six."). They are replaced by scratch-voice lines until re-recorded (see `script/vo-rerecord-sheet.md`). The other 19 sentences are used as recorded.

## Not verified
- That every trial placement in steps 6–35 is forced. The videos say "follow the consequences" and "forced chain", as the brief and the solver's notes do; they do not claim more.
- The "Hell tier" level (the page shows `unrated`; the PM stated the level). It is not shown on screen.

## Editorial choices to review
- Steps 41–42 (r6c8=9 entered then cleared) are skipped; the replay continues at the same board.
- Editorial overlays are distinct from the app's styling: neutral ink rings on the two candidate cells, red dashed on the contradiction, a green pulse on the confirmed 9.
- The replay's gold "cleared cell" outlines at the trial close are faded out (`make_quiet.py`; values, candidates, colours and markers are untouched), the same treatment as the 610092 trailer.
- Review cuts are 9:16 at 1080×1920 with the paid end-card wording ("Tap Play now").

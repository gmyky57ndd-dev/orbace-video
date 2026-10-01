# Round 2 brief — SP-20260930-610092 · "Stuck? Try One Path."

Source: Round 2 production package, Drive file `16D4ZNfmOi5JJ3gGBhrYXXqtRrCVesDWc` (SP-20260930-610092-round-2-production.md, 2026-10-01). The package governs; this file records how the trailer follows it.

**Principle:** complete the story of the breakthrough; do not complete the Sudoku. **Signature line:** "Don't guess the answer. Follow the consequences."

## Source check (from the package, re-verified against the su-pu data on 2026-10-01)
- Step 63 pins R3C5; step 64 opens branch B with R3C5 = 6 of {6, 8}; steps 65–88 follow it; step 89 opens nested branch C with R4C5 = 3; steps 90–122 follow C; step 124 merges C into B; step 125 confirms B and promotes 49 cells.
- Step 60 closes branch A as **abandoned** (left unresolved). Abandonment is not proof that the assumption is false, so the trailer starts at step 63 and says nothing about branch A.
- The recording has **no contradiction event**. The trailer does not use "That can't be true", does not claim an elimination, and does not present steps 61–62 as proven by A.
- The conditional "return → 2–3 unlocked moves → Breakthrough" arc cannot be certified from this recording. Until a verified segment exists, the payoff is visible progress inside an explicitly temporary path, and the overlay "Breakthrough." is not used.

## Working cut (v1, 9:16, 37.5 s)
Steps 63 → 93 in recorded order, frozen at the unfinished step 93; CTA "See where the solve goes next." → "Watch the complete Su-Pu Replay"; exact replay URL as text (no invented short link, no QR in 9:16); small "IB Tree · Inferential Binary Tree" and Orbace branding only at the end. 16:9 is built after the vertical master is approved.

## Open items
- Voice: real recording from `script/vo-recording-sheet.md` replaces the scratch guide voice.
- Thumbnails: the package's AI-art thumbnails (1536×864, 864×1536, 1024×1024) were not in the Drive file; these are real-frame thumbnails from step 63 per standard v2.0. The package's own portrait and square prompts read "undefined" and need re-supplying if AI art is wanted.
- Level: Extreme · Hell (confirmed by the PM, 2026-10-01). The level stays out of the opening; the video leads with the player's problem, not terminology.


## v2 direction (PM review, 2026-10-01) — supersedes the B/C working cut above
`brief/v1-review-v2-script.md`. The PM's screenshot establishes a contradiction in branch A, so the working-cut restriction ("no contradiction claim") no longer applies to branch A. Re-verified from the su-pu data:
- Step 40 opens branch A (R8C3 = 7); steps 41–57 are trial placements; **step 58 places a trial 5 at R4C3 while R9C3 already holds a given 5 — two 5s in column 3.** Step 59 pins the endpoint; step 60 closes the branch ("abandoned").
- After the return, steps 61–62 enter R9C1 = 7 and R2C3 = 7. With R8C3 = 7 rejected, R9C1 is the only remaining place for a 7 in the bottom-left box and R2C3 the only one in column 3 (checked by peer elimination on the pre-branch board). The video shows exactly these two moves and no third.
- Not independently checked: that every trial placement between steps 42 and 57 is forced by the 7. The trailer relies on the replay's own "follow" labels and shows the placements in recorded order.
Story: progress (steps 1–38 accelerated) → stuck → temporary assumption → consequences → contradiction → return → two recorded moves → unfinished CTA. The standalone "Breakthrough." overlay is now used, after the return.

## v3 refinements (PM review of v2, 2026-10-01)
Quiet the return (fade the app's gold cleared-cell outlines; about a second of calm before the first 7), give R2C3=7 more time and emphasis, drop the small captions that duplicate the headlines on N03 and N05. Verdict on v2: the cut satisfies the intended story and acceptance criteria. The outline fade is an editorial edit of the capture (`tools/supu-replay-pipeline/trailer3/make_quiet.py`: gold stroke pixels restored from the median of the pre-branch frames); no cell value or trial style is changed.

# Lesson 07 V3 — British Voice and End Card

## Scope

V3 preserves V2's approved narration, six validated Sudoku states, logical sequence, animation language, and overall pacing. Changes are limited to voice quality, semantic retiming required by that voice, synchronized micro-SFX, and the final information card.

## Voice selection

Three genuinely installed British system voices were rendered with the required fork/branch audition passage:

- `voice-auditions/british-a.mp3` — Flo (English UK)
- `voice-auditions/british-b.mp3` — Sandy (English UK)
- `voice-auditions/british-c.mp3` — Shelley (English UK)

**Selected:** Flo (English UK), provided by macOS system speech synthesis. Of the locally available candidates, it produced the warmest tone, clearest sentence stress, and least character-like delivery. Phrase-specific rates and authored pauses introduce variation around the fork, held branch, proof turn, verification, and final resolution.

This remains local synthetic speech and is not represented as approved human talent. The three auditions are retained for PM review. If the selected read is still judged detectably mechanical, V2 should remain the public master until an approved human or licensed neural British narrator replaces `../production/remotion/public/lesson07-v3-voice.wav`.

Pronunciation review: the script contains `Sudoku` but does not ask the narrator to speak `Orbace` or `ib-tree`; those terms remain end-card typography, avoiding unapproved synthetic pronunciations. No spoken advertising CTA was added.

## Timing

- Total composition: 64.11 seconds / 1,924 frames at 30 fps
- Narration begins: 5.60 seconds
- `The branch holds`: 29.09 seconds
- `But completion isn't proof`: 41.48 seconds
- Verification begins: 44.22 seconds
- `Verified`: 52.44 seconds
- Final spoken line ends: 59.11 seconds
- Silent end-card dwell: 5.00 seconds

The MP4 container reports 64.17 seconds because of AAC priming; the video track is 1,924 frames / 64.13 seconds.

`voice-timing-v3.json` is the timing authority. Scene holds were adjusted at semantic boundaries; no Sudoku state or logical move changed.

## End card

The new card follows the approved identify → explain → direct → brand hierarchy:

- Orbace Sudoku
- When the Branch Holds · Su-Pu Studies · Lesson 07
- `ib-tree · Inferential Binary Tree`
- `orbacesudoku.com/journal`
- `orbacesudoku.com/download`
- `一局一茶 · ONE PUZZLE, ONE TEA`

The technique is primary information rather than metadata. Both written destinations remain visible; no QR code was added because the card is readable and independent without one. Motion is limited to staged fades and a restrained seal accent.

## Audio provenance

Narration was synthesized locally with an installed macOS voice. The bed is the existing original V2 bed. V3 micro-SFX are deterministic synthesized tones generated locally and retimed to V3. No third-party music, voice, or stock SFX were introduced.

Final narrated-master audio measures approximately -15.2 LUFS integrated, 5.1 LU loudness range, and -2.4 dBFS true peak.

# Lesson 01 production QA

## Result

PASS — no blocking source, editorial, visual, caption, audio, or technical issues found.

## Source and editorial

- Published HTML snapshot resolves uniquely to “Two Homes for a Nine.”
- The page and all six main screenshots agree on the fork at R1C1/R2C3, the R2C3 assumption, the five-step contradiction, and R1C1 confirmation.
- No source conflicts, missing assets, corrupt images, duplicates, or unexpectedly small images were found.
- Narration and captions preserve the page’s reasoning order and terminology.

## Visual review

- Review master inspected at the fork, contradiction, proof, and end-card scenes.
- Screenshot geometry is preserved with `object-fit: cover`; no stretching is used.
- Candidates and grid digits remain legible at 1080 × 1920.
- Captions remain in the bottom safe area and do not cover the puzzle.
- Lesson 7 V4 palette, typography, fades, audio bed, caption treatment, and five-second end card are reused.

## Technical validation

- `npm run typecheck`: pass.
- Final render: H.264, 1080 × 1920, yuv420p, 30 fps, 1,800 frames.
- Audio: AAC stereo, 48 kHz, 192 kbps target.
- Container duration: 60.053333 seconds (AAC priming included).
- FFmpeg black detection (`d=0.4`, `pix_th=0.05`): no black segments.
- FFmpeg silence detection (`-55 dB`, `d=1`): no unintended silent segments.
- `git diff --check`: pass.
- Poster, SRT, VTT, narration, manifests, review render, and final master exist.

## Warnings

None.

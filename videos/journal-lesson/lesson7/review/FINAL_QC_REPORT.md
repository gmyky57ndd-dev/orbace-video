# Lesson 07 production QC

## Master

- File: `exports/orbace-journal-lesson07-when-the-branch-holds-60s.mp4`
- Composition: `Lesson07-When-The-Branch-Holds`
- Raster: 1080 × 1920
- Frame rate: 30 fps constant
- Timeline: 1,800 frames / 60.00 seconds (MP4 container reports 60.053 seconds because of AAC priming)
- Video: H.264, CRF 17
- Audio: AAC stereo, 48 kHz, 192 kbps target
- File size: 3,969,799 bytes

## Content checks

- No source screenshot is used as a slideshow frame or composited layer.
- All grid lines, givens, committed values, candidates, selection states, and logic paths are rendered programmatically.
- Committed values match the validated unique solution.
- State 6 singleton notes resolve to the validated solution before the completion claim.
- Circular verification follows the source box order 3 → 6 → 9 → 8 → 7 → 4 → 1 → 2 → 5 and lands on the actual digit-2 solution cell in every box.
- Exact unseen move ordering is not asserted.
- End card contains all approved message elements and holds through 59 seconds.

## Validation executed

- `npm run typecheck`: pass.
- Six reconstruction QA stills: rendered at 1080 × 1920 and visually inspected.
- Eleven timeline QC stills: rendered and visually inspected; four corrected frames were rerendered after safe-area and verification-path fixes.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `ffprobe`: H.264 1080 × 1920 at 30/1 fps; AAC stereo at 48 kHz.
- FFmpeg black detection (`d=0.4`, `pix_th=0.05`): no black segments reported.
- FFmpeg silence detection (`-55 dB`, `d=1`): no unintended silent segments reported.

## Audio provenance

The restrained tonal/noise bed is generated locally from deterministic FFmpeg oscillators and filtered pink noise. It contains no licensed third-party recording, speech, or generative Sudoku content.

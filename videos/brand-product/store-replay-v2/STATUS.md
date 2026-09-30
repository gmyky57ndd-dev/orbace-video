# Replay App Store Preview V2 status

## Current state

Complete and validated on 2026-08-26.

The final edit uses fresh, ad-free current-interface footage from one continuous 70-step Replay attempt. It avoids the Su-Pu library screen so the recorded player alias does not appear.

## Deliverables

- App Store master: `renders/final/orbace-replay-app-preview-v2-app-store-886x1920.mp4`
- 1080 × 1920 archive: `renders/final/orbace-replay-app-preview-v2-1080x1920.mp4`
- Poster: `renders/final/orbace-replay-app-preview-v2-poster.png`
- Muted review: `renders/review/orbace-replay-app-preview-v2-muted-review.mp4`
- Contact sheet: `renders/review/contact-sheet.jpg`
- Source manifest: `source/source-manifest.json`
- Render manifest: `renders/render-manifest.json`
- QA report: `QA.md`

## Rebuild

From `orbace-video/tools/remotion` run:

```sh
npm run product:replay-store-v2
```

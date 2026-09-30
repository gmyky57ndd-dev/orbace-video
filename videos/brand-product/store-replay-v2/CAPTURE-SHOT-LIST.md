# Orbace Replay App Store Preview V2 — Capture Shot List

**Status:** BLOCKED ON FRESH CAPTURE  
**Prepared:** 2026-08-26  
**Creative reference only:** `videos/brand-product/replay-v1/renders/ORB_V1_REPLAY_9x16_C_PRODUCT_FIRST_15s_v02.mp4`

The August 21/24 Replay footage is not eligible for this production because it shows the superseded interface. No newer iPhone recording was found in the repository, Desktop, Documents, or Downloads. Do not start the edit with the old footage.

## 1. Capture build

Capture the current app from the same commit/build candidate intended for submission. Use the repository's explicit screenshot-preview flag so ads are disabled at the application policy source rather than hidden in post:

```bash
cd /Users/justinzero/orbacetech/DevProjects/orbace-sudoku/apps/mobile
flutter run --release \
  --dart-define=ORBACE_HIDE_ADS_FOR_SCREENSHOTS=true \
  --dart-define=RC_API_KEY=<approved-ios-key>
```

`ORBACE_HIDE_ADS_FOR_SCREENSHOTS` is implemented by `AdMobConfig.shouldShowAds`; `AdMobBottomBanner` returns an empty widget when it is active. Do not use `ORBACE_AD_LAYOUT_PREVIEW` or cover an ad with an edit overlay.

Before recording, confirm the build shows the same UI and functionality as the submission candidate. The flag may suppress advertising only; it must not unlock or fabricate product functionality.

## 2. Device preparation

- Record on a supported physical iPhone in portrait orientation.
- Enable Do Not Disturb/Focus and disable notification previews.
- Use a neutral device name and a demo account with no personal information.
- Set display zoom and text size to defaults.
- Use light appearance unless the submission defaults to dark appearance.
- Set volume to zero; the production is designed to work silently.
- Charge above 50%, close unrelated apps, and clear pending system prompts.
- Confirm no debug banner, performance overlay, keyboard, share sheet, consent dialog, purchase sheet, or browser is visible.
- Confirm the bottom of Record Hall and Replay contains no ad or reserved ad placeholder.

## 3. Demo data

Prepare one genuine completed puzzle with:

- a recognizable title and non-personal metadata;
- at least 35 real recorded moves;
- several visible value entries and preferably candidate-note changes;
- zero hints if possible;
- no deliberately fabricated mistake;
- a completed Su-Pu card in `My Su-Pu`;
- a replay whose meaningful middle section changes visibly over 6–8 consecutive steps.

Record the real puzzle title, attempt number, total steps, completion time, score, and selected turning-point step in the capture manifest. Do not edit those values in post.

## 4. Required continuous takes

Capture each take separately with two seconds of stillness before the first gesture and after the last gesture. Keep taps deliberate and avoid rapid, unreadable scrolling.

### Take A — Current Su-Pu entry route (12–15 seconds)

1. Begin on the current app shell with the `Su-Pu` tab visible.
2. Hold for two seconds so the current navigation and `My Su-Pu` segment are legible.
3. Show the Record Hall header: `Record Hall` and `藏谱阁 · Your Su-Pu collection`.
4. Scroll only enough to reveal one complete Su-Pu card.
5. Hold on its real Puzzle Score, time, mistakes, hints, and attempt metadata.
6. Tap the card's genuine `Replay` button once.
7. Hold on the loaded Replay screen for three seconds.

Acceptance: no loading spinner remains after the cut point; no card is partially clipped at the intended hold; the Replay transition is continuous and truthful.

### Take B — Manual replay controls (15–20 seconds)

1. Begin on Replay at a real middle step, with `Attempt N` and `Step X of Y` visible.
2. Hold for two seconds.
3. Tap `Next` three times at roughly one-second intervals.
4. Hold after each tap long enough to see the board and current-move row update.
5. Tap `Back` once to demonstrate reversible inspection.
6. Hold for two seconds.

Acceptance: every board transition matches the recorded move history; the current-move row is readable; no essential digit or control is obscured by the touch indicator.

### Take C — Auto-play and turning point (15–20 seconds)

1. Begin two or three steps before the selected real turning point.
2. Tap the center Auto-play control.
3. Allow six to eight genuine moves to play at the app's native cadence.
4. Pause on the selected turning point.
5. Hold the paused board, step counter, and move description for three seconds.

Acceptance: the turning point is selected because the board visibly changes, not because the edit invents a deduction or claim.

### Take D — Completed record (8–12 seconds)

1. Show the final Replay step and completed board.
2. Hold for three seconds.
3. Return to `My Su-Pu` using normal in-app navigation.
4. Hold on the same completed Su-Pu card for three seconds.

Acceptance: the attempt and puzzle metadata match Takes A–C.

### Take E — Clean plates (five seconds each)

Capture stationary plates of:

- `My Su-Pu`/Record Hall header;
- the complete selected Su-Pu card;
- Replay at step 0;
- Replay at the selected turning point;
- Replay at the final step.

These are fallback edit holds, not permission to fabricate motion.

## 5. Capture format

Retain the original device recording without transcoding. Preferred source characteristics:

- native iPhone portrait resolution;
- HEVC or H.264;
- highest available quality;
- device-native frame rate and timing metadata;
- no destructive trimming or recompression before intake.

Name files:

```text
orbace-replay-v2-take-a-entry-route-YYYYMMDD.MOV
orbace-replay-v2-take-b-manual-controls-YYYYMMDD.MOV
orbace-replay-v2-take-c-autoplay-turning-point-YYYYMMDD.MOV
orbace-replay-v2-take-d-completed-record-YYYYMMDD.MOV
orbace-replay-v2-take-e-clean-plates-YYYYMMDD.MOV
```

Place them in:

```text
orbace-video/videos/brand-product/store-replay-v2/source/captures/
```

## 6. Planned 18-second edit after capture intake

| Output time | Source | Picture | Overlay |
| --- | --- | --- | --- |
| 00:00–00:02.5 | Take A | Current Su-Pu card and Replay tap | `Your solve stays with you.` |
| 00:02.5–00:06 | Take B | Replay loads; two manual steps | `Replay every move.` |
| 00:06–00:11 | Take C | Genuine auto-play progression and pause | `Find what opened the grid.` |
| 00:11–00:14 | Take D | Completed board returning to its record | `Every solve becomes a record.` |
| 00:14–00:18 | Generated brand card | Current Orbace end card | `Sudoku that remembers.` / `Play. Replay. Improve.` |

The first frame must contain genuine app UI, not an abstract title card. The picture edit must remain understandable when muted.

## 7. Intake gate

Production may resume only when the capture set passes all of these checks:

- current submission-candidate interface;
- no ad content or reserved ad slot in every frame;
- no notification banners, private data, system sheets, browser, or debug UI;
- same real attempt across all selected shots;
- genuine move-by-move state changes;
- sufficient holds for text and board inspection;
- original masters and hashes recorded before proxy generation.

After intake, create the source manifest, conform proxies, new Remotion composition, 886×1920 App Store master, 1080×1920 archival master, muted review, poster, contact sheet, render manifest, and QA report. Do not overwrite Replay V1.

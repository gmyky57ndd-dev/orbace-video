# Codex Task — Generate the Three Orbace Sudoku Marketing Videos

**Status:** execution brief for first complete review versions  
**Campaign:** Orbace Sudoku V1 Replay, V2 Solve Record, V3 Brand Film  
**Primary production repository:** `/Users/justinzero/orbacetech/DevProjects/orbace-sudoku/orbace-video`  
**New capture source:** `/Users/justinzero/Desktop/os-iphone`  
**Do not move, rename, overwrite, or modify the original captures.**

## 1. Objective

Create the first complete, reviewable version of all three Orbace marketing videos from the real supplied iPhone recordings. Build them as reproducible Remotion compositions inside the existing `orbace-video` project. The three videos must look and sound like members of the same Orbace system and must inherit the visual discipline of the approved Journal lessons, especially Lesson 7 V4.

The campaign must communicate one connected product story:

- **V1 — Replay:** I can replay how I solved.
- **V2 — Solve Record:** Orbace preserves both my result and how I arrived.
- **V3 — Brand Film:** Play → Replay → Understand → Keep → Compete.

Use only real Orbace UI. Never fabricate a board state, score, move, candidate, Scorecard, Su-Pu record, competition result, Learn page, store badge, or product interaction.

## 2. Required references and precedence

Read these files before editing or rendering:

1. `docs/Orbace Sudoku V2 — Video Production Package v1.0.md` — canonical campaign message, shot intent, prohibitions, audio targets, and delivery specifications.
2. `docs/v1 step by step instruction.md` — POC workflow, review gates, naming, and QC expectations.
3. `os-journal/templates/JOURNAL-VIDEO-PRODUCTION-TEMPLATE.md` — canonical Journal production workflow.
4. `os-journal/lesson7/README.md`, `os-journal/lesson7/review/V4-CHANGELOG.md`, and the approved Lesson 7 V4/final render — primary visual, pacing, caption, audio, transition, and end-card reference.
5. `os-journal/lesson1/` — secondary reference for the reusable Journal structure and two-destination end card.
6. `tools/remotion/src/series/JournalSeries.tsx` and shared tokens/components — implementation reference. Reuse or extract shared tokens; do not fork a visually unrelated marketing system.

If references conflict, use this order:

**real current product behavior → approved Journal Lesson 7 V4 → current campaign package → POC implementation.**

Record every consequential interpretation or source conflict in each campaign's `review/DECISIONS.md`. Never guess silently.

## 3. New source inventory

Treat these as immutable external masters:

### A. Tea Moment campaign source

`/Users/justinzero/Desktop/os-iphone/ScreenRecording_08-24-2026 teamomentplay.MP4`

Observed technical metadata:

- 1170 × 2532 portrait;
- HEVC video and AAC audio;
- variable frame-rate recording, nominal peak 120 fps;
- approximately 639.857 seconds;
- approximately 783.7 MB.

Observed content includes Tea Moment play, a completed solve, Su-Pu/Record Hall navigation, and Replay. This is the preferred **campaign-spine source** because it is the broadest continuous product session.

### B. Focused Replay source

`/Users/justinzero/Desktop/os-iphone/ScreenRecording_08-24-2026 replay.MP4`

Observed technical metadata:

- 1170 × 2532 portrait;
- HEVC video and AAC audio;
- variable frame-rate recording, nominal 60 fps;
- approximately 77.031 seconds;
- approximately 75.9 MB.

Observed content includes a Scorecard/share transition and a clear 63-step Replay sequence. It appears to be a different solve from the long Tea Moment capture. It may be used for a V1 alternate only, or as supplemental evidence, but must not be presented as the same solve unless frame-by-frame inspection proves that it is.

### C. Supporting current-product screenshots

`/Users/justinzero/Desktop/os-iphone/IMG_0131.PNG` through `IMG_0143.PNG`

All are 1170 × 2532. They include current Today, Play, Settings, Compete, official-play instructions, Su-Pu/Record Hall, ranking, and Learn screens. Use them only as legitimate static product evidence. Do not simulate taps, scrolls, changing values, or other motion that was not captured.

## 4. Source handling

Do not duplicate the two full-size masters into the repository.

Instead:

1. Create `shared-assets/manifests/marketing-captures-2026-08-24.json` containing absolute source paths, byte sizes, durations, dimensions, codecs, frame-rate information, and SHA-256 hashes.
2. Generate editing proxies and selected lossless/high-quality excerpts under `shared-assets/proxies/marketing-2026-08-24/`.
3. Normalize selected video excerpts to constant 30 fps for V1/V2 and to the V3 composition frame rate before Remotion ingest. Preserve aspect ratio and color.
4. Keep a source-timecode map from every proxy/excerpt back to the immutable master.
5. Do not commit or copy the 783.7 MB master unless the PM explicitly requests it.

## 5. Mandatory discovery pass

Before building compositions, inspect both recordings from beginning to end and produce:

- `marketing/review/CAPTURE-INVENTORY-2026-08-24.md`;
- contact sheets at useful intervals;
- a scene/timecode table;
- notes on status-bar interruptions, notifications, share sheets, accidental app switching, idle sections, and touch hesitations;
- identification of each distinct puzzle/solve and its final step count;
- exact timecodes for play, completion, Scorecard, score breakdown, Su-Pu/Record Hall, Replay, Learn, and Compete material;
- a list of required shots that are missing.

Select one canonical solve for V1, V2, and V3 wherever the long Tea Moment master makes that possible. Do not cut between different puzzles in a way that claims a single solve became a particular Scorecard or Replay.

If a needed continuous action is missing, use an honest cut to a related real screen or mark the shot missing. Do not manufacture continuity.

## 6. Project organization

Preserve the existing repository organization. Create the missing campaign folders without disturbing `marketing/replay-v1/`:

```text
marketing/
├── replay-v1/                 # existing POC; preserve
├── replay-v2/
│   ├── brief/
│   ├── script/
│   ├── source/
│   ├── production/remotion/
│   ├── review/
│   └── renders/
├── solve-record-v1/
│   ├── brief/
│   ├── script/
│   ├── source/
│   ├── production/remotion/
│   ├── review/
│   └── renders/
└── brand-film-v1/
    ├── brief/
    ├── script/
    ├── source/
    ├── production/remotion/
    ├── review/
    └── renders/
```

Shared marketing components belong under `tools/remotion/src/marketing/`; campaign-specific timing/data belongs in the campaign folder. Reuse the existing Remotion installation and shared Orbace tokens. Do not create three independent apps or install duplicate dependencies.

## 7. Shared Orbace visual system

The marketing videos must feel like shorter, product-led companions to the Journal films.

### Palette

Read actual palette values from the current shared Journal implementation. Use:

- warm paper/cream as the primary light surface;
- deep Orbace green as the primary dark surface;
- crimson for the seal and rare decisive emphasis;
- muted gold for rules, dividers, and restrained proof/achievement emphasis;
- celadon only for subtle supporting states;
- existing product blue only when it is part of captured UI.

Do not introduce neon, gradients unrelated to Orbace, glossy game styling, esports colors, or generic black end cards.

### Typography

- Use the same editorial serif/sans hierarchy as the Journal system.
- Serif: story, proposition, and human meaning.
- Sans: labels, metadata, captions, URLs, and calls to action.
- Use sentence case for narrative overlays.
- Use tracked small caps sparingly for structural labels such as `REPLAY`, `UNDERSTAND`, and `KEEP THE RECORD`.
- Do not substitute a trendy social-video font.

### Motion

- Drive all motion from Remotion frames using `useCurrentFrame()` and `interpolate()`; do not use CSS transitions or CSS animations.
- Default entrances: 6–10 frame opacity change with 6–12 px controlled movement.
- Use the Journal easing character, approximately `Easing.bezier(0.16, 1, 0.3, 1)`.
- Use hard cuts for product clarity, short dissolves for reflective transitions, match cuts for conceptual continuity, and controlled digital crops for evidence.
- No bounce, elastic movement, spinning, kinetic word-by-word text, dramatic zoom typography, transition packs, or auto-caption highlighting.

### Composition and safe areas

- V1/V2: 1080 × 1920, 30 fps.
- Keep critical text inside approximately 90 px horizontal and 180 px top/bottom social-safe margins.
- Do not cover the Sudoku grid, Replay step count, controls, Scorecard evidence, or important native labels.
- V3: build a 1920 × 1080, 30 fps first review master from the available portrait material. Keep critical content within a center-safe 9:16 zone so a vertical derivative remains viable. A later 4K/24 fps finishing pass may be created only if it materially improves supplied live-action footage.

### Captions and accessibility

- V1/V2 must communicate fully with sound muted; their overlays are the narrative.
- V3 must produce voice, muted, and captioned review variants.
- Follow the Journal caption treatment: restrained sans-serif, high contrast, stable placement, phrase-level timing, no karaoke highlighting.
- Output an SRT for V3 and preserve exact parity between approved narration and captions.

## 8. Shared end-card system

Create one reusable `MarketingEndCard` derived from the Journal end-card grammar:

- deep Orbace green background or restrained real-product/paper transition;
- crimson `数` seal;
- `ORBACE SUDOKU` wordmark treatment;
- one campaign-specific payoff line;
- gold divider rules;
- two clear destinations;
- bottom signature: `一局一茶 · ONE PUZZLE, ONE TEA`.

Every end card must include an app-download destination and a relevant Orbace page. Use the short human-readable URLs on screen; keep direct store links in the production metadata and description copy.

Canonical destinations, verified 2026-08-24:

- Download hub: `orbacesudoku.com/download`
- Main site: `orbacesudoku.com`
- Su-Pu and Replay: `orbacesudoku.com/su-pu`
- Journal: `orbacesudoku.com/journal`
- Apple App Store: `https://apps.apple.com/us/app/orbace-sudoku-free/id6782447247`
- Google Play: `https://play.google.com/store/apps/details?id=com.orbace.orbaceSudoku`

Use official App Store and Google Play badges only from approved local brand assets or official badge files. Do not recreate badges with text. If badges are not locally available, render `DOWNLOAD THE APP` above `orbacesudoku.com/download` and record the missing badges in `SOURCE-GAPS.md`.

For short V1/V2 cards, show at most two reading destinations:

1. the relevant feature URL;
2. `orbacesudoku.com/download`.

For V3, use `orbacesudoku.com` plus `orbacesudoku.com/download`, with official badges if available. Keep the card on screen long enough for one normal read; prioritize legibility over retaining an outdated shot timing.

## 9. V1 — Replay Your Solve

### Deliverable

- Composition ID: `OrbaceMarketingReplayV2`
- Target duration: 12–15 seconds; use 15 seconds if required for the Journal-style end card to remain readable.
- Format: 1080 × 1920 at 30 fps.
- Source: preferably Replay from the long Tea Moment master; use the focused 63-step Replay only when it produces the clearer truthful story.

### Story

1. Open immediately on a completed grid/Replay end state. No logo splash.
2. Show three real backward steps at readable speed.
3. Accelerate a real rewind so candidates visibly return.
4. Stop at an actual legible turning point discovered in the footage; do not assume the old POC's Step 24.
5. Advance through the real decisive move and 2–3 consequences.
6. Return to the full Replay interface.
7. Resolve to the shared end card.

### Approved overlay sequence

- `Your solve doesn't disappear.`
- `Rewind every move.`
- `Find the move that opened the grid.`
- `Every solve becomes a record.`

Do not display an overlay if it blocks proof on screen. Adjust its timing or placement, not the captured UI.

### V1 end card

- Payoff: `Replay your solve.`
- Feature destination: `orbacesudoku.com/su-pu`
- Download destination: `orbacesudoku.com/download`

### V1 outputs

```text
marketing/replay-v2/renders/v01/ORB_MKT_V1_REPLAY_9x16_15s_v01.mp4
marketing/replay-v2/review/v01/contact-sheet.jpg
marketing/replay-v2/review/v01/QC.md
marketing/replay-v2/review/v01/DECISIONS.md
```

Also produce a muted review render. Do not overwrite the existing replay POC or its exports.

## 10. V2 — Your Solve Record

### Deliverable

- Composition ID: `OrbaceMarketingSolveRecordV1`
- Target duration: 15–18 seconds; prefer 18 seconds if required to show real Scorecard evidence and a readable end card.
- Format: 1080 × 1920 at 30 fps.
- Source: the canonical Tea Moment completion, Scorecard, Su-Pu, and Replay/record material from the same solve whenever available.

### Story

1. Show the actual final digit or native completion transition.
2. Let the real Scorecard arrive using its native behavior.
3. Show score, time, mistakes, hints, and steps at a readable pace.
4. Show one real score factor or record detail; do not invent a penalty/bonus if this solve lacks it.
5. Connect the result to the real Su-Pu/Record Hall or Replay affordance.
6. Resolve to the shared end card.

### Approved overlay sequence

- `A score is only the beginning.`
- `Time · accuracy · every step`
- `See what shaped your solve.`
- `One solve. One record.`
- Use `Keep it. Replay it. Share it.` only if all three actions are truly available in the captured product; otherwise use `Keep the record.`

Do not imply that personal Puzzle Score is official Ranking Points. Do not make an unranked badge, leaderboard, or beta participant count the hero.

### V2 end card

- Payoff: `How you solved matters.`
- Feature destination: `orbacesudoku.com/su-pu`
- Download destination: `orbacesudoku.com/download`

### V2 outputs

```text
marketing/solve-record-v1/renders/v01/ORB_MKT_V2_SOLVE_RECORD_9x16_18s_v01.mp4
marketing/solve-record-v1/review/v01/contact-sheet.jpg
marketing/solve-record-v1/review/v01/QC.md
marketing/solve-record-v1/review/v01/DECISIONS.md
```

Also produce a muted review render.

## 11. V3 — Every Solve Has a Story

### Deliverable

- Composition ID: `OrbaceMarketingBrandFilmV1`
- Target duration: approximately 30 seconds.
- First review format: 1920 × 1080 at 30 fps, plus a center-safe 1080 × 1920 derivative after approval.
- Source: real Tea Moment, Replay, Scorecard/Su-Pu, Learn, and Compete evidence from the supplied recordings/screenshots.

Do not generate ambient footage for V01. Build the first complete version from real current product footage and Orbace paper/typographic scenes. If approved live-action footage is supplied later, it may replace the opening/closing paper scenes without changing the product story.

### Story and approximate timing

1. **00:00–00:03 — Opening:** Orbace paper field and a restrained crop of the real Tea Moment entry screen. Overlay: `Every solve has a story.` VO: `Most Sudoku ends with the last number.`
2. **00:03–00:07 — Play:** real Tea Moment play showing a candidate, deliberate digit, and correction only if all are captured. Super: `PLAY`. VO: `Orbace keeps what happened before it.`
3. **00:07–00:13 — Replay:** completed state, rewind, actual turning point, and forward consequence. Super: `REPLAY`. VO: `Rewind your solve. Find the move that opened the grid.` Leave approximately one second around the decisive move free of new animation.
4. **00:13–00:17 — Understand:** use real Learn/Journal evidence only if it genuinely corresponds to the demonstrated technique. A current Learn screenshot may be used as a static editorial panel. Super: `UNDERSTAND`. VO: `Learn the technique behind it.` If the exact technique cannot be verified, replace this with a broader truthful Learn screen and VO `Turn a difficult solve into a lesson.` Record the substitution.
5. **00:17–00:22 — Keep:** real Scorecard and Su-Pu/Record Hall. Super: `KEEP THE RECORD`. VO: `And keep the record of how you solved.`
6. **00:22–00:26 — Compete:** current Compete lobby or official-play instruction screen. Use real video if present; otherwise use the supplied static screenshot with a restrained editorial crop. Super: `COMPETE WHEN YOU'RE READY`. VO: `Then, when you're ready, bring your game into fair competition.` Never show a live-event puzzle solution, provisional rank as a claim, thin leaderboard, countdown urgency, or a fabricated tap.
7. **00:26–00:30 — Brand resolve/end card:** shared Journal-derived card. VO: `Orbace Sudoku.`

### V3 end card

- Brand line: `A calmer way to play. A clearer way to compete.`
- Primary destination: `orbacesudoku.com`
- Download destination: `orbacesudoku.com/download`
- Bottom signature: `一局一茶 · ONE PUZZLE, ONE TEA`
- Do not use `Charter Class · Public Beta` unless the PM confirms that this offer/status is still current.

### V3 narration

Default script:

> Most Sudoku ends with the last number. Orbace keeps what happened before it. Rewind your solve. Find the move that opened the grid. Learn the technique behind it. And keep the record of how you solved. Then, when you're ready, bring your game into fair competition. Orbace Sudoku.

If the exact Learn technique cannot be verified, use:

> Most Sudoku ends with the last number. Orbace keeps what happened before it. Rewind your solve. Find the move that opened the grid. Turn a difficult solve into a lesson. And keep the record of how you solved. Then, when you're ready, bring your game into fair competition. Orbace Sudoku.

Voice direction: adult, warm, measured, confident, and natural. Avoid sports-announcer delivery, ASMR whispering, luxury-ad affectation, or “brain training” instruction. The first review may use a clearly labeled temporary voice, but do not represent it as final approval.

### V3 outputs

```text
marketing/brand-film-v1/renders/v01/ORB_MKT_V3_BRAND_16x9_30s_v01.mp4
marketing/brand-film-v1/renders/v01/ORB_MKT_V3_BRAND_16x9_30s_v01_muted.mp4
marketing/brand-film-v1/renders/v01/ORB_MKT_V3_BRAND_16x9_30s_v01_captioned.mp4
marketing/brand-film-v1/renders/v01/ORB_MKT_V3_BRAND_16x9_30s_v01.srt
marketing/brand-film-v1/review/v01/contact-sheet.jpg
marketing/brand-film-v1/review/v01/QC.md
marketing/brand-film-v1/review/v01/DECISIONS.md
```

## 12. Audio system

Inherit the Journal films' restraint:

- quiet felt/paper/digital taps;
- subtle reverse texture for Replay;
- brief reduction or near-silence at the turning point;
- one warmer resolving note for the decisive move;
- understated scorecard information ticks;
- calm tonal bed without a trailer-style rise.

Do not use arcade clicks, ticking clocks, achievement chimes, generic whooshes, confetti sounds, or game-show music.

For social masters, target approximately -14 LUFS integrated and no higher than -1 dBTP. For the V3 brand master, preserve comfortable narration intelligibility and document measured loudness/peak values in QC.

## 13. Remotion implementation requirements

- Use frame-driven Remotion animation only.
- Put staged assets under the relevant Remotion `public/` directory and reference them with `staticFile()`.
- Use `Video` and `Audio` from `@remotion/media`.
- Use sequences and explicit trim points so all source timing is reviewable.
- Parameterize copy, URLs, source paths, trim points, crop values, muted state, caption state, and render dimensions.
- Keep campaign data in JSON/TypeScript config rather than burying timecodes in presentation components.
- Add compositions to the existing shared root rather than creating disconnected projects.
- Preserve source aspect ratio. Crop deliberately; never stretch the iPhone recording.
- Use a neutral paper surround or editorial device/window framing when portrait capture appears inside the V3 landscape master.
- Ensure every composition renders deterministically without network calls.

## 14. Review sequence and gates

Do not render all final derivatives immediately.

### Gate 1 — source truth

Deliver the capture inventory, canonical-solve decision, timecode map, and source gaps. Verify that Scorecard and Replay belong to the claimed solve.

### Gate 2 — visual system

Render representative stills for the opening, product frame, overlay, turning point, and end card of each video. Compare directly with Lesson 7 V4 for palette, hierarchy, restraint, caption behavior, and end-card family resemblance.

### Gate 3 — motion rough cuts

Render low-resolution review videos for V1, V2, and V3. Review once with sound, once muted, and once without pausing.

### Gate 4 — product and brand approval

Confirm:

- every UI state is real and current;
- no two solves are falsely presented as one;
- Replay is clearly different from Undo;
- personal score is not confused with official ranking;
- the Learn claim matches real evidence;
- competition is presented without misleading urgency or population claims;
- all URLs and store destinations are correct and readable;
- all three videos unmistakably belong to the Journal/Orbace visual family.

Only after these gates pass should Codex render full-resolution V01 deliverables and derivatives.

## 15. Automated QC

For every deliverable, verify and record:

- duration, resolution, frame rate, codec, pixel format, and audio streams;
- no black/blank/unintended frames;
- no status-bar notification intrusion in selected excerpts;
- text and badge safe areas;
- overlay/UI collisions;
- URL spelling and minimum readable hold;
- caption/voice parity;
- loudness and true peak;
- source-to-output timecode traceability;
- end-card consistency across all three videos;
- muted comprehension.

Create contact sheets containing at least one still per narrative beat plus the end card.

## 16. Versioning and preservation

- Never overwrite the existing Replay POC.
- Never overwrite a numbered render.
- Use `v01`, `v02`, and so on.
- Do not use `latest`, `new`, `final-final`, or `test2`.
- Update a campaign `CHANGELOG.md` for each revision.
- Preserve review renders, contact sheets, QC reports, source maps, and decisions beside the associated version.

## 17. Stop conditions

Stop and report a source gap instead of inventing footage when:

- the canonical solve cannot be matched across completion, Scorecard, and Replay;
- the exact turning point is not visually legible;
- the claimed Learn technique cannot be proven;
- official store badges are unavailable;
- a required competition screen would expose live puzzle content or misleading ranking data;
- an app interaction exists only as a still and would require fabricated animation;
- any URL or current offer cannot be verified.

The first-version goal is not maximum spectacle. It is a truthful, calm, editorial campaign in which real Orbace product evidence carries the story and the Journal design language makes all three videos feel unmistakably related.

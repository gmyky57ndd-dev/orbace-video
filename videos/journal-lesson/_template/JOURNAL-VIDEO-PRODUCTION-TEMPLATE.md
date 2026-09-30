# Orbace Journal Video Production Template

This is the canonical reusable workflow for all Journal lessons. It consolidates the existing Orbace Journal template/process document without changing its substantive requirements.

## Reference and source precedence

- Lesson 7 V4 is the canonical visual, pacing, narration/caption, audio, transition, and end-card reference.
- The published lesson HTML is canonical for title, puzzle facts, terminology, deduction order, and conclusion.
- Local cropped screenshots are visual evidence and source assets.
- Reviewed overrides may clarify pronunciation, timing, or presentation but must be recorded and may not silently contradict the published lesson.

## Parameterized invocation

Accept one lesson identifier: number, name, or slug.

```text
npm run journal-video -- --lesson lesson-01
npm run journal-video -- --lesson two-homes-for-a-nine
```

Normalize it to `lessonN`, title, slug, published URL, and screenshot directory before editing or rendering.

## Discovery and production

1. Resolve the lesson uniquely from local data and the Journal URL.
2. Save a timestamped HTML snapshot and source manifest.
3. Inventory and hash screenshot assets; reject corrupt or ambiguous material.
4. Normalize lesson data, scenes, narration, captions, verification, and end-card data.
5. Map the lesson onto: Opening → setup → key decision/pattern → reasoning chain → proof/resolution → completion → verification → Orbace end card.
6. Reuse shared Remotion components and tokens from `tools/remotion/`; do not fork the visual system per lesson.
7. Generate narration after factual and timing review; keep captions synchronized with the approved narration.
8. Render review outputs, inspect stills and audio, then render an immutable numbered version or `final`.
9. Write QA, manifest, hashes, source conflicts, and decisions into the lesson `review/` folder.

## Standard outputs

```text
videos/journal-lesson/lessonN/renders/vN/orbace-journal-lessonN-<slug>-vN.mp4
videos/journal-lesson/lessonN/renders/vN/<same-stem>.srt
videos/journal-lesson/lessonN/renders/final/<same-stem>-final.mp4
```

Never use `final-final`, `new`, `latest`, or `test2`. Never overwrite an earlier version.

## Quality control

Check title/URL, puzzle and solution consistency, digit/cell references, scene order, visible-state timing, caption parity, narration pronunciation, safe areas, geometry, audio levels, end-card requirements, and render metadata. Surface all conflicts instead of guessing.

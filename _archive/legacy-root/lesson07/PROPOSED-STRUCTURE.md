# Proposed Remotion production structure

```text
orbace-video/lesson07/
├── package.json
├── remotion.config.ts
├── tsconfig.json
├── SOURCE-GAPS.md
├── PROPOSED-STRUCTURE.md
├── qa-stills/
│   └── lesson07-state-{1..6}-qa.png
├── scripts/
│   └── render-qa.mjs
└── src/
    ├── index.ts
    ├── Root.tsx
    ├── lesson07-board-states.ts
    ├── Board.tsx
    ├── QaStill.tsx
    ├── film/
    │   ├── Lesson07Film.tsx
    │   ├── timeline.ts
    │   └── scenes/
    │       ├── Hook.tsx
    │       ├── Setup.tsx
    │       ├── ConfinedGroup.tsx
    │       ├── Fork.tsx
    │       ├── BranchChain.tsx
    │       ├── ParallelControl.tsx
    │       ├── Completion.tsx
    │       ├── CircularVerification.tsx
    │       └── EndCard.tsx
    └── components/
        ├── AnimatedBoard.tsx
        ├── CandidateMark.tsx
        ├── LogicPath.tsx
        ├── OrbaceType.tsx
        └── SafeArea.tsx
```

The checkpoint was approved and the structure is now implemented. The production composition is `Lesson07-When-The-Branch-Holds`, 1080×1920 at 30fps for 1,800 frames.

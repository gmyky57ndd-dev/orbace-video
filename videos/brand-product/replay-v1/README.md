# Orbace V1 — Rewind Your Solve

Reproducible FFmpeg pipeline for three 15-second, 9:16 V1 Replay variants.
All Sudoku UI and replay states come from the supplied real capture.

## Render

```sh
chmod +x scripts/*.sh
./scripts/inspect.sh
./scripts/render-v1.sh
./scripts/qc-v1.sh
```

The current render produces:

- `exports/ORB_V1_REPLAY_9x16_A_CONTROL_15s_v02.mp4`
- `exports/ORB_V1_REPLAY_9x16_B_CHESS_HOOK_15s_v02.mp4`
- `exports/ORB_V1_REPLAY_9x16_C_PRODUCT_FIRST_15s_v02.mp4`

Variant A is the recommended control. Variant B changes only the approved
opening hook. Variant C is the cleanest product-first cut and begins without
an opening text claim; all later campaign copy and timing remain consistent.

## Source limitations retained honestly

The supplied production capture is a Beginner, 64-step solve rather than the
brief's preferred Hard, 45–70-step canonical solve. It records a forward replay
sequence, not explicit Back-button taps. The rewind edit reverses those actual
captured replay frames; it never synthesizes a grid, candidate, move, or UI
state. The real Step 24 of 64 is the selected turning point.

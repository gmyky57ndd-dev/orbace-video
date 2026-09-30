# Brand and product videos

Brand films, promo shorts and App Store / Google Play videos — everything that is not a su-pu full replay, Journal lesson or su-pu trailer. Each substantial campaign gets its own folder with `brief/`, `script/`, `source/`, `production/`, `review/`, and `renders/` as material becomes available.

## Campaign index

| Campaign | Format | Review output | Evidence |
| --- | --- | --- | --- |
| `replay-v1/` | Preserved earlier POC | Existing A/B/C exports | Legacy replay capture and brand overlays |
| `replay-v2/` | 1080×1920, 30fps, 15s | `ORB_MKT_V1_REPLAY_9x16_15s_v01.mp4` | Replay master, source 00:25–00:40 |
| `solve-record-v1/` | 1080×1920, 30fps, 18s | `ORB_MKT_V2_SOLVE_RECORD_9x16_18s_v01.mp4` | Tea Moment scorecard and Replay master |
| `brand-film-v1/` | 1920×1080, 30fps, 30s | `ORB_MKT_V3_BRAND_16x9_30s_v01.mp4` | Tea Moment, Replay, screenshots 0134/0135/0143 |
| `store-replay-v2/` | 1080×1920 and 886×1920, 18s | `renders/final/orbace-replay-app-preview-v2-*.mp4` | App Store / Google Play preview |
| `_capture-review-2026-08-24/` | — | Contact sheets, capture inventory | Review evidence for the 2026-08-24 captures |

The new campaigns share one Remotion project at `tools/remotion/` and shared UI at `tools/remotion/src/marketing/`. The immutable-source manifest is `../../shared-assets/manifests/marketing-captures-2026-08-24.json`; the human-readable discovery map is `../../shared-assets/manifests/marketing-capture-timecode-map-2026-08-24.md`.

Every campaign folder preserves the same handoff shape: `brief/`, `script/`, `source/`, `production/remotion/`, `review/`, and `renders/v01/`. Review renders are intentionally labeled first-review versions; no final derivative was implied by a `v01` render.

Published 2026-08-28 on YouTube (six uploads, see `../../publishing/publish-log.csv`): which folder produced each is still to be confirmed; two (the 60s 16:9 and the 30s Shorts) have no matching render here.

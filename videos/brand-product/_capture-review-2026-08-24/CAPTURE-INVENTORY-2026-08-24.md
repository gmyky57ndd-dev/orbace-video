# Capture inventory — 2026-08-24

This is the mandatory discovery record for the Orbace marketing campaign package. The Desktop masters are immutable; all derivatives live under `shared-assets/proxies/marketing-2026-08-24/`.

## Inventory

| Asset | Master properties | Verified contents | Marketing use |
| --- | --- | --- | --- |
| `ScreenRecording_08-24-2026 teamomentplay.MP4` | 1170×2532, HEVC/AAC, 639.856893s, nominal 120fps, VFR, SHA-256 recorded in manifest | Tea Moment solve, completion scorecard (1050; 7:47; 0 mistakes; 0 hints; 63 steps), Su-Pu Record Hall, Play, Replay | Brand opening, Solve Record, product ecosystem |
| `ScreenRecording_08-24-2026 replay.MP4` | 1170×2532, HEVC/AAC, 77.030816s, nominal 60fps, VFR, SHA-256 recorded in manifest | Play, Su-Pu, share sheet, published card, Replay Attempt 1 steps 0→63 | Replay hero for V1/V2/V3 |
| `IMG_0131.PNG`–`IMG_0143.PNG` | 1170×2532 PNG stills; hashes in manifest | Home, Settings, Play, Compete, Daily rules, Su-Pu, submit dialogs, Ranking, Learn | Clean product stills for V3 |

## Timecode and scene findings

- `teamomentplay`: Tea Moment opening and board progression 00:00–00:30; completion/scorecard around 07:50–08:00; Su-Pu/Record Hall 08:00–08:40; Play/Su-Pu list 08:40–09:05; Replay 09:05–10:35.
- `replay`: Play 00:00–00:05; Record Hall/share 00:05–00:20; published card 00:20–00:25; Replay steps 00:25–01:05.
- The map is padded because both masters are VFR. Exact conform uses the immutable master, not a proxy’s nominal frame rate.

## UI hygiene

The chosen hero ranges contain the red iOS status clock but no notification banner. The source’s status strip is disclosed in the campaign QC/decisions notes; it is not removed or misrepresented. The share-sheet moment is catalogued but not used as a fabricated continuity bridge.

## Distinct solve evidence

The Tea Moment solve is one 63-step beginner record (1050 score, 0 mistakes, 0 hints). The standalone Replay recording shows the same type of attempt as Step 0→63. No second distinct solve was found in the supplied masters; the campaigns do not imply one.

## Missing shots / gaps

- No clean, notification-free final-submit take.
- No technique-detail page beyond the Learn landing screenshot.
- No clean Compete puzzle result; the V3 Compete beat uses the surface screenshot and cuts before a puzzle answer.

## Derivatives

Contact sheets: `contact-sheet-team-01.jpg`, `contact-sheet-team-02.jpg`, `contact-sheet-replay.jpg`, `contact-sheet-screens.jpg`.

Manifest: `shared-assets/manifests/marketing-captures-2026-08-24.json`.

Timecode map: `shared-assets/manifests/marketing-capture-timecode-map-2026-08-24.md`.

# Su-Pu replay video pipeline

The capture → plan → render → audio → encode pipeline that produced every Su-Pu replay video so far:
the Extreme IB Tree trailer (V5.1, V6), the Easy trailer (V4) and the SP-20260928-355762 full replay (v1–v3, 4K final).
The process it implements is `standards/ORBACE-VIDEO-GENERATION-STANDARD-v2.0.md`.

The layout is flat on purpose: scripts use relative paths (`fonts/`, `site2/`, `full/sched.json`, `hd/v/`), so keep them together.
Frame captures (`steps*/`, `easy/`, `full*/`, `hd/`), `node_modules/` and `out/` are rebuildable and are not kept here.

## Requirements

Node 20+ with Playwright (Chromium), Python 3 with Pillow, numpy, qrcode, opencv-python (QR check), pocketsphinx (voice alignment), and ffmpeg.
`npm install` restores the @fontsource fonts; `fonts/` holds the TTFs the renderers use.

## Stages and scripts

| Stage | Script | What it does |
| --- | --- | --- |
| 1. Pull | `site/`, `site2/` | Snapshot of the live orbacesudoku.com su-pu page (HTML, JS, CSS) and each su-pu's JSON data. `site2/` is the 2026-09-28 refresh ("Entry" wording, r1–r9 / c1–c9 labels). Refresh this before a new batch: open the su-pu in a browser, save the page assets and the `https://justinzero.fly.dev/supu/<id>` response |
| 1. Serve | `serve.js`, `serve2.js` | Local mirror: routes `https://orbacesudoku.com/...` to the snapshot with Playwright route interception, so the real replay UI renders offline |
| 2. Capture | `capture.js`, `capture_w.js`, `capture_rev.js` | Trailer captures: 9:16 phone, 16:9 desktop, and the backward (rewind) pass |
| 2. Capture | `cap.js`, `cap2.js` | Full-replay captures: screenshot `.osgc-card--replay` at every step via `.osr-btn-fwd`. `cap2.js` enlarges the coordinate labels (16/28/24 px desktop, 13/22/19 px phone). Density: `node cap2.js <mode> <dpr>` — 4× desktop, 6× phone for 4K |
| 2. Helpers | `brand.js`, `measure.js`, `m2.js`, `probe.js` | Brand tokens, layout measurement, page probing |
| 3. Plan | `full_sched.py` → `full/sched.json` | Step schedule (pacing by event type) and callout list for a full replay |
| 3. Plan | `align.py`, `vo/lines.json` | Places each narration line with pocketsphinx word alignment (trailers) |
| 3. Plan | `patch_easy.py` | Easy-trailer schedule edits |
| 4. Render | `render.py`, `render_w.py` | Trailer V5.1 (9:16, 16:9) |
| 4. Render | `render6.py` | Extreme trailer V6 (hook, silence beat, "Let's replay it.", rewind, chapter holds, end cards; QR on 16:9 only) |
| 4. Render | `render_easy.py` | Easy trailer V4 |
| 4. Render | `render_full.py`, `render_full_v.py` | Full replay v1/v2 (1080p, 16:9 / 9:16) |
| 4. Render | `render_full2.py`, `render_full_v2.py` | Full replay v3 (refreshed UI, Entry + r/c labels) |
| 4. Render | `render_hd.py <169|916>` | **Current**: 4K full replay (K=2), dedupes unique frames into an ffmpeg concat list |
| 4. Render | `thumbs.py` | 1280×720 and 1080×1920 thumbnails from real replay frames |
| 5. Audio | `music.py`, `music6.py`, `music_easy.py` | Trailer music beds (V5.1, V6, Easy) |
| 5. Audio | `music_full.py`, `music_full2.py` | Full-replay tones (`music_full2.py` = clean version: no pencil-mark ticks, soft attack, smooth reverb) |
| 6. Encode | inside the render scripts | libx264 High, CRF 14, `-tune stillimage`, 30 fps, AAC 256k; voice mix with sidechain ducking and loudnorm to −14 LUFS |

## Full replay in 4K (current recipe)

```bash
node serve2.js &                       # mirror on localhost
node cap2.js w 4                       # desktop capture → hd/w/sNNN.png
node cap2.js v 6                       # phone capture   → hd/v/sNNN.png
python3 full_sched.py                  # → full/sched.json
python3 music_full2.py                 # → out/music_full2.wav
python3 render_hd.py 169               # → out/<file>_169_4k.mp4
python3 render_hd.py 916               # → out/<file>_916_4k.mp4
python3 thumbs.py
```

Name finals `<supu-id>_<type>_<format>_4k.mp4` (type `full` / `lesson` / `trailer`, format `169` / `916` / `11`) and file them under the video's `renders/final/` (local-only, git-ignored). **Do not commit or push the MP4s**; in a cloud session deliver them to the user with the file-delivery tool.

For another su-pu (2026-09-30 refresh): snapshot the live page into `site3/` (`SITE=site3`), then run `node cap2.js <W> <H> <dpr> <dir> <SUPU-ID> <N> -1` for 1280×900@4 (`hd/w`) and 390×844@6 (`hd/v`), `python3 full_sched3.py <SUPU-ID>`, `python3 music_full3.py out/x.wav full/sched_<last6>.json`, `SUPU=<id> FACT="…" python3 render_hd3.py 169|916` (geometry in `geom.json`), encode with ffmpeg (libx264 CRF 14, `-tune stillimage`, AAC 256k, loudnorm −14), and `python3 thumbs3.py`. In this container set `CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

## Known gaps

- No 1:1 composition yet (needed for trailers per standard v2.0).
- Journal lessons use the older `moves` su-pu format; confirm the replay page renders them with current labels before a batch.
- The scripts were written in a cloud session under `/home/claude/v`; paths inside are relative to this folder.

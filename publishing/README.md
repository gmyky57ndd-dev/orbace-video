# Publishing

`publish-log.csv` is the record of everything Orbace publishes: one row per upload or post. It starts on 2026-09-30. The 14 earlier uploads were imported from the YouTube channel ([@OrbaceSudoku](https://www.youtube.com/@OrbaceSudoku)); for anything older or missing, the channel itself is the history.

## The log

| Column | Meaning |
| --- | --- |
| `date` | Publish date (YYYY-MM-DD, channel time) |
| `platform` | YouTube, YouTube Shorts, Reddit, LinkedIn, Pinterest, Facebook, Instagram, TikTok, Google Ads, Website, Email |
| `format` | 16:9, 9:16, 1:1 (or `text`/`image` for posts) |
| `url`, `platform_id` | Public link and the platform's ID (YouTube video ID, post ID, ad ID) |
| `video_type` | full-replay, journal-lesson, trailer, brand-product |
| `supu_id` | SP-YYYYMMDD-NNNNNN when the video is about a su-pu |
| `title` | Title as published |
| `final_file` | Repo-relative path of the exact file uploaded (must be under `videos/<type>/<id>/renders/final/`; the file itself is local-only, not in Git) |
| `status` | `live`, `unlisted`, `scheduled`, `private`, `removed` |
| `logged_by` | Who added the row |
| `notes` | Anything worth knowing (re-upload, campaign, UTM content) |

Rules:

1. Add the row **in the same commit** that publishes or right after the upload — never batch later.
2. Never edit history rows except `status` and `notes` (for example `live` → `removed`).
3. One row per platform upload; a 16:9 upload and its Short are two rows.
4. Use `python3 tools/scripts/log-publish.py` to add rows; it checks the columns and that `final_file` exists.

## Before publishing a video

**Who:** the PM uploads and posts; Claude supplies the package (copy, thumbnails, captions) and never uploads. The PM first downloads the videos from the chat into `renders/final/` locally and checks the sha256 in the video's README.

1. Final files are in `videos/<type>/<id>/renders/final/` on the local machine (never in Git), named to the standard. Publish and log from the machine that holds them; `log-publish.py` checks the file exists locally.
2. Upload to YouTube unlisted: 16:9 as a regular video, 9:16 as a Short; set the Short's related video to the 16:9 upload.
3. Use the package Claude prepared in `videos/<type>/<id>/publishing/`: `youtube-copy.md` (title, description with UTM-tagged su-pu link first, chapters over 1 minute, pinned comment) and `thumbnails/` (1280×720 for 16:9, 1080×1920 for 9:16, 1080×1080 for 1:1). If anything is missing, ask Claude to generate it before uploading.
4. Showcase entry in `showcase-manifest.json` (`status: draft` → preview → `live`), then set YouTube public.
5. Post to channels per `docs/plans/SUPU-TRAILER-DISTRIBUTION-PLAN.md` (r/sudoku: no links, no full solves — use r/orbace_sudoku).
6. Log every upload and post in `publish-log.csv`.

UTM pattern: `?utm_source=<channel>&utm_medium=<video|social|paid_video>&utm_campaign=<campaign>&utm_content=<supu-suffix>_<916|169|11>`.

## Other files

- `showcase-manifest.json` — data for orbacesudoku.com/showcase (schema in `docs/plans/SUPU-SHOWCASE-ENHANCEMENT-PLAN.md`).
- Channel and ads playbooks: `docs/plans/SUPU-TRAILER-DISTRIBUTION-PLAN.md`, `docs/plans/SUPU-LAUNCH-CAMPAIGN.md`.

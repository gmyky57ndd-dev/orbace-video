# Marketing video agent playbook

For every agent that makes Orbace marketing videos, in a cloud session or on a local machine. It says how to go from a request to a finished package, and how to keep the records current. It adds no new creative rules: the standard decides what a video must look like, `CLAUDE.md` holds the short rules, and this file is the working procedure.

- Standard: `standards/ORBACE-VIDEO-GENERATION-STANDARD-v2.0.md` (inherits `standards/ORBACE-REPLAY-TRAILER-STANDARD-v1.0.md`)
- Layout and rules: `README.md`, `CLAUDE.md`
- Pipeline and scripts: `tools/supu-replay-pipeline/README.md`
- Production log (shared Google Sheet): https://docs.google.com/spreadsheets/d/1P3-K7YcRJpS9sSG-beBCmZ0rTcyYPnuTeIYT3SeWQJU/edit

**PM** below means the project manager who reviews the work, downloads the finals, and uploads them.

## 1. Rules that never bend

1. **Genuine replay footage only.** Never fabricate UI, moves, techniques, chapters, coordinates or events. If a beat has no real footage, drop the beat.
2. **Check every claim against the recording.** A brief, a script or a screenshot can be wrong or too cautious. Verify it against the su-pu data (`https://justinzero.fly.dev/supu/<SUPU-ID>`) before it goes on screen or into narration, and write down what you checked and what you did not.
3. **Trailers never show the solved board.** Full replays may, and still end on the invitation. CTA is "Watch the complete replay"; the brand line is "Replay the thinking."
4. **Videos stay local.** Never commit or push a video or audio file to Git, LFS or any server. A push that fails over a video is not retried. Git carries text, captions, JSON, thumbnails, copy and code.
5. **Agents do not upload or post.** The PM uploads to YouTube and logs the upload.
6. **Never overwrite a numbered render.** New iteration, new `renders/vN/`.
7. **Every render that leaves draft gets a row in the production log**, in the same session that made it.
8. **Each format comes from its own capture.** 9:16 and 16:9 for every su-pu video, plus 1:1 for trailers, at 4K masters. Never crop one format into another.

## 2. Where things live

| What | Where | In Git? |
| --- | --- | --- |
| Briefs, scripts, captions, plans, copy, READMEs, thumbnails, code | `videos/<type>/<id>/…`, `tools/…`, `docs/…` | Yes |
| Finals | `videos/<type>/<id>/renders/final/` | **No** (local only) |
| Iterations | `renders/v1/`, `renders/v2/`, … | **No** |
| Raw captures, frames, WAV stems | `tools/supu-replay-pipeline/hd/`, `out/` | **No** |
| What exists, version, sha256, status | the production Sheet | n/a |
| What was published | `publishing/publish-log.csv` | Yes (PM adds rows) |
| Moves, renames, new folders | `docs/REORGANIZATION-MAP.md` | Yes |

Type folders: `videos/full-replay/<SUPU-ID>/`, `videos/trailer/<SUPU-ID>-<level>[-slug]/`, `videos/journal-lesson/lessonN/`, `videos/brand-product/<campaign>/`. Inside each: `brief/ script/ source/ production/ review/ renders/ publishing/` plus a `README.md` you keep current.

## 3. Cloud and local at a glance

| | Cloud session | Local machine |
| --- | --- | --- |
| Start | `bash tools/cloud-setup.sh`; branch off the latest `main` or the branch you build on | `git pull`; install ffmpeg, Python deps, Playwright; `git config core.hooksPath tools/githooks` |
| Browser | Set `CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (check `ls /opt/pw-browsers`); never run `playwright install` | Playwright's own Chromium |
| Network | Live site, data API and Drive work through the proxy; Hugging Face, GitHub LFS and most TTS services are blocked | Whatever your machine allows |
| Voice | No neural TTS. Use a recorded voice file from the PM; `pico2wave` (`apt-get install libttspico-utils`) only as a **scratch** voice for timing | Recorded or generated voice as the PM directs |
| Files at the end | The container is temporary. Send finals and thumbnails to the PM with `SendUserFile`, with each file's sha256. Say they are not in the PR | Files are already on the right machine |
| Git | Commit text only, push the branch. Open a PR when asked | Same |
| Log | Add rows (Sheets connector) or print rows for the PM to paste | Add rows yourself |

## 4. Procedure

### 4.1 Frame the job
- Read the request and any brief the PM attached (the Drive and chat files are the source). Note the su-pu ID, type (full replay, trailer, lesson), formats, level, and anything the PM already decided (voice, level, length).
- Open the production Sheet. If the work already has rows, build on the latest, do not restart.
- Level and story: the expert level and the solver's own title/notes decide wording. If the page says `unrated` but the PM states a level, use the PM's and record it in the README.

### 4.2 Source check
- Pull the data: `curl -sS https://justinzero.fly.dev/supu/<SUPU-ID> -o …`. Read the move history, trial branches, chapters and notes.
- Verify every statement the video will make (a contradiction, a "forced" move, a count of steps). Use the recorded events, and compute the logic from the board when you need to (for example peer elimination for a hidden single). Record verified and **not** verified in the video's `brief/`.
- If the recording does not support the planned story, change the story, not the recording. Tell the PM what you found and what you did instead.

### 4.3 Snapshot the replay page
- The renderer runs the real replay UI offline from a snapshot. Latest snapshot dir: `tools/supu-replay-pipeline/site3/` (`page_<last6>.html`, `data_<last6>.json`, plus css/js).
- For a new su-pu: fetch `https://orbacesudoku.com/su-pu/<SUPU-ID>` and the data API into `site3/` as `page_<last6>.html` and `data_<last6>.json`. If the page references newer `?v=` assets than `site3/` holds, refresh them from the live site.
- Run with `SITE=site3` so `serve2.js` uses it.

### 4.4 Capture
Phone layout 390 px wide and desktop 1280 px wide, each rendered from its own capture:

```
export CHROME=…  SITE=site3
node cap2.js 390 844 7 hd/v7 <SUPU-ID> <N> -1     # 9:16, phone layout, dpr 6 or 7
node cap2.js 1280 900 4 hd/w <SUPU-ID> <N> -1     # 16:9 and 1:1, desktop layout, dpr 4
```

Captures are large and git-ignored. They are rebuildable, so never copy them into the repo.

### 4.5 Plan
- Full replay: `python3 full_sched3.py <SUPU-ID>` writes `full/sched_<last6>.json` (standard pacing, callouts from the solver's notes and recorded trial events).
- Story trailer: copy the latest `trailer3/plan_<id>_*.py`, edit it, and run it. The plan is data (steps and times, band text, captions, voice slots, music envelope, optional `dehighlight` and `pulses`). A review change is normally a plan change plus a re-render, not new code.
- Reformatting an existing trailer (a new aspect ratio): port its timeline unchanged (see `trailer3/render_v6_square.py`) and copy the existing audio track with `-c:a copy` so every format has identical sound.
- Every callout must trace to a recorded note, event or chapter label.

### 4.6 Voice and audio
- Written script lives in `script/narration.txt`; the recording sheet in `script/vo-recording-sheet.md` lists each line, its start and its slot.
- The PM supplies the voice (the "Generic" voice is the house voice for trailers). A file can be one continuous take or one file per line. Cut at the silences and place each line on its cue; use forced alignment (`align.py` method with pocketsphinx) for timing. **Do not stretch words.** Adjust pauses and footage instead.
- A scratch voice is for timing review only and must be labelled as such.
- Music is sparse; duck under voice; a short quiet beat before a reveal; no stingers, no victory fanfare. Full-replay audio is tones only (no voice).
- Loudness about −14 LUFS (an existing track you reuse keeps its level, for example the published V6 audio at −15.4).

### 4.7 Render and encode
- Full replay: `FACT="125 steps · …" SUPU=<ID> python3 render_hd3.py 169|916`, then `thumbs3.py`.
- Story trailer: `FORMAT=916|169|11 K=2 python3 trailer3/render_final.py <plan.json>` (K=1 for a quick 1080p review, K=2 for 4K masters), with `trailer3/audio_trailer2.py <plan> <voice.mp3> <out.wav>`.
- Encode: `ffmpeg … -c:v libx264 -profile:v high -crf 14 [-tune stillimage] -pix_fmt yuv420p -r 30 -c:a aac -b:a 256k -af loudnorm=I=-14:TP=-1.5 -movflags +faststart`.
- If the replay UI leaves a distracting artifact (for example gold "cleared" outlines), fix it as an **editorial** edit: restore those pixels from earlier frames (`trailer3/make_quiet.py`), never change a digit, candidate, colour or marker, and disclose it to the PM.
- Editorial overlays (a pulse, an outline) must look different from the app's own styling and keep one meaning: red dashed marks a contradiction, green marks a confirmed correct move.

### 4.8 Thumbnails, captions, copy
- Thumbnails come from a **real replay frame** (never AI art), unsolved, with the headline only: 1280×720, 1080×1920, 1080×1080 (`trailer3/thumbs_trailer.py`, `thumbs3.py`).
- `renders/final/<SUPU-ID>_<type>.en.srt` carries every spoken line (or the callouts, for silent full replays).
- `publishing/youtube-copy.md`: title plus two alternates, a description with the UTM-tagged su-pu link first (chapters over one minute), hashtags, a pinned comment, one set per format. Say only what the video shows.

### 4.9 QA before anything goes to the PM
Technical, on the **encoded** file:
- dimensions, 30 fps, duration, audio present; loudness near −14 LUFS;
- frames at the key moments (hook, reveal, return, CTA, end card);
- 16:9 end card QR decodes at full and half size (`cv2.QRCodeDetectorAruco` at full size; the basic detector can miss on a very large frame);
- trailers never show the solved board; the silence or quiet beat is where the plan says.

Content: the acceptance test in the brief, every claim traced to a recorded event, nothing on screen that is not in the replay. Say plainly what you did **not** check (for example "not watched on a phone").

### 4.10 Review loop with the PM
- Put each iteration in a new `renders/vN/`. Send it with `SendUserFile`, stating name, length, sha256, and a short list of what changed since the last version.
- PM feedback usually changes the plan, not the pipeline. Make only the changes asked for ("do not touch the others"), re-check what could be affected, and keep the older version's row (status `superseded`).
- On approval, render the finals (all required formats, 4K) into `renders/final/` with standard names: `<SUPU-ID>_<full|lesson|trailer>_<169|916|11>_<4k|1080p>.mp4`.

### 4.11 Hand off
1. Commit text only: plan, scripts, captions, copy, thumbnails, README (with each final's size, length and sha256), `REORGANIZATION-MAP.md` entry. Branch name `video/<SUPU-ID>-<what>`.
2. Push the branch. Open a PR only when the PM asks; the PR carries everything except the videos.
3. Send finals and thumbnails in chat (`SendUserFile`), with sha256 values.
4. Add the production log rows (section 5).
5. Stop. The PM downloads, saves to `renders/final/`, merges, uploads, and logs the upload.

## 5. Keeping the logs current

| Log | Records | Who writes | When |
| --- | --- | --- | --- |
| **Production log** (shared Google Sheet) | every render: version, size, length, sha256, status, where made, branch or PR | the agent that made it; the PM updates status and YouTube ID | same session as the render |
| `publishing/publish-log.csv` | every upload or post | the PM (`tools/scripts/log-publish.py`) | at upload |
| `docs/REORGANIZATION-MAP.md` | moves, renames, new folders, process changes | the agent | same commit |
| the video's `README.md` | story, finals table with sha256, lineage | the agent | same commit |

### Adding a production-log row
Run on the machine that has the file:

```
python3 tools/scripts/production-log.py row <file> \
  --work "Story trailer: Stuck? Try One Path." --version v3 --status "ready for review" \
  --made-in cloud --branch video/SP-20260930-610092-trailer-v1 --notes "what changed"
```

It measures size, resolution, length and sha256 and prints one tab-separated row in the Sheet's column order.

- **Cloud, Google Sheets connector available:** append the row at the bottom of the Sheet. Read the Sheet first, do not edit other rows, and read it back after.
- **Cloud, no Sheets connector (Drive only):** Drive can create but not edit a sheet. Print the rows in your final message in a code block, under "Production log rows to paste", so the PM can paste them.
- **Local:** paste the row into the Sheet yourself.

Statuses: `draft`, `ready for review`, `approved`, `final`, `superseded`. Never delete a row; supersede it. Each superseded iteration, final and format is its own row. "Made in" is `cloud` or `local`.

### Checking the log against reality
On the machine that holds the videos, download the Sheet as CSV and run:

```
python3 tools/scripts/production-log.py check <sheet-export.csv>
```

It lists renders not logged, logged files missing here, and hash mismatches. `production-log.py scan --csv` rebuilds a row for every local render, which is how a local-only backlog is caught up. Run it before closing a local session and when the PM asks "what do we have".

## 6. Troubleshooting from past sessions

| Symptom | Cause and fix |
| --- | --- |
| `git push` fails with a 403 from `lfs.github.com` | The commit contains a video. Do not retry or work around it. Unstage the video (`git reset -q -- <file>`), keep it in the git-ignored folder, and push again. |
| Playwright: "Executable doesn't exist" | Set `CHROME` to the installed Chromium (`ls /opt/pw-browsers`). The scripts read it. |
| A wait loop never ends (`pgrep -f …`) | The pattern matches its own shell. Wait on a log line or output file instead. |
| `box offset can't be negative` while rendering | The crop runs off the capture's left or top edge; increase the padding constant in the renderer. |
| Gold outlines or other app artifacts clutter a frame | Use `make_quiet.py` (editorial, disclosed). |
| A shell heredoc loses backticks in Python text | Use a quoted heredoc (`<<'EOF'`) or write the file with the Write tool. |
| A QR scan fails on a 4K frame | Test with `cv2.QRCodeDetectorAruco`, and also at half size. |
| Stop hook: uncommitted or untracked files | Commit text changes; add scratch folders (`out/`, `shots/`, `hd/`) to `.gitignore`; never commit videos. |

## 7. End-of-session checklist

- [ ] Facts checked against the su-pu data; verified and unverified listed in the brief or README
- [ ] Every required format rendered from its own capture; QA done on the encoded files
- [ ] Finals named to the standard, in `renders/final/`, **not** in Git
- [ ] Captions, thumbnails and YouTube copy written for each format
- [ ] README updated (finals table with size, length, sha256; what changed)
- [ ] `REORGANIZATION-MAP.md` entry added
- [ ] Text committed and branch pushed; no video staged
- [ ] Finals and thumbnails sent to the PM in chat with sha256 (cloud)
- [ ] Production log rows added or printed for the PM
- [ ] Final message says: what was made, what was checked, what was not, where the files are, what the PM must do next

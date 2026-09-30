Below is the operating procedure I would use for **V1 — Rewind Your Solve**. It separates responsibilities so Codex does not improvise product behavior, the human PM owns creative truth and approvals, and supporting systems only do the work they are best suited for. The workflow stays consistent with the production package and the original rule that real Orbace UI is the source of truth. orbace_video_creative_plan_revised.mdMD  
  
## Orbace Sudoku V1 Video — Step-by-Step Production Runbook  
**Asset:** V1 — Rewind Your Solve **Target length:** 12 seconds **Primary format:** 9:16 vertical **Delivery:** 1080 × 1920 MP4 **Purpose:** Produce the first complete, reviewable Orbace launch video using real product capture and a reproducible Codex editing pipeline.  
  
## 1. Roles  
## Human PM / Product Owner  
Owns:  
* creative intent;  
* product correctness;  
* canonical solve selection;  
* shot approval;  
* copy approval;  
* final visual judgment;  
* final release approval.  
The PM does **not** need to perform detailed editing.  
The PM's job is to decide:  
Is this showing the right product behavior, clearly and truthfully?  
  
## Codex  
Owns:  
* project/repository setup;  
* ingesting supplied footage;  
* technical inspection;  
* trimming and sequencing;  
* speed changes;  
* crops and zooms;  
* text overlays;  
* transitions;  
* audio placement;  
* audio normalization;  
* rendering;  
* derivative exports;  
* automated QC;  
* revision tracking.  
Codex should execute the approved specification.  
Codex must **not invent product behavior**.  
  
## Orbace Mobile / Product System  
Used to:  
* generate the real solve;  
* create the Su-Pu;  
* replay the solve;  
* provide real UI footage.  
The product itself is the visual source of truth.  
  
## Screen Capture System  
Preferred:  
**Native iPhone/iPad screen recording**  
Optional desktop ingest through:  
**QuickTime Player**  
Capture should be 60 fps where available.  
  
## Editing / Rendering System  
Recommended:  
**FFmpeg**  
plus:  
**Remotion or another programmatic composition layer if needed for typography and motion**  
Optional:  
**DaVinci Resolve** for manual review or final finishing.  
The first version should be reproducible from scripts rather than dependent on a manual timeline.  
  
## Audio System  
Sources may include:  
* custom SFX;  
* licensed SFX;  
* original sound design;  
* licensed music.  
V1 does not require voiceover.  
  
## 2. Definition of Done  
V1 is complete when there is a single rendered video that:  
* is exactly approximately 12 seconds;  
* uses real Orbace Replay footage;  
* clearly communicates that a finished solve can be replayed;  
* contains a visible turning point;  
* contains correct Orbace UI;  
* contains no test identities or debug content;  
* uses approved Orbace typography;  
* works with sound off;  
* has acceptable audio;  
* exports correctly at 1080 × 1920;  
* passes product, creative and technical review.  
Expected first delivery:  
```
ORB_V1_REPLAY_MASTER_9x16_v01.mp4

```
  
## 3. Step 1 — PM selects the canonical solve  
**Owner:** Human PM **System:** Orbace app  
Do not begin editing before this step is complete.  
The PM should review several completed Su-Pu records.  
Choose one solve with:  
* Hard difficulty preferred;  
* approximately 45–70 total steps;  
* visible candidate notes;  
* a clear logical turning point;  
* at least 2–4 obvious moves following the turning point;  
* no visually confusing chain;  
* no test/debug identity.  
The turning point must be understandable visually.  
Good example:  
```
Step 24
Candidate pair still unresolved

Step 25
One candidate eliminated

Step 26
Only one value remains

Step 27
Digit placed

Step 28–30
Several placements become available

```
Bad example:  
```
Step 24
Grid changes

Step 25
Several notes disappear

Step 26
Unclear why

Step 27
Suddenly four cells are filled

```
The video depends on the viewer being able to see causality.  
  
## 4. Step 2 — PM records canonical solve metadata  
Create a small production note.  
Example:  
```
Canonical Su-Pu ID:
SUPU-DEMO-001

Difficulty:
Hard · 精深

Total steps:
52

Turning point:
Step 24

Key sequence:
24 → 25 → 26 → 27 → 28

Important 3×3 box:
Middle-right

Reason:
Candidate pair resolves and opens three subsequent placements.

```
This becomes Codex's reference.  
Do not tell Codex simply:  
Find an interesting point.  
Give it the approved turning point.  
  
## 5. Step 3 — Prepare clean device state  
**Owner:** PM / Mobile team  
Before recording:  
* enable Do Not Disturb;  
* remove notifications;  
* disable low-battery state;  
* remove VPN indicators if possible;  
* ensure normal signal/network state;  
* use production-quality account;  
* verify no admin/test name;  
* verify no debug overlay;  
* verify correct Orbace branding;  
* verify current Replay UI;  
* verify current terminology.  
Open the selected Su-Pu.  
Navigate to the Replay screen.  
  
## 6. Step 4 — Capture the raw Replay sequence  
**Owner:** PM or Mobile team **System:** native screen recorder  
Do not attempt to capture the final 12-second edit.  
Capture a long, clean source.  
Recommended raw capture:  
## Take A  
1. Start recording.  
2. Hold completed grid for 2 seconds.  
3. Tap Back three times slowly.  
4. Continue Back repeatedly until approximately Step 20.  
5. Pause for 2 seconds.  
6. Move forward one step at a time through Step 30.  
7. Pause.  
8. Move forward to completed grid.  
9. Hold full Replay UI for 3 seconds.  
10. Stop recording.  
Target raw duration:  
**30–60 seconds**  
  
## 7. Step 5 — Record multiple takes  
Capture at least:  
```
replay_take_01.mov
replay_take_02.mov
replay_take_03.mov

```
Why:  
* one take may have awkward tapping;  
* one may contain UI hesitation;  
* one may produce clearer animation timing.  
Do not overwrite earlier takes.  
  
## 8. Step 6 — Transfer footage to production workspace  
Create:  
```
orbace-video/
    assets/
        captures/
            replay_take_01.mov
            replay_take_02.mov
            replay_take_03.mov

```
Also include:  
```
canonical_solve.txt

```
containing the metadata from Step 2.  
  
## 9. Step 7 — Give Codex the production brief  
**Owner:** PM  
Use an instruction similar to:  
Build Orbace V1 — Rewind Your Solve from the supplied Replay captures.  
Use only real supplied Orbace footage.  
Do not fabricate UI, scores, moves, candidate notes or Replay states.  
Canonical turning point is Step 24.  
Create a reproducible editing pipeline using FFmpeg and/or Remotion.  
Produce a first 1080×1920, 30 fps, approximately 12-second MP4.  
Follow the supplied timecode structure exactly.  
If required footage is missing, report the missing shot instead of inventing it.  
Then give Codex the exact sequence below.  
  
## 10. Step 8 — Codex inspects source footage  
**Owner:** Codex  
Codex should first generate a technical report.  
It should inspect:  
* resolution;  
* orientation;  
* frame rate;  
* codec;  
* audio presence;  
* duration;  
* exact locations of Replay steps;  
* whether Step 24 is visible;  
* whether candidate notes are legible.  
Codex should return something like:  
```
Take 01
Resolution: 1179×2556
FPS: 60
Duration: 41.8 sec

Completed state begins: 00:02.1
Three-back sequence: 00:05.4–00:07.0
Step 24 reached: 00:12.8
Forward sequence Step 24–28: 00:18.2–00:22.9
Full replay hero: 00:35.0–00:38.5

```
If Codex cannot find a required shot, stop that part of the edit and report it.  
  
## 11. Step 9 — Codex selects the best take  
Codex may recommend the technically cleanest take.  
The PM makes the final choice.  
Criteria:  
1. candidate notes visible;  
2. smooth interaction;  
3. no accidental touch;  
4. correct turning point;  
5. clean UI;  
6. best legibility.  
Output:  
```
SELECTED_SOURCE=replay_take_02.mov

```
  
## 12. Step 10 — Codex creates project structure  
Codex should create:  
```
orbace-video/
├── assets/
│   ├── captures/
│   ├── audio/
│   ├── brand/
│   └── fonts_reference/
├── config/
│   └── v1.json
├── scripts/
│   ├── inspect.sh
│   ├── render-v1.sh
│   └── qc-v1.sh
├── src/
│   └── v1/
├── exports/
└── README.md

```
Do not include distributable font files unless licensing explicitly permits it.  
Use installed/system fonts or documented brand fonts already available in the production environment.  
  
## 13. Step 11 — Codex creates the timing configuration  
Recommended configuration:  
```
00:00.000–00:00.700
Completed solve

00:00.700–00:02.000
Three backward moves

00:02.000–00:04.300
Accelerated rewind

00:04.300–00:05.000
Step 24 hold

00:05.000–00:07.800
Turning-point sequence

00:07.800–00:09.300
Consequential moves

00:09.300–00:10.500
Full Replay UI

00:10.500–00:12.000
Orbace end card

```
The config should be editable without rewriting the rendering code.  
  
## 14. Step 12 — Build Shot 1  
## 00:00–00:00.70  
Start on completed grid.  
No text.  
No zoom.  
Viewer needs enough time to register:  
Completed Sudoku.  
Audio:  
quiet room-tone equivalent or silence.  
  
## 15. Step 13 — Build Shot 2  
## 00:00.70–00:02.00  
Show three real backward moves.  
Overlay appears:  
**Your solve doesn't disappear.**  
Text should enter subtly.  
Recommended animation:  
* 6–10 frame fade;  
* approximately 8 px vertical movement;  
* no bounce.  
Use a safe upper area.  
Do not cover the grid or step counter.  
  
## 16. Step 14 — Build Shot 3  
## 00:02.00–00:04.30  
Accelerate rewind.  
Target visual impression:  
```
49
↓
41
↓
34
↓
27
↓
24

```
Exact visible numbers do not have to match these perfectly as long as the actual Replay footage reaches Step 24.  
Overlay changes to:  
**Rewind every move.**  
Speed target:  
approximately 4–6× source.  
Do not use an exaggerated social-media speed ramp.  
  
## 17. Step 15 — Build Shot 4  
## 00:04.30–00:05.00  
Stop at:  
**Step 24**  
Hold.  
Create a subtle digital crop:  
**100% → approximately 115%**  
over approximately 8–10 frames.  
Focus on the relevant 3×3 region.  
No text.  
This pause is intentional.  
  
## 18. Step 16 — Build Shot 5  
## 00:05.00–00:07.80  
Advance through the approved turning-point steps.  
Normal or near-normal playback.  
Overlay:  
**Find the move that opened the grid.**  
Do not speed through this section.  
The viewer must be able to see:  
```
candidate change
→ elimination
→ placement
→ consequence

```
This is the hero moment of the entire V1 asset.  
  
## 19. Step 17 — Build Shot 6  
## 00:07.80–00:09.30  
Continue 2–3 consequential moves.  
Gradually return crop:  
**115% → 100%**  
Remove the previous overlay before the next hero copy.  
  
## 20. Step 18 — Build Shot 7  
## 00:09.30–00:10.50  
Show full Replay interface.  
Important visible elements:  
* Sudoku;  
* Replay controls;  
* step count;  
* Move History where available.  
Overlay:  
**Every solve becomes a record.**  
This is the product proposition.  
  
## 21. Step 19 — Build end card  
## 00:10.50–00:12.00  
Do not cut to an unrelated generic black screen.  
Preferred:  
retain the Replay frame softly in the background or move to an Orbace paper surface.  
Show:  
**Orbace Sudoku**  
Secondary:  
**Replay your solve.**  
If store badge is required for placement, include approved badge.  
Otherwise leave it out of the first creative master.  
  
## 22. Step 20 — Add sound design  
Codex should build a temporary SFX track if approved assets are supplied.  
Recommended cues:  
## Back moves  
Three soft paper/pencil-like taps.  
## Rewind  
Very subtle reverse texture.  
## Step 24 stop  
Reverse sound ends.  
Brief reduction in sound.  
## Turning point  
Soft tick per move.  
Slightly warmer note on decisive placement.  
## Consequence  
One resolving tone.  
## End card  
Short Orbace resolve.  
Avoid:  
* arcade clicks;  
* whooshes;  
* game-show sounds;  
* achievement chimes;  
* ticking clock.  
V1 must still work perfectly muted.  
  
## 23. Step 21 — Audio mastering  
Target:  
**Integrated loudness:** about -14 LUFS  
**True peak:** no higher than -1 dBTP  
Codex should normalize final social audio.  
Do not compress so heavily that delicate sounds become aggressive.  
  
## 24. Step 22 — First render  
Codex outputs:  
```
exports/
ORB_V1_REPLAY_9x16_v01.mp4

```
Specification:  
* 1080 × 1920;  
* 30 fps;  
* H.264 High Profile;  
* Rec.709;  
* AAC 48 kHz;  
* approximately 15–25 Mbps.  
Also output a high-quality archive/master if practical.  
  
## 25. Step 23 — Codex creates contact sheet  
For PM review, Codex should also produce representative stills at:  
```
00:00.5
00:01.5
00:03.2
00:04.7
00:06.2
00:08.3
00:09.8
00:11.2

```
This lets PM quickly assess:  
* crop;  
* text;  
* UI obstruction;  
* typography;  
* turning-point clarity.  
  
## 26. Step 24 — Automated QC  
Codex runs checks for:  
* exact duration;  
* correct resolution;  
* correct frame rate;  
* audio stream exists if expected;  
* no black frames;  
* no unintended blank frames;  
* safe text margins;  
* valid codec;  
* no clipping above -1 dBTP.  
Generate:  
```
V1_QC_REPORT.md

```
Example:  
```
Duration: PASS — 12.00s
Resolution: PASS — 1080×1920
FPS: PASS — 30
Audio: PASS
Peak: PASS
Black frame test: PASS
Encoding: PASS

```
  
## 27. Step 25 — PM first review  
The PM watches the video:  
## First time  
With sound.  
## Second time  
Muted.  
## Third time  
Without pausing.  
Ask:  
What would someone understand if they had never seen Orbace?  
Pass condition:  
They understand that Orbace records and replays the solve.  
  
## 28. Step 26 — Product correctness review  
Check frame by frame for:  
* real Replay data;  
* correct step number;  
* correct candidate notes;  
* no fake UI;  
* no obsolete terminology;  
* no test data;  
* correct Orbace seal/logo;  
* correct visual tokens.  
If any product UI is wrong:  
**recapture the product.**  
Do not Photoshop the UI into correctness unless it is a harmless presentation issue like masking a system status item.  
  
## 29. Step 27 — Creative review  
Ask:  
## Hook  
Do the first 2 seconds clearly create curiosity?  
## Replay  
Does the rewind visibly look like undoing a real solve?  
## Turning point  
Can I understand that something meaningful changed?  
## Copy  
Can I read every overlay once at normal speed?  
## Brand  
Does it feel calm, intelligent and distinctive?  
## End card  
Do I remember Orbace?  
  
## 30. Step 28 — PM sends revision notes  
Do not send vague feedback such as:  
Make it more premium.  
Use exact notes.  
Example:  
```
V1 revision notes:

1. 00:00.70
Move overlay 70 px higher.

2. 00:02.00–00:04.30
Rewind is too fast. Reduce from 6× to 4.5×.

3. 00:04.30
Hold Step 24 for +0.15 sec.

4. 00:05.20
Turning-point text appears too early.
Delay until candidate pair is visible.

5. 00:10.50
Keep Replay visible behind end card at 25% opacity.

```
Codex should implement those instructions exactly.  
  
## 31. Step 29 — Codex renders V02  
Output:  
```
ORB_V1_REPLAY_9x16_v02.mp4

```
Do not overwrite V01.  
Also update:  
```
CHANGELOG.md

```
Example:  
```
V02
- Reduced rewind speed
- Extended Step 24 hold
- Raised opening overlay
- Delayed turning-point copy
- Adjusted end-card background

```
  
## 32. Step 30 — PM comprehension test  
Show the video to approximately 5 people who are not involved in building it.  
Do not explain Orbace first.  
Ask:  
**What does this app do that seemed different?**  
Record the answer.  
Desired unaided responses:  
* “It records your solve.”  
* “You can replay how you solved.”  
* “You can go back through your Sudoku.”  
* “It shows the steps you took.”  
Poor responses:  
* “It's a Sudoku app.”  
* “It has undo.”  
* “It teaches Sudoku.”  
* “It looked nice.”  
If most viewers interpret Replay as ordinary Undo, the creative needs revision.  
  
## 33. Step 31 — Distinguish Replay from Undo  
If comprehension testing reveals confusion with Undo, adjust the edit.  
Possible improvements:  
* make Step 24 of 52 more visible;  
* show completed puzzle before rewind longer;  
* make Move History more visible;  
* emphasize transition from final state to earlier solve history;  
* retain: **Every solve becomes a record.**  
Do not solve this by adding a paragraph of explanation.  
The UI behavior should make the distinction visible.  
  
## 34. Step 32 — Final approval  
PM signs off on:  
```
PRODUCT: APPROVED
CREATIVE: APPROVED
COPY: APPROVED
AUDIO: APPROVED
TECHNICAL QC: APPROVED

```
Then Codex creates:  
```
ORB_V1_REPLAY_MASTER_9x16_v1.0.mp4

```
This is the first release master.  
  
## 35. Step 33 — Generate derivatives  
After the master is approved, Codex creates derivatives.  
## 1:1  
```
ORB_V1_REPLAY_1x1_v1.0.mp4

```
1080 × 1080.  
Reframe manually through configuration.  
Do not simply center-crop if text or important grid areas are lost.  
  
## 16:9  
```
ORB_V1_REPLAY_16x9_v1.0.mp4

```
1920 × 1080.  
Use the same timing.  
Recompose text and UI.  
  
## 6-second cutdown  
Recommended story:  
```
0–1 sec
Completed solve

1–2.5 sec
Fast rewind

2.5–4.5 sec
Turning point

4.5–6 sec
Orbace

```
Copy:  
**Replay your solve.**  
  
## 36. Step 34 — Produce static creative  
Export:  
## Turning-point still  
Step 24 / candidate state.  
## Replay hero still  
Full Replay UI.  
Overlay candidate:  
**Every solve becomes a record.**  
These become:  
* social stills;  
* creator-kit imagery;  
* press imagery;  
* landing-page testing assets.  
  
## 37. Step 35 — Archive the pipeline  
Codex should document:  
```
README.md

```
with exact command such as:  
```
./scripts/render-v1.sh

```
and explain:  
* required files;  
* configuration;  
* render command;  
* output locations;  
* dependency versions.  
The goal is:  
Another Codex session should be able to reproduce V1 without reconstructing the edit from scratch.  
  
## 38. What Codex must never do  
Codex must never:  
* invent a missing Replay step;  
* fabricate candidate notes;  
* create fake Sudoku states;  
* simulate a Scorecard;  
* alter a puzzle to make the turning point clearer;  
* substitute generic app UI;  
* introduce ranking information;  
* add unapproved marketing claims;  
* expose test identities;  
* alter the meaning of a real product state.  
If the footage does not support the approved story:  
**Return to capture.**  
  
## 39. What the PM should not spend time doing  
The PM should not manually:  
* trim every frame;  
* calculate export settings;  
* create derivative resolutions;  
* normalize audio;  
* rebuild overlays for each format;  
* create contact sheets;  
* calculate loudness;  
* inspect codecs;  
* rename dozens of exports.  
Those should be automated.  
The human should spend time on the areas requiring judgment:  
* Which solve tells the story?  
* Is the turning point understandable?  
* Is the wording right?  
* Does the video represent the actual product?  
* Does the creative feel like Orbace?  
* Would a new user understand it?  
  
## 40. Minimum assets required to start  
Codex only needs:  
```
1. replay_take_01.mov
2. replay_take_02.mov
3. replay_take_03.mov
4. canonical_solve.txt
5. Orbace logo/seal asset
6. approved overlay copy

```
Optional for first version:  
```
7. SFX files
8. music

```
If audio assets are not ready, produce:  
**V1 picture-lock draft first.**  
Do not delay visual validation for music selection.  
  
## 41. Recommended first Codex milestone  
Do not ask for final master immediately.  
First request:  
**Produce a silent V1 picture-lock candidate using the real Replay footage, correct timing, crops and text overlays.**  
PM approves:  
1. storytelling;  
2. timing;  
3. turning point;  
4. copy;  
5. framing.  
Then add sound.  
This reduces rework.  
  
## 42. End-to-end responsibility map  

| Stage | PM | Codex | Orbace/App | Other System |
| -------------------- | -------------- | --------- | ---------- | ------------------ |
| Select solve | Own | — | Supports | — |
| Verify turning point | Own | Analyze | Source | — |
| Record footage | Direct/approve | — | Source | Screen recorder |
| Inspect footage | Review | Own | — | FFmpeg |
| Build edit | Approve | Own | — | FFmpeg/Remotion |
| Overlays | Approve | Implement | — | Composition engine |
| Sound | Approve | Assemble | — | SFX/music |
| Render | — | Own | — | FFmpeg |
| QC | Review | Own | — | FFmpeg/QC scripts |
| Creative approval | Own | Revise | — | — |
| Derivatives | Approve | Own | — | Render pipeline |
| Archive | — | Own | — | Git/repository |
  
## 43. First-version production sequence  
For the actual first attempt, keep it simple:  
**DAY/SESSION 1**  
1. PM selects canonical Su-Pu.  
2. PM identifies Step 24.  
3. Mobile captures three Replay takes.  
4. Assets go into repository.  
5. Codex inspects footage.  
6. PM approves source take.  
7. Codex creates silent 12-second edit.  
8. PM reviews picture lock.  
9. Codex makes one revision.  
10. PM approves picture.  
Then:  
1. Add sound.  
2. Normalize audio.  
3. Render V1.  
4. Run QC.  
5. Conduct comprehension test.  
6. Make final correction if needed.  
7. Freeze V1 v1.0.  
8. Generate derivatives.  
  
## 44. Success criterion  
The video succeeds if a new viewer can understand this without being told:  
  
**A finished Sudoku in Orbace becomes a replayable record of the solve.**  
Everything else—transitions, music, typography and polish—is secondary to that one outcome.  
The key process choice is to have Codex produce a **silent picture-lock first**, not a supposedly finished ad. That isolates the one difficult creative question: whether the real Replay footage actually communicates “recorded solve” rather than ordinary Undo. Once the PM approves that, sound, final typography, derivatives, and technical exports become relatively mechanical.  

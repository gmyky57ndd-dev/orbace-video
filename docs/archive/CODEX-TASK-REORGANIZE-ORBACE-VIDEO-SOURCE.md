# Codex Task: Reorganize orbace-video Into the Canonical Orbace Video Production Workspace  
Reorganize the existing Orbace video project located at:  
```
/Users/justinzero/orbacetech/DevProjects/orbace-sudoku/orbace-video

```
The goal is to turn this folder into the **single canonical workspace for all Orbace video planning, production, scripts, supporting assets, and rendered versions**.  
Do not redesign video content in this task. Focus on **inventory, structure, normalization, deduplication, naming, and documentation**.  
## 1. Core requirements  
Inspect the entire existing orbace-video folder before making structural changes.  
Preserve all meaningful source material, including:  
* production plans  
* scripts and narration  
* Codex instructions  
* shot lists  
* storyboard or scene specifications  
* screenshots and source images  
* manifests and metadata  
* HTML/source references  
* audio or voice assets  
* Remotion/video project files  
* rendered .mp4 versions  
* review notes  
* marketing creative  
* product/store videos  
* Journal lesson videos  
* reusable templates and workflows  
Do **not** permanently delete anything unless it is an obvious byte-for-byte duplicate and there is a clearly retained canonical copy.  
If uncertain, move obsolete or superseded material into an _archive folder rather than deleting it.  
## 2. Normalize the top-level structure  
Use this structure as the target unless inspection reveals a strong technical reason to adjust it:  
```
orbace-video/
├── README.md
├── docs/
│   ├── production-system/
│   ├── brand-and-style/
│   ├── voice-and-audio/
│   └── archive/
│
├── os-journal/
│   ├── README.md
│   ├── templates/
│   ├── shared-assets/
│   ├── lesson1/
│   ├── lesson7/
│   └── ...
│
├── marketing/
│   ├── brand/
│   ├── acquisition/
│   ├── social/
│   └── campaigns/
│
├── product/
│   ├── app-overview/
│   ├── competition/
│   ├── ranking/
│   ├── su-pu/
│   ├── journal-study/
│   └── store-assets/
│
├── shared-assets/
│   ├── logos/
│   ├── seals/
│   ├── fonts-reference/
│   ├── ui/
│   ├── audio/
│   └── music/
│
├── tools/
│   ├── remotion/
│   ├── scripts/
│   └── prompts/
│
└── _archive/

```
Do not create empty folders just to satisfy this diagram. Create folders only when there is content or an immediate documented use.  
## 3. Critical Journal requirement  
lesson1 and lesson7 must be peers under:  
```
orbace-video/os-journal/

```
For example:  
```
os-journal/
├── lesson1/
└── lesson7/

```
Do not place one lesson inside another, inside templates, or at a different hierarchy level.  
All future lessons should follow the same structure.  
Normalize each lesson toward this layout:  
```
lessonN/
├── README.md
├── source/
│   ├── screenshots/
│   ├── html/
│   └── metadata/
├── script/
│   ├── narration.md
│   ├── scenes.md
│   └── captions.md
├── production/
│   ├── remotion/
│   ├── prompts/
│   └── config/
├── review/
│   └── notes.md
└── renders/
    ├── v1/
    ├── v2/
    ├── v3/
    └── final/

```
Adapt this structure to actual files rather than fabricating missing assets.  
## 4. Lesson 7  
Lesson 7 is the current reference implementation for Journal video production.  
Preserve and organize all available Lesson 7 materials, especially the work associated with:  
**“When the Branch Holds”**  
Include, where present:  
* screenshots  
* lesson metadata/manifests  
* source HTML references  
* narration  
* scene timing  
* voice instructions  
* V1 render  
* V2 render  
* V3 instructions/render  
* final outro information  
* Orbace URLs  
* Orbace technique reference  
* IB-Tree / Inferential Binary Tree  
* review notes about voice tone  
* British/human voice direction  
* end-card requirements  
Keep V1, V2, V3, and later versions clearly distinguishable.  
Do not overwrite earlier renders.  
## 5. Lesson 1  
Normalize Lesson 1 to the same hierarchy and conventions as Lesson 7.  
The known external/source convention for Lesson 1 is:  
Lesson page:  
```
https://orbacesudoku.com/journal/two-homes-for-a-nine/journal-two-homes-for-a-nine

```
Original screenshot/source folder referenced during production planning:  
```
/Users/justinzero/orbacetech/DevProjects/os-journal/lesson1/cropped

```
If that path exists, inspect it and determine whether the assets should be copied or referenced from the canonical orbace-video/os-journal/lesson1/source/screenshots/ location.  
Do **not** destroy the original source folder.  
Prefer copying into the canonical video workspace if the assets are needed for reproducible video builds.  
Document the source location in Lesson 1's README.  
## 6. Journal reusable production system  
Any instruction or document that applies to **all Journal lessons** must not live inside lesson1 or lesson7.  
Move reusable material to:  
```
os-journal/templates/

```
or:  
```
docs/production-system/

```
as appropriate.  
This includes the previously developed concepts for:  
* Journal video template  
* lesson-name-as-parameter workflow  
* Codex production prompt  
* standard scene structure  
* narration structure  
* screenshot treatment  
* transitions  
* captions  
* voice direction  
* outro/end-card  
* URL treatment  
* technique-name treatment  
* render/export settings  
* quality-control checklist  
Create one clearly named canonical document such as:  
```
os-journal/templates/JOURNAL-VIDEO-PRODUCTION-TEMPLATE.md

```
if equivalent material currently exists under inconsistent names.  
Do not rewrite substantive requirements unnecessarily. Consolidate existing material while retaining important details.  
## 7. Marketing video organization  
Separate non-Journal marketing videos from product videos.  
Use marketing/ for content primarily intended for:  
* YouTube  
* social media  
* awareness  
* acquisition  
* launch campaigns  
* brand storytelling  
* promotional campaigns  
Examples include:  
* Orbace channel/video launch concepts  
* first YouTube video  
* acquisition creative  
* brand films  
* promotional shorts  
* campaign variants  
Group each discrete video/campaign into its own folder where enough material exists.  
Recommended structure:  
```
marketing/<video-or-campaign>/
├── brief/
├── script/
├── source/
├── production/
├── review/
└── renders/

```
## 8. Product video organization  
Use product/ for videos primarily explaining a product capability or supporting store/product presentation.  
Examples include:  
* Orbace Sudoku V1 overview  
* Orbace Sudoku V2 overview  
* competition  
* ranking  
* Ranking Points  
* Scorecard  
* Su-Pu  
* Journal/Study  
* Annual Competition Pass  
* Grand entry  
* App Store / Google Play video assets  
Keep Scorecard and Ranking Points as separate concepts if explanatory video materials exist for both.  
Do not merge their scripts simply because both relate to competition.  
## 9. Versioning  
Use explicit versions for iterative production.  
Preferred convention:  
```
v1
v2
v3
...
final

```
For rendered files, use descriptive names such as:  
```
orbace-journal-lesson07-when-the-branch-holds-v1.mp4
orbace-journal-lesson07-when-the-branch-holds-v2.mp4
orbace-journal-lesson07-when-the-branch-holds-v3.mp4

```
Do not rename files if doing so would break code references without updating those references.  
If files are renamed, update all internal references.  
Avoid ambiguous names such as:  
```
final-final.mp4
new.mp4
test2.mp4
latest-real.mp4

```
## 10. Preserve traceability  
For every significant move or rename, maintain traceability.  
Create:  
```
docs/REORGANIZATION-MAP.md

```
Document:  
```
old path -> new path

```
for significant files and directories.  
Also flag:  
* duplicates  
* superseded material  
* broken references  
* external source dependencies  
* missing assets  
* unclear ownership  
* obsolete renders  
* folders intentionally left unchanged  
## 11. Root README  
Create or update:  
```
orbace-video/README.md

```
The README should explain:  
1. purpose of the repository/folder  
2. canonical directory structure  
3. difference between:  
    * Journal videos  
    * marketing videos  
    * product videos  
    * shared assets  
    * production system  
4. how to start a new Journal lesson  
5. how to version renders  
6. where reusable templates live  
7. where source assets live  
8. where final renders live  
9. naming conventions  
10. archive policy  
Keep it practical for a human PM and Codex agent.  
## 12. Per-video README  
Where a video project has multiple scripts, source files, versions, or production assets, add a small README.md.  
It should identify:  
* video purpose  
* current status  
* source material  
* current canonical script  
* current render  
* prior versions  
* dependencies  
* important production decisions  
Do not create long documentation for trivial folders.  
## 13. Detect duplicates intelligently  
Use hashes where appropriate to identify exact duplicates.  
Categorize duplicate-looking files as:  
* exact duplicate  
* previous version  
* derived output  
* alternate asset  
* unknown  
Only automatically remove an exact duplicate when:  
1. hashes match,  
2. the canonical retained file is obvious, and  
3. no build process depends on the old path.  
Otherwise preserve or archive it.  
## 14. Fix internal references  
After moving files, search the repository for references to old paths.  
Update references in:  
* Markdown  
* JSON  
* TypeScript/JavaScript  
* Remotion  
* shell scripts  
* configuration  
* manifests  
* prompts  
* READMEs  
Do not leave the reorganized project with known broken relative paths.  
## 15. Do not touch unrelated Orbace repositories  
Scope the reorganization primarily to:  
```
/Users/justinzero/orbacetech/DevProjects/orbace-sudoku/orbace-video

```
You may inspect referenced external paths such as the Lesson 1 screenshot folder, but do not reorganize or delete unrelated repositories.  
If external material should become part of the canonical video workspace, **copy it** and document its origin unless there is a clear reason not to.  
## 16. Git safety  
Before modifying:  
```
git status

```
Determine whether orbace-video is inside a Git repository.  
Do not discard uncommitted work.  
Do not use destructive commands such as:  
```
git reset --hard
git clean -fd
rm -rf

```
unless specifically authorized.  
Prefer git mv for tracked files where practical.  
## 17. Validation  
After reorganization, verify:  
* Lesson 1 and Lesson 7 are sibling directories.  
* Journal templates are outside individual lesson folders.  
* Marketing and product videos are separated.  
* rendered versions remain available.  
* source screenshots and metadata remain available.  
* scripts are not accidentally lost.  
* internal file references resolve.  
* no meaningful source file disappeared.  
* Git shows expected moves/additions rather than unexplained deletions.  
* existing Remotion/video build code still has resolvable dependencies.  
If practical, run relevant local checks/builds for the video project.  
Do not make unrelated application-code changes.  
## 18. Final report  
When complete, report:  
## Structure created  
Show the resulting directory tree, approximately 3–4 levels deep.  
## Files reorganized  
Summarize major moves.  
## Journal normalization  
Explicitly confirm:  
```
os-journal/lesson1
os-journal/lesson7

```
are peers.  
## Canonical documents  
List the main reusable production/template documents.  
## Video versions preserved  
Identify V1/V2/V3/final renders found and their new locations.  
## External dependencies  
List source assets that remain outside orbace-video.  
## Duplicates/archive  
Explain what was archived or deduplicated.  
## Issues  
Identify missing files, ambiguous materials, broken dependencies, or follow-up work.  
## Git status  
Show the resulting git status --short.  
Do not stop after merely proposing a structure. **Perform the reorganization, repair references, validate it, and provide the completion report.**  

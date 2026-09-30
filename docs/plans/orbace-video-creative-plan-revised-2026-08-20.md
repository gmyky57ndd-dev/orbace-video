# Orbace Sudoku v2 — Video and Creative Plan (Revised)

Replaces §6 of the Launch Implementation Plan
Prepared August 20, 2026 · Reflects Scoring v2, the shareable Scorecard, and the NA public beta

---

## 6.0 What changed and why

Three revisions from the original plan:

**The generated-footage hero is gone.** Both original videos treated AI-generated film as the hero and real UI as a post-production composite — correct when there was no shippable interface. There is now. The replay screen and the Scorecard are the two things no competitor has, and both are screen recordings.

**Ranking is a hook, not a demo.** During beta, fields are small and par thresholds are still calibrating. Showing a leaderboard in a launch video creates an expectation the product can't yet meet, and a five-person board on screen is worse than no board at all. **No video in this set shows a leaderboard.** Competition is teased, never demonstrated, until the Weekly Cup clears 50 entrants twice.

**Three assets, not two.** Replay and Scorecard are separate stories and both are proprietary. The brand film ties them together.

| # | Asset | Length | Source | Job |
|---|---|---|---|---|
| **V1** | Replay — "Step 24 of 52" | 12s vertical | 100% screen record | The hook. Nobody else has this. |
| **V2** | Scorecard — "How You Solved It" | 15s vertical | 100% screen record | The payoff. Plus the ranking hook. |
| **V3** | Brand film — "Every Solve Has a Story" | 30s landscape | Mixed | The context. Press, creators, partners. |

V1 and V2 are the working ads. V3 is the calling card.

---

## 6.1 V1 — "Step 24 of 52" (Replay)

| | |
|---|---|
| **Purpose** | Stop the scroll. Establish the one thing no other Sudoku app can show. |
| **Format** | 12s, vertical 9:16, 1080×1920. Cut 1:1 and 16:9 from the same master. |
| **Source** | 100% screen recording. iPad or iPhone replay screen, portrait. No generative model. |
| **Audience** | Cold prospecting; CtC/SudokuPad-adjacent enthusiasts |

### Shot sequence

| Time | Action | Overlay |
|---|---|---|
| 0–2s | Open on a **completed** grid, static. Then the first tap of Back — one cell empties. | `Every solve becomes a record.` |
| 2–5s | Rapid Back-scrub, ~30 steps in three seconds. Grid visibly unsolves. Step counter runs down. | — |
| 5–9s | Forward at ~2 steps/sec through the turning point. A candidate pair resolves; three cells fall in sequence. Hold half a beat on the resolution. | `Watch the move that opened the grid.` |
| 9–12s | Pull back to show the full replay UI — Step counter, Back/Next, Move History. Static hero frame. | `Orbace Sudoku` + store badge |

### Production notes

- **Choose the puzzle for the turning point.** The whole video is one moment: the cascade where a pair resolves and the grid gives way. Scrub several Su-Pu records and pick the most legible one. A Hard-tier solve with visible candidate notes reads better than a Beginner solve.
- **Candidate notes must be visible.** They're what makes the replay read as *reasoning* rather than *animation*.
- **Do not speed-ramp past the turning point.** The temptation is to make it snappy; the value is in watching it happen.
- **Clean device state:** full battery, no SOS, seeded demo account, no `admin`/`appreview`/`TestPlayer` anywhere on screen.
- **Sound:** room tone, one soft digital tap per move, a single resolving tone at the turning point. Must work sound-off — captions burned in.

### First-frame test

Two variants, identical after 2s:
- **A:** `Every solve becomes a record.`
- **B:** `Chess players keep their games. Now you can too.`

B is the stronger sentence but requires a beat of comprehension. A is more literal. Test on landing→install.

---

## 6.2 V2 — "How You Solved It" (Scorecard) — new

| | |
|---|---|
| **Purpose** | Show that the record has structure, and that it's yours to keep and share. Plant the ranking hook. |
| **Format** | 15s, vertical 9:16, 1080×1920 |
| **Source** | 100% screen recording |
| **Audience** | Retargeting, creator collab pieces, mid-funnel |

### Why this deserves its own asset

The Scorecard is the second thing no competitor ships. It's visually distinctive (the 入門 seal, the bilingual tags, 数谱), it works with zero other players on the board, and the breakdown is inherently interesting to the audience that cares about technique. It's also already shareable — which makes it the natural share unit for a product with small fields.

And the ranking hook is already in the UI: the card carries a **`Not ranked · 非名谱`** badge. That badge does the teasing for you. It implies ranked play exists without showing a leaderboard you can't yet fill.

### Shot sequence

| Time | Action | Overlay |
|---|---|---|
| 0–3s | Solve completes. The Scorecard slides up. Hold on the large score and the 入門 seal. | `Finish a puzzle. Get the receipt.` |
| 3–6s | Scroll to the stats block — Time, Mistakes, Hints, **Steps**. Let Steps land. | `Time. Mistakes. Every step.` |
| 6–10s | Score Breakdown reveals line by line: Base → Accuracy ×0.85 → Time bonus → Efficiency bonus → Clean solve bonus. | `Scored on how you got there.` |
| 10–13s | Cursor moves to the **`Not ranked · 非名谱`** badge. Hold on it. | `Some solves count for more.` |
| 13–15s | Share sheet lifts. Static hero frame. | `Orbace Sudoku` + store badge |

### Production notes

- **Pick a solve with a non-trivial breakdown.** The screenshot example — 900, accuracy ×0.85 from one error, efficiency +50, clean bonus +0 — is *better* than a perfect score. A flawless card teaches nothing; a card with a visible penalty and a visible bonus shows the system has opinions.
- **The `Not ranked` badge is the hook and it must be legible.** Consider a brief scale-up on it. This is the only competition reference in the asset and it does all the work.
- **Do not show the "How Score Was Calculated" block.** It's excellent in-app and far too dense for 15 seconds.
- **Do not show a second score on a different scale.** Practice scores run on a 1000 base and official on a 100 base; putting both in one asset is confusing. Use Practice only here.
- **Sound:** a settling tone as the card lands, a soft tick per breakdown line, one resolving note on the badge.

### The share loop

If the Su-Pu ID on the card becomes a link — a shared Scorecard opening the replay — then V2 markets an asset that is itself a distribution channel. That's a small engineering task with outsized leverage and it's worth prioritizing before this video ships.

---

## 6.3 V3 — "Every Solve Has a Story" (30-second brand film)

The original 30-second film was already record-led and remains the right story. Four revisions.

| | |
|---|---|
| **Purpose** | Explain the whole progression to press, creators, and partners. Introduce the Charter Class. |
| **Format** | 30s, landscape 16:9, 1920×1080, 24fps. Compose center-safe for 9:16 cut-downs. |
| **Source** | Mixed — generated for ambient/human beats, real capture for every screen |
| **Audience** | Press, creator briefings, community partners, website hero |

### Revisions from the original

1. **All screen content is real capture.** The generated Su-Pu sequence is replaced with actual replay footage.
2. **A Scorecard beat is added** at 20–24s, which the original didn't have.
3. **No leaderboard, no ranking data.** The competition beat shows a player *entering*, not standing.
4. **The offer changed.** "First 1,000 verified players receive six months free" becomes the Charter Class, and it occupies the final three seconds only — a footnote, not a payoff.

### Shot sequence

| Time | Source | Visual | Overlay |
|---|---|---|---|
| 0–4s | Generated | Early morning, serene room, window light. An adult sets down tea and picks up a phone lying face-down. | `Every solve has a story.` |
| 4–9s | **Real capture** | Tea Moment board. Notes go in, a digit is placed, a correction is made and fixed. | `Play at your own pace.` |
| 9–15s | **Real capture** | Replay: rewind, then forward through the turning point. Candidate pair resolves; cells cascade. | `Replay how the grid opened.` |
| 15–20s | **Real capture** | Learn/technique screen — the named technique behind that turn. | `Learn the move you almost missed.` |
| 20–24s | **Real capture** | Scorecard: score, breakdown, then the `Not ranked · 非名谱` badge. | `Keep the record.` |
| 24–27s | Generated | Two other adults in different calm settings, each with a phone face-down beside tea. Match-cut rhythm, no racing. | `Compete when you're ready.` |
| 27–30s | Generated | Golden hour. Original player sets the phone down beside the cooling tea. Wide hero, generous negative space. | `Orbace Sudoku` · smaller `Charter Class open during public beta` |

### Revised voiceover

> "A Sudoku result tells you where you finished. Orbace keeps how you arrived. Rewind the solve. Find the move that opened the grid. Learn the technique behind it — and when you're ready, bring it into fair competition. Orbace Sudoku."

Changes from the original: removed "see where you rank" (no rank to show during beta), removed the offer from the VO entirely, and added the learning beat that the Learn tab now supports.

### Revised generation prompt — ambient beats only (0–4s, 24–27s, 27–30s)

> Create polished ambient live-action footage for a premium puzzle-app brand film. Shot one: early morning in a serene home, an adult seated by a window in soft natural light; they set down a ceramic cup of tea and pick up a modern smartphone that is lying face-down on a warm cream tabletop. Shot two: two additional diverse adults in different calm environments — one at a kitchen table, one in a quiet study — each seated with a phone resting face-down beside a cup of tea, unhurried, absorbed. Shot three: golden hour, the first adult sets the phone face-down beside the now-cooling tea and sits back, quietly satisfied; wide composition with generous clean negative space above and below for typography. Warm natural light, cream paper textures, dark ink tones, muted jade and gentle amber accents, tactile close-ups, photorealistic premium editorial cinematography, believable contemporary devices, emotionally warm but restrained, smooth match cuts, subtle depth of field.
>
> Do not generate any phone screen content, Sudoku grid, numbers, puzzle interface, on-screen text, logos, or store badges — the phone must remain face-down or out of frame in every shot. No confetti, no trophies, no cash or prize imagery, no gambling motifs, no red alert states, no frantic speed or racing, no neon or esports styling, no infantilized brain-training clichés, no medical or cognitive-health imagery, no children, no crowds. Leave all text for post-production. Hold the final frame for three seconds.

The critical change: the model is now **forbidden from rendering any screen at all**. This eliminates the failure mode the original plan warned about — invalid grids, distorted UI, unreadable numbers — by removing the requirement entirely rather than trying to prompt around it.

### Sound

Quiet room tone. Soft tea pour. Pencil-like note sounds translated to gentle digital taps at 4–9s. A subtle reverse texture during the replay rewind. Warm strings or felt piano lifting slightly at 24s. One composed resolving note on the end card. Mix must stay calm and intelligible on phone speakers.

---

## 6.4 What no video in this set does

Worth stating as a rule, because the temptation will recur every time someone asks for "something more exciting."

| Never | Because |
|---|---|
| Show a leaderboard or any rank number | Fields are 4–7 during beta. One screenshot of a five-person board undoes the positioning. |
| Show two score scales in one asset | Practice runs on 1000 base, official on 100. Side by side it reads as a bug. |
| Show a live event's grid or solution | Publishing a solution mid-window breaks the fairness claim outright. |
| Show `admin`, `appreview`, `TestPlayer_*`, `SwiftCell_*` | Same discipline as the store screenshots. |
| Lead with the offer | It's the last three seconds of one asset, and absent from the other two. |
| Claim brain-health or cognitive benefit | Unsupported, and a regulatory exposure with no upside. |
| Use a countdown, timer pressure, or scarcity urgency | Contradicts the entire brand. |

---

## 6.5 Testing and sequencing

### Release order

| Week | Asset | Placement |
|---|---|---|
| Beta W1 | **V1 (Replay)** | Launch post, community posts, creator briefing packs |
| Beta W2 | **V3 (Brand film)** | Website hero, press outreach, partner conversations |
| Beta W3 | **V2 (Scorecard)** | Retargeting, second creator wave, mid-funnel |
| Beta W5+ | V1/V2 variants | Paid pilot, once §7 gates clear |

V1 first because it's the strongest cold hook and the cheapest to produce. V2 third because it lands better on people who already understand what a Su-Pu is.

### Tests, in order

| # | Test | Cells | Metric | Gate |
|---|---|---|---|---|
| 1 | V1 first frame | `Every solve becomes a record.` vs `Chess players keep their games.` | Landing → install | ≥300 installs/cell |
| 2 | V1 vs V2 as the paid workhorse | Replay hook vs Scorecard hook | Cost per completed first event | ≥300 installs/cell |
| 3 | V2 ranking hook | With `Some solves count for more.` vs without | Verified account rate | ≥300 installs/cell |

Run test 1 to completion before starting test 2. At the budget in §7 only two cells reach significance at a time — running three concurrently produces noise that looks like data.

**Kill rule, unchanged:** stop any creative producing cheap installs and no verified competition starts, regardless of view count or CTR.

### Derivative assets from the same masters

No new shoots needed:

- **Store preview videos** (iOS App Preview, 15–30s): V1 extended to 20s
- **Six 6-second cutdowns** from V1 and V2 for social
- **Stills:** the turning-point frame from V1 and the breakdown frame from V2 are your two best static creatives
- **Creator kit:** V1 and V2 masters plus raw replay capture, so partners can cut their own without asking

---

## 6.6 Production checklist

Before any capture:

- [ ] Leaderboard rank-sequence bug fixed (not shown in video, but the build must be clean)
- [ ] Time limit reconciled across platforms
- [ ] Lexicon locked and applied to all in-app strings that appear on camera
- [ ] Seeded demo account: plausible name, 25+ Su-Pu, several Clean, Scholar's Path mid-Stage-2
- [ ] Device: full battery, no SOS, no notifications, Do Not Disturb on
- [ ] A Hard-tier Su-Pu selected with a legible, cinematic turning point
- [ ] A Scorecard selected with a visible accuracy penalty *and* a visible bonus
- [ ] Su-Pu ID → replay deep link shipped, if V2 is to close the share loop

---

*Creative specification. All performance figures referenced are planning estimates from the Launch Implementation Plan §7 and should be replaced with measured cohort data after the first 200 users.*

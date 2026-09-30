# Orbace Su-Pu Replay Trailer V6 — Final Implementation Notes

## Objective
Apply the following V6 refinements to the existing V5 trailer. Keep all other V5 production rules unchanged unless explicitly overridden here.

## V6 Creative Revisions

- **Strengthen the opening hook**
  - Open with: **"This puzzle looked impossible."**
  - Follow immediately with: **"Until this happened..."**
  - Then cut to the real contradiction moment from the Su-Pu replay.
  - Goal: create immediate curiosity before explaining the technique.

- **Build context before the contradiction**
  - Let viewers briefly see the real branch forming before the contradiction appears.
  - The contradiction should feel like the payoff to the branch, not an unexplained starting frame.
  - Use only genuine Su-Pu replay footage and existing branch visualization.

- **Make Replay the hero**
  - After the silence beat, use the narration: **"Let's replay it."**
  - Immediately rewind using the real Su-Pu replay controls.
  - The video should market the experience of replaying reasoning, not primarily the IB Tree technique.

- **Emphasize Su-Pu chapter structure**
  - Hold each real chapter title approximately **0.5 seconds longer** than in V5.
  - Add no new chapter labels, narration, or graphics.
  - Allow the audience to notice that Su-Pu organizes the solve into chapters.

- **Use a replay-first end card**
  - Replace **"See how it ends"** with:
    - **"Watch the complete replay"**
    - **"Replay the thinking."**
  - Keep the end card minimal and replay-focused.

## Current V6 CTA / Link Implementation

V6 must rely only on links and infrastructure that already exist in production.

### 9:16 YouTube Shorts
- **Do not include a QR code.**
- End card should show:
  - **Watch the complete replay**
  - **Replay the thinking.**
- Put the canonical Su-Pu URL in:
  - YouTube description
  - pinned comment
- Canonical destination:
  - `https://orbacesudoku.com/su-pu/SP-20260925-683633`

### 16:9 Desktop / Presentation Version
- A QR code **may** be included.
- Encode the existing canonical Su-Pu URL directly:
  - `https://orbacesudoku.com/su-pu/SP-20260925-683633`
- Recommended nearby text:
  - **Scan to watch the complete replay**
- Maintain sufficient QR quiet zone and keep it inside the safe area.
- Do not require any short-link or redirect service for V6.

## Guiding Principle

> The replay is the product.  
> Reveal the turning point, but never reveal the entire story.

The trailer should create curiosity strong enough to make viewers open the full Su-Pu replay.

---

# Future Video Generation — Branded Redirect Approach

## Purpose
For future replay campaigns, introduce a lightweight branded redirect system so videos, QR codes, presentations, and social posts can use short, memorable URLs while still resolving to the canonical Su-Pu replay.

Example:

`https://orbacesudoku.com/go/ibtree`

redirects to:

`https://orbacesudoku.com/su-pu/SP-20260925-683633?utm_source=youtube&utm_medium=video&utm_campaign=ibtree_replay`

## Recommended Namespace
Reserve:

`/go/<slug>`

for marketing and campaign redirects.

Examples:
- `/go/ibtree`
- `/go/easy-replay`
- `/go/champion-001`
- `/go/journal5`

## Redirect Behavior
- Use a **302 temporary redirect** by default for campaign links.
- Reason:
  - destination can change later;
  - campaign tracking parameters can evolve;
  - browsers/search engines are less likely to treat the mapping as permanently fixed.

Use a permanent redirect only when the destination is intentionally immutable.

## Tracking
Each branded redirect should support campaign-specific UTM parameters, for example:

- `utm_source=youtube`
- `utm_medium=video`
- `utm_campaign=ibtree_replay`

For channel-specific attribution, use distinct redirect slugs or configurable destination parameters, for example:
- `/go/ibtree-youtube`
- `/go/ibtree-linkedin`
- `/go/ibtree-reddit`

or maintain one public slug with channel-specific links behind campaign management.

## QR Code Usage After Redirect Infrastructure Exists
Once the redirect service is implemented:
- use the short branded URL in 16:9 QR codes;
- keep 9:16 YouTube Shorts QR-free;
- use the branded short URL in presentations, print, LinkedIn graphics, and downloadable assets;
- preserve the canonical Su-Pu URL as the final destination.

## Important Scope Rule
The branded redirect system is a **future marketing-infrastructure enhancement**.

It is **not a dependency for V6** and must not delay current trailer production or campaign launch.

## Future Production Standard
After redirect infrastructure exists, future replay video prompts should explicitly specify:
1. canonical Su-Pu URL;
2. campaign redirect slug;
3. channel-specific UTM destination;
4. whether the export receives:
   - no QR code,
   - direct canonical QR code,
   - or branded redirect QR code.

This keeps video production decoupled from campaign-link implementation while preserving clean attribution.

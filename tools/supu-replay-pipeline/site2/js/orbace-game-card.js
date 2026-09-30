/* Orbace Sudoku — consolidated game card (docs/plans/2026-07-15-consolidated-game-card-design.md).
 * OrbaceGameCard.wrap(bodyEl, opts) moves bodyEl inside a new .osgc-card shell,
 * in place, and returns { card, line1, line2 } so callers set metadata text
 * directly — the same textContent-assignment idiom already used throughout
 * app.js (e.g. #v1HeroLabel, #v1TeaMeta), no new state pattern introduced.
 */
window.OrbaceGameCard = (function () {
  const TARGET_TIME = {
    foundation: "6:00",
    discipline: "9:00",
    insight: "12:00",
    mastery: "16:00",
    extreme: "20:00",
  };

  // Tier identity has (at least) four equivalent spellings across the app:
  // the English id (Play page tabs), a single CJK glyph (pack cards, Play
  // tab icons — 門成通深神), a two-character CJK label (Su-Pu library tabs —
  // 入门初成贯通精深入神), and a lowercase English word (the REAL production
  // /tea-moment/* and /puzzles/teamoment endpoints — confirmed live on
  // orbacesudoku.com 2026-07-15, distinct from the mock data used in
  // development/tests, which only exercised the id and CJK forms). Callers
  // pass whichever form their data happens to use, so targetTime()
  // normalizes all of them to the English id before lookup.
  //
  // Known backend data issue (not a frontend bug, not fixed here): the real
  // /puzzles/teamoment?tier=discipline and ?tier=insight endpoints both
  // self-report tier:"medium" on their puzzle items — insight/Medium's word
  // form is used below since it's the literal match; discipline/Easy's own
  // items will incorrectly resolve to insight's target time until the
  // backend's tier labeling is fixed.
  // Frozen: exposed on the public API below (app.js's Playground label
  // reuses it), so a stray write here would silently corrupt targetTime()
  // site-wide rather than throwing.
  const TIER_ALIASES = Object.freeze({
    "門": "foundation", "入门": "foundation", "beginner": "foundation",
    "成": "discipline", "初成": "discipline", "easy": "discipline",
    "通": "insight", "贯通": "insight", "medium": "insight",
    "深": "mastery", "精深": "mastery", "hard": "mastery",
    "神": "extreme", "入神": "extreme", "expert": "extreme",
  });

  function targetTime(tierId) { return TARGET_TIME[TIER_ALIASES[tierId] || tierId] || ""; }

  function formatDuration(sec) {
    if (sec == null) return "";
    return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
  }

  function formatRecordedDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const BRAND_SEAL = { play: "弈", replay: "谱" };

  function wrap(bodyEl, opts) {
    opts = opts || {};
    const mode = opts.mode === "replay" ? "replay" : "play";
    const doc = bodyEl.ownerDocument;

    const card = doc.createElement("div");
    card.className = "osgc-card osgc-card--" + mode;

    const header = doc.createElement("div");
    header.className = "osgc-header";

    const meta = doc.createElement("div");
    meta.className = "osgc-meta";
    const line1 = doc.createElement("div");
    line1.className = "osgc-meta-line1";
    const line2 = doc.createElement("div");
    line2.className = "osgc-meta-line2";
    meta.appendChild(line1);
    meta.appendChild(line2);

    const brand = doc.createElement("div");
    brand.className = "osgc-brand";
    brand.innerHTML = '<span class="seal md">' + BRAND_SEAL[mode] + '</span>';

    header.appendChild(brand);
    header.appendChild(meta);

    const body = doc.createElement("div");
    body.className = "osgc-body";

    const parent = bodyEl.parentNode;
    const next = bodyEl.nextSibling;
    body.appendChild(bodyEl);

    card.appendChild(header);
    card.appendChild(body);

    if (parent) parent.insertBefore(card, next);

    return { card: card, line1: line1, line2: line2 };
  }

  return { wrap: wrap, targetTime: targetTime, formatDuration: formatDuration, formatRecordedDate: formatRecordedDate, TIER_ALIASES: TIER_ALIASES };
})();

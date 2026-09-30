/* Orbace Sudoku — Su-Pu standalone pages shared module.
 * Loaded by su-pu/example.html and su-pu/replay-template.html.
 * Auto-detects page context from location.pathname and boots the correct view.
 * Depends on: OrbaceAPI (api.js), OrbaceSupuReplay (orbace-supu-replay.js),
 * OrbaceGameCard (orbace-game-card.js), OrbaceSupuReplayV2
 * (orbace-supu-replay-v2.js, plus its own OrbaceReplayCore dependency) —
 * used only for a real capture-originated share, see ensureReplayV2() below.
 *
 * Su-Pu Library redesign (2026-08-06): the library-browse page moved to
 * /su-pu (site-src/pages/su-pu.html + js/su-pu-library.js) — this file's
 * former LIBRARY PAGE (/su-pu/library) section was removed since that route
 * now 301s to /su-pu (vercel.json) before any page/script ever loads.
 *
 * Su-Pu Capture: Publish for Teaching, Task 5 (2026-09-15): GET /supu/:id
 * additively carries a `capture` envelope (branches/trials/resolutions) plus
 * `puzzle.solution` for a row published via POST /supu/lab/:draftId/publish
 * (backend Task 3). When present, mount OrbaceSupuReplayV2 — the same
 * branch-tree renderer /su-pu/lab already uses — read-only, in place of the
 * flat v1 OrbaceSupuReplay. Every existing (non-capture) share is completely
 * unaffected: `supu.capture` is absent for them, so they fall through to the
 * unchanged v1 branch below, same as before this change.
 */
(function () {
"use strict";

var doc = document;

/* ---- Utility helpers (private in app.js — redefined here) ---- */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; });
}

var toastTimer;
var TOAST_ICONS = {
  ok: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.6l4 4 8-9"/></svg>',
  warn: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round"><path d="M10 3.5v7.5"/><path d="M10 15.2v.1"/></svg>',
};

/* toast(title[, detail][, variant])
 * Renders the shared #supuToast (styles.css `.toast`) as an icon + title +
 * optional secondary line — the copied URL, so the confirmation says WHAT
 * was copied rather than just that something was. `variant` is "warn" for
 * the clipboard-refused path. Called with a single string it still renders
 * a plain centred message. */
function toast(title, detail, variant) {
  var t = doc.getElementById("supuToast");
  if (!t) return;
  t.className = "toast" + (variant ? " is-" + variant : "");
  t.innerHTML =
    '<span class="toast-row">' +
      '<span class="toast-icon" aria-hidden="true">' + (TOAST_ICONS[variant === "warn" ? "warn" : "ok"]) + '</span>' +
      '<span class="toast-body">' +
        '<span class="toast-title">' + esc(title) + '</span>' +
        (detail ? '<span class="toast-detail">' + esc(detail) + '</span>' : '') +
      '</span>' +
    '</span>';
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, detail ? 4000 : 3000);
}

function ev(name, params) {
  if (window.trackEvent) window.trackEvent(name, params);
}

var TIER_TAB_MAP = { foundation: "Beginner", discipline: "Easy", insight: "Medium", mastery: "Hard", extreme: "Expert" };
// See su-pu-library.js's englishTier() for why 极致 (the 6th Challenge-the-House
// tier) is special-cased ahead of TIER_ALIASES instead of added to it.
function englishTier(tier) {
  if (tier === "极致" || tier === "極致") return "Extreme";
  return TIER_TAB_MAP[OrbaceGameCard.TIER_ALIASES[tier] || tier] || tier || "";
}

/* ---- DOM references (set by each page context) ---- */
var boardEl, controlsEl, listEl, explainEl, cardBodyEl, storyEl;
var supuReplay = null, supuReplayV2 = null, supuCard = null;
var currentSupuId = null;

function ensureReplay() {
  if (!supuReplay) {
    supuReplay = OrbaceSupuReplay.mount({
      boardEl: boardEl, controlsEl: controlsEl,
      listEl: listEl, mode: "sidebar",
      explainEl: explainEl,
    });
  }
  return supuReplay;
}

/* Branch-tree renderer for a capture-originated share (see file header).
 * No `onCellClick` — this is a public, read-only page; click-to-annotate
 * is Su-Pu Lab's own interactive mode, never appropriate here. */
function ensureReplayV2() {
  if (!supuReplayV2) {
    supuReplayV2 = OrbaceSupuReplayV2.mount({
      boardEl: boardEl, controlsEl: controlsEl, listEl: listEl,
      // UAT feedback (2026-09-24): NS/HS shade+highlight + the "Shape the
      // replay" story weren't showing on this, the public "final replay"
      // page — reuses the same explainEl this page already wires to v1's
      // ensureReplay() above (only one of the two mounts is ever active
      // per page load, since supu.capture picks the branch below).
      explainEl: explainEl,
      storyEl: storyEl,
    });
  }
  return supuReplayV2;
}

/* GET /supu/:id returns puzzle.givens as an array of 81 ints. v1's
 * OrbaceSupuReplay.load() indexes it positionally and tolerates either
 * shape, but OrbaceSupuReplayV2.load() (via OrbaceReplayCore.createTimeline())
 * needs the canonical 81-char digit string — same conversion
 * js/orbace-supu-parity.js's givensDigits() applies for the same reason,
 * redefined locally here (this file's established convention for small
 * utils, see esc() above) rather than pulling in that lab-diagnostic module
 * as a dependency of this public page. */
function givensDigits(g) {
  if (g == null) return "";
  return Array.isArray(g) ? g.join("") : String(g);
}

function ensureCard() {
  if (!supuCard) supuCard = OrbaceGameCard.wrap(cardBodyEl, { mode: "replay" });
  return supuCard;
}

/* ---- ======== REPLAY TEMPLATE PAGE (/su-pu/[id]) ======== ---- */
function initReplayTemplate() {
  var path = location.pathname.replace(/\/+$/, "") || "/";
  var m = path.match(/^\/su-pu\/(.+)/);
  if (!m) { showError("No Su-Pu ID found in URL."); return; }
  var id = m[1];
  if (id === "replay-template") {
    showError("No Su-Pu ID found in URL.");
    return;
  }
  loadSuPuReplay(id);
}

function showError(msg) {
  ensureCard();
  supuCard.line1.textContent = "Su-Pu not found";
  supuCard.line2.textContent = msg;
}

/* Synchronous fallback for browsers/contexts where the async Clipboard API
 * is missing or rejects (non-secure origin, permission denied, document not
 * focused). Returns true only if the copy actually happened. */
function legacyCopy(text) {
  try {
    var ta = doc.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
    doc.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = doc.execCommand("copy");
    doc.body.removeChild(ta);
    return !!ok;
  } catch (e) { return false; }
}

function copyLink() {
  var id = currentSupuId || "";
  var url = (location.origin || "https://orbacesudoku.com") + "/su-pu/" + id;
  var shown = url.replace(/^https?:\/\//, "");
  function ok() { toast("Su-Pu link copied", shown); }
  function fail() { toast("Press \u2318/Ctrl + C to copy", shown, "warn"); }
  function tryLegacy() { if (legacyCopy(url)) ok(); else fail(); }

  /* The Clipboard API rejects rather than throwing, so the old bare
   * try/catch + .then() left the click silently doing nothing whenever the
   * write was refused — hence the .catch() fallback here. */
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      navigator.clipboard.writeText(url).then(ok, tryLegacy);
    } catch (e) { tryLegacy(); }
  } else {
    tryLegacy();
  }
}

async function loadSuPuReplay(id) {
  ensureCard();
  supuCard.line2.classList.remove("supu-meta-error");
  supuCard.line2.onclick = null;
  if (id === currentSupuId && (supuReplay || supuReplayV2)) return;
  try {
    var supu = await OrbaceAPI.getSupu(id);
    currentSupuId = supu.supu_id;
    var m = supu.meta || {};
    var dur = OrbaceGameCard.formatDuration(m.duration_seconds);
    supuCard.line1.textContent = "Su-Pu · " + englishTier(supu.puzzle.tier) + (supu.puzzle.tier_index ? " #" + supu.puzzle.tier_index : "") + (m.clean ? " · 净谱 clean" : "");
    supuCard.line2.textContent = [
      "By " + m.player.display_name,
      dur,
      "Puzzle Score " + (m.score || 0).toLocaleString(),
      "Recorded " + OrbaceGameCard.formatRecordedDate(m.date),
    ].join(" · ");
    if (supu.capture) {
      // Real capture envelope + real solution — never a legacyToCaptureV2()
      // pseudo-solution, unlike page-supu-lab.js's loadSupu(): this row
      // already carries the genuine v2/v3/v4 event stream and its actual
      // solved solution from POST /supu/lab/:draftId/publish.
      ensureReplayV2().load(givensDigits(supu.puzzle.givens), supu.capture.moveHistory, supu.puzzle.solution, { notes: [], pins: [] }, supu.story || null);
    } else {
      ensureReplay().load(supu.puzzle.givens, supu.moves);
    }
    ev("replay_view", { supu_id: supu.supu_id });
  } catch (e) {
    if (e && e.status) {
      supuCard.line1.textContent = "Su-Pu not found";
      supuCard.line2.textContent = "This record may be private or the link may have expired.";
      return;
    }
    supuCard.line1.textContent = "Su-Pu · couldn't load";
    supuCard.line2.textContent = "Connection problem — tap to retry";
    supuCard.line2.classList.add("supu-meta-error");
    supuCard.line2.onclick = function () { currentSupuId = null; loadSuPuReplay(id); };
  }
}

/* ---- ======== EXAMPLE PAGE (/su-pu/example) ======== ---- */
async function initExample() {
  ensureCard();
  try {
    var featured = await OrbaceAPI.getFeatured().catch(function () { return null; });
    var supu = null;
    if (featured && featured.hero_supu_id) supu = await OrbaceAPI.getSupu(featured.hero_supu_id).catch(function () { return null; });
    if (!supu) supu = await OrbaceAPI.getSupu("SP-20260703-REAL01").catch(function () { return null; });
    if (!supu || !supu.puzzle) { showError("Example replay unavailable."); return; }

    currentSupuId = supu.supu_id;
    var m = supu.meta || {};
    var dur = OrbaceGameCard.formatDuration(m.duration_seconds);
    supuCard.line1.textContent = "Su-Pu · " + englishTier(supu.puzzle.tier) + (supu.puzzle.tier_index ? " #" + supu.puzzle.tier_index : "") + (m.clean ? " · 净谱 clean" : "");
    supuCard.line2.textContent = [
      "By " + m.player.display_name,
      dur,
      "Puzzle Score " + (m.score || 0).toLocaleString(),
      "Recorded " + OrbaceGameCard.formatRecordedDate(m.date),
    ].join(" · ");
    ensureReplay().load(supu.puzzle.givens, supu.moves);
    ev("example_replay_load", { supu_id: supu.supu_id });
  } catch (e) {
    showError("Example replay unavailable.");
  }
}

/* ---- ======== AUTO-BOOT ======== ---- */
function boot() {
  var path = location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/su-pu/example") {
    boardEl = doc.getElementById("exampleBoard");
    controlsEl = doc.getElementById("exampleControls");
    listEl = doc.getElementById("exampleMoveList");
    explainEl = doc.getElementById("exampleExplain");
    cardBodyEl = doc.getElementById("exampleCardBody");
    storyEl = doc.getElementById("exampleStory");
    initExample();
  } else {
    boardEl = doc.getElementById("replayBoard");
    controlsEl = doc.getElementById("replayControls");
    listEl = doc.getElementById("replayMoveList");
    explainEl = doc.getElementById("replayExplain");
    cardBodyEl = doc.getElementById("replayCardBody");
    storyEl = doc.getElementById("replayStory");
    initReplayTemplate();
  }
}

/* Wire copyLink for both replay-template and example pages. */
window.supuCopyLink = function () { copyLink(); };

/* Delegated listener (CSP script-src unsafe-inline remediation, Phase 0.5,
 * 2026-07-25) — replaces onclick="window.supuCopyLink()" on the "Copy Link"
 * button. */
doc.addEventListener("click", function (e) {
  if (e.target.closest("[data-supu-copy-link]")) window.supuCopyLink();
});

/* Wait for dependencies — OrbaceSupuReplay and OrbaceGameCard are loaded
 * synchronously, but OrbaceAPI may do auth-restore on first call. */
if (doc.readyState === "loading") {
  doc.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

})();

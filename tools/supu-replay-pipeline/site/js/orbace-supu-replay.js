/* Orbace Sudoku — canonical Su-Pu replay block (docs/orbace-brand-standard.md
 * §Su-Pu Replay Anatomy). One implementation of board-render + playback
 * transport, replacing the 3 duplicated implementations that used to live in
 * js/app.js (rp-prefixed on #supu detail, slb-prefixed on the #supu library
 * inline replay, hero-prefixed on the Home hero theater) — each with its own
 * board container style, its own transport button style, and (only two of
 * them) its own move-list style.
 *
 * The board reuses .og-board/.og-cell from orbace-grid.css directly (see
 * css/orbace-supu-replay.css's .osr-board modifier) so a replay board reads
 * as the same visual object as a live play board — just read-only.
 *
 * Two move-list presentation modes:
 *   'sidebar' — full vertical list, one row per move, full-word labels
 *               ("Correct"/"Mistake"/"Hint", or a technique name when the
 *               move carries one). #supu page only (detail view + the
 *               inline library replay), sized to match the board's height.
 *   'strip'   — compact horizontal auto-scrolling move-chip row. For
 *               multi-section pages (e.g. Home) that can't spare a tall
 *               sidebar.
 * mode: 'none' (or omitting listEl) skips the move list entirely.
 * explainEl (optional, either mode): a per-move "why" caption — shows the
 * plain-English explanation for the CURRENT move when it carries one (only
 * naked_single/hidden_single moves do; see solve-path.ts's
 * tagMovesWithTechniques()), hidden otherwise. Same learn.explain.*
 * templates the practice grid's "Show" tool uses (js/i18n.js's
 * window.explainTechnique()).
 *
 * Host owns puzzle fetching, title/meta text, and ceremony (same division of
 * responsibility as js/orbace-grid.js's mountControlled()) — this module
 * owns only board rendering + playback mechanics + the move list/strip.
 */
window.OrbaceSupuReplay = (function () {
  "use strict";

  // Technique codes come from the human-ranked solver (backend/org-api/src/
  // services/solve-path.ts and the canonical Dart port packages/sudoku_engine/
  // lib/src/engine/human_ranked_solver.dart) — keep this mapping in sync with
  // that solver's tag set if it grows. Real player moves get these tags too
  // as of the technique-playbook proposal's Phase 2 (2026-07-18,
  // solve-path.ts's tagMovesWithTechniques(), wired into POST /supu at save
  // time) — untagged/pre-Phase-2 moves fall back to "OK"/"✕"/"HINT" below.
  const TECHNIQUES = {
    NS: "Naked Single",
    HS: "Hidden Single",
    NP: "Naked Pair",
    LC: "Locked Candidates",
    HP: "Hidden Pair",
    XW: "X-Wing",
    // UAT feedback (2026-09-19) — kept in sync with orbace-supu-replay-v2.js's
    // TECHNIQUES dict; see that file's own comment for why (self-declared
    // capture tags only, never emitted by the backend auto-tagger).
    CH: "Cross Hatching",
    LD: "Last Digit",
  };

  function moveLabel(t) {
    if (t === "NOTE") return { text: "Note", kind: "note" };
    if (t === "ERASE") return { text: "Erase", kind: "erase" };
    if (t && TECHNIQUES[t]) return { text: TECHNIQUES[t], kind: "technique" };
    if (t === "✕") return { text: "Mistake", kind: "mistake" };
    if (t === "HINT") return { text: "Hint", kind: "hint" };
    return { text: "Correct", kind: "correct" }; // "OK" or unset
  }

  function moveLoc(mv) {
    if (mv.t === "NOTE") return "R" + (Math.floor(mv.i / 9) + 1) + "C" + (mv.i % 9 + 1) + " ✏" + mv.v;
    if (mv.t === "ERASE") return "R" + (Math.floor(mv.i / 9) + 1) + "C" + (mv.i % 9 + 1) + " erased";
    return "R" + (Math.floor(mv.i / 9) + 1) + "C" + (mv.i % 9 + 1) + "=" + mv.v;
  }

  function scrollWithinContainer(container, child) {
    if (!container || !child) return;
    const top = child.offsetTop, bottom = top + child.offsetHeight;
    if (top < container.scrollTop) container.scrollTop = top;
    else if (bottom > container.scrollTop + container.clientHeight) container.scrollTop = bottom - container.clientHeight;
  }

  function buildBoard(el) {
    el.innerHTML = "";
    el.classList.add("og-board", "osr-board");
    const cells = [];
    for (let i = 0; i < 81; i++) {
      const d = document.createElement("div");
      d.className = "og-cell";
      const r = Math.floor(i / 9), c = i % 9;
      if (r % 3 === 0 && r !== 0) d.classList.add("bt");
      if (c % 3 === 0 && c !== 0) d.classList.add("bl");
      el.appendChild(d);
      cells.push(d);
    }
    return cells;
  }

  const CONTROLS_HTML =
    '<button class="osr-btn osr-btn-first" title="First">⏮</button>' +
    '<button class="osr-btn osr-btn-back" title="Back">⏪</button>' +
    '<button class="osr-btn osr-btn-play" title="Play/Pause">▶</button>' +
    '<button class="osr-btn osr-btn-fwd" title="Forward">⏩</button>' +
    '<button class="osr-btn osr-btn-last" title="End">⏭</button>' +
    '<select class="osr-speed"><option value="900">0.5×</option><option value="450" selected>1×</option><option value="220">2×</option><option value="110">4×</option></select>' +
    '<span class="osr-step">Step 0 / 0</span>';

  function mount(options) {
    const boardEl = options.boardEl;
    const controlsEl = options.controlsEl;
    const listEl = options.listEl || null;
    const mode = listEl ? (options.mode || "sidebar") : "none";
    const onStep = options.onStep || null;
    // Per-move "why" caption (round 3 of validation feedback, 2026-07-18:
    // "a method to store / display explanation by player") — optional;
    // hosts that don't pass explainEl just don't get one (e.g. the Home
    // hero theater's strip mode). Only naked_single/hidden_single moves
    // ever carry e/p (see solve-path.ts's tagMovesWithTechniques() doc
    // comment), so most moves simply clear it.
    const explainEl = options.explainEl || null;

    let cells = [];
    let curGivens = "";
    let curMoves = [];
    let pos = 0;
    let timer = null;
    let speed = options.speed || 450;

    if (controlsEl) {
      controlsEl.classList.add("osr-controls");
      controlsEl.innerHTML = CONTROLS_HTML;
      // Strip mode: the move-chip row joins the same flex row as the
      // transport buttons, landing right after the step counter — one
      // compact line instead of a separate block underneath (docs/
      // orbace-brand-standard.md §Su-Pu Replay Anatomy). Sidebar mode stays
      // wherever the host placed listEl (a tall list has no business on the
      // controls row).
      if (mode === "strip" && listEl) controlsEl.appendChild(listEl);
    }

    function renderBoard() {
      const placed = {};
      // Notes rendering (2026-07-26 bug fix): the payload's note moves
      // toggle a single number in a cell — {i, v, t:'NOTE'} for both adding
      // and removing (docs/web-team-note-rendering-handoff.md). Reconstructed
      // fresh each render from move 0..pos, not carried across renders, so
      // scrubbing the transport (which can move pos backward) stays correct.
      const notesByCell = Array.from({ length: 81 }, () => ({}));
      for (let k = 0; k < pos; k++) {
        const m = curMoves[k];
        if (m.t === "NOTE") {
          if (notesByCell[m.i][m.v]) delete notesByCell[m.i][m.v];
          else notesByCell[m.i][m.v] = true;
        } else if (m.t === "ERASE") {
          // Bug fix (2026-07-27): an erase move carries v:0 (no digit) —
          // it must clear the cell, not render "0" into it the way a real
          // placement's `placed[m.i] = {v: m.v, ...}` would.
          delete placed[m.i];
          notesByCell[m.i] = {};
        } else {
          placed[m.i] = { v: m.v, last: k === pos - 1, t: m.t };
          notesByCell[m.i] = {}; // placing a value clears that cell's notes
        }
      }
      cells.forEach((d, i) => {
        d.classList.remove("user", "justplaced", "err");
        if (+curGivens[i]) { d.textContent = curGivens[i]; d.classList.add("given"); return; }
        const pl = placed[i];
        if (pl) {
          d.textContent = pl.v;
          d.classList.add("user");
          if (pl.last) d.classList.add("justplaced");
          if (pl.t === "✕") d.classList.add("err");
        } else if (Object.keys(notesByCell[i]).length) {
          // Mirrors js/orbace-grid.js's own live-play notes rendering
          // exactly (.og-notes reused as-is from orbace-grid.css) so a
          // replay board reads as the same visual object mid-solve.
          d.innerHTML = "";
          const grid = document.createElement("div");
          grid.className = "og-notes";
          for (let v = 1; v <= 9; v++) {
            const s = document.createElement("span");
            s.textContent = notesByCell[i][v] ? String(v) : "";
            grid.appendChild(s);
          }
          d.appendChild(grid);
        } else {
          d.textContent = "";
        }
      });
    }

    function renderList() {
      if (mode === "sidebar") {
        const rows = listEl.querySelectorAll(".osr-mv");
        rows.forEach((d, k) => {
          d.classList.toggle("done", k < pos);
          d.classList.toggle("cur", k === pos - 1);
        });
        const cur = listEl.querySelector(".osr-mv.cur");
        if (cur) scrollWithinContainer(listEl, cur);
      } else if (mode === "strip") {
        const chip = listEl.firstElementChild;
        if (!chip) return;
        if (pos > 0) {
          const mv = curMoves[pos - 1];
          const lbl = moveLabel(mv.t);
          chip.className = "osr-chip cur " + lbl.kind;
          chip.textContent = moveLoc(mv);
          chip.title = lbl.text;
        } else {
          chip.className = "osr-chip";
          chip.textContent = "";
          chip.title = "";
        }
      }
    }

    function buildList() {
      if (mode === "none") return;
      listEl.innerHTML = "";
      if (mode === "sidebar") {
        listEl.classList.add("osr-movelist");
        curMoves.forEach((mv, k) => {
          const lbl = moveLabel(mv.t);
          const d = document.createElement("div");
          d.className = "osr-mv " + lbl.kind;
          d.innerHTML = '<span class="osr-mv-label">' + (k + 1) + ". " + lbl.text + '</span><span>' + moveLoc(mv) + "</span>";
          d.onclick = () => { pause(); pos = k + 1; render(); };
          listEl.appendChild(d);
        });
      } else if (mode === "strip") {
        // Single current-move chip (was: one chip per move + auto-scroll-into-
        // view) — sits inline with the "Step x / y" counter and just relabels
        // itself each step instead of scrolling a whole row (docs/plans/
        // 2026-07-15-game-card-branding-cleanup-design.md §4).
        listEl.classList.add("osr-strip");
        if (curMoves.length) listEl.appendChild(document.createElement("div"));
      }
    }

    function syncControls() {
      if (!controlsEl) return;
      const step = controlsEl.querySelector(".osr-step");
      if (step) step.textContent = "Step " + pos + " / " + curMoves.length;
      const playBtn = controlsEl.querySelector(".osr-btn-play");
      if (playBtn) playBtn.textContent = timer ? "⏸" : "▶";
    }

    function renderExplain() {
      if (!explainEl) return;
      const mv = pos > 0 ? curMoves[pos - 1] : null;
      if (!mv || !mv.e || !window.explainTechnique) {
        explainEl.hidden = true;
        explainEl.textContent = "";
        return;
      }
      explainEl.textContent = window.explainTechnique(mv.e, mv.p);
      explainEl.hidden = false;
    }

    function render() {
      renderBoard();
      renderList();
      renderExplain();
      syncControls();
      if (onStep) onStep(pos, curMoves.length);
      if (pos >= curMoves.length) pause();
    }

    function pause() {
      clearInterval(timer);
      timer = null;
      syncControls();
    }
    function play() {
      if (timer) { pause(); return; }
      if (!curMoves.length) return;
      if (pos >= curMoves.length) pos = 0;
      timer = setInterval(() => { pos++; render(); }, speed);
      syncControls();
    }
    function first() { pause(); pos = 0; render(); }
    function last() { pause(); pos = curMoves.length; render(); }
    function back() { pause(); pos = Math.max(0, pos - 1); render(); }
    function fwd() { pause(); pos = Math.min(curMoves.length, pos + 1); render(); }
    function seek(p) { pause(); pos = Math.max(0, Math.min(curMoves.length, p)); render(); }

    if (controlsEl) {
      const q = (sel) => controlsEl.querySelector(sel);
      q(".osr-btn-play").onclick = play;
      q(".osr-btn-first").onclick = first;
      q(".osr-btn-last").onclick = last;
      q(".osr-btn-back").onclick = back;
      q(".osr-btn-fwd").onclick = fwd;
      q(".osr-speed").onchange = (e) => { speed = +e.target.value; if (timer) { pause(); play(); } };
    }

    function load(givens, moves) {
      pause();
      curGivens = givens || "";
      curMoves = moves || [];
      pos = 0;
      cells = buildBoard(boardEl);
      // Bug fix attempt (2026-09-01, reported twice — replay links from
      // /challenge showing a blank grid until the player clicks anywhere):
      // .og-board (buildBoard() above) uses `container-type: inline-size`
      // (orbace-grid.css), which .og-cell's font-size depends on. If this
      // board only just became visible in the same tick (e.g. mounted right
      // after a page's own display:none -> block toggle), the browser can
      // land the first render() call below before that container-query
      // context is settled, and nothing repaints until a click forces a
      // style recalc. Reading offsetHeight forces a synchronous reflow
      // here, before render(), so the board's real size is resolved first.
      void boardEl.offsetHeight;
      buildList();
      render();
    }

    if (options.givens) load(options.givens, options.moves);
    if (options.autoplay) play();

    return { load, play, pause, first, last, back, fwd, seek, destroy: pause };
  }

  return { mount };
})();

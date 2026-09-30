/* Orbace Sudoku — canonical grid block (docs/orbace-brand-standard.md §Grid & Keypad
 * Anatomy). This is the literal reusable unit meant to replace every puzzle-play
 * surface on the site — see docs/plans/2026-07-14-orbacesudoku9cellgrid-design.md
 * and docs/plans/2026-07-14-teamoment-migration-design.md.
 *
 * Two entry points, sharing one internal controller (createController below):
 *
 *   OrbaceGrid.mount(container, options)
 *     Fully self-contained/standalone: builds its own .og-wrap (board + meta/
 *     timer card + keypad + toolrow + help), fetches its own puzzle by tier,
 *     owns its own timer, shows its own toasts. Used by the #orbacesudoku9cellgrid
 *     reference page. Behavior unchanged from the original single-mode version.
 *     `options.onLoaded(pzMeta)` fires once the fetched puzzle is applied
 *     (pzMeta: {puzzle_id, tier, tier_index, givens, solution} or null) — for
 *     standalone hosts (e.g. the static /play page) that wrap the mount in an
 *     OrbaceGameCard header and need the puzzle identity to fill it in, since
 *     mount() otherwise fetches internally without exposing what it loaded.
 *
 *   OrbaceGrid.mountControlled(options)
 *     For host pages (e.g. Tea Moment) that already own puzzle-loading, timing,
 *     pause, and a completion ceremony (seal stamp, Su-Pu save, replay) and only
 *     want the grid/keypad/toolrow markup + interaction, not a second parallel
 *     state machine. The host supplies target elements and the puzzle directly
 *     (no fetch, no built-in meta/timer/toast-on-solve), and receives lifecycle
 *     callbacks (onStart/onUndo/onNotesToggle/onHint/onSolved) to run its own
 *     ceremony at the right moments. Exposes loadPuzzle()/pause()/resume() so the
 *     host can swap puzzles and freeze input without rebuilding DOM.
 *
 * Depends only on window.OrbaceAPI (js/api.js, standalone mode only) and
 * css/orbace-grid.css. Keyboard nav is scoped to the mounted board element, not
 * document-level, so multiple instances (or coexistence with legacy pages during
 * a future migration) don't collide.
 */
window.OrbaceGrid = (function () {
  const ICONS = {
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>',
    erase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16a1.5 1.5 0 0 1 0-2.12l9.5-9.5a1.5 1.5 0 0 1 2.12 0l5.5 5.5a1.5 1.5 0 0 1 0 2.12L13 20"></path><path d="M9.5 12.5 15 18"></path></svg>',
    notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>',
    hint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.05V17h6v-.25c0-.85.4-1.55 1-2.05A7 7 0 0 0 12 2z"></path></svg>',
    // Technique-hint tool (Phase 3 of the technique-playbook proposal,
    // 2026-07-18) — a target/crosshair, distinct from the lightbulb "just
    // tell me the answer" hint: this shows WHERE the specific technique
    // being drilled applies, not the value.
    technique: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="1" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="23"></line><line x1="1" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="23" y2="12"></line></svg>'
  };

  const TIER_LABELS = { foundation: "Beginner", discipline: "Easy", insight: "Medium", mastery: "Hard", extreme: "Expert" };

  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._ogTimer);
    t._ogTimer = setTimeout(() => t.classList.remove("show"), 3000);
  }

  function fmtSecs(s) {
    const m = Math.floor(s / 60), r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  // Move-event-fidelity / Web Capture Parity, Step 2 (2026-09-04): now
  // returns the ascending-cell-index list of peer cells that actually HAD
  // digit `n` before this call (i.e. real clears, not every peer touched)
  // — the canonical capture adapter needs exactly this list for
  // VALUE_SET's/HINT_REVEAL's cleared_peer_notes/cleared_notes payload
  // (fixtures/normative/solve-event-capture/v1's own frozen ordering:
  // peer entries ascending cell_index). Purely additive — every existing
  // caller ignores the return value and sees identical delete() behavior.
  function clearPeerNotes(notesArr, idx, n) {
    const cleared = [];
    if (!n) return cleared;
    const r = Math.floor(idx / 9), c = idx % 9, br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 81; i++) {
      if (i === idx) continue;
      const ir = Math.floor(i / 9), ic = i % 9;
      if (ir === r || ic === c || (Math.floor(ir / 3) * 3 === br && Math.floor(ic / 3) * 3 === bc)) {
        if (notesArr[i].has(n)) { notesArr[i].delete(n); cleared.push(i); }
      }
    }
    return cleared;
  }

  /* Shared engine behind both mount() and mountControlled(). `elements` are the
   * DOM nodes to render into (boardEl/keypadEl/toolsEl required; metaEl/timerEl
   * optional — omitted entirely in controlled mode, where the host owns its own
   * meta/timer UI). `callbacks` are all optional; when a ceremony callback
   * (onHint/onSolved) is supplied it REPLACES the built-in toast for that event
   * so the host can show its own wording — onStart/onUndo/onNotesToggle just
   * fire alongside the default mechanics, they don't replace anything. */
  function createController(elements, callbacks, config) {
    const { boardEl, keypadEl, toolsEl, metaEl, timerEl } = elements;
    callbacks = callbacks || {};
    config = config || {};

    boardEl.classList.add("og-board");
    if (!boardEl.hasAttribute("tabindex")) boardEl.setAttribute("tabindex", "0");
    if (!boardEl.hasAttribute("aria-label")) boardEl.setAttribute("aria-label", "Sudoku board");
    keypadEl.classList.add("og-keypad");
    keypadEl.setAttribute("role", "group");
    if (!keypadEl.hasAttribute("aria-label")) keypadEl.setAttribute("aria-label", "Number pad");
    toolsEl.classList.add("og-toolrow");
    // Practice mode (config.technique set — see mountControlled() doc
    // comment) gets a 5th tool: "where does THIS specific technique apply
    // right now?" (Phase 3 of the technique-playbook proposal, 2026-07-18).
    // Default is 4 (erase/undo/notes/hint, unified keypad+toolrow format).
    toolsEl.classList.toggle("og-toolrow--5", !!config.technique);

    toolsEl.innerHTML =
      '<button class="og-tool" data-tool="erase" title="Erase (Delete)" aria-label="Erase">' + ICONS.erase + '<span>Erase</span></button>' +
      '<button class="og-tool" data-tool="undo" title="Undo" aria-label="Undo">' + ICONS.undo + '<span>Undo</span></button>' +
      '<button class="og-tool" data-tool="notes" title="Notes (N)" aria-label="Toggle notes mode">' + ICONS.notes + '<span>Notes</span></button>' +
      '<button class="og-tool" data-tool="hint" title="Hint (H)" aria-label="Hint">' + ICONS.hint + '<span>Hint</span></button>' +
      (config.technique
        ? '<button class="og-tool" data-tool="technique" title="Show this technique" aria-label="Show where this technique applies">' + ICONS.technique + '<span>Show</span></button>'
        : '');
    const tools = {};
    toolsEl.querySelectorAll(".og-tool").forEach((b) => { tools[b.dataset.tool] = b; });

    let P = "", S = "";
    // UAT feedback (2026-09-19): live error-highlighting and Hint used to be
    // an all-or-nothing consequence of whether a `solution` was supplied at
    // all (see `correct()` below) — the only way to turn either off was to
    // withhold S entirely, which ranked/competition play already does and
    // keeps doing (see js/app.js's official-attempt mount, "Deliberately no
    // `solution` field"), unchanged, no toggle offered there by design.
    // These two flags let a host that DOES supply S (Tea Moment, Play,
    // Puzzle Packs, Su-Pu Capture) still let the player turn either off
    // without losing S for everything else that needs it (Submit-style
    // contradiction checks, solved-flag validation, Review/Replay). Default
    // true preserves every existing page's behavior unchanged unless it
    // opts out via options.mistakeCheck/options.hintEnabled or a later
    // setMistakeCheck()/setHintEnabled() call.
    let liveMistakeCheck = config.mistakeCheck !== false;
    let hintEnabled = config.hintEnabled !== false;
    // UAT feedback (2026-09-20): a host with its own overlay-based revert
    // mechanism that this engine's undoStack knows nothing about (Su-Pu
    // Capture's trial branches — orbace-grid-lab.js) needs to disable this
    // engine's own Undo entirely while that overlay is active. Without this,
    // clicking Undo during an open branch silently reaches past the
    // trial-only moves (which never pushed anything onto undoStack, since
    // trial marks are a host-tracked overlay, not real vals[]/notes[]
    // mutations) and undoes the last REAL committed move instead — visibly
    // wrong ("undo undid my main steps"). Default true preserves every
    // existing host's behavior unchanged.
    let undoEnabled = config.undoEnabled !== false;
    let pzMeta = null; // stored by applyPuzzle for onSolved callback
    let cellEls = [], given = [], vals = [], notes = [];
    let sel = -1, notesMode = false, undoStack = [], errors = 0, hints = 0, solved = false, paused = false, log = [];
    // Parallel to undoStack, popped/pushed/capped together — see snapshot()
    // and undo() below. §4.1's real gap: this engine never had a per-action
    // identity of any kind before Web Capture Parity Step 2; UNDO_APPLY's
    // frozen payload requires one (fixtures/normative/solve-event-capture/
    // v1). There is no redo feature in this engine (verified: no redoStack
    // anywhere), so action_id currently only ever gets read back by undo().
    let actionIdStack = [], actionIdCounter = 0;
    // Web Capture Parity, Step 2 (2026-09-04). Fully guarded/no-op on any
    // page that hasn't added <script src="js/solve-event-capture.js"> yet
    // (that's Step 4's job) — every real production page today loads
    // orbace-grid.js without it, so this MUST tolerate its absence, not
    // just prefer it. `captureSession` is created once per controller
    // instance and reset() on every new puzzle load (applyPuzzle), exactly
    // matching solve-event-capture.js's own designed lifecycle — never
    // recreated. See recordCapture() below for the never-break-gameplay
    // guarantee every call site relies on.
    const captureRuntime = window.OrbaceSolveEventCapture || null;
    const captureClock = captureRuntime ? captureRuntime.createActivePlayClock() : null;
    const captureSession = captureRuntime && captureClock
      ? captureRuntime.createCaptureSession(captureRuntime.SCHEMA_VERSION, captureClock, [])
      : null;
    function recordCapture(eventType, payload) {
      if (!captureSession) return;
      try { captureSession.record(eventType, payload); } catch (e) { /* capture must never break gameplay — R7 */ }
    }
    let techHighlight = []; // cell indices lit up by the technique-hint tool (Phase 3); cleared on any real move
    // Subset of techHighlight that's the literal cell(s) the explanation
    // caption's text refers to ("This cell has only one candidate left…",
    // "These two cells…") — round 2 of validation feedback, 2026-07-18.
    // When the action places a value (naked/hidden single), that's exactly
    // one cell (res.placementIndex); techHighlight also includes that
    // cell's row/col/box peers as reasoning context, which get the plain
    // .tech-hint ring but not the stronger .tech-hint-primary fill. For
    // elimination-only actions (pair/pointing-pair/x-wing) there's no
    // placement, and the highlighted cells ARE exactly what the caption
    // names ("these two highlighted cells", "these four highlighted
    // cells") — so the whole set is primary, nothing left over as context.
    let techHighlightPrimary = [];
    let secs = 0, timerHandle = null;

    function buildBoard() {
      boardEl.innerHTML = "";
      cellEls = [];
      for (let i = 0; i < 81; i++) {
        const d = document.createElement("div");
        d.className = "og-cell";
        const r = Math.floor(i / 9), c = i % 9;
        if (r % 3 === 0 && r !== 0) d.classList.add("bt");
        if (c % 3 === 0 && c !== 0) d.classList.add("bl");
        d.dataset.idx = i;
        d.addEventListener("click", () => selectCell(i));
        boardEl.appendChild(d);
        cellEls.push(d);
      }
    }

    // Erase lives in the icon row (toolsEl, data-tool="erase") as of the
    // unified keypad format — 1-9 in one line here, erase/undo/notes/hint
    // as a second row of icons (see toolsEl.innerHTML above). Its click
    // handler is wired below alongside undo/notes/hint.
    function buildKeypad() {
      keypadEl.innerHTML = "";
      for (let n = 1; n <= 9; n++) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = String(n);
        b.addEventListener("click", () => enterValue(n));
        keypadEl.appendChild(b);
      }
    }

    function startTimer() {
      if (!timerEl) return;
      clearInterval(timerHandle);
      timerHandle = setInterval(() => {
        if (solved) return;
        secs++;
        timerEl.textContent = fmtSecs(secs);
      }, 1000);
    }

    function correct(i) {
      return !S || vals[i] === +S[i];
    }

    function snapshot() {
      undoStack.push({ vals: vals.slice(), notes: notes.map((s) => new Set(s)) });
      actionIdStack.push("act-" + (++actionIdCounter));
      if (undoStack.length > 200) { undoStack.shift(); actionIdStack.shift(); }
    }

    let started = false;
    function markStarted() {
      if (started) return;
      started = true;
      if (callbacks.onStart) callbacks.onStart();
    }

    function selectCell(i) {
      if (paused || solved) return;
      sel = i;
      boardEl.focus();
      render();
    }

    function enterValue(n) {
      if (paused || !P || sel < 0 || given[sel]) return;
      markStarted();
      snapshot();
      if (notesMode) {
        const previousEnabled = notes[sel].has(n);
        notes[sel].has(n) ? notes[sel].delete(n) : notes[sel].add(n);
        // Bug fix (2026-07-26): note toggles were never logged at all, so a
        // web-originated Su-Pu's saved moveHistory had zero record of pencil
        // marks ever existing — the replay had nothing to show even before
        // considering renderer support. Toggle is symmetric (same {i,v,t}
        // for add and remove), matching mobile's share-payload convention
        // (see docs/web-team-note-rendering-handoff.md) so both platforms'
        // saved replays use one shape.
        if (n) log.push({ i: sel, v: n, t: "NOTE" });
        recordCapture("NOTE_SET", { cell_index: sel, note_value: n, previous_enabled: previousEnabled, next_enabled: !previousEnabled });
      } else {
        const previousValue = vals[sel] || null;
        vals[sel] = n;
        const ownClearedDigits = [];
        for (let d = 1; d <= 9; d++) if (notes[sel].has(d)) ownClearedDigits.push(d);
        notes[sel].clear();
        const peerCleared = clearPeerNotes(notes, sel, n);
        const ok = correct(sel);
        if (!ok) errors++;
        if (n) log.push({ i: sel, v: n, t: ok ? "OK" : "✕" });
        // R4's no-op rule: re-entering the same value the cell already held
        // is not a real mutation for the canonical stream (the legacy log
        // above is intentionally left as-is — unrelated, pre-existing
        // behavior, not this step's scope).
        if (previousValue !== n) {
          const clearedPeerNotes = ownClearedDigits.map((d) => ({ cell_index: sel, note_value: d }))
            .concat(peerCleared.map((c) => ({ cell_index: c, note_value: n })));
          recordCapture("VALUE_SET", { cell_index: sel, previous_value: previousValue, next_value: n, cleared_peer_notes: clearedPeerNotes });
        }
      }
      techHighlight = [];
      techHighlightPrimary = [];
      if (callbacks.onTechniqueHint) callbacks.onTechniqueHint(null);
      render();
      checkDone();
    }

    function eraseCell() {
      if (paused || !P || sel < 0 || given[sel]) return;
      if (!vals[sel] && notes[sel].size === 0) return;
      snapshot();
      // Bug fix (2026-07-27): erasing a committed value (e.g. clearing a
      // mistake before re-entering the correct digit) was never logged at
      // all — a replay had zero record the cell was ever cleared, jumping
      // straight from the wrong digit to the eventual right one with no
      // "correction" step in between (user-reported: "did make a mistake
      // but used erase to correct it later... not captured"). Only logged
      // when a real value existed — erasing a notes-only cell is silent in
      // this legacy shorthand log, unchanged (out of this step's scope).
      const hadValue = !!vals[sel];
      const previousValue = vals[sel] || null;
      const previousNoteDigits = [];
      for (let d = 1; d <= 9; d++) if (notes[sel].has(d)) previousNoteDigits.push(d);
      if (vals[sel]) log.push({ i: sel, v: 0, t: "ERASE" });
      vals[sel] = 0;
      notes[sel].clear();
      // Canonical capture is deliberately MORE complete than the legacy log
      // here: R2 requires capturing every committed note-membership change,
      // and VALUE_CLEAR's frozen payload (fixtures/normative/solve-event-
      // capture/v1) has no notes field of its own — a value-bearing cell
      // never has its own notes to clear by this engine's own invariant
      // (entering any value already clears its own notes), verified by
      // tracing every mutation path before this step. A notes-only erase is
      // represented as its true constituent NOTE_SET actions instead, using
      // only the already-frozen event taxonomy — no new event shape.
      if (hadValue) {
        recordCapture("VALUE_CLEAR", { cell_index: sel, previous_value: previousValue, next_value: null });
      } else {
        previousNoteDigits.forEach((d) => {
          recordCapture("NOTE_SET", { cell_index: sel, note_value: d, previous_enabled: true, next_enabled: false });
        });
      }
      techHighlight = [];
      techHighlightPrimary = [];
      if (callbacks.onTechniqueHint) callbacks.onTechniqueHint(null);
      render();
    }

    function toggleNotes() {
      if (paused) return;
      notesMode = !notesMode;
      flash(tools.notes);
      render();
      if (callbacks.onNotesToggle) callbacks.onNotesToggle(notesMode);
    }

    // Web Capture Parity, Step 2 (2026-09-04) — replaces the single-digit
    // noteDiffDigit() this file used to have. Two real, distinct bugs in
    // the original, found while designing UNDO_APPLY's ordered mutation
    // list (fixtures/normative/solve-event-capture/v1's own frozen
    // contract needs a COMPLETE diff, not a best-effort one):
    //   1. noteDiffDigit() returned only the FIRST differing digit — a
    //      value entry that clears several pre-existing notes at once
    //      (notes[sel].clear()) and is later undone should restore all of
    //      them, not just one.
    //   2. undo()'s own loop below used to `continue` past the note-diff
    //      entirely whenever a cell's VALUE also changed — but a value
    //      change and its own cell's note restoration happen in the SAME
    //      undo step (entering a value or taking a hint always clears that
    //      cell's own notes first), so the old code silently dropped every
    //      note restoration whenever a value was also restored in that
    //      cell — not just under-counting digits, dropping them entirely.
    // Ascending digit order (1-9) is the natural loop order below.
    function noteDiffDigits(before, after) {
      const digits = [];
      for (let n = 1; n <= 9; n++) if (before.has(n) !== after.has(n)) digits.push(n);
      return digits;
    }

    function undo() {
      if (!undoEnabled) return;
      const s = undoStack.pop();
      const actionId = actionIdStack.pop();
      if (!s) return;
      const prevVals = vals, prevNotes = notes;
      vals = s.vals;
      notes = s.notes;
      // Bug fix (2026-09-04): undo used to restore the board silently
      // without ever touching `log` — the saved moveHistory kept every
      // move ever made, including ones the player undid, so a saved
      // replay could misrepresent the final board (move-event-fidelity
      // project, Phase 1). Diff the whole board rather than assuming a
      // fixed correspondence between one undoStack pop and one log
      // entry — eraseCell() calls snapshot() unconditionally but only
      // pushes a log entry when a real value existed (see its own
      // comment above), so the two aren't reliably 1:1.
      //
      // Deliberately reuses the EXISTING tag vocabulary (OK/✕/ERASE/
      // NOTE) for the corrective entry — the value a cell settles on
      // after the undo, tagged exactly as a fresh forward move to that
      // same value would be — rather than inventing a new "UNDO" tag.
      // supu-verify.service.ts's replay loop treats any tag outside
      // {NOTE, ERASE, HINT} as a bare placement it applies to the
      // replay board and checks for a mistake; an unrecognized tag
      // would risk exactly that miscount. Reusing OK/✕/ERASE/NOTE needs
      // zero server-side change and is provably safe, since the server
      // already knows how to apply and score each of them correctly.
      const mutations = [];
      for (let i = 0; i < 81; i++) {
        if (prevVals[i] !== vals[i]) {
          if (vals[i]) log.push({ i, v: vals[i], t: correct(i) ? "OK" : "✕" });
          else log.push({ i, v: 0, t: "ERASE" });
          mutations.push({ cell_index: i, kind: "VALUE", previous_value: prevVals[i] || null, next_value: vals[i] || null });
        }
        // No `continue` here — a value change and its own cell's note
        // restoration are independent facts about the same cell and both
        // need recording (see this function's header comment, bug #2).
        const diffDigits = noteDiffDigits(prevNotes[i], notes[i]);
        diffDigits.forEach((d) => {
          log.push({ i, v: d, t: "NOTE" });
          mutations.push({ cell_index: i, kind: "NOTE", note_value: d, previous_enabled: prevNotes[i].has(d), next_enabled: notes[i].has(d) });
        });
      }
      if (mutations.length && actionId) recordCapture("UNDO_APPLY", { action_id: actionId, mutations: mutations });
      techHighlight = [];
      techHighlightPrimary = [];
      if (callbacks.onTechniqueHint) callbacks.onTechniqueHint(null);
      render();
      if (callbacks.onUndo) callbacks.onUndo();
    }

    function hint() {
      if (paused || !P || solved) return;
      if (!hintEnabled) { toast("Hint is turned off"); return; }
      if (sel < 0 || given[sel]) { toast("Select an empty cell first"); return; }
      if (!S) { toast("Hint isn't available for this puzzle"); return; }
      if (vals[sel] === +S[sel]) { toast("That cell is already correct"); return; }
      markStarted();
      snapshot();
      const previousValue = vals[sel] || null;
      const ownClearedDigits = [];
      for (let d = 1; d <= 9; d++) if (notes[sel].has(d)) ownClearedDigits.push(d);
      vals[sel] = +S[sel];
      notes[sel].clear();
      const peerCleared = clearPeerNotes(notes, sel, +S[sel]);
      hints++;
      log.push({ i: sel, v: vals[sel], t: "HINT" });
      const clearedNotes = ownClearedDigits.map((d) => ({ cell_index: sel, note_value: d }))
        .concat(peerCleared.map((c) => ({ cell_index: c, note_value: vals[sel] })));
      recordCapture("HINT_REVEAL", { cell_index: sel, previous_value: previousValue, next_value: vals[sel], cleared_notes: clearedNotes });
      techHighlight = [];
      techHighlightPrimary = [];
      if (callbacks.onTechniqueHint) callbacks.onTechniqueHint(null);
      flash(tools.hint);
      if (callbacks.onHint) callbacks.onHint(); else toast("💡 Hint used");
      render();
      checkDone();
    }

    // Phase 3 of the technique-playbook proposal (2026-07-18): "Show" tool,
    // practice mode only (config.technique). Asks the backend whether
    // config.technique currently applies to the live board (given + vals,
    // as the player has it right now) and, if so, highlights the cells
    // involved — unlike hint(), it never reveals a value.
    let techniqueRequestId = 0;
    async function techniqueHint() {
      if (paused || !P || solved || !config.technique) return;
      const api = window.OrbaceAPI;
      if (!api || !api.getTechniqueHint) { toast("Technique hint isn't available right now"); return; }
      const board = vals.slice();
      const myRequest = ++techniqueRequestId;
      flash(tools.technique);
      try {
        const res = await api.getTechniqueHint({ board: board, technique: config.technique });
        if (myRequest !== techniqueRequestId) return; // stale response (board changed mid-request)
        if (res && res.found) {
          techHighlight = res.highlightCellIndices || [];
          techHighlightPrimary = res.placementIndex != null ? [res.placementIndex] : techHighlight.slice();
          render();
          if (callbacks.onTechniqueHint) callbacks.onTechniqueHint(res);
        } else {
          techHighlight = [];
          techHighlightPrimary = [];
          render();
          if (callbacks.onTechniqueHint) callbacks.onTechniqueHint(null);
          toast("Nothing to show yet — fill in a bit more first");
        }
      } catch (e) {
        toast("Couldn't check the board — try again");
      }
    }

    function flash(btn) {
      if (!btn) return;
      btn.classList.remove("flash");
      void btn.offsetWidth;
      btn.classList.add("flash");
      setTimeout(() => btn.classList.remove("flash"), 350);
    }

    function checkDone() {
      if (solved || !S) return;
      if (vals.every((v, i) => v === +S[i])) {
        solved = true;
        clearInterval(timerHandle);
        if (callbacks.onSolved) callbacks.onSolved({ errors, hints, log, secs, givens: P, solution: S, meta: pzMeta, captureSnapshot: captureSession ? captureSession.snapshot() : [], captureDegraded: captureSession ? captureSession.isDegraded() : false });
        else toast("✨ Solved in " + fmtSecs(secs) + (errors === 0 && hints === 0 ? " — no errors, no hints." : "."));
      }
    }

    function render() {
      const selRow = sel >= 0 ? Math.floor(sel / 9) : -1;
      const selCol = sel >= 0 ? sel % 9 : -1;
      const selBox = sel >= 0 ? Math.floor(selRow / 3) * 3 + Math.floor(selCol / 3) : -1;

      cellEls.forEach((d, i) => {
        const r = Math.floor(i / 9), c = i % 9, box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        d.classList.toggle("given", !!given[i]);
        d.classList.toggle("user", !given[i] && vals[i] !== 0);
        d.classList.toggle("sel", i === sel);
        d.classList.toggle("peer", sel >= 0 && i !== sel && (r === selRow || c === selCol || box === selBox));
        d.classList.toggle("same", sel >= 0 && vals[sel] !== 0 && vals[i] === vals[sel] && i !== sel);
        d.classList.toggle("err", liveMistakeCheck && vals[i] !== 0 && !correct(i));
        d.classList.toggle("tech-hint", techHighlight.indexOf(i) !== -1);
        d.classList.toggle("tech-hint-primary", techHighlightPrimary.indexOf(i) !== -1);

        if (vals[i] !== 0) {
          d.textContent = String(vals[i]);
        } else if (notes[i].size) {
          d.innerHTML = "";
          const grid = document.createElement("div");
          grid.className = "og-notes";
          for (let v = 1; v <= 9; v++) {
            const s = document.createElement("span");
            s.textContent = notes[i].has(v) ? String(v) : "";
            grid.appendChild(s);
          }
          d.appendChild(grid);
        } else {
          d.textContent = "";
        }
      });

      keypadEl.classList.toggle("notes-on", notesMode);
      tools.notes.classList.toggle("on", notesMode);
      tools.undo.disabled = undoStack.length === 0 || !undoEnabled;
      tools.erase.disabled = sel < 0 || !!given[sel];
      tools.hint.disabled = !S || !hintEnabled;
      if (tools.technique) tools.technique.disabled = solved;
    }

    boardEl.addEventListener("keydown", (e) => {
      if (paused || solved || !P) return;
      if (e.key >= "1" && e.key <= "9") { enterValue(+e.key); e.preventDefault(); return; }
      if (e.key === "Backspace" || e.key === "Delete") { eraseCell(); e.preventDefault(); return; }
      if (e.key === "n" || e.key === "N" || e.key === " ") { toggleNotes(); e.preventDefault(); return; }
      if (e.key === "h" || e.key === "H") { hint(); e.preventDefault(); return; }
      if (sel < 0) return;
      const r = Math.floor(sel / 9), c = sel % 9;
      if (e.key === "ArrowUp" && r > 0) { selectCell(sel - 9); e.preventDefault(); }
      if (e.key === "ArrowDown" && r < 8) { selectCell(sel + 9); e.preventDefault(); }
      if (e.key === "ArrowLeft" && c > 0) { selectCell(sel - 1); e.preventDefault(); }
      if (e.key === "ArrowRight" && c < 8) { selectCell(sel + 1); e.preventDefault(); }
    });

    tools.erase.addEventListener("click", eraseCell);
    tools.undo.addEventListener("click", undo);
    tools.notes.addEventListener("click", toggleNotes);
    tools.hint.addEventListener("click", hint);
    if (tools.technique) tools.technique.addEventListener("click", techniqueHint);

    buildBoard();
    buildKeypad();

    function applyPuzzle(pz, metaText) {
      // puzzle_name (2026-08-29) is optional and only ever set by Puzzle
      // Packs' "Puzzle Challenge" selection path — carried through here (not
      // read live from the caller's own state at save time) so it stays
      // correct even if the caller has already moved on to a different
      // puzzle by the time onSaveSupu() actually fires.
      pzMeta = pz && pz.puzzle_id ? { puzzle_id: pz.puzzle_id, tier: pz.tier, tier_index: pz.tier_index, givens: pz.givens, solution: pz.solution, puzzle_name: pz.puzzle_name || null } : null;
      P = pz.givens;
      S = pz.solution || "";
      given = [...P].map(Number);
      vals = given.slice();
      notes = Array.from({ length: 81 }, () => new Set());
      sel = -1;
      notesMode = false;
      undoStack = [];
      errors = 0;
      hints = 0;
      solved = false;
      paused = false;
      started = false;
      log = [];
      actionIdStack = [];
      actionIdCounter = 0;
      if (captureSession) captureSession.reset(pzMeta && pzMeta.puzzle_id ? pzMeta.puzzle_id : null);
      if (captureClock) { captureClock.reset(); captureClock.start(); }
      secs = 0;
      techHighlight = [];
      techHighlightPrimary = [];
      if (callbacks.onTechniqueHint) callbacks.onTechniqueHint(null);
      boardEl.classList.remove("og-paused");
      if (metaEl) { metaEl.onclick = null; metaEl.textContent = metaText || ""; }
      if (timerEl) timerEl.textContent = "00:00";
      render();
      if (!config.controlled) startTimer();
      if (callbacks.onLoaded) callbacks.onLoaded(pzMeta);
    }

    // Daily Tea Moment puzzle for standalone hosts (the static /play page,
    // site re-imagined v2 R2) — same retry UX as loadByTier below.
    // Fixed 2026-07-22 (SEO audit finding): this was calling getDailyPuzzle(),
    // the separate Daily Ranking ORG game's rotation endpoint, and labeling
    // its (stale, unrelated) date as "Tea Moment" — showing a mismatched
    // puzzle/date. Tea Moment is its own daily-assignment system; the
    // correct endpoint is getTeaMomentToday() (GET /tea-moment/today), which
    // has no client-facing "date" field to mislabel.
    async function loadDaily() {
      if (metaEl) metaEl.textContent = "Loading…";
      try {
        const api = window.OrbaceAPI;
        const pz = await api.getTeaMomentToday();
        if (!pz || !pz.givens) {
          if (metaEl) { metaEl.textContent = "No puzzle available — tap to retry."; metaEl.onclick = () => loadDaily(); }
          return;
        }
        applyPuzzle(pz, "Tea Moment");
      } catch (e) {
        if (metaEl) { metaEl.textContent = "Couldn't load a puzzle — tap to retry."; metaEl.onclick = () => loadDaily(); }
      }
    }

    async function loadByTier(tier) {
      if (metaEl) metaEl.textContent = "Loading…";
      try {
        const api = window.OrbaceAPI;
        const res = await api.getTeamomentPuzzles({ tier: tier, limit: 1, sort: "recent" });
        const catalogPz = res && res.items && res.items.length ? res.items[0] : null;
        const pz = catalogPz || (await api.getDailyPuzzle().catch(() => null));
        if (!pz) {
          if (metaEl) { metaEl.textContent = "No puzzle available — tap to retry."; metaEl.onclick = () => loadByTier(tier); }
          return;
        }
        applyPuzzle(pz, (TIER_LABELS[tier] || "Beginner") + (pz.tier_index ? " #" + pz.tier_index : ""));
      } catch (e) {
        if (metaEl) { metaEl.textContent = "Couldn't load a puzzle — tap to retry."; metaEl.onclick = () => loadByTier(tier); }
      }
    }

    return {
      loadByTier: loadByTier,
      loadDaily: loadDaily,
      loadPuzzle: (pz, metaText) => applyPuzzle(pz, metaText),
      pause: () => { paused = true; boardEl.classList.add("og-paused"); if (captureClock) captureClock.pause(); },
      resume: () => { paused = false; boardEl.classList.remove("og-paused"); if (captureClock) captureClock.resume(); },
      destroy: () => clearInterval(timerHandle),
      getLog: () => log.slice(),
      // Web Capture Parity, Step 2. Mirrors getLog()'s directly-callable
      // pattern for callers that read state on demand rather than only via
      // onSolved's payload (which also carries captureSnapshot/
      // captureDegraded — see checkDone() above). Empty array / false on
      // any page that hasn't loaded solve-event-capture.js yet (Step 4).
      getCaptureSnapshot: () => captureSession ? captureSession.snapshot() : [],
      isCaptureDegraded: () => captureSession ? captureSession.isDegraded() : false,
      // UAT feedback (2026-09-19): runtime toggles for a host that wants to
      // let the player flip these mid-solve (a settings/tools panel) rather
      // than only fix them at mount time via options.mistakeCheck/
      // hintEnabled. Both re-render immediately so the board/toolrow reflect
      // the new state without waiting for the next real move.
      setMistakeCheck: (on) => { liveMistakeCheck = on !== false; render(); },
      setHintEnabled: (on) => { hintEnabled = on !== false; render(); },
      getMistakeCheck: () => liveMistakeCheck,
      getHintEnabled: () => hintEnabled,
      // UAT feedback (2026-09-20) — see undoEnabled's own declaration
      // comment above for why a host needs this.
      setUndoEnabled: (on) => { undoEnabled = on !== false; render(); },
      getUndoEnabled: () => undoEnabled
    };
  }

  function mount(container, options) {
    options = options || {};
    const tier = options.tier || "foundation";

    container.innerHTML =
      '<div class="og-wrap">' +
        '<div class="og-board-col"><div class="og-board"></div></div>' +
        '<div class="og-side">' +
          '<div class="og-meta">' +
            '<div class="og-meta-title">Orbace Sudoku</div>' +
            '<div class="og-meta-sub" data-role="meta">Loading…</div>' +
            '<div class="og-timer" data-role="timer">00:00</div>' +
          '</div>' +
          '<div class="og-keypad"></div>' +
          '<div class="og-toolrow"></div>' +
          // UAT feedback (2026-09-19): leisure play (Today/Play/Puzzle
          // Packs — every mount() consumer) keeps live error-highlighting ON
          // by default (unchanged behavior), but the player can now see and
          // turn it off, rather than it being an invisible side effect of
          // whether a solution happens to be loaded. Ranked/competition
          // play is unaffected either way — that mounts via
          // mountControlled() directly with no `solution` at all, and never
          // renders this markup (see js/app.js's official-attempt mount).
          '<label class="og-mistake-toggle"><input type="checkbox" checked> Error check</label>' +
          '<div class="og-help">' +
            '<b>1</b>–<b>9</b> input number &nbsp; <b>←↑↓→</b> navigate<br>' +
            '<b>N</b> toggle notes &nbsp; <b>Del</b> erase &nbsp; <b>H</b> hint<br>' +
            '<span class="amber">Mistakes are shown gently in amber — never a red alert.</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    const elements = {
      boardEl: container.querySelector(".og-board"),
      keypadEl: container.querySelector(".og-keypad"),
      toolsEl: container.querySelector(".og-toolrow"),
      metaEl: container.querySelector('[data-role="meta"]'),
      timerEl: container.querySelector('[data-role="timer"]')
    };

    const instance = createController(elements, {
      onSolved: options.onSolved,
      onStart: options.onStart,
      onHint: options.onHint,
      onUndo: options.onUndo,
      onNotesToggle: options.onNotesToggle,
      onLoaded: options.onLoaded,
    }, { controlled: false, mistakeCheck: options.mistakeCheck, hintEnabled: options.hintEnabled, undoEnabled: options.undoEnabled });
    const mistakeToggle = container.querySelector(".og-mistake-toggle input");
    if (mistakeToggle) {
      mistakeToggle.checked = instance.getMistakeCheck();
      mistakeToggle.addEventListener("change", () => instance.setMistakeCheck(mistakeToggle.checked));
    }
    // options.manual: skip the built-in daily/tier auto-fetch — the host
    // fetches its own puzzle (e.g. a Puzzle Packs pack/technique selection)
    // and calls instance.loadPuzzle(pz) itself. Without this, mount()'s
    // default loadByTier() fetch would race the host's own load and could
    // clobber it with an unrelated puzzle.
    if (options.manual) { /* host calls loadPuzzle() */ }
    else if (options.daily) instance.loadDaily();
    else instance.loadByTier(tier);
    return instance;
  }

  /* options: { boardEl, keypadEl, toolsEl, puzzle, onStart, onUndo,
   *   onNotesToggle, onHint, onSolved, technique, onTechniqueHint,
   *   mistakeCheck, hintEnabled }. No fetch, no built-in meta/timer/
   * toast-on-solve — see file header. `mistakeCheck`/`hintEnabled` (both
   * default true) gate live error-highlighting and the Hint tool
   * independently of whether `puzzle.solution` was supplied — see the
   * instance's own setMistakeCheck()/setHintEnabled() for a runtime
   * toggle instead of an options-only one. Withholding `puzzle.solution`
   * entirely (ranked/competition play's existing pattern) still turns off
   * both AND makes checkDone()'s auto-solve-detection a no-op — these two
   * flags never touch that, only the live-display/tool side.
   * `technique` (a snake_case id like "naked_single") is optional — when
   * supplied, the toolrow gets a 4th "Show" tool (Phase 3 of the
   * technique-playbook proposal) that asks the backend whether that
   * specific technique currently applies to the live board and highlights
   * the matching cells. `onTechniqueHint(res)` fires with the full result
   * (including explanationTemplateKey/params for a "why" caption) when it
   * finds something (see css/orbace-grid.css .og-cell.tech-hint for the
   * highlight styling hook), and fires with `null` whenever the highlight
   * is cleared — not found, or any real move/undo/hint/new-puzzle — so the
   * host can clear its own explanation UI in step; a built-in toast covers
   * the "nothing to show yet" case either way, no callback needed for
   * that part. */
  function mountControlled(options) {
    options = options || {};
    const elements = { boardEl: options.boardEl, keypadEl: options.keypadEl, toolsEl: options.toolsEl };
    const callbacks = {
      onStart: options.onStart,
      onUndo: options.onUndo,
      onNotesToggle: options.onNotesToggle,
      onHint: options.onHint,
      onSolved: options.onSolved,
      onTechniqueHint: options.onTechniqueHint
    };
    const instance = createController(elements, callbacks, { controlled: true, technique: options.technique, mistakeCheck: options.mistakeCheck, hintEnabled: options.hintEnabled, undoEnabled: options.undoEnabled });
    if (options.puzzle) instance.loadPuzzle(options.puzzle);
    return instance;
  }

  /* Su-Pu Library redesign (2026-08-06): a non-interactive 9x9 preview for
   * browse-grid cards — NOT a second board engine, just a static mosaic of
   * given-vs-empty cells (no digits, no candidates, no input) built from
   * .og-* box-line border tokens for brand consistency. `givens` is an
   * 81-length array/string, 0 or '.'/'0' meaning empty. */
  function renderThumb(container, givens) {
    container.innerHTML = "";
    container.className = (container.className ? container.className + " " : "") + "og-thumb";
    const cells = givens || [];
    for (let i = 0; i < 81; i++) {
      const row = Math.floor(i / 9), col = i % 9;
      const raw = cells[i];
      const filled = raw != null && raw !== "0" && raw !== "." && Number(raw) !== 0;
      const cell = document.createElement("div");
      cell.className = "og-thumb-cell" + (filled ? " given" : "") +
        (row % 3 === 0 ? " bt" : "") + (col % 3 === 0 ? " bl" : "");
      container.appendChild(cell);
    }
  }

  // Exposed so other, non-canonical board implementations (e.g. #play's
  // hand-rolled board, js/app.js) can reuse the exact same tool icons
  // instead of drifting from a second copy (validation feedback, 2026-07-17
  // — "match Tea Moment's icons exactly").
  return { mount: mount, mountControlled: mountControlled, renderThumb: renderThumb, ICONS: ICONS };
})();

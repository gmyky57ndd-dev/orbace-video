/* Orbace Sudoku — Su-Pu replay data model + reducer (Su-Pu Replay v2).
 *
 * Pure module: no DOM, no network, no dependency on any other Orbace script.
 * That is deliberate — test/replay-core.test.mjs loads it into jsdom and
 * exercises it directly, the same way test/solve-event-capture.test.mjs
 * loads js/solve-event-capture.js.
 *
 * Scope (docs/plans/2026-09-08-supu-replay-v2-web-execution-plan.md, Phase 1):
 * this file owns the `solve-event-capture-v2` event taxonomy, the board-state
 * representation, apply/revert, the keyframed timeline, and the projection
 * back down to the frozen {i,v,t} shorthand. Rendering lives in
 * js/orbace-supu-replay-v2.js; neither file touches js/orbace-supu-replay.js,
 * which still serves every live Su-Pu page unchanged.
 *
 * WHY A REDUCER AT ALL. js/orbace-supu-replay.js rebuilds the board by
 * replaying moves 0..pos on EVERY render — O(n) per step, O(n^2) for a full
 * playback, with per-type logic inlined into the render loop. Trial paths,
 * branch promotion and pins make both the cost and the branching worse. Here
 * the board is six flat typed arrays (486 bytes), every event is reversible
 * from its own payload, and a keyframe every 64 events bounds an arbitrary
 * scrub. Stepping is O(1); a full playback is O(n).
 *
 * THE INVARIANT EVERYTHING RESTS ON: every event must be applicable AND
 * revertible from its own payload alone. Most of the payload fields exist
 * only to satisfy it (previous_origin, previous_notes on a promoted cell,
 * eliminated_was_noted). test/replay-core.test.mjs walks every fixture
 * forward and then backward and compares state at every index — that walk
 * caught six real defects during the prototype, so treat a new field on an
 * event as a question about what its revert needs, every time.
 */
window.OrbaceReplayCore = (function () {
  "use strict";

  var SCHEMA_VERSION = 'solve-event-capture-v2';

  /* v1 taxonomy, unchanged and still authoritative for scoring. */
  var V1_EVENTS = ['VALUE_SET','VALUE_CLEAR','NOTE_SET','HINT_REVEAL','UNDO_APPLY','REDO_APPLY'];
  /* v2 additions.
   *
   * THE TRIAL PATH IS A TECHNIQUE, NOT A SCRATCH PAD. It is Orbace's own
   * method for extreme puzzles: when no single/pair/chain resolves, pick a
   * low-candidate cell, assume one candidate, propagate FAST, and see
   * whether the line contradicts. A contradiction is not a failure — it is
   * the technique succeeding: it ELIMINATES that candidate, and the player
   * rewinds to the seed cell and tries the next one. So the model is:
   *
   *   TRIAL SERIES  = one seed cell + the candidates being tested
   *     └ BRANCH    = one candidate's attempt   -> REFUTED | CONFIRMED | ABANDONED
   *
   * Sibling branches share a series_id. Only one branch is ever open, so a
   * series is a flat sequence of attempts, never a tree.
   *
   * "Go back to the beginning of the path and try another path" is FREE
   * here, and that is the strongest argument for keeping trials in their own
   * layer: a trial digit never touches `values`, so rewinding a dead path
   * clears the trial layer and there is nothing in the committed board to
   * undo. No undo stack, no snapshot, no compensating events.
   *
   * For scoring, only a CONFIRMED branch's promoted digits reach the legacy
   * shorthand — see projectToLegacyShorthand() at the bottom. */
  var V2_EVENTS = ['TRIAL_OPEN','TRIAL_SET','TRIAL_CLOSE','PIN_SET','TEXT_NOTE_ADD'];

  /* solve-event-capture-v5 (2026-09-29 plan, Phase 2) — branch-scoped
   * hypothetical pencil notes. The ONE new event type; TRIAL_OPEN/TRIAL_SET
   * /TRIAL_CLOSE are reused unchanged in shape (v5 only adds the optional
   * `promoted_notes` field to a root CONFIRMED close, handled inline in
   * applyEvent/revertEvent below, not a new top-level event type). */
  var V5_EVENTS = ['TRIAL_NOTE_SET'];

  /* A branch outcome is a RESULT, not a verdict on the player.
   *   REFUTED   — the line contradicted; the seed candidate is eliminated.
   *               This is the technique working, and it is the case that
   *               carries the teaching payload (`contradiction`).
   *   CONFIRMED — the line held; its digits are promoted to real values.
   *   ABANDONED — the player stopped before either. Kept distinct from
   *               REFUTED so a reflecting view can tell "I disproved this"
   *               from "I gave up on this" — different lessons.
   *   MERGED    — v4 only (solve-event-capture-v4, docs/plans/2026-09-15-
   *               supu-capture-nested-trial-merge-v4-design.md). A NESTED
   *               branch folded into its still-open parent: `cleared` and
   *               `promoted` are always empty — nothing is cleared and
   *               nothing is promoted, only which branch a trial cell is
   *               OWNED BY changes. This reducer needs no extra state for
   *               that: the capture client already resolves ownership
   *               before it writes any LATER close's `cleared`/`promoted`
   *               list (a merged branch's cells appear there under the
   *               ancestor that eventually refutes/confirms them — verified
   *               against a real production stream, SP-20260920-248831,
   *               step 71's CONFIRMED `promoted[]` already lists the cells
   *               a prior MERGED close at step 70 folded in). So MERGED
   *               falls through the same generic status-set / reopen-parent
   *               path below that ABANDONED already used — no reducer
   *               change, only the presentation layer needed one (it was
   *               rendering MERGED as "Abandoned", which is what this
   *               constant gaining a 4th value guards against going stale
   *               again). Root-only, the mirror of CONFIRMED's root-only
   *               rule — rejected server-side (ROOT_MERGE_NOT_ALLOWED). */
  var TRIAL_RESOLUTIONS = ['REFUTED', 'CONFIRMED', 'ABANDONED', 'MERGED'];

  /* Why a line died, so the replay can show it rather than assert it.
     PLAYER_DECLARED is the honest shape for a player-declared refutation
     the auto-detector found no real collision for (design Q7) — `cells` is
     allowed empty only for this kind (capture-envelope.ts). */
  var CONTRADICTION_KINDS = ['ROW_DUPLICATE','COL_DUPLICATE','BOX_DUPLICATE','CELL_NO_CANDIDATES','UNIT_DIGIT_UNPLACEABLE','PLAYER_DECLARED'];
  var EVENT_TYPES = V1_EVENTS.concat(V2_EVENTS).concat(V5_EVENTS);

  /* Frozen pin vocabulary. A closed enum, not free text: it keeps the value
     one byte in storage, keeps the renderer's glyph table total, and means a
     future client can never invent a symbol older clients can't draw. */
  var PIN_SYMBOLS = [
    { id:1, key:'PATH_START',   glyph:'▶', label:'Path start' },
    { id:2, key:'PATH_END',     glyph:'■', label:'Path end' },
    { id:3, key:'TURNING_POINT',glyph:'◆', label:'Turning point' },
    { id:4, key:'KEY_INSIGHT',  glyph:'★', label:'Key insight' },
    { id:5, key:'QUESTION',     glyph:'?', label:'Question' },
    { id:6, key:'WATCH_OUT',    glyph:'!', label:'Watch out' }
  ];
  var PIN_BY_KEY = {}, PIN_BY_ID = {};
  PIN_SYMBOLS.forEach(function (p) { PIN_BY_KEY[p.key] = p; PIN_BY_ID[p.id] = p; });

  /* v2-only keys mirror capture-envelope.ts's own LIMITS_V2 by value, not
     by import (this program's "no shared runtime" discipline) — proven
     equal by test (capture-limits-v2-parity.test.ts / .test.mjs). Until
     that test existed, maxBranchesPerSeries/maxPinsPerSolve had drifted
     out of this copy entirely (trial-path audit F5, 2026-09-11): the UI
     could let a player exceed a limit the backend then rejected at save
     time. */
  var LIMITS = {
    maxEventsPerSolve: 10000,
    maxEventBytes: 16 * 1024,
    maxStreamBytes: 2 * 1024 * 1024,
    /* new in v2 — the only unbounded-size thing the new types introduce */
    maxTextNoteChars: 500,
    maxTextNotesPerSolve: 200,
    /* v2's single-open-branch cap and v3's nesting cap, both carried so the
       v2 limits-parity fixture stays valid and the v3 reducer can enforce the
       stack depth. `maxTrialDepth` mirrors the backend LIMITS_V3 (contract
       docs/shared_artifacts/2026-09-11-solve-event-capture-v3-contract.md). */
    maxOpenTrialBranches: 1,
    maxTrialDepth: 8,
    maxTrialBranchesPerSolve: 16,
    maxBranchesPerSeries: 9,
    maxPinsPerSolve: 81
  };

  /* UAT feedback (2026-09-20): a trial branch's cells/badge get colored by
   * its own sequence number (branch_id — assigned once, in opening order,
   * never reused), cycling through this many distinct CSS classes
   * (`.oglab-trial-c0` .. `.oglab-trial-c<N-1>`, defined per-page in
   * su-pu-capture.html / su-pu-lab.html for the live board, and again in
   * orbace-supu-replay-v2.css — same class names, reused verbatim — for
   * both the replay board and its move-list rows). Set to exactly
   * LIMITS.maxTrialDepth (8) — the system's own hard cap on
   * simultaneously-open nested branches — so the deepest possible chain
   * never repeats a color; a branch far enough apart in opening order to
   * share a color anyway is never simultaneously visible with it (a closed
   * branch's trial marks are gone — promoted to real values or cleared —
   * long before its color could recur). Shared here (not duplicated in
   * orbace-grid-lab.js and orbace-supu-replay-v2.js separately) so live
   * capture and its own replay are guaranteed to use the exact same
   * branch-number -> color mapping, never just "close".
   */
  var TRIAL_COLOR_COUNT = 8;
  function trialColorClass(branchId) {
    // branch_id starts at 1 (never 0) — shift down by one so branch 1 maps
    // to c0, branch 2 to c1, ... branch 8 to c7, branch 9 back to c0, using
    // every palette slot from the very first branch instead of reserving
    // c0 for a fallback that real branch ids never actually hit.
    var n = (typeof branchId === 'number' && branchId > 0) ? (branchId - 1) : 0;
    return 'oglab-trial-c' + (n % TRIAL_COLOR_COUNT);
  }
  var TRIAL_COLOR_CLASSES = Array.from({ length: TRIAL_COLOR_COUNT }, function (_, k) { return 'oglab-trial-c' + k; });

  /** UAT feedback (2026-09-29): branch numbers read as confusing next to
   *  the grid's own digits (a trial "3" on a cell next to a real "3"), so
   *  every user-visible branch label uses letters instead — bijective
   *  base-26 (a..z, then aa, ab, ...), matching the convention already
   *  live in the Reddit prototype's own trial-branch UI. `branch_id` on
   *  the wire (and everywhere internal to this module/orbace-grid-lab.js)
   *  stays the plain sequential number it always was — this is a display-
   *  only transform, called at the last possible moment before text hits
   *  the DOM, same as trialColorClass() right above it. */
  function branchLetter(branchId) {
    var n = (typeof branchId === 'number' && branchId > 0) ? Math.floor(branchId) : 1;
    var s = '';
    while (n > 0) {
      var rem = (n - 1) % 26;
      s = String.fromCharCode(97 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  /* ---------------------------------------------------------------------
     BOARD STATE — six flat typed arrays, 486 bytes total. Cloning one is a
     handful of memcpys, which is what makes keyframing cheap enough to be
     worth doing (see createTimeline below).
     --------------------------------------------------------------------- */
  var ORIGIN = { NONE:0, GIVEN:1, USER:2, HINT:3, PROMOTED:4 };

  function emptyState() {
    return {
      values:  new Int8Array(81),    // 0 empty, 1..9
      origin:  new Uint8Array(81),   // ORIGIN.*
      notes:   new Uint16Array(81),  // bit d (1..9) set => candidate present
      trials:  new Int8Array(81),    // 0 none, 1..9 — ONE trial digit per cell
      tbranch: new Uint8Array(81),   // branch id owning that trial mark
      // solve-event-capture-v5 — the hypothetical pencil-note overlay, same
      // "effective value + owning branch id" shape as trials[]/tbranch[]
      // above but for candidate masks instead of a single digit. Reseeded
      // from committed `notes` on every ROOT TRIAL_OPEN (applyEvent below);
      // a nested open inherits whatever is already here unchanged, exactly
      // like trials[] does for digits. Mirrors orbace-grid-lab.js's
      // identical pair on the live-capture side. INVARIANT this file relies
      // on for test parity: whenever `openBranch === 0` (idle, no branch
      // anywhere open), trialNoteMasks[i] === notes[i] for every i — see
      // applyEvent's TRIAL_CLOSE case for how every resolution maintains
      // this exactly.
      trialNoteMasks: new Uint16Array(81),
      trialNoteOwners: new Uint8Array(81),
      pins:    new Uint8Array(81),   // 0 none, else PIN_SYMBOLS id
      given:   new Uint8Array(81),   // 1 = clue, immutable for the whole solve
      openBranch: 0,                 // 0 = none open
      branches: {},                  // id -> {id,label,status,seed,seriesId,testing,contradiction}
      series: {}                     // id -> {id,cellIndex,candidates[],eliminated[],resolvedTo}
      /* NOTE: the contradiction cells are deliberately NOT held here. They
         are a property of ONE event (the refuted close), not accumulated
         state, so storing them made the state un-revertible — reverting the
         NEXT event cleared a flash that belonged to the previous one. The
         renderer derives them from events[pos-1] instead. Caught by the
         forward/backward walk, 2026-09-08. */
    };
  }

  /* solve-event-capture-v5 — shallow copy of a branch's beforeNotes map,
   * each cell index -> {mask, owner} value objects that must themselves be
   * copied, not shared by reference, exactly like every other piece of
   * per-branch state cloneState() below already copies. */
  function copyNoteMap(m) {
    var out = {};
    for (var k in m) if (m.hasOwnProperty(k)) out[k] = { mask: m[k].mask, owner: m[k].owner };
    return out;
  }

  function cloneState(s) {
    var b = {}, se = {};
    for (var k in s.branches) {
      var x = s.branches[k];
      b[k] = { id:x.id, label:x.label, status:x.status, seed:x.seed,
               seriesId:x.seriesId, testing:x.testing, contradiction:x.contradiction,
               parentId:x.parentId, // v3: parent branch id (null = root)
               // v4: exactly which cells THIS branch's own MERGED close
               // reassigned to its parent, so revertEvent can move them back
               // without rescanning tbranch (which by then may hold other
               // branches' cells too — see applyEvent's TRIAL_CLOSE/MERGED
               // case for why a scan-at-revert-time can't tell those apart).
               // null except in the narrow window between a MERGED close
               // being applied and either its own revert or the branch being
               // deleted by a TRIAL_OPEN revert.
               mergedCells: x.mergedCells ? x.mergedCells.slice() : null,
               // solve-event-capture-v5 — beforeNotes: every cell this
               // branch's OWN TRIAL_NOTE_SET events (or, for a nested
               // refute's elimination, a descendant's own elimination) have
               // touched, first-touch-only before-image (cell -> {mask,
               // owner}), read by TRIAL_CLOSE to know what to restore/
               // promote/fold. Always an object (possibly empty), set at
               // TRIAL_OPEN apply.
               beforeNotes: copyNoteMap(x.beforeNotes || {}),
               // mergedNoteKeys: exactly which beforeNotes keys THIS
               // branch's own MERGED close newly added to its PARENT (not
               // ones the parent already had), so revertEvent removes
               // precisely those and nothing else. null except in the
               // narrow window between that close applying and either its
               // own revert or this branch being deleted by a TRIAL_OPEN
               // revert — same lifecycle as mergedCells above.
               mergedNoteKeys: x.mergedNoteKeys ? x.mergedNoteKeys.slice() : null,
               // preCloseSnapshot: a full-array snapshot of the WHOLE note
               // overlay (masks + owners, all 81 cells), taken
               // UNCONDITIONALLY at the top of THIS branch's own
               // TRIAL_CLOSE apply, before any resolution-specific
               // mutation (restore-to-before-image, elimination, or a root
               // close's wipe) runs. This is the one piece of state
               // revertEvent cannot recover any other way — unlike digit
               // promotion, which carries `trial_value` on the wire for
               // exactly this purpose, ABANDONED/REFUTED carry no note-mask
               // snapshot at all (the wire contract forbids one), and even
               // where a REFUTED elimination touches one specific cell,
               // there is no field covering the OTHER 80 a root close's
               // wipe also affects. Same null-except-in-the-narrow-window
               // lifecycle as mergedCells above.
               preCloseSnapshot: x.preCloseSnapshot
                 ? { masks: x.preCloseSnapshot.masks.slice(), owners: x.preCloseSnapshot.owners.slice() }
                 : null,
               // elimCreatedParentBeforeNote: set only by a NESTED REFUTED's
               // elimination — whether THIS elimination was the PARENT's
               // first touch of the eliminated cell (i.e. whether it
               // created the parent's own beforeNotes entry for that cell,
               // which revertEvent must then remove). Not recoverable from
               // the close event's own payload (it carries no
               // previous_branch_id for the eliminated cell the way a real
               // TRIAL_NOTE_SET would) or from preCloseSnapshot (that's
               // THIS branch's overlay arrays, not the PARENT's own
               // beforeNotes map — a different branch's state). Same
               // lifecycle as the others above.
               elimCreatedParentBeforeNote: x.elimCreatedParentBeforeNote || null };
    }
    for (var m in s.series) {
      var y = s.series[m];
      se[m] = { id:y.id, cellIndex:y.cellIndex, candidates:y.candidates.slice(),
                elimCount:y.elimCount.slice(), resolvedTo:y.resolvedTo, resolvedBy:y.resolvedBy };
    }
    return {
      values: s.values.slice(), origin: s.origin.slice(), notes: s.notes.slice(),
      trials: s.trials.slice(), tbranch: s.tbranch.slice(),
      trialNoteMasks: s.trialNoteMasks.slice(), trialNoteOwners: s.trialNoteOwners.slice(),
      pins: s.pins.slice(),
      given: s.given,   /* immutable for the solve — shared, never copied */
      openBranch: s.openBranch, branches: b, series: se
    };
  }

  function initialState(givens) {
    var s = emptyState();
    for (var i = 0; i < 81; i++) {
      var d = +givens[i] || 0;
      if (d) { s.values[i] = d; s.origin[i] = ORIGIN.GIVEN; s.given[i] = 1; }
    }
    return s;
  }

  function noteBit(d) { return 1 << d; }

  /* Givens are immutable. The backend envelope validator rejects any
     VALUE_SET / VALUE_CLEAR / HINT_REVEAL / TRIAL_SET / mutation naming a
     clue cell outright (error code CELL_IS_GIVEN), so in a well-formed
     stream these guards never fire — they exist so a malformed or
     adversarial stream degrades into a wrong-looking board rather than
     one that silently erases its own clues on rewind, which is exactly the
     failure this harness caught on its first full backward walk.
     A pin, by contrast, IS allowed on a given: annotating a clue is a
     normal teaching act. */
  function writeValue(s, i, v, org) {
    if (s.given[i]) return;
    s.values[i] = v || 0;
    s.origin[i] = v ? org : ORIGIN.NONE;
  }
  function writeTrial(s, i, v, branchId) {
    if (s.given[i]) return;
    s.trials[i] = v || 0;
    s.tbranch[i] = v ? branchId : 0;
  }

  /* ---------------------------------------------------------------------
     APPLY / REVERT. Mutates in place and returns the same state object —
     the timeline decides when to clone. Each revert is the exact algebraic
     inverse of its apply, reading only the event's own payload; nothing
     here consults the history.
     --------------------------------------------------------------------- */
  function applyEvent(s, ev, schemaVersion) {
    var p = ev.payload, i = p.cell_index, k;
    // solve-event-capture-v5 — the ONE place this stream's declared version
    // changes replay semantics: a nested REFUTED's elimination destination
    // (wire contract §4). Every other v5 addition (TRIAL_NOTE_SET, root
    // CONFIRMED's promoted_notes) is unambiguous purely from which fields
    // are present, so it needs no version check. Omitted by every existing
    // caller today (createTimeline(givens, events) with no third opts
    // field, or opts without schemaVersion) — schemaVersion is then
    // undefined, isV5 is false, and v1-v4 replay is byte-for-byte
    // unchanged, which is the whole reason this stays optional rather than
    // required.
    var isV5 = schemaVersion === 'solve-event-capture-v5';
    switch (ev.event_type) {
      case 'VALUE_SET':
        writeValue(s, i, p.next_value, ORIGIN.USER); s.notes[i] = 0;
        (p.cleared_peer_notes || []).forEach(function (c) { s.notes[c.cell_index] &= ~noteBit(c.note_value); });
        break;
      case 'VALUE_CLEAR':
        writeValue(s, i, 0, ORIGIN.NONE); break;
      case 'NOTE_SET':
        if (p.next_enabled) s.notes[i] |= noteBit(p.note_value); else s.notes[i] &= ~noteBit(p.note_value);
        break;
      case 'HINT_REVEAL':
        writeValue(s, i, p.next_value, ORIGIN.HINT); s.notes[i] = 0;
        (p.cleared_notes || []).forEach(function (c) { s.notes[c.cell_index] &= ~noteBit(c.note_value); });
        break;
      case 'UNDO_APPLY': case 'REDO_APPLY':
        p.mutations.forEach(function (m) {
          if (m.kind === 'VALUE') writeValue(s, m.cell_index, m.next_value, m.next_origin || ORIGIN.USER);
          else if (m.kind === 'NOTE') { if (m.next_enabled) s.notes[m.cell_index] |= noteBit(m.note_value);
                                        else s.notes[m.cell_index] &= ~noteBit(m.note_value); }
          else if (m.kind === 'TRIAL') writeTrial(s, m.cell_index, m.next_value, m.branch_id);
        });
        break;

      /* ---- v2 ---- */
      case 'TRIAL_OPEN':
        s.openBranch = p.branch_id;
        /* Create iff the event says it creates one, and delete on revert under
           exactly the same condition — a conditional apply paired with an
           unconditional revert is how state stops being reversible (this
           module's defect 5 and 7 were both that shape). A malformed stream
           whose branch names a series that was never opened simply gets no
           series entry: degraded rendering, never corrupted state. */
        if (p.series_id && p.creates_series) {
          s.series[p.series_id] = { id:p.series_id, cellIndex:p.seed ? p.seed.cell_index : null,
                                    candidates:(p.seed && p.seed.candidates) ? p.seed.candidates.slice() : [],
                                    /* elimCount[d] = how many refuted closes eliminated digit d.
                                       A count, not a set: ++/-- are exact inverses, so two closes
                                       naming the same digit (which validation forbids, but a
                                       hand-pasted stream can still contain) cannot desync it. */
                                    elimCount:new Uint8Array(10), resolvedTo:null, resolvedBy:0 };
        }
        s.branches[p.branch_id] = { id:p.branch_id, label:p.label || ('Branch ' + p.branch_id),
                                    status:'OPEN', seed:p.seed || null, seriesId:p.series_id || null,
                                    testing:p.seed ? p.seed.testing : null, contradiction:null,
                                    /* v3: null = root; otherwise the branch this one
                                       nested under (DFS). v2 streams omit it → null,
                                       which is exactly the flat behaviour. */
                                    parentId:(p.parent_branch_id === undefined ? null : p.parent_branch_id),
                                    mergedCells:null, // v4, see cloneState's own comment
                                    beforeNotes:{}, mergedNoteKeys:null,
                                    preCloseSnapshot:null, elimCreatedParentBeforeNote:null }; // v5, see cloneState
        // solve-event-capture-v5 — root open reseeds the note overlay from
        // committed notes (wire contract §2: "on root open, masks copy
        // committed masks"); a nested open needs nothing here, the overlay
        // already holds the correct effective values inherited from
        // whichever branch (or the committed layer) it was last at.
        if (p.parent_branch_id === undefined || p.parent_branch_id === null) {
          for (var rn = 0; rn < 81; rn++) { s.trialNoteMasks[rn] = s.notes[rn]; s.trialNoteOwners[rn] = 0; }
        }
        break;
      case 'TRIAL_SET':
        writeTrial(s, i, p.next_value, p.branch_id); break;
      case 'TRIAL_NOTE_SET': {
        var bitA = noteBit(p.note_value);
        var maskBeforeA = s.trialNoteMasks[i];
        if (p.next_enabled) s.trialNoteMasks[i] |= bitA; else s.trialNoteMasks[i] &= ~bitA;
        s.trialNoteOwners[i] = p.branch_id;
        // First touch by this branch, derived from the payload alone (not
        // a live scan) — see orbace-grid-lab.js's setTrialNote() for the
        // identical reasoning: previous_branch_id differs from branch_id
        // exactly when this branch has never touched this cell's mask
        // before (null/untouched, or an inherited-from-ancestor value).
        var branchA = s.branches[p.branch_id];
        if (branchA && p.previous_branch_id !== p.branch_id) {
          branchA.beforeNotes[i] = { mask: maskBeforeA, owner: p.previous_branch_id || 0 };
        }
        break;
      }
      case 'TRIAL_CLOSE': {
        /* CONFIRMED promotes the branch's trial digits into real values, and
           carries the promotion list in its own payload so the whole thing
           stays revertible without a scan.
           REFUTED is the interesting case: clearing the trial layer IS the
           rewind — nothing in `values` was ever touched — and the payload
           carries the contradiction that killed the line plus the candidate
           it therefore eliminates, which is the result the technique exists
           to produce. */
        var closingBranch = s.branches[p.branch_id];
        // solve-event-capture-v5 — true exactly when THIS close, if it
        // completes, leaves no branch open anywhere (openBranch returns to
        // 0) — i.e. this branch has no parent. CONFIRMED is always this
        // (root-only by the existing v3 contract, enforced by the capture
        // client, trusted here); ABANDONED/REFUTED can be either.
        var isRootClose = (p.parent_branch_id === undefined || p.parent_branch_id === null);
        // solve-event-capture-v5 — a full-array snapshot of the note
        // overlay, taken UNCONDITIONALLY before this close does anything to
        // it, for ANY resolution. This is the one piece of state
        // revertEvent needs and cannot recover any other way: this event's
        // own payload carries no note-mask snapshot for ABANDONED/REFUTED
        // (the wire contract forbids one — promoted_notes is CONFIRMED-
        // only), and even where it does carry enough to reconstruct one
        // cell (a REFUTED elimination, digit promotion's `trial_value`),
        // there is no single field covering the WHOLE overlay the way a
        // root close's wipe (below) needs undone. A full 81-cell snapshot
        // is simpler and more robust than tracking exactly which cells each
        // resolution touches — this is a close event, not a hot path, so
        // the cost is a non-issue. Mirrors mergedCells's own established
        // pattern in this file (remember, don't rederive), just taken once
        // up front instead of per-mechanism.
        if (closingBranch) {
          closingBranch.preCloseSnapshot = { masks: s.trialNoteMasks.slice(), owners: s.trialNoteOwners.slice() };
        }
        (p.cleared || []).forEach(function (c) { writeTrial(s, c.cell_index, 0, 0); });
        // Restore THIS branch's own note touches to their pre-branch value
        // BEFORE the elimination below runs (matches the backend
        // reference's own order exactly: restoreFrame() then
        // applyRefutation() — capture-envelope.ts's applyTrialClose). Root
        // or nested, unconditional for ABANDONED/REFUTED; CONFIRMED never
        // restores (it promotes forward instead, handled separately below).
        if (closingBranch && p.resolution !== 'CONFIRMED' && p.resolution !== 'MERGED') {
          for (var bk in closingBranch.beforeNotes) {
            if (!closingBranch.beforeNotes.hasOwnProperty(bk)) continue;
            var restoreCell = +bk;
            var restoreBefore = closingBranch.beforeNotes[bk];
            s.trialNoteMasks[restoreCell] = restoreBefore.mask;
            s.trialNoteOwners[restoreCell] = restoreBefore.owner || 0;
          }
        }
        if (p.resolution === 'REFUTED' && p.eliminated) {
          /* the eliminated candidate stops being a candidate — the payoff. */
          var elimBit = noteBit(p.eliminated.value);
          var elimCell = p.eliminated.cell_index;
          // solve-event-capture-v5 — version-gated destination layer (wire
          // contract §4): under v5, a NESTED refute eliminates from the
          // PARENT's trial-note overlay and becomes parent-owned there
          // (reversible if that ancestor later abandons — wire contract
          // §6); a v5 ROOT refute, and every v3/v4 stream regardless of
          // nesting, keep hitting committed notes — the unchanged, pre-
          // existing behavior.
          if (isV5 && !isRootClose) {
            var parentForElim = s.branches[p.parent_branch_id];
            var hadParentBeforeNote = !!(parentForElim && parentForElim.beforeNotes.hasOwnProperty(elimCell));
            if (closingBranch) {
              // The one piece of bookkeeping preCloseSnapshot (above) can't
              // cover: whether this elimination was the PARENT's first
              // touch of this cell — that's the PARENT's own beforeNotes
              // map, a different branch's state, not this branch's overlay
              // arrays. Needed so revertEvent removes the entry only if
              // THIS elimination created it.
              closingBranch.elimCreatedParentBeforeNote = hadParentBeforeNote ? false : true;
            }
            if (parentForElim && !hadParentBeforeNote) {
              parentForElim.beforeNotes[elimCell] = { mask: s.trialNoteMasks[elimCell], owner: s.trialNoteOwners[elimCell] };
            }
            s.trialNoteMasks[elimCell] &= ~elimBit;
            if (parentForElim) s.trialNoteOwners[elimCell] = p.parent_branch_id;
          } else {
            s.notes[elimCell] &= ~elimBit;
          }
          var ser = s.series[p.series_id];
          if (ser) ser.elimCount[p.eliminated.value]++;
        }
        if (p.resolution === 'CONFIRMED' && s.series[p.series_id]) {
          /* resolvedBy records WHICH branch resolved the series, so the revert
             below clears it only when unwinding that same branch. */
          s.series[p.series_id].resolvedTo = (p.promoted && p.promoted.length)
            ? (s.branches[p.branch_id] && s.branches[p.branch_id].testing) : null;
          s.series[p.series_id].resolvedBy = p.branch_id;
        }
        if (p.resolution === 'MERGED' && s.branches[p.branch_id]) {
          /* v4. `cleared`/`promoted` are always empty for MERGED (design
             doc §3) — a merge changes OWNERSHIP, not the digits or the real
             board, so there is no per-cell payload to iterate like the two
             blocks above. The capture client (orbace-grid-lab.js's own
             mergeIntoParent()) reassigns `tbranch[i]` the same way, live,
             for exactly this reason. Mirrored here so a scrub landing
             between this close and whichever close eventually resolves the
             (now-enlarged) parent renders the merged-in cells under their
             new owner, not their old one — bug fixed 2026-09-20: before
             this, tbranch was never touched on a MERGED apply at all, so a
             seek landing in that window still showed the pre-merge branch.
             `mergedCells` records exactly which cells this reassigned
             because revertEvent CANNOT recover that list by scanning —
             after this apply, no cell is tagged `branch_id` any more (every
             one of them now reads `parent_branch_id`, indistinguishable
             from cells the parent already owned on its own), so the set has
             to be remembered, not re-derived. */
          var mergedCells = [];
          for (var mc = 0; mc < 81; mc++) {
            if (s.tbranch[mc] === p.branch_id) { mergedCells.push(mc); s.tbranch[mc] = p.parent_branch_id; }
          }
          s.branches[p.branch_id].mergedCells = mergedCells;
          /* solve-event-capture-v5 — the note-side sibling of the above:
             fold this branch's own beforeNotes up into the parent's (only
             where the parent doesn't already have an earlier entry for that
             cell — a note-only cell, with no trial digit ever placed there,
             would never appear in mergedCells at all, which is why this
             can't reuse that list), transfer ownership of every note-
             touched cell, and record exactly which keys were newly added so
             revertEvent removes precisely those, not ones the parent
             already had before this merge. */
          var parentForMerge = s.branches[p.parent_branch_id];
          if (parentForMerge) {
            var addedNoteKeys = [];
            for (var nk in s.branches[p.branch_id].beforeNotes) {
              if (!s.branches[p.branch_id].beforeNotes.hasOwnProperty(nk)) continue;
              if (!parentForMerge.beforeNotes.hasOwnProperty(nk)) {
                parentForMerge.beforeNotes[nk] = s.branches[p.branch_id].beforeNotes[nk];
                addedNoteKeys.push(nk);
              }
              s.trialNoteOwners[+nk] = p.parent_branch_id;
            }
            s.branches[p.branch_id].mergedNoteKeys = addedNoteKeys;
          }
        }
        if (s.branches[p.branch_id]) s.branches[p.branch_id].contradiction = p.contradiction || null;
        (p.promoted || []).forEach(function (c) {
          writeValue(s, c.cell_index, c.next_value, ORIGIN.PROMOTED);
          /* promotion is a real placement, so it clears the cell's notes the
             same way VALUE_SET does — which means the entry must also carry
             `previous_notes`, or the rewind cannot put them back (caught by
             the harness's forward/backward walk, 2026-09-08). */
          s.notes[c.cell_index] = 0;
          /* the trial mark is consumed by the promotion — the digit is real
             now, so it must vacate the trial slot or the cell would render
             as both provisional and committed. */
          writeTrial(s, c.cell_index, 0, 0);
        });
        /* solve-event-capture-v5 — root CONFIRMED's promoted_notes: commit
           the survivors onto the committed layer. Absent on every v1-v4
           close and every v5 close that isn't a root CONFIRMED
           (`(p.promoted_notes || [])` is then simply []). */
        if (p.resolution === 'CONFIRMED') {
          (p.promoted_notes || []).forEach(function (pn) { s.notes[pn.cell_index] = pn.next_mask; });
        }
        /* solve-event-capture-v5 — whenever this close leaves NO branch
           open anywhere (root close, any resolution), the trial-note
           overlay is fully wiped to empty — matching the backend
           reference's own resetTrialLayers() (capture-envelope.ts),
           called unconditionally after CONFIRMED and after ABANDONED/
           REFUTED specifically when the frame stack empties. This is a
           deliberate BLANKET reset, not a "sync to committed" — the idle
           overlay reads as empty, not as a committed-note mirror (verified
           against Team A's golden fixtures, docs/shared_artifacts/2026-09-
           29-solve-event-capture-v5-golden-fixtures.json: every
           open_branch_ids:[] step shows trial_note_masks/owners: {}).
           revertEvent undoes this via the preCloseSnapshot taken at the
           top of this case, which — being taken before ANY of this event's
           mutations — already covers exactly this wipe too; nothing
           further to record here. */
        if (isRootClose) {
          for (var wz = 0; wz < 81; wz++) { s.trialNoteMasks[wz] = 0; s.trialNoteOwners[wz] = 0; }
        }
        if (s.branches[p.branch_id]) {
          s.branches[p.branch_id].status = p.resolution;
          /* v3: closing a nested branch re-opens its parent (DFS). v2 branches
             have parentId null → 0, identical to the old unconditional reset. */
          s.openBranch = s.branches[p.branch_id].parentId || 0;
        } else {
          s.openBranch = 0;
        }
        break;
      }
      case 'PIN_SET':
        s.pins[i] = p.next_symbol ? PIN_BY_KEY[p.next_symbol].id : 0; break;
      case 'TEXT_NOTE_ADD':
        break; /* no board effect — lives in the note index, not the grid */
    }
    return s;
  }

  function revertEvent(s, ev, schemaVersion) {
    var p = ev.payload, i = p.cell_index;
    var isV5 = schemaVersion === 'solve-event-capture-v5'; // see applyEvent's identical declaration
    switch (ev.event_type) {
      /* `previous_origin` is a v2 addition. v1's VALUE_SET records only
         previous_value, which is not enough to rewind provenance: restoring
         a digit tells you nothing about whether it had been typed or
         revealed by a hint, so a naive revert silently re-labels a hinted
         cell as the player's own work. v2 carries it explicitly; the
         `|| ORIGIN.USER` fallback is what a v1 stream replayed under v2
         degrades to, which is the pre-existing behaviour, not a regression. */
      case 'VALUE_SET':
        writeValue(s, i, p.previous_value, p.previous_origin || ORIGIN.USER);
        s.notes[i] = p.previous_notes || 0;
        (p.cleared_peer_notes || []).forEach(function (c) { s.notes[c.cell_index] |= noteBit(c.note_value); });
        break;
      case 'VALUE_CLEAR':
        writeValue(s, i, p.previous_value, p.previous_origin || ORIGIN.USER); break;
      case 'NOTE_SET':
        if (p.previous_enabled) s.notes[i] |= noteBit(p.note_value); else s.notes[i] &= ~noteBit(p.note_value);
        break;
      case 'HINT_REVEAL':
        writeValue(s, i, p.previous_value, p.previous_origin || ORIGIN.USER);
        s.notes[i] = p.previous_notes || 0;
        (p.cleared_notes || []).forEach(function (c) { s.notes[c.cell_index] |= noteBit(c.note_value); });
        break;
      case 'UNDO_APPLY': case 'REDO_APPLY':
        p.mutations.forEach(function (m) {
          if (m.kind === 'VALUE') writeValue(s, m.cell_index, m.previous_value, m.previous_origin || ORIGIN.USER);
          else if (m.kind === 'NOTE') { if (m.previous_enabled) s.notes[m.cell_index] |= noteBit(m.note_value);
                                        else s.notes[m.cell_index] &= ~noteBit(m.note_value); }
          else if (m.kind === 'TRIAL') writeTrial(s, m.cell_index, m.previous_value, m.branch_id);
        });
        break;
      case 'TRIAL_OPEN':
        // solve-event-capture-v5 — exact inverse of applyEvent's root-open
        // reseed: idle (no branch open anywhere) reads as an EMPTY overlay,
        // not "matches committed" (see applyEvent's TRIAL_CLOSE case for
        // why — verified against Team A's golden fixtures). A root open's
        // own reseed populates all 81 cells from committed notes; nothing
        // else ever un-populates the UNTOUCHED ones (a touched cell's own
        // TRIAL_NOTE_SET revert already handles itself), so this revert
        // must do it explicitly, or an untouched cell's reseed value leaks
        // into the idle state once this branch (and everything nested
        // under it) has been fully reverted away.
        if (p.parent_branch_id === undefined || p.parent_branch_id === null) {
          for (var ro = 0; ro < 81; ro++) { s.trialNoteMasks[ro] = 0; s.trialNoteOwners[ro] = 0; }
        }
        delete s.branches[p.branch_id];
        /* the series outlives its branches, so it is only unwound when the
           branch being reverted is the one that created it — the exact
           mirror of the apply condition above */
        if (p.series_id && p.creates_series) delete s.series[p.series_id];
        /* v3: reverting a nested open re-opens the parent it nested under
           (v2's parent_branch_id is absent → 0). */
        s.openBranch = p.parent_branch_id || 0; break;
      case 'TRIAL_SET': {
        /* v3: restore the mark's PREVIOUS owner (a nested branch may have
           overwritten an ancestor's mark). Absent in v2 → the setting branch. */
        var prevOwner = (p.previous_branch_id === undefined) ? p.branch_id : (p.previous_branch_id || 0);
        writeTrial(s, i, p.previous_value, prevOwner); break;
      }
      case 'TRIAL_NOTE_SET': {
        var bitB = noteBit(p.note_value);
        if (p.previous_enabled) s.trialNoteMasks[i] |= bitB; else s.trialNoteMasks[i] &= ~bitB;
        s.trialNoteOwners[i] = p.previous_branch_id || 0;
        // Exact inverse of applyEvent's identical condition: only a first
        // touch by this branch ever created a beforeNotes entry, so only a
        // first touch's revert removes it.
        var branchB = s.branches[p.branch_id];
        if (branchB && p.previous_branch_id !== p.branch_id) {
          delete branchB.beforeNotes[i];
        }
        break;
      }
      case 'TRIAL_CLOSE': {
        var reopenBranch = s.branches[p.branch_id];
        // solve-event-capture-v5 — exact inverse of applyEvent's
        // unconditional preCloseSnapshot: restore the WHOLE note overlay to
        // exactly what it held before this close did anything to it (its
        // own restore-to-before-image mutation, its elimination, and — for
        // a root close — the wipe). One full-array restore correctly
        // undoes all three at once, since they're all just mutations to
        // these same two arrays; see that snapshot's own comment for why
        // this event's payload alone can't reconstruct it piecemeal.
        if (reopenBranch && reopenBranch.preCloseSnapshot) {
          s.trialNoteMasks.set(reopenBranch.preCloseSnapshot.masks);
          s.trialNoteOwners.set(reopenBranch.preCloseSnapshot.owners);
          reopenBranch.preCloseSnapshot = null;
        }
        if (p.resolution === 'CONFIRMED') {
          (p.promoted_notes || []).forEach(function (pn) { s.notes[pn.cell_index] = pn.previous_mask; });
        }
        (p.promoted || []).forEach(function (c) {
          writeValue(s, c.cell_index, c.previous_value, c.previous_origin || ORIGIN.USER);
          s.notes[c.cell_index] = c.previous_notes || 0;
          writeTrial(s, c.cell_index, c.trial_value, p.branch_id);
        });
        (p.cleared || []).forEach(function (c) { writeTrial(s, c.cell_index, c.previous_value, p.branch_id); });
        if (p.resolution === 'REFUTED' && p.eliminated) {
          /* put the eliminated candidate back — `eliminated_was_noted` records
             whether it was actually a pencilled note before the close, so the
             rewind restores the real prior state rather than assuming one.
             solve-event-capture-v5 — the note-OVERLAY half of a nested v5
             elimination (trialNoteMasks) is already undone by the
             preCloseSnapshot restore above; only the COMMITTED-layer half
             (root refute, or any v3/v4 stream) needs undoing here — doing
             both would double-apply the nested case. The one thing
             preCloseSnapshot cannot cover is whether this elimination was
             the PARENT's first touch of that cell (a different branch's
             own beforeNotes map, not this branch's overlay arrays) —
             elimCreatedParentBeforeNote records exactly that. */
          if (p.eliminated_was_noted) {
            if (isV5 && p.parent_branch_id !== undefined && p.parent_branch_id !== null) {
              if (reopenBranch && reopenBranch.elimCreatedParentBeforeNote) {
                var parentForUnelim = s.branches[p.parent_branch_id];
                if (parentForUnelim) delete parentForUnelim.beforeNotes[p.eliminated.cell_index];
              }
            } else {
              s.notes[p.eliminated.cell_index] |= noteBit(p.eliminated.value);
            }
          }
          if (reopenBranch) reopenBranch.elimCreatedParentBeforeNote = null;
          var ser = s.series[p.series_id];
          if (ser && ser.elimCount[p.eliminated.value] > 0) ser.elimCount[p.eliminated.value]--;
        }
        if (p.resolution === 'CONFIRMED' && s.series[p.series_id]
            && s.series[p.series_id].resolvedBy === p.branch_id) {
          s.series[p.series_id].resolvedTo = null;
          s.series[p.series_id].resolvedBy = 0;
        }
        if (p.resolution === 'MERGED' && reopenBranch && reopenBranch.mergedCells) {
          /* exact inverse of the apply-side reassignment above — move
             precisely the cells THIS merge reassigned back to branch_id,
             using the list apply recorded rather than a revert-time scan
             (which, as that comment explains, can no longer tell them
             apart from the parent's own cells). */
          reopenBranch.mergedCells.forEach(function (mc) { s.tbranch[mc] = p.branch_id; });
          reopenBranch.mergedCells = null;
          /* solve-event-capture-v5 — note-side inverse: the OWNERSHIP part
             (trialNoteOwners) is already undone by this event's own
             preCloseSnapshot restore above (MERGED gets one taken too, same
             as every other resolution) — only the PARENT's beforeNotes
             bookkeeping (a different branch's own map) needs a separate
             undo: remove exactly the keys THIS merge added to it, not ones
             the parent already had before this merge. */
          var parentForUnmerge = s.branches[p.parent_branch_id];
          if (parentForUnmerge && reopenBranch.mergedNoteKeys) {
            reopenBranch.mergedNoteKeys.forEach(function (rk) { delete parentForUnmerge.beforeNotes[rk]; });
          }
          reopenBranch.mergedNoteKeys = null;
        }
        if (reopenBranch) { reopenBranch.status = 'OPEN'; reopenBranch.contradiction = null; }
        s.openBranch = p.branch_id; break;
      }
      case 'PIN_SET':
        s.pins[i] = p.previous_symbol ? PIN_BY_KEY[p.previous_symbol].id : 0; break;
      case 'TEXT_NOTE_ADD':
        break;
    }
    return s;
  }

  /** All cell indices a given event actually touched. Several event types
   *  don't carry their cell reference under `payload.cell_index` at all —
   *  `UNDO_APPLY`/`REDO_APPLY`'s real payload is `{action_id, mutations}`
   *  (see orbace-grid.js's undo(), which emits exactly that shape and
   *  never a top-level cell_index), `TRIAL_OPEN`'s seed cell is
   *  `payload.seed.cell_index`, `TRIAL_CLOSE`'s cells are
   *  `payload.promoted[]`/`payload.cleared[]`/`payload.eliminated`. Ported
   *  from orbace-supu-replay-v2.js's own stepCells() (added 2026-09-10 to
   *  fix "the cell move and the row move are easily out of sync," a board-
   *  highlight bug caused by exactly this gap) so createTimeline's byCell
   *  index below isn't built on the same incomplete `payload.cell_index`
   *  check — before this fix byCell silently omitted every UNDO_APPLY
   *  event from every cell's list (A0 spike, 2026-09-21 technique-
   *  explanations execution plan, Package A). Kept a plain module function
   *  (not tied to createTimeline) since it only reads one event, not the
   *  timeline. Returns an array, often more than one cell, never undefined. */
  function stepCells(ev) {
    if (!ev) return [];
    var p = ev.payload;
    switch (ev.event_type) {
      case 'VALUE_SET': case 'VALUE_CLEAR': case 'NOTE_SET': case 'HINT_REVEAL':
      case 'TRIAL_SET': case 'TRIAL_NOTE_SET': case 'PIN_SET':
        return [p.cell_index];
      case 'TRIAL_OPEN':
        return p.seed ? [p.seed.cell_index] : [];
      case 'TRIAL_CLOSE': {
        var out = (p.promoted || []).map(function (x) { return x.cell_index; })
          .concat((p.cleared || []).map(function (x) { return x.cell_index; }));
        if (p.eliminated) out.push(p.eliminated.cell_index);
        return out;
      }
      case 'UNDO_APPLY': case 'REDO_APPLY':
        return (p.mutations || []).map(function (m) { return m.cell_index; });
      case 'TEXT_NOTE_ADD':
        if (!p.anchor) return [];
        if (p.anchor.kind === 'CELL') return [p.anchor.cell_index];
        if (p.anchor.kind === 'REGION') return p.anchor.cells || [];
        return [];
      default:
        return [];
    }
  }

  /* ---------------------------------------------------------------------
     TIMELINE — the whole point of the exercise.

     Today's renderBoard() rebuilds the board by replaying moves 0..pos on
     EVERY render: O(n) per step, O(n²) for a full playback, and it has to
     special-case each type inline. With trials + branch promotion + pins
     that only gets worse.

     Instead: hold ONE mutable cursor state, step it forward/back by exact
     inverses (O(1) per step — the common case, since playback is +1), and
     keep a keyframe every K events so an arbitrary scrub costs at most K
     applies instead of pos applies.

       memory: ceil(n/K) * 486 bytes   (n=10000, K=64 -> ~76 KB)
       step:   O(1)
       seek:   O(K) worst case, O(|Δ|) when the target is nearby
     --------------------------------------------------------------------- */
  function createTimeline(givens, events, opts) {
    opts = opts || {};
    var K = opts.keyframeInterval || 64;
    // solve-event-capture-v5 — the declared move_history_schema_version of
    // this stream, threaded into every applyEvent/revertEvent call below.
    // Omitted by every caller that predates this addition (Phase 3/4's own
    // job is wiring each real page's loaded envelope through here) — v1-v4
    // replay is byte-for-byte unchanged when this is absent, see
    // applyEvent's own comment on why that's safe.
    var schemaVersion = opts.schemaVersion;
    var base = initialState(givens);
    var keyframes = [cloneState(base)];      // keyframes[j] === state after j*K events
    var cur = cloneState(base);
    var pos = 0;
    var lastSeekCost = 0;

    /* cellIndex -> ascending list of event positions touching it. Built once,
       O(n). Powers "jump to next move on this cell" and per-cell history
       without a scan. Uses stepCells() (not a bare payload.cell_index check)
       so UNDO_APPLY/REDO_APPLY/TRIAL_OPEN/TRIAL_CLOSE are indexed under every
       cell they actually touch, not silently dropped. */
    var byCell = []; for (var c = 0; c < 81; c++) byCell.push([]);
    /* text notes ordered by anchor position — the row-by-row list */
    var textNotes = [];

    events.forEach(function (ev, idx) {
      stepCells(ev).forEach(function (ci) {
        if (typeof ci === 'number') byCell[ci].push(idx);
      });
      if (ev.event_type === 'TEXT_NOTE_ADD') textNotes.push({ at:idx, source:'capture', ev:ev });
    });

    function keyframeAt(j) {
      while (keyframes.length <= j) {
        var from = (keyframes.length - 1) * K;
        var s = cloneState(keyframes[keyframes.length - 1]);
        for (var i = from; i < Math.min(from + K, events.length); i++) applyEvent(s, events[i], schemaVersion);
        keyframes.push(s);
      }
      return keyframes[j];
    }

    function seek(target) {
      target = Math.max(0, Math.min(events.length, target));
      var delta = Math.abs(target - pos);
      var j = Math.floor(target / K);
      var kfCost = target - j * K;
      var cost;
      if (delta <= kfCost + 2) {            // walking from here is cheaper
        while (pos < target) { applyEvent(cur, events[pos], schemaVersion); pos++; }
        while (pos > target) { pos--; revertEvent(cur, events[pos], schemaVersion); }
        cost = delta;
      } else {                               // jump to nearest keyframe, walk in
        cur = cloneState(keyframeAt(j));
        pos = j * K;
        while (pos < target) { applyEvent(cur, events[pos], schemaVersion); pos++; }
        cost = kfCost;
      }
      lastSeekCost = cost;
      return cur;
    }

    return {
      seek: seek,
      state: function () { return cur; },
      pos: function () { return pos; },
      length: function () { return events.length; },
      events: events,
      byCell: byCell,
      textNotes: textNotes,
      stats: function () {
        return { events: events.length, keyframes: keyframes.length,
                 keyframeInterval: K, snapshotBytes: 486,
                 keyframeMemBytes: keyframes.length * 486, lastSeekCost: lastSeekCost };
      }
    };
  }

  /** The digits a trial series has ruled out, ascending. Read this rather
   *  than elimCount, which is a reversibility mechanism, not an API. */
  function eliminatedDigits(series) {
    var out = [];
    if (!series || !series.elimCount) return out;
    for (var d = 1; d <= 9; d++) if (series.elimCount[d] > 0) out.push(d);
    return out;
  }

  /* ---------------------------------------------------------------------
     LEGACY -> v2 ADAPTER (Phase 2)

     Lifts a stored `{i,v,t}` shorthand stream — exactly what GET /supu/:id
     already returns for every Su-Pu ever saved — into a v2 event stream, so
     the v2 renderer can replay real solves with NO backend change. Lossy in
     one direction only: v1 has no trials, pins or text notes to lose.

     WHY IT RUNS A SHADOW BOARD. The reversibility invariant needs
     previous_value / previous_origin / previous_notes on every event, and
     the legacy shorthand records none of them. They are derived here by
     replaying forward, never hand-written — the same discipline the real
     capture client must follow, and the direct lesson of the prototype's
     stale-previous_notes defect.

     TWO FIDELITY POINTS, both taken from js/orbace-supu-replay.js's own
     renderBoard() rather than from the wire format:

     1. A legacy ERASE clears the cell's NOTES as well as its value. v2's
        VALUE_CLEAR clears only the value, so one ERASE expands into a
        VALUE_CLEAR plus one NOTE_SET(off) per candidate that was showing.
        Expanding keeps the stream reversible; teaching VALUE_CLEAR to eat
        notes would not, since its payload could not restore them.
     2. GET /supu/:id carries NO solution — v1 renders a mistake from the
        server's stored `t` tag, not from a comparison. So the caller gets a
        derived pseudo-solution (see derivePseudoSolution) instead, which
        reproduces v1's mistake rendering exactly without inventing data.

     Returns an OBJECT, not a bare array, so an adapted stream can never be
     mistaken for a captured one and POSTed somewhere: its extensions are
     unregistered and it carries reconstructed timing.
     --------------------------------------------------------------------- */

  var TECHNIQUE_TAGS = { NS:1, HS:1, NP:1, LC:1, HP:1, XW:1 };

  /** The correct digit for each cell, inferred from the solve itself: a
   *  placement the server tagged OK (or with a technique) is by definition
   *  the right digit for that cell. Cells never correctly filled stay 0,
   *  which is what makes an uncorrected mistake still render as one.
   *  This is an inference from the record, not a solution lookup — a Su-Pu
   *  never carries the solution over the wire. */
  function derivePseudoSolution(givens, moves) {
    var sol = new Array(81).fill(0);
    for (var i = 0; i < 81; i++) if (+givens[i]) sol[i] = +givens[i];
    (moves || []).forEach(function (m) {
      if (m == null || typeof m.i !== 'number') return;
      if (m.t === 'NOTE' || m.t === 'ERASE') return;
      /* HINT counts: a revealed digit is the correct one by definition.
         Leaving it out made every hinted cell in every existing Su-Pu render
         as a mistake in v2 — caught by the v1 parity suite, which is the
         whole reason that suite exists. */
      if (m.t === 'OK' || m.t === 'HINT' || m.t == null || TECHNIQUE_TAGS[m.t]) sol[m.i] = m.v;
    });
    return sol;
  }

  /** legacy {i,v,t}[] -> { events, moveBoundaries, pseudoSolution, ... }.
   *  moveBoundaries[k] is the event count after legacy move k, so a caller
   *  comparing against a v1 renderer can line the two up despite ERASE
   *  expanding into several events. */
  function legacyToCaptureV2(givens, moves, options) {
    options = options || {};
    var perMoveMs = options.perMoveMs || 1000;
    var given = String(givens).split('').map(function (c) { return +c ? 1 : 0; });
    var values = new Array(81).fill(0), origin = new Array(81).fill(0), notes = new Array(81).fill(0);
    for (var i = 0; i < 81; i++) if (given[i]) { values[i] = +String(givens)[i]; origin[i] = ORIGIN.GIVEN; }

    var events = [], boundaries = [], ms = 0, skipped = 0;

    function emit(type, payload) {
      events.push({ sequence_no: events.length, event_type: type,
                    client_elapsed_ms: ms, payload: payload, extensions: {} });
      return events[events.length - 1];
    }

    (moves || []).forEach(function (m) {
      ms += perMoveMs;
      var i = m && m.i;
      /* A malformed or given-cell move is skipped, not guessed at — the
         count is reported so a caller can see the stream was imperfect
         rather than silently trusting a partial adaptation. */
      if (m == null || typeof i !== 'number' || i < 0 || i > 80) { skipped++; boundaries.push(events.length); return; }

      if (m.t === 'NOTE') {
        if (given[i]) { skipped++; boundaries.push(events.length); return; }
        var on = !(notes[i] & (1 << m.v));
        emit('NOTE_SET', { cell_index: i, note_value: m.v, previous_enabled: !on, next_enabled: on });
        if (on) notes[i] |= (1 << m.v); else notes[i] &= ~(1 << m.v);
      } else if (m.t === 'ERASE') {
        if (given[i]) { skipped++; boundaries.push(events.length); return; }
        /* The events are marked so the move list can show ONE "Erase" row,
           the way v1 does, instead of the three note-clears the expansion
           really needs. The board is identical either way; the move list is
           not, and it is the teaching surface. */
        var first = true;
        if (values[i]) {
          emit('VALUE_CLEAR', { cell_index: i, previous_value: values[i],
                                previous_origin: origin[i], next_value: null })
            .extensions['orbace.legacy.erase'] = 'primary';
          values[i] = 0; origin[i] = ORIGIN.NONE; first = false;
        }
        for (var d = 1; d <= 9; d++) {
          if (notes[i] & (1 << d)) {
            emit('NOTE_SET', { cell_index: i, note_value: d, previous_enabled: true, next_enabled: false })
              .extensions['orbace.legacy.erase'] = first ? 'primary' : 'expansion';
            notes[i] &= ~(1 << d); first = false;
          }
        }
      } else if (m.t === 'HINT') {
        if (given[i] || values[i] === m.v) { skipped++; boundaries.push(events.length); return; }
        emit('HINT_REVEAL', { cell_index: i, previous_value: values[i] || null, previous_origin: origin[i],
                              previous_notes: notes[i], next_value: m.v, cleared_notes: [] });
        values[i] = m.v; origin[i] = ORIGIN.HINT; notes[i] = 0;
      } else {
        /* OK / ✕ / a technique tag — all placements. The tag itself rides in
           an extension so the move list can still say "Naked Single"; it is
           NOT registered, which is one more reason this output must never be
           sent to the backend. */
        if (given[i] || values[i] === m.v) { skipped++; boundaries.push(events.length); return; }
        var e = emit('VALUE_SET', { cell_index: i, previous_value: values[i] || null,
                                    previous_origin: origin[i], previous_notes: notes[i],
                                    next_value: m.v, cleared_peer_notes: [] });
        if (m.t && m.t !== 'OK') e.extensions['orbace.legacy.tag'] = m.t;
        if (m.e) e.extensions['orbace.legacy.explain'] = { e: m.e, p: m.p || null };
        values[i] = m.v; origin[i] = ORIGIN.USER; notes[i] = 0;
      }
      boundaries.push(events.length);
    });

    return {
      source: 'legacy-adapter',
      lossy: true,
      events: events,
      moveBoundaries: boundaries,
      pseudoSolution: derivePseudoSolution(givens, moves),
      skippedMoves: skipped
    };
  }

  /* ---------------------------------------------------------------------
     BACKWARD COMPATIBILITY GUARANTEE
     Drops every v2 event type, so what the scorer / public library / the
     existing js/orbace-supu-replay.js receive is byte-identical to a v1
     stream from the same solve. A trial digit can therefore never become a
     "mistake": it never reaches the code that derives OK/✕ at all.
     --------------------------------------------------------------------- */
  function projectToLegacyShorthand(events, solutionDigits) {
    var has = Array.isArray(solutionDigits) && solutionDigits.length === 81;
    function tag(i, v) { return has && solutionDigits[i] === v ? 'OK' : '✕'; }
    var out = [];
    events.forEach(function (e) {
      var p = e.payload;
      switch (e.event_type) {
        case 'VALUE_SET':   out.push({ i:p.cell_index, v:p.next_value, t:tag(p.cell_index, p.next_value) }); break;
        case 'VALUE_CLEAR': out.push({ i:p.cell_index, v:0, t:'ERASE' }); break;
        case 'NOTE_SET':    out.push({ i:p.cell_index, v:p.note_value, t:'NOTE' }); break;
        case 'HINT_REVEAL': out.push({ i:p.cell_index, v:p.next_value, t:'HINT' }); break;

        /* A promoted trial digit IS a real placement — the player committed
           it — so it MUST reach the shorthand, or verifyAndScoreSupu's
           replay simulation never reconstructs a solved board and every
           solve that used a confirmed branch would fail verification. It is
           tagged OK/✕ against the solution like any other placement: the
           exemption applies to a digit while it is PROVISIONAL, not to one
           the player has committed onto the board.
           TRIAL_OPEN, TRIAL_SET, a REFUTED/ABANDONED close, PIN_SET and
           TEXT_NOTE_ADD have no shorthand equivalent by design — the same
           treatment v1 already gives UNDO/REDO. That is the whole of the
           "a trial is never a mistake" guarantee: the scorer never sees a
           trial digit that was not deliberately committed. A refuted line
           costs the player nothing, which is what makes the technique
           usable at all. */
        case 'TRIAL_CLOSE':
          if (p.resolution === 'CONFIRMED') {
            (p.promoted || []).slice()
              .sort(function (a, c) { return a.cell_index - c.cell_index; })
              .forEach(function (c) { out.push({ i:c.cell_index, v:c.next_value, t:tag(c.cell_index, c.next_value) }); });
          }
          break;
      }
    });
    return out;
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION, EVENT_TYPES: EVENT_TYPES,
    V1_EVENTS: V1_EVENTS, V2_EVENTS: V2_EVENTS, V5_EVENTS: V5_EVENTS,
    PIN_SYMBOLS: PIN_SYMBOLS, PIN_BY_KEY: PIN_BY_KEY, PIN_BY_ID: PIN_BY_ID,
    LIMITS: LIMITS, ORIGIN: ORIGIN,
    TRIAL_COLOR_COUNT: TRIAL_COLOR_COUNT, TRIAL_COLOR_CLASSES: TRIAL_COLOR_CLASSES, trialColorClass: trialColorClass,
    branchLetter: branchLetter,
    emptyState: emptyState, initialState: initialState, cloneState: cloneState,
    applyEvent: applyEvent, revertEvent: revertEvent,
    stepCells: stepCells,
    createTimeline: createTimeline,
    eliminatedDigits: eliminatedDigits,
    legacyToCaptureV2: legacyToCaptureV2,
    derivePseudoSolution: derivePseudoSolution,
    projectToLegacyShorthand: projectToLegacyShorthand
  };
})();

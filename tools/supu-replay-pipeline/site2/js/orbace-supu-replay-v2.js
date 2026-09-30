/* Orbace Sudoku — Su-Pu replay renderer v2 (Su-Pu Replay v2, Phase 1).
 *
 * Keeps js/orbace-supu-replay.js's mount({boardEl, controlsEl, listEl, ...})
 * contract so a host can be switched over without changing its markup, and
 * adds `onCellClick` plus a 4-argument load(givens, events, solution,
 * annotations). Renders from an OrbaceReplayCore timeline frame instead of
 * re-scanning the move array on every paint.
 *
 * ISOLATION: this file does not modify, wrap or import js/orbace-supu-
 * replay.js — v1 still renders every live Su-Pu page, and both modules can
 * be loaded on the same document (different globals, and every v2 CSS rule
 * is scoped under .osr-v2, applied to this module's own elements in mount()).
 *
 * The board reuses .og-board/.og-cell from css/orbace-grid.css exactly as v1
 * does, so a v2 replay board reads as the same visual object.
 *
 * Depends on: window.OrbaceReplayCore (js/orbace-replay-core.js).
 */
window.OrbaceSupuReplayV2 = (function () {
  "use strict";
  var Core = window.OrbaceReplayCore;

  // W6 accessibility pass (2026-09-13, flagged during the Su-Pu Capture
  // bridge's Phase 2 a11y audit — see that RC's "found but out of scope"
  // note). This module had ZERO ARIA attributes anywhere before this pass.
  // Glyph-only buttons relied on `title` alone, which isn't consistently
  // promoted to an accessible name across screen readers — explicit
  // aria-label added here, same fix already applied to the capture page's
  // own pin buttons. `aria-label` on osr-btn-play is completed dynamically
  // in syncControls() (its meaning changes between "Play" and "Pause").
  var CONTROLS_HTML =
    '<button class="osr-btn osr-btn-first" title="First" aria-label="Jump to first step">⏮</button>' +
    '<button class="osr-btn osr-btn-back" title="Back" aria-label="Previous step">⏪</button>' +
    '<button class="osr-btn osr-btn-play" title="Play/Pause" aria-label="Play" aria-pressed="false">▶</button>' +
    '<button class="osr-btn osr-btn-fwd" title="Forward" aria-label="Next step">⏩</button>' +
    '<button class="osr-btn osr-btn-last" title="End" aria-label="Jump to last step">⏭</button>' +
    '<select class="osr-speed" aria-label="Playback speed"><option value="900">0.5×</option><option value="450" selected>1×</option>' +
    '<option value="220">2×</option><option value="110">4×</option></select>' +
    // aria-live="polite": manual step navigation (the common case for a
    // screen-reader user reviewing a replay) benefits from hearing the new
    // step count; continuous autoplay at the default 450ms/step will also
    // announce every step, which may read as noisy during Play specifically
    // — a real AT walkthrough (Team D, per the Phase 2 RC) should confirm
    // this default is right rather than something to silence.
    '<span class="osr-step" aria-live="polite">Step 0 / 0</span>';

  function rc(i) { return 'R' + (Math.floor(i / 9) + 1) + 'C' + (i % 9 + 1); }

  /* Technique codes from the human-ranked solver (backend/org-api/src/
   * services/solve-path.ts's TECHNIQUE_TAGS / tagMovesWithTechniques(),
   * wired into POST /supu at real-Su-Pu save time) — same short-code set
   * js/orbace-supu-replay.js's (v1) own TECHNIQUES map already uses, kept
   * in sync with that one, not the source of truth. A move's legacy `t`
   * is this code (e.g. 'HS'), never the full name — legacyToCaptureV2()
   * carries it through unchanged as the orbace.legacy.tag extension.
   * Restored 2026-09-10: describe() never read this extension, so every
   * real Su-Pu's technique-tagged moves showed as generic "Correct" here
   * even though v1's own move list still showed "Hidden Single" etc. for
   * the exact same data — a real V1/V2 parity gap, not a feature that
   * needs new backend work. Naturally "optional": a move without a
   * recognized technique code (Su-Pu Capture's own fresh captures, which
   * never had technique-tagging wired in, included) just falls back to
   * plain Correct/Mistake below, same as always. */
  var TECHNIQUES = {
    NS: 'Naked Single', HS: 'Hidden Single', NP: 'Naked Pair',
    LC: 'Locked Candidates', HP: 'Hidden Pair', XW: 'X-Wing',
    // UAT feedback (2026-09-19): CH/LD are self-declared-only codes (Su-Pu
    // Capture's own TECHNIQUES picker) — the backend's real auto-tagger
    // (solve-path.ts's TECHNIQUE_TAGS) never emits either, so these only
    // ever appear via a capture's own TEXT_NOTE_ADD self-tag, same path as
    // every other code here.
    CH: 'Cross Hatching', LD: 'Last Digit',
  };

  /** All cell indices a given event actually touched — used to highlight
   *  the board in sync with the current move-list row (2026-09-10 UI
   *  feedback: "the cell move and the row move are easily out of sync").
   *  The previous board highlight only ever read `payload.cell_index`
   *  directly, which several event types don't carry their cell reference
   *  under at all (TRIAL_OPEN's seed cell is `payload.seed.cell_index`;
   *  TRIAL_CLOSE's cells are `payload.promoted[]`/`payload.cleared[]`/
   *  `payload.eliminated`; UNDO_APPLY/REDO_APPLY's are `payload.
   *  mutations[]`) — for those, the "last placed cell" silently stayed
   *  wherever it was several steps ago, or vanished, while the move-list
   *  row kept advancing. Returns an array (often more than one cell for a
   *  multi-cell event), never undefined. */
  function stepCells(ev) {
    if (!ev) return [];
    var p = ev.payload;
    switch (ev.event_type) {
      case 'VALUE_SET': case 'VALUE_CLEAR': case 'NOTE_SET': case 'HINT_REVEAL': case 'TRIAL_SET': case 'PIN_SET':
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

  /** Su-Pu Capture's own self-declared technique tag (2026-09-10, twice-
   *  refined). No automatic technique detection exists for live capture
   *  (see js/orbace-grid-lab.js's currentBranchSteps() comment) — the first
   *  cut let a player tag only a just-confirmed trial, which turned out to
   *  be invisible to anyone solving normally without ever pencilling
   *  candidates and opening a trial path. page-supu-capture.js now lets a
   *  player tag ANY of their own placed digits, by selecting that cell and
   *  picking a technique — recorded as a plain TEXT_NOTE_ADD anchored to
   *  the CELL ("Technique: Hidden Single"), not as an orbace.legacy.tag
   *  extension (capture-extensions-baseline-v0 has zero registered keys —
   *  sending one would 422 the whole save).
   *
   *  FIXED 2026-09-21 (technique-explanations execution plan, Package A
   *  item 4): the original version tracked a single `lastValueSetIndexAtCell`
   *  map that only ever advanced on VALUE_SET/CONFIRMED-promotion and never
   *  reset on VALUE_CLEAR/UNDO_APPLY/REDO_APPLY, so a clear-then-retag or an
   *  undo of the tagged placement left the tag pointing at a stale earlier
   *  row. Rebuilt on `tl.byCell` (orbace-replay-core.js's timeline, whose
   *  own construction now uses stepCells() to index EVERY event type that
   *  can touch a cell — see that file's header comment — not just VALUE_SET).
   *  For each "Technique: " note, find the cell's most recent touch BEFORE
   *  the note: if that touch is a plain VALUE_SET, or a TRIAL_CLOSE
   *  CONFIRMED that promoted this exact cell (preserved, not new — a real
   *  supported case, not a gap), attribute the tag there, matching prior
   *  behavior for the cases that were already correct. Any other last touch
   *  (a clear, an undo, a hint, a refuted/abandoned close) means the tag no
   *  longer names a live placement — no attribution, rather than a stale
   *  guess ("a clear invalidates active ownership", source doc §6).
   *
   *  Deliberately its own resolver, not orbace-technique-explanations.js's
   *  resolvePlacement(): that one is intentionally narrower (built for
   *  mathematically PROVING NS/HS, so it excludes trial promotions on
   *  purpose per doc §6) — reusing it here would silently regress every
   *  existing technique tag on a promoted cell. Both share the same
   *  underlying byCell correctness fix; the eligibility rule on top differs
   *  by purpose.
   *
   *  Takes the already-built timeline (`tl`, from Core.createTimeline —
   *  byCell/textNotes are ready synchronously, no seek() needed) instead of
   *  a raw events array, so it can use the corrected index. Keyed by event
   *  INDEX (not cell — a cell can be placed more than once across undo/redo
   *  or a refuted-then-retried trial in one stream). A real Su-Pu's event
   *  stream never contains a "Technique: " cell note, so this is a no-op
   *  there (empty map). */
  function buildSelfDeclaredTechniques(tl) {
    var byIndex = {};
    tl.textNotes.forEach(function (note) {
      var anchor = note.ev.payload.anchor;
      if (!(anchor && anchor.kind === 'CELL')) return;
      var m = /^Technique: (.+)$/.exec(note.ev.payload.text || '');
      if (!m) return;

      var cell = anchor.cell_index;
      var touches = tl.byCell[cell] || [];
      var lastIdx = -1;
      for (var k = touches.length - 1; k >= 0; k--) {
        if (touches[k] >= note.at) continue;
        // TEXT_NOTE_ADD is itself indexed in byCell (stepCells reads a
        // CELL-anchored note's own cell reference, for board-highlight
        // sync) but a note is never a board mutation — skip past any
        // earlier note on this cell to find the actual last placement,
        // or a second tag on the same cell would resolve to the FIRST
        // tag instead of the value it's both describing.
        if (tl.events[touches[k]].event_type === 'TEXT_NOTE_ADD') continue;
        lastIdx = touches[k];
        break;
      }
      if (lastIdx === -1) return;

      var target = tl.events[lastIdx];
      if (target.event_type === 'VALUE_SET') {
        byIndex[lastIdx] = m[1];
      } else if (target.event_type === 'TRIAL_CLOSE' && target.payload.resolution === 'CONFIRMED' &&
                 (target.payload.promoted || []).some(function (p) { return p.cell_index === cell; })) {
        byIndex[lastIdx] = m[1];
      }
    });
    return byIndex;
  }

  /** v3 nesting depth of each TRIAL_* event, by event index — one pass with a
   *  branch stack, so the move list can indent a nested path under its parent
   *  and hue it by depth (instead of every trial row reading the same). A
   *  TRIAL_OPEN records the depth it opened at; a TRIAL_CLOSE records its own
   *  depth then pops itself (and anything above, for a malformed stream). */
  function computeTrialDepths(events) {
    var depths = {}, stack = [];
    (events || []).forEach(function (ev, k) {
      var p = ev.payload || {};
      if (ev.event_type === 'TRIAL_OPEN') {
        depths[k] = stack.length;
        stack.push(p.branch_id);
      } else if (ev.event_type === 'TRIAL_SET') {
        var i = stack.lastIndexOf(p.branch_id);
        depths[k] = i >= 0 ? i : Math.max(0, stack.length - 1);
      } else if (ev.event_type === 'TRIAL_CLOSE') {
        var j = stack.lastIndexOf(p.branch_id);
        depths[k] = j >= 0 ? j : 0;
        if (j >= 0) stack.length = j;
      }
    });
    return depths;
  }

  /* Plain-English rendering of why a line died. This is the teaching
     payload — a replay that only says "rejected" teaches nothing. */
  function contradictionText(c) {
    if (!c) return '';
    var where = c.unit_label ? ' in ' + c.unit_label : '';
    switch (c.kind) {
      case 'ROW_DUPLICATE': case 'COL_DUPLICATE': case 'BOX_DUPLICATE':
        return 'two ' + c.digit + 's' + where;
      case 'CELL_NO_CANDIDATES':   return rc(c.cells[0]) + ' has no candidates left';
      case 'UNIT_DIGIT_UNPLACEABLE': return c.digit + ' has nowhere to go' + where;
      case 'PLAYER_DECLARED': return 'declared by the player';
      default: return 'contradiction';
    }
  }

  /* One row descriptor per event — drives both the list and the legacy
     label vocabulary. Text notes get their own full-width prose row. */
  function describe(ev, solution, selfDeclaredTechnique, neutralLabels) {
    var p = ev.payload;
    /* An adapted legacy ERASE is several events (a value clear and/or one
       note-clear per candidate) because that is what stays reversible — but
       it was ONE move to the player, and js/orbace-supu-replay.js showed it
       as one row. Collapse it back, or every legacy replay's move list grows
       rows that never existed. Returning null suppresses the row entirely. */
    var eraseRole = ev.extensions && ev.extensions['orbace.legacy.erase'];
    if (eraseRole === 'expansion') return null;
    if (eraseRole === 'primary') return { kind: 'erase', label: 'Erase', loc: rc(p.cell_index) + ' erased' };
    switch (ev.event_type) {
      case 'VALUE_SET': {
        var legacyTag = ev.extensions && ev.extensions['orbace.legacy.tag'];
        if (legacyTag && TECHNIQUES[legacyTag]) {
          return { kind: 'technique', label: TECHNIQUES[legacyTag], loc: rc(p.cell_index) + '=' + p.next_value };
        }
        if (selfDeclaredTechnique) {
          // A self-declared tag is the player's own label, NOT authoritative
          // (unlike the server's orbace.legacy.tag). Still flag a wrong digit
          // as a mistake — keep the declared tag visible so the intent isn't
          // lost — instead of masking the error as "correct" (code-review F3).
          var selfOk = !solution || solution[p.cell_index] === p.next_value;
          if (selfOk) return { kind: 'technique', label: selfDeclaredTechnique, loc: rc(p.cell_index) + '=' + p.next_value };
          return { kind: 'mistake', label: 'Mistake',
                   loc: rc(p.cell_index) + '=' + p.next_value + ' (tagged ' + selfDeclaredTechnique + ')' };
        }
        var ok = solution && solution[p.cell_index] === p.next_value;
        // UAT feedback (2026-09-20): "Correct" on a real, scored Su-Pu
        // (mistakes count toward its score) is accurate ground truth, no
        // change there. On a capture — where item 2's Setup panel just
        // made live error-checking itself optional — the same word implied
        // an active checking process the player may not have had on, same
        // confusion mobile already avoided by calling a placed digit an
        // "Entry" rather than "Correct". `neutralLabels` (passed by the
        // capture page's own mount() call only) swaps just this one word;
        // "Mistake" is untouched either way — a wrong digit is a fact, not
        // an implication that checking was active.
        return { kind: ok ? 'correct' : 'mistake', label: ok ? (neutralLabels ? 'Entry' : 'Correct') : 'Mistake',
                 loc: rc(p.cell_index) + '=' + p.next_value };
      }
      case 'VALUE_CLEAR': return { kind:'erase', label:'Erase', loc: rc(p.cell_index) + ' erased' };
      case 'NOTE_SET':    return { kind:'note', label: p.next_enabled ? 'Note +' : 'Note −',
                                   loc: rc(p.cell_index) + ' ✏' + p.note_value };
      case 'HINT_REVEAL': return { kind:'hint', label:'Hint', loc: rc(p.cell_index) + '=' + p.next_value };
      case 'UNDO_APPLY':  return { kind:'undo', label:'Undo', loc: p.mutations.length + ' cell(s)' };
      case 'REDO_APPLY':  return { kind:'undo', label:'Redo', loc: p.mutations.length + ' cell(s)' };
      /* "Trial Path" is presented as a TECHNIQUE name, the same way
         tagMovesWithTechniques() surfaces "Naked Single" — because that is
         what it is. The row says what is being assumed, and a close says
         what was proved. */
      // UAT feedback (2026-09-20): "(N)" is the branch's own sequence
      // number (branch_id — assigned once, in opening order, never
      // reused), matching the same number the live capture board shows on
      // that branch's cells and the series readout above. `colorClass`
      // (only ever set for a trial-family row) matches the live board's
      // per-branch color exactly, so a branch reads the same way live and
      // in Replay.
      case 'TRIAL_OPEN':  return { kind:'trial', label:'Inferential Binary Tree Branch (' + p.branch_id + ')',
                                   colorClass: Core.trialColorClass(p.branch_id),
                                   loc: 'assume ' + (p.seed ? rc(p.seed.cell_index) + '=' + p.seed.testing : '#' + p.branch_id) +
                                        (p.seed && p.seed.candidates ? '  of {' + p.seed.candidates.join(',') + '}' : '') };
      case 'TRIAL_SET':   return { kind:'trial', label: p.next_value ? '  ↳ follow' : '  ↳ clear',
                                   colorClass: Core.trialColorClass(p.branch_id),
                                   loc: rc(p.cell_index) + (p.next_value ? '≈' + p.next_value : ' cleared') };
      case 'TRIAL_CLOSE':
        if (p.resolution === 'REFUTED') {
          return { kind:'refuted', label:'✕ Refuted (' + p.branch_id + ')',
                   colorClass: Core.trialColorClass(p.branch_id),
                   loc: (p.contradiction ? contradictionText(p.contradiction) + ' → ' : '') +
                        (p.eliminated ? rc(p.eliminated.cell_index) + ' ≠ ' + p.eliminated.value : 'line dead') };
        }
        if (p.resolution === 'CONFIRMED') {
          // A promoted cell's placement lives here now (F2's fix dropped
          // the duplicate VALUE_SET the old promotion trick echoed), so a
          // self-declared technique tag on it must render on THIS row —
          // the same way an ordinary VALUE_SET's does above.
          if (selfDeclaredTechnique) {
            return { kind: 'technique', label: selfDeclaredTechnique,
                     loc: (p.promoted || []).map(function (c) { return rc(c.cell_index) + '=' + c.next_value; }).join(', ') };
          }
          return { kind:'confirmed', label:'✓ Confirmed (' + p.branch_id + ')',
                   colorClass: Core.trialColorClass(p.branch_id),
                   loc: (p.promoted || []).length + ' cell(s) promoted' };
        }
        if (p.resolution === 'MERGED') {
          // v4 (nested-trial-merge-v4-design.md). Distinct from Abandoned on
          // purpose — a merge is not the player giving up, it's the line
          // being FOLDED UP into its still-open parent, trial placements
          // retained (not cleared) and nothing promoted/proven yet. Bug
          // fixed 2026-09-20: this used to fall through to the generic
          // "Abandoned" case below, which real production evidence
          // (SP-20260920-248831, step 71) showed rendering right before the
          // very next row's "Confirmed" — a merge immediately followed by a
          // confirm reads as "gave up, then... confirmed?" when it's
          // actually one continuous, successful line.
          return { kind:'merged', label:'⤴ Merged into branch ' + p.parent_branch_id + ' (' + p.branch_id + ')',
                   colorClass: Core.trialColorClass(p.branch_id),
                   loc: 'trial placements retained under branch ' + p.parent_branch_id };
        }
        if (p.resolution === 'ABANDONED') {
          return { kind:'trial', label:'Abandoned (' + p.branch_id + ')',
                   colorClass: Core.trialColorClass(p.branch_id),
                   loc:'#' + p.branch_id + ' left unresolved' };
        }
        // Any other string is a resolution this renderer doesn't know —
        // either a future value or a malformed stream. Brief's own rule
        // (orbace-su-pu-enhancement-prd-v1.0.md's companion implementation
        // brief, Priority 1): "stop safely; do not label it abandoned or
        // downgrade silently." No colorClass — this row makes no claim
        // about which branch it belongs to.
        return { kind:'unsupported', label:'Branch outcome not supported',
                 loc:'#' + p.branch_id + ' — this record can\'t be replayed accurately' };
      case 'PIN_SET':     return { kind:'pin',
                                   label: p.next_symbol ? 'Pin ' + Core.PIN_BY_KEY[p.next_symbol].glyph : 'Unpin',
                                   loc: rc(p.cell_index) + (p.next_symbol ? ' · ' + Core.PIN_BY_KEY[p.next_symbol].label : '') };
      case 'TEXT_NOTE_ADD': return { kind:'text', label:'Note', text: p.text, anchor: p.anchor };
      default: return { kind:'', label: ev.event_type, loc:'' };
    }
  }

  // W6 (a11y) — unique per mount() instance so aria-activedescendant's id
  // references never collide if more than one replay is ever mounted on
  // the same page.
  var mountUid = 0;

  /** The board is interactive (click-to-annotate) only on `/su-pu/lab`
   *  (page-supu-lab.js passes `onCellClick`); `/su-pu/capture`'s pure
   *  review mode never does. Per-cell `aria-label`, built fresh every
   *  render alongside the cell's visible content, so a keyboard/screen-
   *  reader user arrowing through the interactive board hears the same
   *  state a sighted user sees. */
  function cellAriaLabel(i, s, org, v, tr, solution, symKey) {
    var label = rc(i);
    if (org === Core.ORIGIN.GIVEN) label += ', given ' + v;
    else if (v) {
      label += ', ' + v;
      if (org === Core.ORIGIN.HINT) label += ' (hint)';
      else if (solution && solution[i] !== v) label += ' (mistake)';
      if (org === Core.ORIGIN.PROMOTED) label += ' (promoted)';
    } else if (tr) {
      label += ', trial ' + tr;
    } else {
      label += ', empty';
    }
    if (symKey) label += ', pinned ' + Core.PIN_BY_KEY[symKey].label;
    return label;
  }

  function buildBoard(el) {
    el.innerHTML = ''; el.classList.add('og-board');
    var cells = [];
    for (var i = 0; i < 81; i++) {
      var d = document.createElement('div');
      d.className = 'og-cell';
      var r = Math.floor(i / 9), c = i % 9;
      if (r % 3 === 0 && r !== 0) d.classList.add('bt');
      if (c % 3 === 0 && c !== 0) d.classList.add('bl');
      d.dataset.i = i;
      el.appendChild(d); cells.push(d);
    }
    // UAT feedback (2026-09-28) — r1-r9/c1-c9 reference line, every board
    // site-wide. js/orbace-grid.js (always loaded first, see this page's
    // own script order) owns the one implementation; see its
    // addCoordinateFrame() comment.
    if (window.OrbaceGrid && window.OrbaceGrid.addCoordinateFrame) window.OrbaceGrid.addCoordinateFrame(el);
    return cells;
  }

  function mount(options) {
    var boardEl = options.boardEl, controlsEl = options.controlsEl, listEl = options.listEl || null;
    var onStep = options.onStep || null, onCellClick = options.onCellClick || null;
    // UAT feedback (2026-09-20) — see describe()'s own comment on the one
    // label this swaps ("Correct" -> "Entry"). Only Su-Pu Capture's own
    // mount() call passes this; every other consumer (real scored Su-Pu
    // replays) is unaffected.
    var neutralLabels = !!options.neutralLabels;
    // Package C/D wiring (2026-09-24, docs/plans/2026-09-21-supu-web-
    // technique-explanations-execution-plan.md) — both optional, same
    // "host that doesn't pass it just doesn't get one" precedent
    // js/orbace-supu-replay.js's own explainEl already uses. A host that
    // omits either keeps its exact pre-existing behavior — no crash, no
    // layout change, nothing to opt into.
    var explainEl = options.explainEl || null;  // NS/HS "why" caption (reuses .osr-explain, orbace-supu-replay.css)
    var storyEl = options.storyEl || null;       // read-only "Shape the replay" story block (published Su-Pu only)
    var cells = [], tl = null, givens = '', solution = null, speed = 450, timer = null;
    var annotations = { notes: [], pins: [] };  // post-hoc layer, merged at render
    var selfDeclaredByIndex = {};  // event index -> technique label, see buildSelfDeclaredTechniques()
    var depthByIndex = {};         // event index -> trial branch depth (v3 nesting)
    var readoutEl = null;          // §9 series readout element, created lazily
    var uid = ++mountUid;          // W6 (a11y): see mountUid's own comment
    var focusedCell = -1;          // W6 (a11y): only meaningful when onCellClick is set

    function cellDomId(i) { return 'osrv2-cell-' + uid + '-' + i; }

    /* W6 (a11y) — a single tab stop on the board (not 81), with a roving
     * aria-activedescendant tracking a virtual cursor moved by arrow keys,
     * same interaction shape js/orbace-grid.js's own live board already
     * uses for arrow-key cell selection (this file deliberately doesn't
     * import that module — see the header — but mirrors its pattern for
     * consistency rather than inventing a third one). Chosen over per-cell
     * tabIndex=0 specifically to avoid 81 tab stops for what's normally a
     * single click-to-annotate action on /su-pu/lab. */
    function setFocusedCell(i) {
      if (focusedCell >= 0 && cells[focusedCell]) cells[focusedCell].classList.remove('kbd-focus');
      focusedCell = i;
      if (cells[focusedCell]) {
        cells[focusedCell].classList.add('kbd-focus');
        boardEl.setAttribute('aria-activedescendant', cellDomId(focusedCell));
      }
    }

    /* SCOPE ROOT. Every rule in css/orbace-supu-replay-v2.css is written as
       `.osr-v2 ...`, so v2 styling cannot reach a v1 replay board rendered by
       js/orbace-supu-replay.js on the same page. The class goes on each
       element this module owns rather than on a host wrapper, so the
       guarantee holds regardless of the host's markup. */
    boardEl.classList.add('osr-v2');
    // UAT feedback (2026-09-24): the move list never got v1's own
    // .osr-movelist class (only .osr-v2/.osr-list, which css/orbace-supu-
    // replay-v2.css's own comment shows was deliberate for HEIGHT — see
    // syncListHeight() below — but never covered WIDTH/flex-sizing at
    // all). Without .osr-movelist's flex:1;min-width:220px, this element
    // had no flex-grow, so it sized itself from its own row content
    // instead of claiming its share of .osr-layout's row — easily wider
    // than whatever space remained beside a full board, forcing an
    // unwanted wrap onto its own line even on a genuinely wide viewport
    // (verified: real desktop-width iframe test still showed the list
    // stacked below the board, not beside it). Adding the class reuses
    // v1's already-correct box styling (background/border/padding too)
    // wholesale rather than duplicating any of it here — its own
    // max-height is a harmless fallback besides, since syncListHeight()'s
    // inline style still wins whenever it applies (inline always beats a
    // stylesheet rule, regardless of media query).
    if (listEl) listEl.classList.add('osr-v2', 'osr-list', 'osr-movelist');
    if (controlsEl) {
      controlsEl.classList.add('osr-controls', 'osr-v2');
      controlsEl.innerHTML = CONTROLS_HTML;
    }
    // css/orbace-supu-replay-v2.css's own isolation rule (test/replay-
    // core.test.mjs Suite 5) requires every selector start with .osr-v2 —
    // same reason every other host-supplied element above gets it added.
    if (storyEl) storyEl.classList.add('osr-v2', 'osr-story');

    // W6 (a11y): interactive (lab, click-to-annotate) gets real grid
    // semantics + keyboard operability; read-only (capture) gets
    // aria-hidden instead of exposing 81 unlabeled, inoperable cells — the
    // move list already narrates every step in text, so there's nothing a
    // screen reader user gains from also traversing the board itself.
    if (onCellClick) {
      boardEl.setAttribute('role', 'grid');
      boardEl.setAttribute('aria-label', 'Su-Pu board — arrow keys to move, Enter or Space to select a cell for annotation');
      boardEl.tabIndex = 0;
      boardEl.addEventListener('keydown', function (e) {
        if (!cells.length) return;
        if (e.key === 'Enter' || e.key === ' ') {
          if (focusedCell < 0) setFocusedCell(0);
          e.preventDefault();
          onCellClick(focusedCell);
          return;
        }
        var isArrow = e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight';
        if (!isArrow) return;
        // First arrow press after focusing the board (or after a fresh
        // load()) only ESTABLISHES the cursor at cell 0 — it must not also
        // apply that same keypress's direction on top, which would jump
        // straight to cell 1 on a single ArrowRight and read as "the
        // cursor skipped a cell."
        if (focusedCell < 0) { e.preventDefault(); setFocusedCell(0); return; }
        var r = Math.floor(focusedCell / 9), c = focusedCell % 9, next = focusedCell;
        if (e.key === 'ArrowUp' && r > 0) next = focusedCell - 9;
        else if (e.key === 'ArrowDown' && r < 8) next = focusedCell + 9;
        else if (e.key === 'ArrowLeft' && c > 0) next = focusedCell - 1;
        else if (e.key === 'ArrowRight' && c < 8) next = focusedCell + 1;
        else return;
        e.preventDefault();
        setFocusedCell(next);
      });
    } else {
      boardEl.setAttribute('aria-hidden', 'true');
    }

    /** Package C/D (2026-09-24) — the CURRENT step's NS/HS auto-explanation,
     *  if any. `null` on every step that isn't a supported self-declared
     *  Naked Single/Hidden Single placement (the overwhelming majority —
     *  most steps carry no "Technique: " tag at all, and OrbaceTechnique
     *  Explanations.explainPlacement() is only ever called for the small
     *  minority that do, so this stays cheap despite recomputing a scratch
     *  timeline internally — see that module's own header on why it isn't
     *  cached). Doc §4's "Show reasoning, default on for supported tags" —
     *  no separate toggle built this pass (see plan doc §3.D items 2-6,
     *  "not started" beyond this), always shown when supported. Exposed
     *  on the closure (not a renderBoard-local var) only so a future
     *  Explain/Before-After control could read it too, without another
     *  resolve — nothing outside renderBoard reads it yet. */
    var currentExplanation = null;

    function updateExplainCaption() {
      if (!explainEl) return;
      if (currentExplanation && currentExplanation.status === 'supported') {
        explainEl.textContent = currentExplanation.copy.sentence;
        explainEl.hidden = false;
      } else {
        explainEl.hidden = true;
        explainEl.textContent = '';
      }
    }

    /* UAT feedback (2026-09-24) — "Shape the replay" story: a real user
     * wrote a story on their draft, published it, and could not find it on
     * the resulting replay (SupuLabDraft.storyTitle's own schema comment
     * had documented that gap as deliberate; supu-lab.routes.ts's publish
     * handler now snapshots it onto SupuShare, and GET /supu/:id surfaces
     * it as `story` — see supu.routes.ts). Read-only render, once per
     * load() — a story never changes mid-replay (it's fixed at publish
     * time), so there's nothing to re-render on seek/step the way
     * renderBoard/updateExplainCaption are. `esc()` matches this file's
     * own escaping convention (see describe()'s callers / su-pu-pages.js's
     * identical helper) — chapters/title/etc. are player-authored text. */
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    var STORY_TREATMENT_LABELS = { routine: 'Routine', explain: 'Explain', question: 'Question', outcome: 'Outcome' };
    function renderStory(story) {
      if (!storyEl) return;
      if (!story || (!story.title && !story.opening_question && !story.takeaway && !(story.chapters && story.chapters.length))) {
        storyEl.hidden = true;
        storyEl.innerHTML = '';
        return;
      }
      var html = '<div class="osr-story-title">' + esc(story.title || '(untitled)') + '</div>';
      if (story.opening_question) html += '<p class="osr-story-question">' + esc(story.opening_question) + '</p>';
      if (story.chapters && story.chapters.length) {
        html += '<ol class="osr-story-chapters">' + story.chapters.map(function (ch) {
          var label = STORY_TREATMENT_LABELS[ch.treatment] || 'Routine';
          return '<li><span class="osr-story-badge osr-story-badge-' + esc(ch.treatment || 'routine') + '">' + label + '</span> ' + esc(ch.label || '(untitled chapter)') + '</li>';
        }).join('') + '</ol>';
      }
      if (story.takeaway) html += '<p class="osr-story-takeaway">' + esc(story.takeaway) + '</p>';
      storyEl.innerHTML = html;
      storyEl.hidden = false;
    }

    function renderBoard() {
      var s = tl.state(), pos = tl.pos();
      /* derived, not stored: the contradiction belongs to the event the
         cursor is sitting on, and vanishes as soon as you step past it */
      var lastEv = pos > 0 ? tl.events[pos - 1] : null;
      var lastCells = stepCells(lastEv);
      var contra = (lastEv && lastEv.event_type === 'TRIAL_CLOSE') ? (lastEv.payload.contradiction || null) : null;
      var annPins = {};
      annotations.pins.forEach(function (a) { if (a.at <= pos) annPins[a.cell_index] = a.symbol; });

      // Package C/D — resolve the current step's self-declared NS/HS tag,
      // if any, into an auto-explanation. Gated on the module-level const
      // (§4 decision #2) so a host loading an older/dark
      // orbace-technique-explanations.js (or none at all — mirrors every
      // other `if (window.X)` guard already in this file) degrades to
      // exactly the pre-Package-C/D board, no crash, no partial overlay.
      //
      // Two ways the cursor can be "on" a tagged placement, both shown the
      // same way: (a) sitting right on the VALUE_SET step itself, or (b)
      // sitting on the "Technique: X" TEXT_NOTE_ADD step that names it —
      // page-supu-capture.js's picker can tag a cell well after placing it
      // (any "already placed" cell, not just the just-placed one), so the
      // note is a real, separately-steppable move-list row, not always the
      // very next step after its placement. (b) resolves the cell's
      // CURRENT placement via explainPlacement()'s own resolvePlacement()
      // (the same cell-scoped `tl.byCell[cell]` walk Package A already
      // built and self-declared-techniques' own bug fix relies on) rather
      // than assuming adjacency to the note — correct even with unrelated
      // steps in between, and naturally shows nothing if the cell's value
      // has since changed out from under the note.
      currentExplanation = null;
      var Techniques = window.OrbaceTechniqueExplanations;
      if (Techniques && Techniques.TECHNIQUE_EXPLANATIONS_ENABLED && lastEv) {
        if (lastEv.event_type === 'VALUE_SET') {
          var placementLabel = selfDeclaredByIndex[pos - 1];
          if (placementLabel === 'Naked Single' || placementLabel === 'Hidden Single') {
            var placedCell = lastCells.length === 1 ? lastCells[0] : null;
            if (placedCell !== null) currentExplanation = Techniques.explainPlacement(givens, tl, placedCell, placementLabel);
          }
        } else if (lastEv.event_type === 'TEXT_NOTE_ADD' && lastEv.payload && lastEv.payload.anchor && lastEv.payload.anchor.kind === 'CELL') {
          var noteText = lastEv.payload.text;
          if (noteText === 'Technique: Naked Single' || noteText === 'Technique: Hidden Single') {
            // resolvePlacement()'s own byCell walk does NOT skip
            // TEXT_NOTE_ADD touches (only buildSelfDeclaredTechniques' own
            // bespoke resolver does that, per Package A item 4's own
            // comment) — resolving directly against `tl` while the cursor
            // sits ON this note would find the note ITSELF as "the most
            // recent touch" and report ambiguous_provenance. A scratch
            // timeline seeked to the note's own index sees the board
            // exactly as it stood immediately BEFORE this note ran, the
            // same "immutable alternate frame, never move the live
            // timeline" technique orbace-technique-explanations.js's own
            // computeBeforeState() already uses for its NS/HS candidate
            // math — so the real underlying placement resolves correctly
            // regardless of how many unrelated steps sit between it and
            // this note.
            var scratch = Core.createTimeline(givens, tl.events);
            scratch.seek(pos - 1); // seek() mutates + also returns a state snapshot — the timeline object itself is what explainPlacement needs
            currentExplanation = Techniques.explainPlacement(givens, scratch, lastEv.payload.anchor.cell_index, noteText.slice('Technique: '.length));
          }
        }
      }
      var overlayPrimary = -1, overlayShade = null;
      if (currentExplanation && currentExplanation.status === 'supported') {
        overlayPrimary = currentExplanation.conclusion.cellIndex;
        overlayShade = currentExplanation.support.cells || null;
      }

      for (var i = 0; i < 81; i++) {
        var d = cells[i];
        d.className = 'og-cell' + (Math.floor(i / 9) % 3 === 0 && i > 8 ? ' bt' : '') +
                      (i % 9 % 3 === 0 && i % 9 !== 0 ? ' bl' : '');
        d.innerHTML = ''; d.textContent = '';
        /* Which cell(s) the CURRENT step touched — added unconditionally
           (not nested inside the value/trial branches below) so it also
           lights up a cell the step left EMPTY (e.g. a refuted trial's
           cleared[] cells, or an erase), not just one that still shows a
           digit. Fixes "the cell move and the row move are easily out of
           sync" (2026-09-10): the old check only ever looked at a single
           `payload.cell_index`, which most non-VALUE_SET event types don't
           carry their cell reference under at all — see stepCells(). */
        if (lastCells.indexOf(i) >= 0) d.classList.add('justplaced');

        var v = s.values[i], org = s.origin[i], tr = s.trials[i];
        if (org === Core.ORIGIN.GIVEN) { d.textContent = v; d.classList.add('given'); }
        else if (v) {
          d.textContent = v;
          if (org === Core.ORIGIN.HINT) d.classList.add('hint');
          else { d.classList.add('user'); if (solution && solution[i] !== v) d.classList.add('err'); }
          if (org === Core.ORIGIN.PROMOTED) d.classList.add('promoted');
        } else if (tr) {
          /* TRIAL DIGIT — occupies the value slot (one per cell), but a
             distinct face and never error-checked against the solution.
             UAT feedback (2026-09-20): colored by the owning branch's own
             sequence number (s.tbranch[i] — was a literal `=== 2` check,
             a leftover from the old two-branch-only "first attempt vs.
             retry" model that predates nested/multi-branch trees; already
             wrong for any branch numbered 3+). Same shared helper the live
             board and move-list use, so a replay always matches. */
          d.textContent = tr;
          d.classList.add('trial');
          d.classList.add(Core.trialColorClass(s.tbranch[i]));
          var branchNumEl = document.createElement('span');
          branchNumEl.className = 'oglab-trial-branchnum';
          branchNumEl.textContent = String(s.tbranch[i]);
          branchNumEl.setAttribute('aria-hidden', 'true');
          d.appendChild(branchNumEl);
        } else if (s.notes[i]) {
          var g = document.createElement('div'); g.className = 'og-notes';
          for (var n = 1; n <= 9; n++) {
            var sp = document.createElement('span');
            sp.textContent = (s.notes[i] & (1 << n)) ? n : '';
            g.appendChild(sp);
          }
          d.appendChild(g);
        }

        /* the cells that killed a refuted line — the teaching moment, so
           they get a ring rather than a fill and survive on top of whatever
           the cell already shows */
        if (contra && contra.cells && contra.cells.indexOf(i) >= 0) {
          d.classList.add('contradiction');
        }

        /* Package C/D (2026-09-24) — NS/HS auto-explanation overlay.
           Reuses .tech-hint/.tech-hint-primary verbatim from orbace-grid.css
           (same ring+fill, same pulse animation live Play's own Practice-
           mode "Show" hint tool already uses) rather than inventing new
           overlay styling — a replay board and a live board already read
           as "the same visual object" (orbace-supu-replay.css's own header
           comment), this keeps that true for this overlay too. Primary
           (the placed digit) gets both classes so the pulse fires on it;
           supporting cells (NS: its 20 peers, HS: the one qualifying unit)
           get the ring alone. Cleared for free every render: className is
           fully reset at the top of this loop, so stepping off a supported
           cell (or to any step with no supported tag) drops the overlay
           with no separate "clear" code path to keep in sync. */
        if (overlayPrimary === i) {
          d.classList.add('tech-hint', 'tech-hint-primary');
        } else if (overlayShade && overlayShade.indexOf(i) >= 0) {
          d.classList.add('tech-hint');
        }

        var symId = s.pins[i];
        var symKey = annPins[i] !== undefined ? annPins[i] : (symId ? Core.PIN_BY_ID[symId].key : null);
        if (symKey) {
          var pin = document.createElement('span');
          pin.className = 'og-pin';
          pin.textContent = Core.PIN_BY_KEY[symKey].glyph;
          pin.title = Core.PIN_BY_KEY[symKey].label;
          d.appendChild(pin); d.classList.add('haspin');
        }

        // W6 (a11y): only meaningful on the interactive (lab) board — see
        // this cell's id/label being the aria-activedescendant target for
        // the roving-focus keydown handler set up in mount() above.
        if (onCellClick) {
          d.id = cellDomId(i);
          d.setAttribute('role', 'gridcell');
          d.setAttribute('aria-label', cellAriaLabel(i, s, org, v, tr, solution, symKey));
        }
      }
      // className was fully rewritten per-cell above, which would silently
      // drop a keyboard-focus indicator set by a prior arrow-key move —
      // reapply it once, after the redraw, rather than inside the loop.
      if (onCellClick && focusedCell >= 0 && cells[focusedCell]) cells[focusedCell].classList.add('kbd-focus');
    }

    function buildList() {
      if (!listEl) return;
      listEl.innerHTML = '';
      // W6 (a11y): this is the replay's whole navigation surface (every row
      // seeks to that step on click) — until now, every row was a plain,
      // non-focusable <div>, so the entire move list, including trial-path
      // branch navigation, was invisible to keyboard/screen-reader use. A
      // generic container label plus per-row role/tabindex/keydown below is
      // the fix; role="list" (not a composite listbox with roving tabindex)
      // was chosen deliberately — each row independently tabbable is a
      // simpler, more universally-supported idiom to get right on a first
      // pass than a hand-rolled roving-focus widget, at the cost of more
      // tab stops for a long replay. Revisit if a real AT walkthrough
      // (Team D, per the Phase 2 RC) finds that cost too high.
      listEl.setAttribute('role', 'list');
      listEl.setAttribute('aria-label', 'Move list — activate a row to jump to that step');
      /* merge: capture events in order, plus annotation notes at their anchor */
      var rows = [];
      tl.events.forEach(function (ev, k) { rows.push({ at:k + 1, ev:ev, ann:false, idx:k }); });
      annotations.notes.forEach(function (a) { rows.push({ at:a.at, ann:true, text:a.text }); });
      rows.sort(function (a, b) { return a.at - b.at || (a.ann ? 1 : -1); });

      rows.forEach(function (r) {
        var d = document.createElement('div');
        var ariaLabel;
        if (r.ann) {
          d.className = 'osr-mv text ann';
          d.innerHTML = '<span class="osr-mv-label">Annotation · after step ' + r.at + '</span>';
          d.appendChild(document.createTextNode(r.text));
          ariaLabel = 'Step ' + r.at + ': annotation, ' + r.text;
        } else {
          var info = describe(r.ev, solution, selfDeclaredByIndex[r.idx], neutralLabels);
          if (!info) return;          /* suppressed erase-expansion event */
          d.className = 'osr-mv ' + info.kind;
          /* v3: indent a nested trial row under its parent (depth-based,
             unchanged) and hue it by OWNING BRANCH NUMBER (info.colorClass
             — see describe()'s own comment) so a nested path visibly sits
             under its parent while still reading as its own distinct
             branch, not "whatever color this depth is". */
          if (info.kind === 'trial' || info.kind === 'refuted' || info.kind === 'confirmed' || info.kind === 'merged') {
            var depth = depthByIndex[r.idx] || 0;
            d.style.setProperty('--trial-depth', String(depth));
            if (info.colorClass) d.classList.add(info.colorClass);
          }
          if (info.kind === 'text') {
            d.innerHTML = '<span class="osr-mv-label">Note · step ' + r.at + '</span>';
            d.appendChild(document.createTextNode(info.text));
            ariaLabel = 'Step ' + r.at + ': note, ' + info.text;
          } else {
            d.innerHTML = '<span class="osr-mv-label">' + r.at + '. ' + info.label + '</span>' +
                          '<span>' + info.loc + '</span>';
            ariaLabel = 'Step ' + r.at + ': ' + info.label + ', ' + info.loc;
          }
        }
        d.dataset.at = r.at;
        // role="button" + tabindex + a text aria-label independent of the
        // two-span visual layout (so a screen reader gets one coherent
        // sentence, not "26. Naked Single" then a disconnected "R4C7=5").
        d.setAttribute('role', 'button');
        d.tabIndex = 0;
        d.setAttribute('aria-label', ariaLabel);
        var activate = function () { pause(); tl.seek(r.at); render(); };
        d.onclick = activate;
        d.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
        });
        listEl.appendChild(d);
      });
    }

    function renderList() {
      if (!listEl) return;
      var pos = tl.pos();
      var anchor = null;  // the done row closest to `pos`, used as a scroll target when no row is an exact match
      Array.prototype.forEach.call(listEl.children, function (d) {
        var at = +d.dataset.at;
        var done = at <= pos;
        d.classList.toggle('done', done);
        var isCur = at === pos;
        d.classList.toggle('cur', isCur);
        // W6 (a11y): the "current step" state was CSS-only (.cur) — a
        // screen reader had no way to identify which row the board/controls
        // are currently sitting on.
        if (isCur) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
        if (done && (!anchor || at > +anchor.dataset.at)) anchor = d;
      });
      /* `anchor` is null exactly when pos===0 (no row's `at` — which starts
         at 1 — is ever <= 0), so scrolling to the top is correct there. The
         old code only ever looked for an EXACT `at === pos` match to scroll
         to; seeking to 0 (the ⏮ "First"/Start control) never has one, so the
         list silently kept whatever scrollTop a previous play/scrub/seek had
         left it at — reading as "the list jumped to a random row" even
         though the step counter and board both correctly reset (2026-09-12
         UAT: "click start, the step jumped directly to row 26"). Falling
         back to the nearest done row also covers a suppressed erase-
         expansion step (describe() returns null for those — see buildList —
         so no `.osr-mv` element exists at that exact `at` at all). */
      if (!anchor) { listEl.scrollTop = 0; return; }
      /* `Element.offsetTop` is relative to the nearest POSITIONED ancestor
         (offsetParent), not to `listEl`'s own scroll frame — and `listEl`
         here is `position: static` on the real page, so its offsetParent is
         <body>. `anchor.offsetTop` was therefore the row's distance from the
         top of the WHOLE PAGE (hundreds of px more than the list's own
         ~500-1000px scrollable range), while `listEl.scrollTop`/
         `clientHeight` are in the list's own small coordinate space — two
         different rulers compared directly. The moment this ever computed a
         change, it requested a scrollTop far past the list's actual max, the
         browser clamped it there, and the view landed at the BOTTOM of the
         list — reading as "the step jumped to some other row," reproduced
         live on the very first step of a brand-new capture (2026-09-12 UAT:
         confirmed via direct measurement — requested scrollTop 884 against
         an actual max of 522 (scrollHeight 1060 - clientHeight 538),
         clamped to exactly 522, i.e. the list's bottom).
         getBoundingClientRect() is always viewport-relative for both
         elements, so subtracting the two gives the row's true position
         within listEl's own content regardless of CSS positioning
         context — this is the fix; the `!anchor` case above needed no such
         correction since it's a hardcoded 0, not a computed offset. */
      var top = anchor.getBoundingClientRect().top - listEl.getBoundingClientRect().top + listEl.scrollTop;
      var bot = top + anchor.offsetHeight;
      if (top < listEl.scrollTop) listEl.scrollTop = top;
      else if (bot > listEl.scrollTop + listEl.clientHeight) listEl.scrollTop = bot - listEl.clientHeight;
    }

    function syncControls() {
      /* `tl` is null until the first load() — pause() runs before it, so this
         guard is load-order, not defensive noise. */
      if (!controlsEl || !tl) return;
      controlsEl.querySelector('.osr-step').textContent = 'Step ' + tl.pos() + ' / ' + tl.length();
      var playBtn = controlsEl.querySelector('.osr-btn-play');
      playBtn.textContent = timer ? '⏸' : '▶';
      // W6 (a11y): the glyph swap above was always visual-only — a screen
      // reader had no way to know playback had started. aria-pressed plus
      // a state-matching aria-label make "Play"/"Pause" an announced toggle.
      playBtn.setAttribute('aria-pressed', timer ? 'true' : 'false');
      playBtn.setAttribute('aria-label', timer ? 'Pause' : 'Play');
    }

    /** §9 series readout: `Trial path @ R1C5 {2,6,8̶} → 6`, eliminated
     *  candidates struck through, and `→ must be 2` once eliminations force
     *  the remaining digit. Rendered from the reducer's own series state
     *  (eliminatedDigits is its public read API) — the CSS for this existed
     *  since Phase 1 but nothing ever built the element (F8). Shows the
     *  series of the most recent TRIAL_OPEN/TRIAL_CLOSE at or before the
     *  cursor, so it follows the same timeline as the move list. */
    function renderSeriesReadout() {
      if (!readoutEl) {
        readoutEl = document.createElement('div');
        readoutEl.className = 'osr-v2-series';
        // W6 (a11y): this is the "teaching payload" for a trial path (which
        // candidates survive, what's forced) — it was plain text with no
        // announcement of its own updates as the cursor moves through a
        // trial series.
        readoutEl.setAttribute('role', 'status');
        readoutEl.setAttribute('aria-live', 'polite');
        // UAT feedback (2026-09-28): this used to insert right after
        // boardEl itself, landing as a full-width sibling in the board's
        // own column. Since js/orbace-grid.js's addCoordinateFrame()
        // (r1-r9/c1-c9 reference line, same day) wraps boardEl inside a
        // new .og-board-frame, boardEl is no longer the last thing in its
        // column — it's nested one level deeper, with no nextSibling of
        // its own — so inserting relative to boardEl directly landed
        // readoutEl INSIDE that frame's own 2-column CSS grid instead,
        // auto-placed into the narrow row-header column (the "wrapped in
        // a small box" report). Anchor on the frame itself when present,
        // so this still lands as a sibling of the frame (full column
        // width) exactly as before addCoordinateFrame() existed.
        var anchor = boardEl.closest('.og-board-frame') || boardEl;
        if (anchor.parentNode) anchor.parentNode.insertBefore(readoutEl, anchor.nextSibling);
      }
      var s = tl.state(), pos = tl.pos(), sid = null, bid = null;
      for (var i = pos - 1; i >= 0; i--) {
        var e = tl.events[i];
        if (e.payload && e.payload.series_id && (e.event_type === 'TRIAL_OPEN' || e.event_type === 'TRIAL_CLOSE')) {
          sid = e.payload.series_id;
          bid = e.payload.branch_id;
          break;
        }
      }
      var ser = sid ? s.series[sid] : null;
      if (!ser) { readoutEl.innerHTML = ''; return; }
      // UAT feedback (2026-09-20): `ser` (s.series[sid]) never carried a
      // `testing` field at all (bug — `testing` only ever lives on
      // s.branches[branch_id], per applyEvent()'s own TRIAL_OPEN case) —
      // the "Assume" line added 2026-09-19 silently read `ser.testing` as
      // `undefined`, with zero test coverage catching it. `bid` (the same
      // branch id this readout is otherwise now labeled with, see below)
      // resolves it correctly; `s.branches` keeps every branch's record
      // even after it closes (only `.status` changes), so this is safe
      // regardless of the series' resolution state.
      var testing = (bid != null && s.branches[bid]) ? s.branches[bid].testing : null;
      var elim = Core.eliminatedDigits(ser);
      var parts = (ser.candidates || []).map(function (d) { return elim.indexOf(d) >= 0 ? '<s>' + d + '</s>' : String(d); });
      // UAT feedback (2026-09-19) — root cause: `ser.candidates` is seeded
      // straight from the player's own pencil marks at TRIAL_OPEN time (see
      // orbace-grid-lab.js's openPath(): `candidates = st.notes[selectedCell]`),
      // NOT a forcing conclusion. Whenever a player opens a branch on a cell
      // that already had only one digit pencilled in, `remaining.length===1`
      // was already true at the very first step, before anything was
      // actually tested — this badge then claimed "must be N" about an
      // as-yet-unconfirmed assumption. A real forced conclusion requires at
      // least one candidate to have actually been eliminated by a TRIAL_SET
      // during this series (`elim.length > 0`); until then, this reads as
      // the assumption it is — the same "Assume" framing orbace-grid-lab.js's
      // own currentBranchSteps() already uses live for the identical event,
      // now naming the tested digit explicitly (`ser.testing`, previously
      // unused here) instead of only implying it via strikethroughs.
      var tail = '';
      if (ser.resolvedTo != null) tail = ' → ' + ser.resolvedTo;
      else if (elim.length > 0) {
        var remaining = (ser.candidates || []).filter(function (d) { return elim.indexOf(d) < 0; });
        if (remaining.length === 1) tail = ' → must be ' + remaining[0];
      }
      // UAT feedback (2026-09-20): "(N)" is the branch's own sequence
      // number (branch_id — assigned once, in opening order) so the reader
      // can tell which branch this readout is about, matching the same
      // number the live capture board shows on that branch's cells (see
      // orbace-replay-core.js's trialColorClass() comment) and the
      // move-list rows below. The badge chip also gets that same color
      // class (reusing the identical `.oglab-trial-cN` classes the board
      // uses, not a separate naming scheme) so a scrubbed replay reads the
      // identical color for the identical branch, live and in Review alike.
      var colorClass = Core.trialColorClass(bid);
      readoutEl.innerHTML = tail
        ? ('<span class="osr-v2-badge ' + colorClass + '">Inferential binary tree branch (' + bid + ')</span> @ ' + rc(ser.cellIndex) + ' {' + parts.join(',') + '}' + tail)
        : ('<span class="osr-v2-badge ' + colorClass + '">Assume (' + bid + ')</span> ' + rc(ser.cellIndex) + '=' + testing + ' of {' + parts.join(',') + '}');
    }

    function render() {
      renderBoard(); updateExplainCaption(); renderSeriesReadout(); renderList(); syncControls();
      // Re-synced every render, not just on load()/resize: the explain
      // caption and series readout toggle visible/hidden per step, which
      // changes .osr-board-col's own rendered height — a stale
      // once-at-load measurement would drift out of alignment with the
      // grid as the player steps through (see syncListHeight()'s own
      // header comment for the full rationale).
      syncListHeight();
      if (onStep) onStep(tl.pos(), tl.length(), tl);
      if (tl.pos() >= tl.length()) pause();
    }

    // UAT feedback (2026-09-16): the move list had no height cap at all, so
    // a real capture's full step-by-step list grew taller than the board
    // and forced the PLAYER TO SCROLL THE WHOLE PAGE to see later steps —
    // renderList()'s own scrollTop auto-scroll-into-view logic (see that
    // function's 2026-09-12 comment) was already correct, but had nothing
    // to scroll WITHIN: listEl.clientHeight === listEl.scrollHeight with no
    // cap set, so every scrollTop assignment there was a no-op. Matching
    // listEl's max-height to the board's own rendered height (not a fixed
    // constant — the board is responsive, see orbace-grid.css's
    // `--og-cell:calc(100cqw/9)`) turns the list into its own independently
    // scrollable panel the same height as the grid, which is what makes
    // that existing auto-scroll logic actually visible.
    //
    // Revised for UAT feedback (2026-09-24), two bugs found together:
    //  1. "align with the grid height" — this measured boardEl alone, not
    //     the column it sits in (board + the "why" caption + transport
    //     controls below it, .osr-board-col's real rendered height), so
    //     the list was always a bit SHORTER than the visual column it was
    //     meant to line up with.
    //  2. "detail steps ... cannot be fully displayed with the grid [on
    //     mobile]" — this ran unconditionally, so once .osr-layout wraps
    //     (mobile, or any narrow-enough width) it kept setting an inline
    //     max-height matched to the board's full square size (up to
    //     540px) — an inline style beats a stylesheet rule regardless of
    //     media query, so it silently overrode the mobile @media block's
    //     own, deliberately-much-shorter .osr-movelist max-height. A
    //     board-height list stacked UNDER a board-height board is exactly
    //     "can't both fit on one screen."
    // Fix: measure the whole column, and only apply the match when the
    // list is actually sitting BESIDE it (same top — i.e. this flex line
    // did not wrap). When stacked, clear the inline override so the
    // stylesheet's own compact mobile cap (orbace-supu-replay.css's
    // .osr-movelist media-query rule) governs instead.
    function syncListHeight() {
      if (!listEl) return;
      // UAT feedback (2026-09-28): same reparenting js/orbace-grid.js's
      // addCoordinateFrame() (r1-r9/c1-c9 reference line) caused for
      // renderSeriesReadout()'s insertion point above — boardEl.parentElement
      // used to BE .osr-board-col (board + explain caption + transport
      // controls) but is now the much-shorter .og-board-frame (just the
      // board + its column-header row), silently under-measuring the real
      // column height this is meant to match. Anchor on the frame when
      // present and walk one level further up to its own parent — the
      // actual .osr-board-col — restoring the original measurement.
      var anchor = boardEl.closest('.og-board-frame') || boardEl;
      if (!anchor.parentElement) return;
      var colRect = anchor.parentElement.getBoundingClientRect();
      var listRect = listEl.getBoundingClientRect();
      var sideBySide = Math.abs(listRect.top - colRect.top) < 4;
      if (sideBySide && colRect.height > 0) {
        listEl.style.maxHeight = colRect.height + 'px';
      } else {
        listEl.style.maxHeight = '';
      }
    }
    if (listEl && typeof window !== 'undefined' && window.addEventListener) {
      var resizeTimer = null;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(syncListHeight, 120);
      });
    }

    function pause() { clearInterval(timer); timer = null; syncControls(); }
    function play() {
      if (timer) { pause(); return; }
      if (!tl || !tl.length()) return;
      if (tl.pos() >= tl.length()) tl.seek(0);
      timer = setInterval(function () { tl.seek(tl.pos() + 1); render(); }, speed);
      syncControls();
    }
    function seek(p) { pause(); tl.seek(p); render(); }

    if (controlsEl) {
      var q = function (s) { return controlsEl.querySelector(s); };
      q('.osr-btn-play').onclick = play;
      q('.osr-btn-first').onclick = function () { seek(0); };
      q('.osr-btn-last').onclick  = function () { seek(tl.length()); };
      q('.osr-btn-back').onclick  = function () { seek(tl.pos() - 1); };
      q('.osr-btn-fwd').onclick   = function () { seek(tl.pos() + 1); };
      q('.osr-speed').onchange = function (e) { speed = +e.target.value; if (timer) { pause(); play(); } };
    }

    function load(g, events, sol, anns, story) {
      pause();
      givens = g || ''; solution = sol || null;
      annotations = anns || { notes: [], pins: [] };
      tl = Core.createTimeline(givens, events || []);
      selfDeclaredByIndex = buildSelfDeclaredTechniques(tl);
      depthByIndex = computeTrialDepths(events || []);
      renderStory(story || null);
      cells = buildBoard(boardEl);
      if (onCellClick) cells.forEach(function (d, i) { d.onclick = function () { onCellClick(i); }; });
      // W6 (a11y): fresh cells means any prior focused-cell index/DOM
      // reference from a previous load() is stale — start over at "no
      // keyboard cursor placed yet" (the keydown handler treats < 0 as
      // "start from cell 0" on the first arrow/Enter press).
      focusedCell = -1;
      if (onCellClick) boardEl.removeAttribute('aria-activedescendant');
      void boardEl.offsetHeight;
      syncListHeight();
      buildList(); tl.seek(0); render();
    }

    return { load:load, play:play, pause:pause, seek:seek, render:render,
             timeline: function () { return tl; } };
  }

  /** Wires a `<input type="range">` scrubber so it only seeks on an actual
   *  drag (or a keyboard arrow-key step), never a plain click on the track
   *  — a native range input's click-to-position behavior jumps straight to
   *  wherever you clicked, which can be dozens of steps away from one
   *  click (2026-09-10 UI feedback: "click on next step, the step went to
   *  #25" from a single click near step #1 — not a data desync; the board
   *  and move list were correctly in sync for wherever it actually landed,
   *  the click itself was the surprise). Pointer Events unify mouse and
   *  touch, so this covers both; keyboard arrow-key stepping on a focused
   *  control never fires `pointerdown` at all, so it's unaffected — this
   *  only ever intercepts a plain, no-movement click. Exported (not baked
   *  into mount()) so a host page opts in explicitly; su-pu-lab.html's own
   *  page-supu-lab.js is untouched by this session's changes and keeps its
   *  existing direct `scrub.oninput = ...` wiring unless its own
   *  maintainer chooses to adopt this too. */
  function wireScrubSafely(scrubEl, onSeek) {
    var dragging = false, startX = 0, valueBeforeGesture = null;
    scrubEl.addEventListener('pointerdown', function (e) {
      dragging = false; startX = e.clientX; valueBeforeGesture = scrubEl.value;
    });
    scrubEl.addEventListener('pointermove', function (e) {
      if (valueBeforeGesture === null) return;
      if (Math.abs(e.clientX - startX) > 3) dragging = true;
    });
    scrubEl.addEventListener('input', function () {
      if (valueBeforeGesture !== null && !dragging) { scrubEl.value = valueBeforeGesture; return; }
      onSeek(+scrubEl.value);
    });
    scrubEl.addEventListener('pointerup', function () { valueBeforeGesture = null; dragging = false; });
  }

  return { mount: mount, describe: describe, wireScrubSafely: wireScrubSafely, computeTrialDepths: computeTrialDepths, buildSelfDeclaredTechniques: buildSelfDeclaredTechniques };
})();

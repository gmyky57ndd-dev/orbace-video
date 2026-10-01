/* Su-Pu technique explanations — placement resolver + eligibility gate.
 * docs/plans/2026-09-21-supu-web-technique-explanations-execution-plan.md,
 * Package A. Pure module: no DOM, no network, same separation
 * orbace-story-core.js draws from orbace-story-editor.js. Consumed by both
 * js/page-supu-capture.js (preview) and js/orbace-supu-replay-v2.js
 * (replay overlay) — this is the ONE place placement provenance is
 * resolved, so the two hosts can't independently drift on what counts as
 * "the placement this technique tag explains" the way
 * buildSelfDeclaredTechniques()'s ad hoc lastValueSetIndexAtCell map used to.
 *
 * CONSERVATIVE ON PURPOSE. Source spec §6: "Skip replacements, aggregated
 * confirmation promotions and ambiguous undo/redo provenance until
 * explicitly supported... If the existing core cannot establish this
 * without substantial changes, restrict eligibility and show the
 * fallback." resolvePlacement() below does exactly that: a cell is only
 * eligible when the single most recent event that touched it (via
 * orbace-replay-core.js's corrected byCell index — see that file's
 * stepCells()) is a plain VALUE_SET matching the cell's current value.
 * Any other last-touching event (an undo restored it, a hint revealed it,
 * a trial promoted it) falls back rather than tracing further back
 * through history to find "the real original placement" — that is a
 * recorder-rewrite-sized problem this small feature deliberately does not
 * take on (spec: "Do not expand this small feature into a recorder
 * rewrite").
 */
window.OrbaceTechniqueExplanations = (function () {
  'use strict';

  /** Given a orbace-replay-core.js timeline (from createTimeline) and a
   *  cell index, resolve which recorded event — if any — cleanly accounts
   *  for that cell's value AS OF THE TIMELINE'S CURRENT POSITION
   *  (timeline.pos()/timeline.state()), not necessarily the end of the
   *  stream. Callers seek() first if they want "the value after step N".
   *
   *  Returns:
   *    { eligible: true,  eventIndex, cellIndex, value }
   *    { eligible: false, reason: 'invalid_cell' | 'no_history' |
   *                                'cell_empty' | 'open_trial' |
   *                                'ambiguous_provenance' | 'value_mismatch',
   *      lastEventType? }  -- lastEventType only set for ambiguous_provenance
   *
   *  'ambiguous_provenance' covers every case doc §6 asks to fall back on:
   *  the last touch was an UNDO_APPLY/REDO_APPLY, a HINT_REVEAL, a
   *  TRIAL_CLOSE promotion, etc. — never a best-effort guess at what it
   *  "really" resolves to.
   */
  function resolvePlacement(timeline, cell) {
    if (!(typeof cell === 'number' && cell >= 0 && cell < 81)) {
      return { eligible: false, reason: 'invalid_cell' };
    }

    var state = timeline.state();
    if (state.openBranch) {
      // Deliberately global, not unit-scoped: a precise "does the open
      // trial's seed cell share this cell's row/column/box" check needs
      // the same unit-membership math Package B's NS/HS detector already
      // needs (orbace-grid-lab-capture.js's unitCells()) — reusing it here
      // would couple the resolver to the detector for a narrower gate.
      // Over-restricting here is safe (doc §6's own instruction); a false
      // "fall back" just shows the existing honest fallback copy, never a
      // false proof.
      return { eligible: false, reason: 'open_trial' };
    }

    var currentValue = state.values[cell];
    if (!currentValue) return { eligible: false, reason: 'cell_empty' };

    var touches = timeline.byCell[cell] || [];
    var pos = timeline.pos();
    var lastIdx = -1;
    for (var k = touches.length - 1; k >= 0; k--) {
      if (touches[k] < pos) { lastIdx = touches[k]; break; }
    }
    if (lastIdx === -1) return { eligible: false, reason: 'no_history' };

    var ev = timeline.events[lastIdx];
    if (ev.event_type !== 'VALUE_SET') {
      return { eligible: false, reason: 'ambiguous_provenance', lastEventType: ev.event_type };
    }
    // Should always hold if byCell/state stay consistent, but a mismatch
    // here means something else touched the cell without being indexed —
    // never assert a proof against a value the resolved event didn't
    // actually produce.
    if (ev.payload.next_value !== currentValue) {
      return { eligible: false, reason: 'value_mismatch' };
    }

    return { eligible: true, eventIndex: lastIdx, cellIndex: cell, value: currentValue };
  }

  /* -----------------------------------------------------------------------
     PACKAGE B — NS/HS DETECTOR.

     This release detects only the literal "Naked Single" / "Hidden Single"
     self-declared labels (product decision, 2026-09-21 — see the plan doc
     §1 item 9 / §3.B.5). Every other label (Naked Pair, Locked Candidates,
     Hidden Pair, Cross Hatching, Last Digit, or an unrecognized string)
     returns status 'unsupported' — the existing fallback copy, unchanged.

     unitCells()/candidatesFor() are ported from
     orbace-grid-lab-capture.js's own functions of the same purpose (used
     there for contradiction detection) rather than imported — that module
     is loaded on the capture/lab hosts but NOT on replay-template.html
     (verified: its extraJs list has no orbace-grid-lab-capture.js entry),
     so this module needs its own copy to work on both hosts. Same
     board-only, pencil-marks-never-the-proof-source semantics doc §6
     requires: candidates come from committed values in row/column/box,
     never from the player's notes.
     ----------------------------------------------------------------------- */

  var DETECTOR_VERSION = 1;

  function unitCells(kind, r, c) {
    var cells = [];
    if (kind === 'ROW') {
      for (var i = 0; i < 9; i++) cells.push(r * 9 + i);
    } else if (kind === 'COL') {
      for (var j = 0; j < 9; j++) cells.push(j * 9 + c);
    } else {
      var br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
      for (var dr = 0; dr < 3; dr++) for (var dc = 0; dc < 3; dc++) cells.push((br + dr) * 9 + (bc + dc));
    }
    return cells;
  }

  function candidatesFor(values, idx) {
    var r = Math.floor(idx / 9), c = idx % 9;
    var used = new Uint8Array(10);
    for (var k = 0; k < 9; k++) { used[values[r * 9 + k]] = 1; used[values[k * 9 + c]] = 1; }
    var br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (var dr = 0; dr < 3; dr++) for (var dc = 0; dc < 3; dc++) used[values[(br + dr) * 9 + (bc + dc)]] = 1;
    var out = [];
    for (var d = 1; d <= 9; d++) if (!used[d]) out.push(d);
    return out;
  }

  function unitIndexLabel(kind, r, c) {
    if (kind === 'ROW') return r + 1;
    if (kind === 'COL') return c + 1;
    return Math.floor(r / 3) * 3 + Math.floor(c / 3) + 1;
  }

  function unitWord(kind) {
    return kind === 'ROW' ? 'row' : kind === 'COL' ? 'column' : 'box';
  }

  function rc(i) { return 'R' + (Math.floor(i / 9) + 1) + 'C' + (i % 9 + 1); }

  /** Board-overlay ("shade") consumers (Package C/D) need the actual cell
   *  indices a Naked Single's proof rests on, not just the digit — the
   *  cell's own row+col+box peers are jointly what eliminates every other
   *  candidate. HS's own `support.cells` already gives one unit for the
   *  same purpose; NS's is the union of all three, deduped, self excluded
   *  (a naked single isn't "explained" by one unit the way a hidden single
   *  is — it's the full peer set together). */
  function peerCells(cell) {
    var r = Math.floor(cell / 9), c = cell % 9;
    var seen = {}; seen[cell] = true;
    var out = [];
    unitCells('ROW', r, c).concat(unitCells('COL', r, c)).concat(unitCells('BOX', r, c)).forEach(function (i) {
      if (!seen[i]) { seen[i] = true; out.push(i); }
    });
    return out;
  }

  /** True iff `values[cell]` (still empty in this before-state) has exactly
   *  one legal candidate and it is `digit`. Doc §6: "A different solved
   *  digit, matching solution array, or single handwritten candidate does
   *  not satisfy this test" — this reads only committed board values. */
  function isNakedSingle(values, cell, digit) {
    var cands = candidatesFor(values, cell);
    return cands.length === 1 && cands[0] === digit;
  }

  /** Row, then column, then box (doc §6's fixed, stable order). Returns the
   *  first unit where `cell` is the only empty cell that can legally hold
   *  `digit`, or null if none qualifies. Requires `digit` to actually be
   *  legal at `cell` first — an inconsistent before-state (shouldn't occur
   *  in a valid capture) never yields a proof. */
  function isHiddenSingle(values, cell, digit) {
    var r = Math.floor(cell / 9), c = cell % 9;
    if (candidatesFor(values, cell).indexOf(digit) === -1) return null;
    var kinds = ['ROW', 'COL', 'BOX'];
    for (var i = 0; i < kinds.length; i++) {
      var kind = kinds[i];
      var cells = unitCells(kind, r, c);
      var onlyThisCell = true;
      for (var j = 0; j < cells.length; j++) {
        var other = cells[j];
        if (other === cell) continue;
        if (values[other] === 0 && candidatesFor(values, other).indexOf(digit) !== -1) { onlyThisCell = false; break; }
      }
      if (onlyThisCell) return { kind: kind, unitNumber: unitIndexLabel(kind, r, c), cells: cells };
    }
    return null;
  }

  /** A throwaway timeline seeked to just before `eventIndex`, i.e. the
   *  board exactly as it was immediately before that event applied — never
   *  the caller's own shared timeline, which must keep its own position
   *  untouched (doc §4: "draw an immutable alternate frame rather than
   *  changing the live reducer state"). `Core` is read lazily (not at
   *  module-load time) so script load order between this file and
   *  orbace-replay-core.js doesn't matter, only call order. */
  function computeBeforeState(givens, events, eventIndex) {
    var Core = window.OrbaceReplayCore;
    var scratch = Core.createTimeline(givens, events);
    return scratch.seek(eventIndex);
  }

  var INELIGIBLE_STATUS = {
    invalid_cell: 'ambiguous_action',
    cell_empty: 'ambiguous_action',
    no_history: 'ambiguous_action',
    open_trial: 'insufficient_evidence',
    ambiguous_provenance: 'insufficient_evidence',
    value_mismatch: 'insufficient_evidence',
  };

  var FALLBACK_TEXT = 'Player-tagged · Visual explanation unavailable';

  /** The Package A+B entry point. `givens` is the same 81-char string the
   *  caller already passed to Core.createTimeline() to build `timeline` —
   *  required here too since the timeline object doesn't expose it, and
   *  computeBeforeState() needs it to build its own scratch timeline.
   *
   *  Returns a doc-§5-shaped result:
   *    { status: 'supported' | 'unsupported' | 'insufficient_evidence' | 'ambiguous_action',
   *      source: {eventIndex, cellIndex, value} | null,
   *      technique: 'NS' | 'HS' | null,
   *      support: {unitKind, unitNumber, cells} | {candidates, cells} | null,
   *        -- HS: {unitKind, unitNumber, cells} (the one qualifying unit).
   *        -- NS: {candidates, cells} — `cells` here is the full row+col+box
   *        --   peer set (added 2026-09-24 for Package C/D's board overlay;
   *        --   a naked single's proof rests on all three units together,
   *        --   unlike HS's single qualifying unit).
   *      conclusion: {cellIndex, value} | null,
   *      detectorVersion: number,
   *      copy: {key, params, preview, sentence} | null,
   *      fallbackText: string }                            -- always set
   *
   *  fallbackText is always populated (doc §3: "Keep the selected label,
   *  recorded note and existing save behavior" on any non-'supported'
   *  status) so callers never need to hardcode the fallback copy
   *  themselves.
   */
  function explainPlacement(givens, timeline, cell, selectedTechniqueLabel) {
    var placement = resolvePlacement(timeline, cell);
    var base = { detectorVersion: DETECTOR_VERSION, fallbackText: FALLBACK_TEXT };

    if (!placement.eligible) {
      return Object.assign({}, base, {
        status: INELIGIBLE_STATUS[placement.reason] || 'insufficient_evidence',
        source: null, technique: null, support: null, conclusion: null, copy: null,
      });
    }

    var isNS = selectedTechniqueLabel === 'Naked Single';
    var isHS = selectedTechniqueLabel === 'Hidden Single';
    if (!isNS && !isHS) {
      return Object.assign({}, base, {
        status: 'unsupported',
        source: { eventIndex: placement.eventIndex, cellIndex: cell, value: placement.value },
        technique: null, support: null, conclusion: null, copy: null,
      });
    }

    var before = computeBeforeState(givens, timeline.events, placement.eventIndex);
    var digit = placement.value;
    var cellLabel = rc(cell);
    var source = { eventIndex: placement.eventIndex, cellIndex: cell, value: digit };
    var conclusion = { cellIndex: cell, value: digit };

    if (isNS) {
      if (!isNakedSingle(before.values, cell, digit)) {
        return Object.assign({}, base, { status: 'insufficient_evidence', source: source, technique: 'NS', support: null, conclusion: null, copy: null });
      }
      return Object.assign({}, base, {
        status: 'supported', source: source, technique: 'NS', conclusion: conclusion,
        support: { candidates: [digit], cells: peerCells(cell) },
        copy: {
          key: 'technique_explanation.naked_single', params: { cell: cellLabel, digit: digit },
          preview: 'Naked single at ' + cellLabel + ' · Preview',
          sentence: cellLabel + ' has only one possible digit left: ' + digit + '.',
        },
      });
    }

    var hs = isHiddenSingle(before.values, cell, digit);
    if (!hs) {
      return Object.assign({}, base, { status: 'insufficient_evidence', source: source, technique: 'HS', support: null, conclusion: null, copy: null });
    }
    var word = unitWord(hs.kind);
    return Object.assign({}, base, {
      status: 'supported', source: source, technique: 'HS', conclusion: conclusion,
      support: { unitKind: hs.kind, unitNumber: hs.unitNumber, cells: hs.cells },
      copy: {
        key: 'technique_explanation.hidden_single', params: { unit: word, unitNumber: hs.unitNumber, digit: digit, cell: cellLabel },
        preview: 'Hidden single in ' + word + ' ' + hs.unitNumber + ' · Preview',
        sentence: word.charAt(0).toUpperCase() + word.slice(1) + ' ' + hs.unitNumber + ' has only one place for ' + digit + ': ' + cellLabel + '.',
      },
    });
  }

  /* Package C/D activation gate. docs/plans/2026-09-21-supu-web-technique-
   * explanations-execution-plan.md §4 decision #2 (Team D, 2026-09-21):
   * frontend-only, a module-level const HERE rather than a config.js
   * addition — config.js loads on every page, so flipping it would force a
   * site-wide `?v` bump; this only bumps the two hosts that actually load
   * this module (su-pu-capture.html, replay-template.html — su-pu-lab.html
   * stays dormant per §1 item 3 / §4 decision #3, unaffected either way).
   * UAT feedback (2026-09-24) — a real user asked why the NS/HS shade and
   * highlight weren't showing on Review/final replay; Packages A/B (the
   * math) were already shipped and tested, only C/D's UI wiring was
   * missing. Shipping this ON rather than the plan's original staged
   * dark-then-flip rollout: the overlay only ever activates on a cell the
   * ORIGINAL capturer explicitly self-tagged "Naked Single"/"Hidden
   * Single" (page-supu-capture.js's own technique picker), so the blast
   * radius per row is inherently opt-in and small, not a blanket new
   * always-on surface. Kept as an exported const (not inlined at each call
   * site) for a one-line rollback if CX/UX review afterward asks for one —
   * flip to false, bump `?v`, redeploy; still a deploy-time gate, not a
   * live toggle, since Cloudflare Pages direct upload has no server-side
   * flag plumbing. */
  var TECHNIQUE_EXPLANATIONS_ENABLED = true;

  return {
    resolvePlacement: resolvePlacement,
    explainPlacement: explainPlacement,
    DETECTOR_VERSION: DETECTOR_VERSION,
    TECHNIQUE_EXPLANATIONS_ENABLED: TECHNIQUE_EXPLANATIONS_ENABLED,
  };
})();

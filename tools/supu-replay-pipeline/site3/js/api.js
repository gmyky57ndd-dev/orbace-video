/* Orbace Sudoku Web v4 — API client.
 * Two adapters behind one interface:
 *   mock — serves js/mock-data.js with simulated latency (USE_MOCKS: true)
 *   real — HTTP against PRD §3.4 endpoints on Fly.io Fastify
 * The UI (app.js) only ever talks to window.OrbaceAPI. Backend integration
 * should require config changes + real-adapter completion only — no UI edits.
 */
window.OrbaceAPI = (function () {
  const cfg = window.ORBACE_CONFIG;

  /* ---------------- shared helpers ---------------- */
  let authToken = null; // JWT from /auth/uuid/register or Supabase session
  // Restore Tier-1 JWT from a prior session on full-page reload — without
  // this, authToken exists only in the closure (destroyed on every page
  // navigation) and API calls fail with 401 until the async registerUuid()
  // finishes (reported 2026-07-22: "login not persistent after page change").
  try { const t = localStorage.getItem("orbace_auth_token"); if (t) authToken = t; } catch (_) {}

  // A stalled fetch (dead connection, Fly.io cold start, flaky mobile network)
  // has no default browser timeout — without this, callers relying on
  // .catch() to fail fast (e.g. the homepage's daily-puzzle load) can be left
  // waiting indefinitely instead of ever reaching their fallback/error state.
  async function http(base, path, opts = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let res;
    try {
      res = await fetch(base + path, {
        method: opts.method || "GET",
        // Phase 3 (session cookies): harmless while USE_COOKIE_SESSIONS is
        // off everywhere (no session cookie is ever set, so there is nothing
        // to send) — required once it's on, since the org-api origin only
        // ever sees cookies a same-origin request explicitly opts in to send.
        credentials: "include",
        headers: {
          // Only set Content-Type when there's an actual body — Fastify's
          // JSON body parser rejects ANY request carrying this header with
          // an empty body (FST_ERR_CTP_EMPTY_JSON_BODY), which was silently
          // 400-ing every bodyless POST (startRanking, startOrg) before the
          // route handler ever ran (found 2026-07-22 reproducing the
          // "window may have just closed" report against production with a
          // disposable test account — the window was open the whole time).
          ...(opts.body ? { "Content-Type": "application/json" } : {}),
          ...(authToken ? { Authorization: "Bearer " + authToken } : {}),
          ...(opts.headers || {})
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      const err = new Error("API " + res.status + " " + path);
      err.status = res.status;
      // P6.4: track API 404s for monitoring.
      if (res.status === 404) {
        try { if (window.trackEvent) window.trackEvent("api_404", { path: path }); } catch (e3) {}
      }
      // Some routes reuse one status code for multiple distinct reasons
      // (e.g. GET /org/:eventId/puzzle returns 403 for "window not open,"
      // "window closed," AND "underage account") — err.status alone can't
      // tell those apart. Attach the parsed body so callers that need to
      // (app.js's getOrgPuzzle() catch blocks) can read err.body.error
      // instead of guessing from the status code alone. Best-effort: a
      // non-JSON error body (e.g. an upstream 502 HTML page) leaves
      // err.body undefined, callers already handle that.
      try { err.body = await res.json(); } catch (e2) { /* not JSON, ignore */ }
      throw err;
    }
    // A 204 (e.g. DELETE /supu/lab/:id) has no body at all — res.json() on
    // an empty string throws "Unexpected end of JSON input" rather than
    // returning anything, which the mock adapter's own hand-rolled {}
    // return for deleteSupuLabDraft never exercised (found 2026-09-10 via
    // real UAT: the Delete button in Su-Pu Capture's "My captures" list
    // failed with that exact error against the real backend).
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  const api = (path, opts) => http(cfg.API_BASE_URL, path, opts);
  const orgApi = (path, opts) => http(cfg.ORG_API_URL, path, opts);

  // Set by signOut() so a subsequent fresh page load (e.g. reaching a
  // hash-only route like #supu via a full navigation, which re-runs this
  // whole module) doesn't silently re-establish an identity the user just
  // explicitly signed out of. Cleared by any explicit identity-creating
  // action (registerUuid success, a real sign-in) — see tier1Init below.
  const EXPLICIT_SIGNOUT_KEY = "orbace_explicit_signout";

  // ADR-010 abuse controls (Phase 0.5, 2026-07-25) — a lightweight,
  // never-persisted signal for the server's composite-key rate limiting.
  // Deliberately separate from getDeviceFingerprint(): that value is a
  // persisted identity-resolution key (recovers the same tier1 account
  // across reloads); this one is recomputed fresh on every call and never
  // stored anywhere client-side, used only to bucket abuse-detection
  // counters server-side (which itself only ever stores a one-way hash of
  // it, never the raw signal — see backend/org-api/src/lib/abuse-signal.ts).
  function getAbuseSignal() {
    try {
      return [
        navigator.userAgent || "",
        (screen.width || "") + "x" + (screen.height || ""),
        Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      ].join("|");
    } catch (_) {
      return "";
    }
  }

  function hasSupabaseArtifacts() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("sb-") || k.startsWith("supabase."))) return true;
      }
    } catch (_) {}
    return false;
  }

  /* ---------------- mock adapter ---------------- */
  const M = window.ORBACE_MOCKS;
  const delay = () => new Promise(r => setTimeout(r, cfg.MOCK_LATENCY_MS));

  // Shared client-side filter for the mock Su-Pu library/mine adapters —
  // mirrors supu-discovery.service.ts's buildListWhere() so USE_MOCKS:true
  // exercises the same real filter surface (tier/clean/type/technique/q) as
  // the live endpoint, added for the Su-Pu Library redesign (2026-08-06).
  function filterSupuItems(items, p) {
    let out = items;
    if (p.tier) out = out.filter(x => x.tier === p.tier);
    if (p.clean) out = out.filter(x => x.clean);
    if (p.type) out = out.filter(x => x.type === p.type);
    if (p.technique) out = out.filter(x => (x.techniques || []).indexOf(p.technique) !== -1);
    if (p.q) {
      const q = String(p.q).toLowerCase();
      out = out.filter(x =>
        (x.player && x.player.display_name && x.player.display_name.toLowerCase().indexOf(q) !== -1) ||
        (x.supu_id && x.supu_id.toLowerCase().indexOf(q) !== -1)
      );
    }
    return out;
  }
  function mockCall(name, result) {
    return async (...args) => {
      await delay();
      if (cfg.MOCK_FAIL === name) throw new Error("Mock failure injected for " + name);
      return typeof result === "function" ? result(...args) : result;
    };
  }

  // Su-Pu Replay v2 Phase 4 (2026-09-09) — module-scope store backing the
  // saveSupuLabDraft/getSupuLabDraft/getMySupuLabDrafts/deleteSupuLabDraft
  // mocks below. Keyed by draft id.
  const _mockLabDrafts = {};
  // Mirrors the real backend's DRAFT_CAP (supu-lab.routes.ts) — see
  // saveSupuLabDraft's mock below.
  const MOCK_DRAFT_CAP = 50;
  // Su-Pu Replay v2 Phase 5 (2026-09-09) — backing store for
  // getSupuAnnotation/putSupuAnnotation below. Keyed by supuId (mock mode
  // has no real multi-author concept, so one annotation per Su-Pu here).
  const _mockAnnotations = {};
  // Su-Pu six-priorities brief, Priority 2 (2026-09-21) — backing store for
  // getSupuLabDraftStory/putSupuLabDraftStory below. Keyed by draft id,
  // same one-per-key shape and deterministic-per-key mock digest precedent
  // as _mockAnnotations above.
  const _mockStories = {};

  // Orbace Promo Code capability mock adapter — self-contained (no
  // mock-data.js fixture) since it only needs one campaign/code, matching
  // getTechniqueHint's precedent above for a small in-line mock engine.
  // Tracks redemption in module-scope state so preview -> redeem ->
  // entitlements is exercisable offline in one mock session; resets on
  // full page reload same as every other mock adapter's state.
  const _mockPromoState = { redeemed: false, entitlement: null, idempotencyKeys: {} };
  const MOCK_PROMO_CAMPAIGN = { campaignKey: "founders_1000_6m_2026", displayName: "Founding Player Competition Pass", termsVersion: "2026-08-17-mock" };
  function mockPromoError(code, status) {
    const e = new Error("mock promo error " + code);
    e.status = status;
    e.body = { error: code, code: code, retryable: false };
    return e;
  }

  // Puzzle Challenge (2026-08-28) — self-contained mock engine for the
  // public page's validate/submit calls, same precedent as the promo-code
  // block above: a small real backtracking solver (not a stub) so "Check
  // My Puzzle" exercises genuine error/success paths against whatever a
  // tester actually types or pastes, not just canned responses.
  //
  // Reason codes and check ordering mirror the authoritative wire contract
  // (docs/shared_artifacts/puzzle-challenge-api-contract-v1.md §2.1, owned
  // by Team A's backend plan — this mock exists only so the mock/real
  // adapter swap-over is a config flip, not a frontend rewrite):
  // invalid_format → too_few_givens → conflicting_givens → too_unconstrained
  // (budget) → no_solution / multiple_solutions → valid. `reason` is always
  // a machine code here, same as the real endpoint will return — copy
  // lives in js/page-puzzle-challenge.js's REASON_COPY, not in this file.
  //
  // Node-budgeted the same way admin.js's real pzSolveOne is (Validate
  // Puzzle's pzMakeBudget) — naive Sudoku backtracking can blow up on some
  // inputs, and this only ever needs to be "good enough for local QA."
  function mockHasConflictingGivens(cells) {
    function conflictsIn(indices) {
      const seen = new Set();
      for (const i of indices) {
        const v = cells[i];
        if (v === 0) continue;
        if (seen.has(v)) return true;
        seen.add(v);
      }
      return false;
    }
    for (let r = 0; r < 9; r++) {
      const rowIdx = []; for (let c = 0; c < 9; c++) rowIdx.push(r * 9 + c);
      if (conflictsIn(rowIdx)) return true;
    }
    for (let c = 0; c < 9; c++) {
      const colIdx = []; for (let r = 0; r < 9; r++) colIdx.push(r * 9 + c);
      if (conflictsIn(colIdx)) return true;
    }
    for (let br = 0; br < 9; br += 3) {
      for (let bc = 0; bc < 9; bc += 3) {
        const boxIdx = [];
        for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) boxIdx.push(r * 9 + c);
        if (conflictsIn(boxIdx)) return true;
      }
    }
    return false;
  }
  function mockCountSudokuSolutions(cells, cap) {
    const board = cells.slice();
    let count = 0;
    let nodes = 0;
    let overBudget = false;
    const NODE_BUDGET = 2000000;
    function findEmpty() {
      for (let i = 0; i < 81; i++) if (board[i] === 0) return i;
      return -1;
    }
    function valid(i, v) {
      const row = Math.floor(i / 9), col = i % 9;
      const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
      for (let c = 0; c < 9; c++) if (board[row * 9 + c] === v) return false;
      for (let r = 0; r < 9; r++) if (board[r * 9 + col] === v) return false;
      for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) if (board[r * 9 + c] === v) return false;
      return true;
    }
    function solve() {
      if (count >= cap) return;
      if (nodes++ > NODE_BUDGET) { overBudget = true; return; }
      const i = findEmpty();
      if (i === -1) { count++; return; }
      for (let v = 1; v <= 9 && count < cap && !overBudget; v++) {
        if (valid(i, v)) { board[i] = v; solve(); board[i] = 0; }
      }
    }
    solve();
    return { count, overBudget };
  }
  function mockValidateChallengeGivens(rawGivens) {
    const normalized = window.OrbaceGivensGrid ? window.OrbaceGivensGrid.normalize(rawGivens) : String(rawGivens || "").replace(/\s/g, "").replace(/[-.]/g, "0");
    if (normalized.length !== 81 || !/^[0-9]+$/.test(normalized)) {
      return { valid: false, clue_count: 0, unique_solution: false, reason: "invalid_format" };
    }
    const cells = [...normalized].map(Number);
    const clueCount = cells.filter((c) => c !== 0).length;
    if (clueCount < 17) {
      return { valid: false, clue_count: clueCount, unique_solution: false, reason: "too_few_givens" };
    }
    if (mockHasConflictingGivens(cells)) {
      return { valid: false, clue_count: clueCount, unique_solution: false, reason: "conflicting_givens" };
    }
    const { count, overBudget } = mockCountSudokuSolutions(cells, 2);
    if (overBudget) {
      return { valid: false, clue_count: clueCount, unique_solution: false, reason: "too_unconstrained" };
    }
    if (count === 0) {
      return { valid: false, clue_count: clueCount, unique_solution: false, reason: "no_solution" };
    }
    if (count > 1) {
      return { valid: false, clue_count: clueCount, unique_solution: false, reason: "multiple_solutions" };
    }
    return { valid: true, clue_count: clueCount, unique_solution: true };
  }

  // Challenge the House v2 (2026-08-29) — mock engine for POST
  // /api/puzzles/check and POST /api/submissions. Wire shapes match the
  // build plan directly (camelCase, unlike v1's snake_case contract above):
  // docs/plans/2026-08-29-challenge-the-house-v2-execution-plan.md §7.1/§7.2.
  // Reuses v1's mockHasConflictingGivens/mockCountSudokuSolutions rather than
  // re-deriving well-formed/solution-count logic, and adds a naked+hidden
  // singles-only solver (mirroring the real backend's
  // challenge-machine.service.ts) so the trivial-tier verdict is a genuine
  // computed result too, not a canned response.
  function mockCellLabel(i) {
    return "R" + (Math.floor(i / 9) + 1) + "C" + ((i % 9) + 1);
  }
  function mockFindConflictingPairs(cells) {
    const pairs = [];
    const seen = new Set();
    function addPairsIn(indices) {
      for (let a = 0; a < indices.length; a++) {
        for (let b = a + 1; b < indices.length; b++) {
          const i = indices[a], j = indices[b];
          if (cells[i] === 0 || cells[j] === 0 || cells[i] !== cells[j]) continue;
          const key = i < j ? i + "-" + j : j + "-" + i;
          if (seen.has(key)) continue;
          seen.add(key);
          pairs.push({ a: mockCellLabel(i), b: mockCellLabel(j) });
        }
      }
    }
    for (let r = 0; r < 9; r++) { const idx = []; for (let c = 0; c < 9; c++) idx.push(r * 9 + c); addPairsIn(idx); }
    for (let c = 0; c < 9; c++) { const idx = []; for (let r = 0; r < 9; r++) idx.push(r * 9 + c); addPairsIn(idx); }
    for (let br = 0; br < 9; br += 3) {
      for (let bc = 0; bc < 9; bc += 3) {
        const idx = [];
        for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) idx.push(r * 9 + c);
        addPairsIn(idx);
      }
    }
    return pairs;
  }
  function mockCandidates(cells) {
    const cand = new Map();
    for (let i = 0; i < 81; i++) {
      if (cells[i] !== 0) continue;
      const row = Math.floor(i / 9), col = i % 9;
      const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
      const used = new Set();
      for (let c = 0; c < 9; c++) if (cells[row * 9 + c]) used.add(cells[row * 9 + c]);
      for (let r = 0; r < 9; r++) if (cells[r * 9 + col]) used.add(cells[r * 9 + col]);
      for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) if (cells[r * 9 + c]) used.add(cells[r * 9 + c]);
      const options = [];
      for (let v = 1; v <= 9; v++) if (!used.has(v)) options.push(v);
      cand.set(i, options);
    }
    return cand;
  }
  function mockDetectTrivial(cells) {
    const board = cells.slice();
    let firstTechnique = null, firstCell = null;
    for (let step = 0; step < 200; step++) {
      if (board.every((v) => v !== 0)) return { trivial: true, technique: firstTechnique, cell: firstCell };
      const cand = mockCandidates(board);
      let action = null;
      for (const [i, options] of cand) {
        if (options.length === 0) return { trivial: false, technique: null, cell: null };
        if (options.length === 1) { action = { i, v: options[0], technique: "naked_single" }; break; }
      }
      if (!action) {
        outer:
        for (let br = 0; br < 9 && !action; br += 3) {
          for (let bc = 0; bc < 9 && !action; bc += 3) {
            const idx = [];
            for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) idx.push(r * 9 + c);
            for (let v = 1; v <= 9; v++) {
              const cells2 = idx.filter((i) => cand.has(i) && cand.get(i).includes(v));
              if (cells2.length === 1) { action = { i: cells2[0], v, technique: "hidden_single" }; break outer; }
            }
          }
        }
      }
      if (!action) return { trivial: false, technique: null, cell: null };
      if (!firstTechnique) { firstTechnique = action.technique; firstCell = mockCellLabel(action.i); }
      board[action.i] = action.v;
    }
    return { trivial: false, technique: null, cell: null };
  }
  // mockCountSudokuSolutions (above, v1's original) picks the first empty
  // cell each step — fine for v1's ~30-clue curated puzzles, but a
  // deliberately-hard grid (e.g. AI Escargot, used below and in the backend
  // test fixtures) can exhaust its 2M-node budget before finding a genuine
  // SECOND solution, even after already finding the first — mistakenly
  // reported here as "2" (found live, 2026-08-30: real regression, "Check
  // my puzzle" always showed the multi-solution verdict for a
  // known-unique grid). The real backend's puzzle-validator.service.ts
  // never has this problem because it picks the FEWEST-CANDIDATES empty
  // cell each step (far better pruning) — same algorithm here, kept as a
  // separate function rather than changing mockCountSudokuSolutions in
  // place, since that one is still used by v1's mockValidateChallengeGivens
  // and shouldn't be touched for this page's sake.
  function mockCandidateMask(board, i) {
    const row = Math.floor(i / 9), col = i % 9;
    const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
    let mask = 0x1ff;
    for (let c = 0; c < 9; c++) if (board[row * 9 + c]) mask &= ~(1 << (board[row * 9 + c] - 1));
    for (let r = 0; r < 9; r++) if (board[r * 9 + col]) mask &= ~(1 << (board[r * 9 + col] - 1));
    for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) if (board[r * 9 + c]) mask &= ~(1 << (board[r * 9 + c] - 1));
    return mask;
  }
  function mockPopCount(mask) {
    let v = mask, count = 0;
    while (v) { v &= v - 1; count++; }
    return count;
  }
  function mockCountSolutionsFast(cells, cap) {
    const board = cells.slice();
    let count = 0, nodes = 0, overBudget = false;
    const NODE_BUDGET = 3000000;
    function bestEmpty() {
      let bestIndex = -1, bestCount = 10;
      for (let i = 0; i < 81; i++) {
        if (board[i] !== 0) continue;
        const c = mockPopCount(mockCandidateMask(board, i));
        if (c === 0) return i;
        if (c < bestCount) { bestCount = c; bestIndex = i; if (c === 1) break; }
      }
      return bestIndex;
    }
    function solve() {
      if (count >= cap) return;
      if (nodes++ > NODE_BUDGET) { overBudget = true; return; }
      const i = bestEmpty();
      if (i === -1) { count++; return; }
      let mask = mockCandidateMask(board, i);
      while (mask && count < cap && !overBudget) {
        const bit = mask & -mask;
        const v = 31 - Math.clz32(bit) + 1;
        mask &= ~bit;
        board[i] = v; solve(); board[i] = 0;
      }
    }
    solve();
    return { count, overBudget };
  }

  function mockCheckPuzzle(rawGivens) {
    const normalized = window.OrbaceGivensGrid ? window.OrbaceGivensGrid.normalize(rawGivens) : String(rawGivens || "").replace(/\s/g, "").replace(/[-.]/g, "0");
    if (normalized.length !== 81 || !/^[0-9]+$/.test(normalized)) {
      const e = new Error("invalid_grid");
      e.status = 400;
      e.body = { error: { code: "INVALID_GRID", message: "givens must be 81 characters." } };
      throw e;
    }
    const cells = [...normalized].map(Number);
    const conflicts = mockFindConflictingPairs(cells);
    const wellFormed = conflicts.length === 0;
    let solutionCount = 0, trivial = false, trivialTechnique = null, trivialCell = null;
    if (wellFormed) {
      const { count, overBudget } = mockCountSolutionsFast(cells, 2);
      solutionCount = overBudget ? 2 : count;
      if (solutionCount === 1) {
        const r = mockDetectTrivial(cells);
        trivial = r.trivial; trivialTechnique = r.technique; trivialCell = r.cell;
      }
    }
    return {
      wellFormed, solutionCount, trivial, trivialTechnique, trivialCell,
      conflicts, duplicateOf: null, acceptingSubmissions: true, queueDepth: 3,
      checkToken: "mock-check-token-" + Date.now(),
    };
  }

  // Su-Pu Capture bridge W3 (2026-09-13 execution plan) — mock validate+
  // solve for POST /puzzles/import. Reuses mockCountSolutionsFast/
  // mockFindConflictingPairs/mockCandidateMask/mockPopCount above (same
  // fewest-candidates-first solver mockCheckPuzzle uses) rather than
  // re-deriving solver logic; adds the one piece mockCheckPuzzle never
  // needed — actually walking the found branch to completion so a real
  // solution string can be returned.
  function mockDeriveSolution(cells) {
    const board = cells.slice();
    function bestEmpty() {
      let bestIndex = -1, bestCount = 10;
      for (let i = 0; i < 81; i++) {
        if (board[i] !== 0) continue;
        const c = mockPopCount(mockCandidateMask(board, i));
        if (c === 0) return i;
        if (c < bestCount) { bestCount = c; bestIndex = i; if (c === 1) break; }
      }
      return bestIndex;
    }
    function solve() {
      const i = bestEmpty();
      if (i === -1) return true; // no empty cell left — fully solved
      const mask = mockCandidateMask(board, i);
      if (!mask) return false; // dead end — the picked cell has no options left
      let remaining = mask;
      while (remaining) {
        const bit = remaining & -remaining;
        const v = 31 - Math.clz32(bit) + 1;
        remaining &= ~bit;
        board[i] = v;
        if (solve()) return true;
        board[i] = 0;
      }
      return false;
    }
    return solve() ? board.join("") : null;
  }

  function mockImportPuzzle(rawGivens) {
    function fail(code, message, extra) {
      const e = new Error(code);
      e.status = 400;
      e.body = Object.assign({ error: { code: code, message: message }, givens: rawGivens }, extra || {});
      throw e;
    }
    const normalized = window.OrbaceGivensGrid ? window.OrbaceGivensGrid.normalize(rawGivens) : String(rawGivens || "").replace(/\s/g, "").replace(/[-.]/g, "0");
    if (normalized.length !== 81 || !/^[0-9]+$/.test(normalized)) {
      fail("INVALID_GRID", "givens must be 81 characters: digits 1-9 for clues, 0/./- for blanks.");
    }
    const cells = [...normalized].map(Number);
    const givensCount = cells.filter((c) => c !== 0).length;
    if (givensCount < 17) fail("TOO_FEW_GIVENS", "A unique puzzle needs at least 17 given digits.");
    const conflicts = mockFindConflictingPairs(cells);
    if (conflicts.length) fail("CONFLICTING_GIVENS", "Two or more given digits conflict.", { conflicts: conflicts });
    const { count, overBudget } = mockCountSolutionsFast(cells, 2);
    const solutionCount = overBudget ? 2 : count;
    if (solutionCount !== 1) fail("NOT_UNIQUE", "This grid does not have exactly one solution.");
    const solution = mockDeriveSolution(cells);
    return {
      givens: normalized, solution: solution,
      checksum: "mock-checksum-" + normalized.slice(0, 8),
      difficulty: "medium", tier: "medium",
    };
  }

  const mock = {
    getDailyPuzzle: mockCall("getDailyPuzzle", M.dailyPuzzle),
    getFeatured: mockCall("getFeatured", M.featured),

    getTeamomentPuzzles: mockCall("getTeamomentPuzzles", (params) => {
      const p = params || {};
      let items = (M.teamomentPuzzles && M.teamomentPuzzles.items) || [];
      // Match on pack_id when present, falling back to tier — mirrors the
      // real backend, which filters by the puzzle's actual canonical pack
      // but can self-report a mislabeled `tier` field in the response (see
      // the tea_moments_999 fixture's comment in mock-data.js).
      if (p.tier) items = items.filter(x => (x.pack_id || x.tier) === p.tier);
      if (p.technique) items = items.filter(x => (x.required_techniques || []).includes(p.technique));
      return { items, total: M.teamomentPuzzles ? M.teamomentPuzzles.total : items.length, page: 1, limit: items.length };
    }),

    // Mock-coverage gap closed 2026-09-19 (found while writing
    // test/boot-execution.test.mjs) — /puzzle-packs actually threw
    // "getPacks is not a function" under USE_MOCKS:true (loadPacks() calls
    // it unconditionally, no existence guard). Diffing `real`'s and
    // `mock`'s key sets then found 4 more Puzzle Packs/Puzzle Challenge
    // methods with the same gap (getPackStats, selectPackPuzzle,
    // getPuzzleChallengePack, selectPuzzleChallengePuzzle, below) — fixed
    // together since they're the same root cause, though only getPacks
    // was directly observed throwing (the other 4's call sites are either
    // existence-guarded or never reached while packs.length was 0 from
    // getPacks' own failure).
    // One representative pack — loadPacks() renders it, picks it as the
    // initial practice puzzle, and getPackStats' matching pack_id enhances
    // it with community stats, exactly like the real two-call flow.
    getPacks: mockCall("getPacks", () => ({
      packs: [{ id: "insight", title: "Insight", difficulty_band: "medium", puzzle_count: 42 }],
    })),
    getPackStats: mockCall("getPackStats", () => ({
      packs: [{ pack_id: "insight", unique_players: 128, qualifying_solves: 340, supu_submitted_count: 12 }],
    })),
    // selectPackPuzzle's response shape matches getTeamomentPuzzles' items
    // (per its own real-adapter comment) — reuse the same daily-puzzle
    // fixture every other "give me one puzzle" mock in this file reuses.
    selectPackPuzzle: mockCall("selectPackPuzzle", (packId) => ({ ...M.dailyPuzzle, puzzle_id: packId + "-mock" })),
    // Puzzle Challenge's "imported" pack — null is the real, valid "no
    // reader submissions yet" state loadImportedPack() already renders
    // cleanly (see its own `data || null` handling), not a placeholder.
    getPuzzleChallengePack: mockCall("getPuzzleChallengePack", null),
    selectPuzzleChallengePuzzle: mockCall("selectPuzzleChallengePuzzle", () => ({ ...M.dailyPuzzle, puzzle_id: "challenge-mock" })),

    // Su-Pu Capture bridge W1 (2026-09-13 execution plan) — reuses the same
    // teamomentPuzzles fixture as a stand-in catalog, stripped to the real
    // endpoint's metadata-only shape (no givens/solution).
    searchPuzzles: mockCall("searchPuzzles", (params) => {
      const p = params || {};
      let items = (M.teamomentPuzzles && M.teamomentPuzzles.items) || [];
      if (p.q) {
        const q = String(p.q).toLowerCase();
        items = items.filter(x => (x.puzzle_id || "").toLowerCase().includes(q) || (x.title || "").toLowerCase().includes(q));
      }
      if (p.pack) items = items.filter(x => (x.pack_id || x.tier) === p.pack);
      if (p.technique) items = items.filter(x => (x.required_techniques || []).includes(p.technique));
      return {
        items: items.map(x => ({
          puzzle_id: x.puzzle_id, pack_id: x.pack_id, tier: x.tier, tier_index: x.tier_index,
          title: x.title || null, difficulty_score: null, required_techniques: x.required_techniques || [],
          provenance: x.pack_id === "imported" ? "community" : "curated",
        })),
        total: items.length, page: 1, limit: items.length,
      };
    }),

    // Su-Pu Capture bridge W3 (2026-09-13 execution plan) — Turnstile is
    // ignored here, same convention as checkChallengePuzzle's mock below:
    // page-supu-capture.js skips mounting the real Turnstile widget under
    // ORBACE_CONFIG.USE_MOCKS, so there is no token to validate offline.
    importPuzzle: mockCall("importPuzzle", (body) => mockImportPuzzle(body && body.givens)),

    getTeaMomentToday: mockCall("getTeaMomentToday", M.teaMomentToday),

    getTeaMomentHistory: mockCall("getTeaMomentHistory", (params) => {
      const p = params || {};
      let items = (M.teaMomentHistory && M.teaMomentHistory.items) || [];
      if (p.limit) items = items.slice(0, p.limit);
      return { items, total: M.teaMomentHistory ? M.teaMomentHistory.total : items.length, page: 1, limit: items.length };
    }),
    getRecentPuzzles: mockCall("getRecentPuzzles", (limit) => M.recentPuzzles.slice(0, limit || 7)),
    getOrgStatus: mockCall("getOrgStatus", M.orgStatus),
    // Mock-coverage gap found 2026-09-19 while writing
    // test/boot-execution.test.mjs: diffing `real`'s and `mock`'s key sets
    // showed `real` had this, `mock` never did. Doesn't actually throw on
    // /competition-calendar today — its only caller guards with
    // `if (!api.getOrgStatusRaw) return;` — but is a real gap for anyone
    // running locally with USE_MOCKS:true. Same raw fixture as
    // getOrgStatus's mock (the real/mock split there is mapOrgStatus() vs.
    // none, and the mock fixture is already in the "raw" shape).
    getOrgStatusRaw: mockCall("getOrgStatusRaw", M.orgStatus),
    // Ranking Games' mock event ids (js/mock-data.js's rankingEvents) get the
    // real backend's tournament restrictions shape attached — everything
    // else (including the legacy ORG flow's plain eventId) is unaffected.
    getOrgPuzzle: mockCall("getOrgPuzzle", (eventId) => eventId === "evt-mock-tournament"
      ? { ...M.dailyPuzzle, restrictions: { no_hint: true, no_pause: true, explicit_submit: true } }
      : M.dailyPuzzle),
    startOrg: mockCall("startOrg", () => ({ success: true })),
    previewPromoCode: mockCall("previewPromoCode", (code) => {
      const normalized = String(code || "").trim().toUpperCase();
      if (!normalized) throw mockPromoError("invalid_code_format", 400);
      if (normalized !== "FOUNDERS6") throw mockPromoError("code_not_found", 404);
      return {
        campaignKey: MOCK_PROMO_CAMPAIGN.campaignKey, displayName: MOCK_PROMO_CAMPAIGN.displayName,
        benefit: "competition_pass", duration: { kind: "calendar_months", value: 6 },
        eligible: !_mockPromoState.redeemed, noPaymentRequired: true, autoRenews: false,
        termsVersion: MOCK_PROMO_CAMPAIGN.termsVersion, availability: "available",
      };
    }),
    redeemPromoCode: mockCall("redeemPromoCode", (code, surface, termsVersion, idempotencyKey) => {
      const normalized = String(code || "").trim().toUpperCase();
      if (normalized !== "FOUNDERS6") throw mockPromoError("code_not_found", 404);
      if (_mockPromoState.idempotencyKeys[idempotencyKey]) return _mockPromoState.idempotencyKeys[idempotencyKey];
      if (_mockPromoState.redeemed) throw mockPromoError("already_redeemed", 409);
      const now = new Date();
      const endsAt = new Date(now);
      endsAt.setUTCMonth(endsAt.getUTCMonth() + 6);
      const result = {
        redemptionId: "mock-redemption-" + Date.now().toString(36), campaignKey: MOCK_PROMO_CAMPAIGN.campaignKey,
        claimSequence: 417,
        entitlement: { type: "competition_pass", status: "active", startsAt: now.toISOString(), endsAt: endsAt.toISOString(), source: "orbace_promotion", autoRenews: false },
        remainingClaims: 583, replayed: false, nextAction: "/compete",
      };
      _mockPromoState.redeemed = true;
      _mockPromoState.entitlement = result.entitlement;
      _mockPromoState.idempotencyKeys[idempotencyKey] = Object.assign({}, result, { replayed: true });
      return result;
    }),
    getEntitlements: mockCall("getEntitlements", () => ({
      entitlements: _mockPromoState.redeemed ? [Object.assign({}, _mockPromoState.entitlement)] : [],
    })),
    getLeaderboard: mockCall("getLeaderboard", (period) => {
      const d = M.leaderboards[period];
      if (!d) throw new Error("Unknown leaderboard period: " + period);
      return d;
    }),
    getLiveLeaderboard: mockCall("getLiveLeaderboard", (eventId) => M.leaderboards.daily),
    // Mock-coverage gap found 2026-09-19 (same key-set diff as
    // getOrgStatusRaw above). Doesn't throw unguarded today — its caller,
    // page-rankings.js's loadStandings() (only invoked on the All-Time
    // tab, not /rankings' default view), wraps the call in try/catch — but
    // is a real gap for local USE_MOCKS:true testing. Empty page, matching
    // real's { entries, total, pageSize } shape, so loadStandings() renders
    // an empty standings list cleanly, the same as a real just-launched
    // leaderboard.
    getAllTimeLeaderboard: mockCall("getAllTimeLeaderboard", () => ({ entries: [], total: 0, pageSize: 25 })),
    getSupu: mockCall("getSupu", (id) => ({ ...M.supu, supu_id: id || M.supu.supu_id })),
    // Su-Pu Replay v2 Phase 4 (2026-09-09) — self-contained in-memory mock
    // state, same precedent as _mockPromoState above: only the lab page
    // exercises this, resets on full reload, no mock-data.js fixture
    // needed for what's essentially a tiny CRUD list.
    // Su-Pu Capture bridge W5 (2026-09-13 execution plan, P0) — mirrors the
    // real backend's per-player draft cap so mock mode can exercise the
    // capacity UI (page-supu-capture.js) without a real account. Only a
    // genuinely NEW draft (no body.id) counts against the cap, same as the
    // real POST /supu/lab — updating an existing one never does.
    // Su-Pu Capture workspace execution plan (2026-09-22), Package 3 —
    // versioning. Mirrors supu-lab.routes.ts's own logic: an ordinary
    // repeat save (body.id present) never touches version/familyId/
    // parentVersionId; a brand-new capture (no id, no continued_from_
    // version_id) becomes version 1 of its own new family; continuing an
    // older version (continued_from_version_id present) creates a new row
    // in that SAME family at the next version number.
    saveSupuLabDraft: mockCall("saveSupuLabDraft", (body) => {
      const isNew = !(body && body.id);
      if (isNew && Object.keys(_mockLabDrafts).length >= MOCK_DRAFT_CAP) {
        const e = new Error("quota_exceeded");
        e.status = 429;
        e.body = { error: "CAPTURE_QUOTA_EXCEEDED", used: Object.keys(_mockLabDrafts).length, cap: MOCK_DRAFT_CAP };
        throw e;
      }
      const now = new Date().toISOString();
      if (!isNew) {
        const id = body.id;
        const existing = _mockLabDrafts[id] || {};
        _mockLabDrafts[id] = { ...existing, ...body, id, solved: !!(body && body.solved), created_at: existing.created_at || now, updated_at: now };
        const d = _mockLabDrafts[id];
        return { id, solved: d.solved, updated_at: now, version: d.version, family_id: d.familyId, parent_version_id: d.parentVersionId };
      }
      const id = "lab-mock-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
      let familyId = id, version = 1, parentVersionId = null;
      if (body && body.continued_from_version_id) {
        const parent = _mockLabDrafts[body.continued_from_version_id];
        if (!parent) { const e = new Error("Continued-from version not found"); e.status = 404; throw e; }
        familyId = parent.familyId || parent.id;
        parentVersionId = parent.id;
        const familyVersions = Object.values(_mockLabDrafts).filter((d) => (d.familyId || d.id) === familyId);
        version = Math.max(0, ...familyVersions.map((d) => d.version || 1)) + 1;
      }
      _mockLabDrafts[id] = { ...body, id, familyId, version, parentVersionId, solved: !!(body && body.solved), created_at: now, updated_at: now };
      return {
        id, solved: _mockLabDrafts[id].solved, created_at: now, updated_at: now,
        version, family_id: familyId, parent_version_id: parentVersionId,
        used: Object.keys(_mockLabDrafts).length, cap: MOCK_DRAFT_CAP,
      };
    }),
    getSupuLabDraft: mockCall("getSupuLabDraft", (id) => {
      const d = _mockLabDrafts[id];
      if (!d) throw new Error("Draft not found");
      return {
        id: d.id, source_supu_id: d.sourceSupuId || null,
        puzzle: { givens: d.puzzleGivens, solution: d.puzzleSolution },
        solved: !!d.solved,
        published_share_id: d.publishedShareId || null,
        version: d.version || 1, family_id: d.familyId || d.id, parent_version_id: d.parentVersionId || null,
        move_history_schema_version: d.move_history_schema_version,
        extension_registry_version: d.extension_registry_version,
        moveHistory: d.moveHistory,
        annotation_doc: d.annotationDoc || null,
        created_at: d.created_at, updated_at: d.updated_at,
      };
    }),
    // W5 (2026-09-13 execution plan, P0) — pagination + capacity fields,
    // mirroring the real GET /supu/lab/mine response shape.
    getMySupuLabDrafts: mockCall("getMySupuLabDrafts", (params) => {
      const p = params || {};
      const page = Math.max(1, parseInt(p.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(p.limit, 10) || 25));
      const all = Object.values(_mockLabDrafts)
        .slice()
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      const drafts = all.slice((page - 1) * limit, page * limit)
        .map((d) => ({
          id: d.id, source_supu_id: d.sourceSupuId || null, solved: !!d.solved, published_share_id: d.publishedShareId || null,
          version: d.version || 1, family_id: d.familyId || d.id, parent_version_id: d.parentVersionId || null,
          created_at: d.created_at, updated_at: d.updated_at,
        }));
      return { drafts, total: all.length, page, limit, used: all.length, cap: MOCK_DRAFT_CAP };
    }),
    // Su-Pu Capture workspace execution plan (2026-09-22), Package 3.
    getSupuLabDraftVersions: mockCall("getSupuLabDraftVersions", (id) => {
      const d = _mockLabDrafts[id];
      if (!d) throw new Error("Draft not found");
      const familyId = d.familyId || d.id;
      const versions = Object.values(_mockLabDrafts)
        .filter((x) => (x.familyId || x.id) === familyId)
        .sort((a, b) => (b.version || 1) - (a.version || 1))
        .map((x) => ({
          id: x.id, version: x.version || 1, parent_version_id: x.parentVersionId || null,
          solved: !!x.solved, published_share_id: x.publishedShareId || null,
          created_at: x.created_at, updated_at: x.updated_at,
        }));
      return { family_id: familyId, versions };
    }),
    deleteSupuLabDraft: mockCall("deleteSupuLabDraft", (id) => { delete _mockLabDrafts[id]; return {}; }),
    // Su-Pu Capture: Publish for Teaching, Task 4 (2026-09-15) — mirrors
    // saveSupuLabDraft's mock shape above; the real endpoint's contract is
    // {id, url} (backend/org-api/src/routes/supu-lab.routes.ts's publish
    // route), and mock mode has no reason to replicate its solved/ownership
    // validation — this is a local dev convenience, not a second copy of
    // the backend's real rules.
    publishSupuLabDraft: mockCall("publishSupuLabDraft", (id) => {
      // Code-quality review (2026-09-15, Minor) — a falsy/null id (e.g. the
      // real backend's POST /supu/lab/null/publish, which the page used to
      // send before Publish was gated on a real saved draft id) must 404
      // exactly like the real backend's own findUnique-miss does
      // (supu-lab.routes.ts: `{ error: 'Draft not found' }`), not silently
      // succeed — this mock returning a fake success masked that bug in
      // local/mock testing.
      if (!id) {
        const e = new Error("Draft not found");
        e.status = 404;
        e.body = { error: "Draft not found" };
        throw e;
      }
      // UAT feedback (2026-09-20): mirrors the real endpoint's idempotency
      // guard (supu-lab.routes.ts) — a draft already published returns the
      // SAME share id/url rather than minting a second one, matching the
      // capture list's ability to call this again for an already-published
      // row.
      var existing = _mockLabDrafts[id] && _mockLabDrafts[id].publishedShareId;
      if (existing) return { id: existing, url: "https://orbacesudoku.com/su-pu/" + existing };
      var newId = "SP-MOCK-" + id;
      if (_mockLabDrafts[id]) _mockLabDrafts[id].publishedShareId = newId;
      return { id: newId, url: "https://orbacesudoku.com/su-pu/" + newId };
    }),
    // Su-Pu Replay v2 Phase 5 (2026-09-09) — mock digest is deterministic
    // per supuId only (not a real JCS+sha256 of the stream, which mock
    // mode has no reason to replicate): round-trip consistency within one
    // mock session is all a local dev flow needs.
    getSupuAnnotation: mockCall("getSupuAnnotation", (supuId) => {
      const a = _mockAnnotations[supuId];
      if (!a) return { exists: false, supu_id: supuId, base_capture_digest: "mock-digest-" + supuId, revision: 0 };
      return { exists: true, ...a };
    }),
    putSupuAnnotation: mockCall("putSupuAnnotation", (supuId, body) => {
      const expected = "mock-digest-" + supuId;
      if (body.base_capture_digest !== expected) {
        const e = new Error("Stale digest"); e.status = 409; e.body = { error: "STALE_CAPTURE_DIGEST", expected };
        throw e;
      }
      const existing = _mockAnnotations[supuId];
      const currentRevision = existing ? existing.revision : 0;
      if (body.revision !== currentRevision) {
        const e = new Error("Revision conflict"); e.status = 409; e.body = { error: "REVISION_CONFLICT", current_revision: currentRevision };
        throw e;
      }
      const now = new Date().toISOString();
      _mockAnnotations[supuId] = {
        supu_id: supuId, author_player_id: "mock-player", author_kind: "PLAYER",
        visibility: body.visibility || (existing && existing.visibility) || "PRIVATE",
        annotation_schema_version: "supu-annotation-v1", base_capture_digest: expected,
        revision: currentRevision + 1, ops: body.ops, updated_at: now,
      };
      return { ..._mockAnnotations[supuId] };
    }),
    // Su-Pu six-priorities brief, Priority 2 (2026-09-21) — mock digest is
    // deterministic per draftId only, same reasoning as getSupuAnnotation's
    // mock above.
    getSupuLabDraftStory: mockCall("getSupuLabDraftStory", (draftId) => {
      const s = _mockStories[draftId];
      if (!s) return { exists: false, draft_id: draftId, base_capture_digest: "mock-digest-" + draftId, revision: 0 };
      return { exists: true, ...s };
    }),
    putSupuLabDraftStory: mockCall("putSupuLabDraftStory", (draftId, body) => {
      const expected = "mock-digest-" + draftId;
      if (body.base_capture_digest !== expected) {
        const e = new Error("Stale digest"); e.status = 409; e.body = { error: "STALE_CAPTURE_DIGEST", expected };
        throw e;
      }
      const existing = _mockStories[draftId];
      const currentRevision = existing ? existing.revision : 0;
      if (body.revision !== currentRevision) {
        const e = new Error("Revision conflict"); e.status = 409; e.body = { error: "REVISION_CONFLICT", current_revision: currentRevision };
        throw e;
      }
      const now = new Date().toISOString();
      _mockStories[draftId] = {
        draft_id: draftId, story_schema_version: "supu-story-v1", base_capture_digest: expected,
        revision: currentRevision + 1, title: body.title || null, opening_question: body.opening_question || null,
        takeaway: body.takeaway || null, chapters: body.chapters || [], updated_at: now,
      };
      return { ..._mockStories[draftId] };
    }),
    getSupuLibrary: mockCall("getSupuLibrary", (params) => {
      const p = params || {};
      let items = (M.supuLibrary && M.supuLibrary.items) || [];
      items = filterSupuItems(items, p);
      return { items, total: items.length, page: 1, limit: items.length };
    }),
    getMySupu: mockCall("getMySupu", (params) => {
      const p = params || {};
      let items = (M.mySupu && M.mySupu.items) || [];
      items = filterSupuItems(items, p);
      return { items, total: items.length, page: p.page || 1, limit: p.limit || items.length };
    }),
    getSupuSpotlight: mockCall("getSupuSpotlight", () => M.supuSpotlight || { editor: null, clean: null, rare_technique: null }),
    getBlogPosts: mockCall("getBlogPosts", (params) => {
      const p = params || {};
      const limit = p.limit || 20;
      return { items: M.blogPosts.items.slice(0, limit), total: M.blogPosts.total, page: p.page || 1, limit };
    }),
    getBlogPost: mockCall("getBlogPost", (slug) => M.blogPostDetail[slug] || null),
    // Puzzle Challenge (2026-08-28, public page only — the admin Challenge
    // Queue tab lives in admin.html/admin.js, which is self-contained and
    // always calls the real backend directly, same as every other admin
    // tab; it has no mock mode to plug into here). See the mock engine
    // defined above, sibling to the promo-code block.
    validatePuzzleChallenge: mockCall("validatePuzzleChallenge", (givens) => mockValidateChallengeGivens(givens)),
    // Error/success shapes match the authoritative contract's §2.2 exactly
    // (machine-code error/reason, not prose — matches the real adapter's
    // err.body shape from http()'s parsed error JSON).
    submitPuzzleChallenge: mockCall("submitPuzzleChallenge", (payload) => {
      const p = payload || {};
      if (!p.rights_confirmed) {
        const e = new Error("rights_confirmed_required");
        e.status = 422;
        e.body = { error: "rights_confirmed_required" };
        throw e;
      }
      const result = mockValidateChallengeGivens(p.givens);
      if (!result.valid) {
        const e = new Error("invalid_grid: " + result.reason);
        e.status = 422;
        e.body = { error: "invalid_grid", reason: result.reason };
        throw e;
      }
      return { status: "created", submission_id: "pcs_mock_" + Date.now() };
    }),
    // Challenge the House v2 (2026-08-29) — see the mock engine above.
    checkChallengePuzzle: mockCall("checkChallengePuzzle", (givens) => mockCheckPuzzle(givens)),
    submitChallenge: mockCall("submitChallenge", (payload) => {
      const p = payload || {};
      if (p.rightsGranted !== true) {
        const e = new Error("RIGHTS_NOT_GRANTED");
        e.status = 400;
        e.body = { error: { code: "RIGHTS_NOT_GRANTED", message: "rightsGranted must be true." } };
        throw e;
      }
      const isSignedIn = window.OrbaceAuthSession && window.OrbaceAuthSession.getState() === "registered";
      return {
        submissionId: "mock-submission-" + Date.now(),
        statusUrl: "/challenge/s/mock-status-token-" + Date.now(),
        queuePosition: 4,
        needsConfirmation: !isSignedIn,
        emailMasked: p.email ? p.email[0] + "•••••@" + p.email.split("@")[1] : "s•••••@example.com",
      };
    }),
    getChallengeStatus: mockCall("getChallengeStatus", () => ({
      status: "in_review",
      queuePosition: 3,
      givens: "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79",
      title: "Thursday Killer, p.14",
      suPuId: null,
      createdAt: new Date().toISOString(),
    })),
    // GET /api/community (2026-08-30) — real public board, replacing the
    // former localStorage-only mock. Same shape the real adapter returns.
    getCommunityBoard: mockCall("getCommunityBoard", () => ({
      items: [
        {
          name: "P-CHALLENGE-01", puzzleId: "P-CHALLENGE-01", submitter: "Anonymous",
          time: "2026-08-29T00:00:00.000Z", status: "published", mine: false,
          // Real rateDifficulty(givens) result for this puzzle (confirmed live,
          // team-d/RC_team_backend_puzzle-challenge-difficulty-tier-fix_2026-08-29.md).
          solutions: 1, tier: "extreme", study: false, note: "Solved in the House.", suPuId: "SP-20260829-552436",
        },
      ],
    })),
    getTechniquePuzzles: mockCall("getTechniquePuzzles", (technique) => ({
      technique, puzzles: M.techniquePuzzles[technique] || [],
    })),
    getPuzzleByExternalId: mockCall("getPuzzleByExternalId", (externalId) => {
      // Mock only needs to support puzzles referenced by fixtures above (blog
      // post's puzzle_embed, techniquePuzzles' practice tiles) — extend this
      // map if more fixtures need it.
      const fixtures = {
        extreme_001: { external_id: "extreme_001", givens: "5".repeat(81), solution: "5".repeat(81), title: "Extreme 01", difficulty: "extreme" },
        // Distinct digit from extreme_001 on purpose — a second puzzle_embed
        // block in the same post (smoke test's SMOKE-08e multi-embed check)
        // uses this to confirm each OrbaceSupuReplay.mount() instance renders
        // its OWN puzzle's givens independently, not a stale/shared one.
        extreme_002: { external_id: "extreme_002", givens: "7".repeat(81), solution: "7".repeat(81), title: "Extreme 02", difficulty: "extreme" },
        // A real, partially-filled puzzle (not the degenerate all-given
        // fixtures above) — shares the same "classic puzzle" fixture as
        // backend/org-api's solve-path parity tests, so its first move
        // (cell 40, value 5) is a genuine naked single. Lets the practice
        // grid's Phase 3 "Show" tool be tested against a real detectable
        // case in mock mode, not just the not-applicable path.
        foundation_001: {
          external_id: "foundation_001",
          givens: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
          solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
          title: "Foundation 01",
          difficulty: "beginner",
        },
      };
      if (fixtures[externalId]) return fixtures[externalId];
      // Su-Pu Capture bridge W1/W4 (2026-09-13 execution plan) — the search
      // panel's "Load" action calls this same endpoint for a result it just
      // got from searchPuzzles(), whose mock reuses M.teamomentPuzzles.items
      // (a separate fixture set from the three hand-rolled ones above).
      // Without this fallback, every mock search result 404'd here even
      // though the exact same id round-trips fine through the real backend
      // (one Prisma table, not two disconnected fixture maps).
      const fromCatalog = (M.teamomentPuzzles && M.teamomentPuzzles.items || []).find((x) => x.puzzle_id === externalId);
      if (!fromCatalog) return null;
      return {
        external_id: fromCatalog.puzzle_id, givens: fromCatalog.givens, solution: fromCatalog.solution,
        title: fromCatalog.title, tier: fromCatalog.tier, pack_id: fromCatalog.pack_id,
        sort_index: fromCatalog.tier_index, difficulty: fromCatalog.tier,
      };
    }),
    // Phase 3 of the technique-playbook proposal (2026-07-18): minimal
    // in-mock naked-single detector so offline/test mode can exercise the
    // practice grid's "Show" tool end-to-end without a backend — every
    // OTHER technique intentionally reports not_applicable here (the real
    // 6-technique cascade only exists server-side, see solve-path.ts).
    getTechniqueHint: mockCall("getTechniqueHint", (params) => {
      const p = params || {};
      const board = (p.board || []).slice();
      if (p.technique !== "naked_single") return { found: false, reason: "not_applicable" };
      for (let i = 0; i < 81; i++) {
        if (board[i]) continue;
        const r = Math.floor(i / 9), c = i % 9, br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
        const peers = [];
        const used = new Set();
        for (let j = 0; j < 81; j++) {
          if (j === i) continue;
          const jr = Math.floor(j / 9), jc = j % 9;
          if (jr === r || jc === c || (Math.floor(jr / 3) * 3 === br && Math.floor(jc / 3) * 3 === bc)) {
            peers.push(j);
            if (board[j]) used.add(board[j]);
          }
        }
        const remaining = [];
        for (let v = 1; v <= 9; v++) if (!used.has(v)) remaining.push(v);
        if (remaining.length === 1) {
          return {
            found: true,
            techniqueId: "naked_single",
            placementIndex: i,
            placementValue: remaining[0],
            highlightCellIndices: [i].concat(peers),
            affectedCellIndices: [i],
            explanationTemplateKey: "naked_single",
            params: { value: String(remaining[0]) },
          };
        }
      }
      return { found: false, reason: "not_applicable" };
    }),
    submitOrg: mockCall("submitOrg", M.submitResult),
    getRankingData: mockCall("getRankingData", () => ({
      events: M.rankingEvents,
      nextEvent: M.rankingNextEvent,
      leaderboards: M.rankingLeaderboards,
      playerStats: M.rankingPlayerStats,
    })),
    startRanking: mockCall("startRanking", (eventId) => ({ attempt_id: "mock-attempt-" + Date.now().toString(36), event_id: eventId, status: "started", started_at: new Date().toISOString() })),
    // The V8 fields (attempt_state etc.) are only added for the mock Weekly
    // Cup event id -- unlike GET /compete/overview (below), which reflects
    // whichever event id the CALLER is currently exercising in either a
    // legacy or V8 scenario, evt-mock-daily/evt-mock-tournament are only
    // ever routed through a full submit cycle in this mock's LEGACY
    // (RGK-*) test scenarios today (Team Web M2's WC-6/WC-7 exercise their
    // V8 card up through mounting the board, not through submit) -- adding
    // V8 fields unconditionally for those ids here would corrupt those
    // legacy tests' expected plain rankingSubmitResult fields.
    submitRanking: mockCall("submitRanking", (eventId, payload) =>
      eventId === "evt-mock-weekly" ? { ...M.rankingSubmitResult, ...M.competeSubmitV8ByEvent["evt-mock-weekly"] } : M.rankingSubmitResult),
    getReplay: mockCall("getReplay", (id) => ({
      ...M.myReplay,
      id,
      // The homepage's public Featured Su-Pu mock represents a finalized
      // champion replay. Keep the signed-in `myReplay` fixture's intentionally
      // empty move list unchanged for its own submission tests.
      moves: id === "mock-replay-1" ? [{ i: 0, v: 8, t: "OK" }] : M.myReplay.moves,
    })),
    getCompeteOverview: mockCall("getCompeteOverview", (eventId) =>
      (M.competeOverviewByEvent && M.competeOverviewByEvent[eventId]) || M.competeOverviewByEvent["evt-mock-weekly"]),

    // V8.1 Round 2 public rankings (Team Web) -- self-contained mock
    // fixtures (no mock-data.js entry needed) matching the REAL deployed
    // shapes read from backend/org-api/src/routes/competition.routes.ts and
    // src/services/v8-ranking-r2.service.ts's getR2PublicResults().
    getCompetitionEventsByDate: mockCall("getCompetitionEventsByDate", (date) => ({
      date: date,
      events: [
        { event_id: "evt-mock-r2-daily", competition_type: "daily", window_opens_at: date + "T05:00:00.000Z", window_closes_at: date + "T05:00:00.000Z", is_final: true, results_available: true, results_url: "/competition/events/evt-mock-r2-daily/results" },
        { event_id: "evt-mock-r2-weekly", competition_type: "weekly", window_opens_at: date + "T05:00:00.000Z", window_closes_at: date + "T05:00:00.000Z", is_final: true, results_available: true, results_url: "/competition/events/evt-mock-r2-weekly/results" },
      ],
    })),
    getCompetitionEventResults: mockCall("getCompetitionEventResults", (eventId) => ({
      event_id: eventId,
      competition_type: eventId.indexOf("weekly") !== -1 ? "weekly" : "daily",
      is_final: true,
      schedule_id: eventId.indexOf("weekly") !== -1 ? "RP_WEEKLY_V2" : "SCORE_DAILY_V2",
      entries: [
        { result_id: "r1", rank: 1, player: { display_name: "MockChampion" }, elapsed_seconds: 312, ...(eventId.indexOf("weekly") !== -1 ? { total_rp: 3000 } : { daily_score: 400 }), replay: { state: "AVAILABLE", reference: "mock-replay-1", web_url: "/replays/mock-replay-1" } },
        { result_id: "r2", rank: 2, player: { display_name: "MockRunnerUp" }, elapsed_seconds: 401, ...(eventId.indexOf("weekly") !== -1 ? { total_rp: 1800 } : { daily_score: 250 }), replay: { state: "UNAVAILABLE", reference: null, web_url: null } },
      ],
    })),
    // Event Results "Play this puzzle" card (UAT 2026-09-18) -- same
    // GET /competition/events/:eventId/puzzle mobile's leaderboard practice
    // card (apps/mobile/lib/src/features/ranking/leaderboard_screen.dart's
    // _PracticePuzzleCard) already calls; never returns a solution (see the
    // real route's comment in backend/org-api/src/routes/competition.routes.ts).
    getCompetitionEventPuzzle: mockCall("getCompetitionEventPuzzle", (eventId) => ({
      event_id: eventId,
      puzzle_id: "discipline_245",
      competition_type: eventId.indexOf("weekly") !== -1 ? "weekly" : eventId.indexOf("tournament") !== -1 ? "tournament" : "daily",
      difficulty: "discipline",
      difficulty_score: null,
      target_time_seconds: null,
      median_time_seconds: null,
      required_techniques: [],
      seal: null,
      givens: "090703100002000060360000090208034010710000000430617058020048970070106005000070001",
    })),
    getSeasonStanding: mockCall("getSeasonStanding", () => ({
      player_id: "mock-player", season_id: String(new Date().getUTCFullYear()), rank: 12,
      rules_version: "RULES_V8_1_R2", total_season_rp: 4200, season_lifecycle: "ACTIVE",
      counting_result_ids: ["r1", "r2"], non_counting_result_ids: [], displaced_result_ids: [],
      season_complete: false, server_now: new Date().toISOString(),
    })),
    // RANKING_RESULTS_WIRE_V1 mocks -- shapes taken verbatim from
    // docs/shared_artifacts/Team-A-C-V8.1-Ranking-Result-Consistency-Client-
    // Contract-Draft.md's §4/§5/§7 example responses (the same contract
    // Team A's preview deploy verified live 2026-08-09), not guessed.
    getRankingsSeasons: mockCall("getRankingsSeasons", () => ({
      contract_version: "RANKING_RESULTS_WIRE_V1",
      current_season_id: "2026",
      seasons: [
        { season_id: "2026", label: "2026 Season", lifecycle: "OPEN", starts_at: "2026-01-01T00:00:00.000Z", ends_at: "2027-01-01T00:00:00.000Z", finalized_at: null, archived_at: null, ranking_available: true },
      ],
      server_now: new Date().toISOString(),
    })),
    getSeasonLeaderboard: mockCall("getSeasonLeaderboard", (seasonId) => ({
      contract_version: "RANKING_RESULTS_WIRE_V1",
      season: { season_id: seasonId || "2026", label: (seasonId || "2026") + " Season", lifecycle: "OPEN", is_current: true, source_rules_versions: ["RULES_V8_1", "RULES_V8_1_R2"], aggregation_version: "SEASON_AGGREGATION_V2", tie_break_version: "SEASON_TIE_BREAK_V1", revision: 14, finalized_at: null, archived_at: null },
      standings: [
        { standing_ref: "standing_public_01", rank: 1, player: { display_name: "MockChampion", country: "US", is_anonymous: false }, total_rp: 4800, weekly_results_counted: 7, grand_results_counted: 1, public_supu: [{ result_id: "result_weekly_08", reference: "mock-replay-8", web_url: "/replays/mock-replay-8" }] },
        { standing_ref: "standing_public_02", rank: 2, player: { display_name: "Anonymous", country: null, is_anonymous: true }, total_rp: 4200, weekly_results_counted: 6, grand_results_counted: 0, public_supu: [] },
      ],
      pagination: { page: 1, page_size: 25, total_items: 2, total_pages: 1 },
      data_state: "AVAILABLE",
      server_now: new Date().toISOString(),
    })),
    getMyResults: mockCall("getMyResults", (opts) => ({
      contract_version: "RANKING_RESULTS_WIRE_V1",
      filters: { competition_type: (opts && opts.competitionType) || null, season_id: (opts && opts.seasonId) || null, finality: (opts && opts.finality) || "all" },
      items: [
        {
          result_id: "result_weekly_04",
          event: { event_id: "event_weekly_2026_31", event_name: "Weekly Cup — 2026 Week 31", competition_type: "weekly", season_id: "2026", event_date: "2026-08-01", window_opens_at: "2026-08-01T00:00:00.000Z", window_closes_at: "2026-08-02T23:59:59.999Z", finalized_at: "2026-08-03T00:05:00.000Z", difficulty: "medium" },
          participation_state: "SUBMITTED", finality: "FINAL", outcome: "QUALIFYING_CORRECT", integrity_status: "CLEAR",
          elapsed_seconds: 913, placement: 2, event_rank: 2,
          score: { applicable: false, kind: "NOT_APPLICABLE", base: null, performance: null, total: null, schedule_id: null },
          ranking_points: { applicable: true, base: 600, performance: 1200, total: 1800, settlement_state: "BANKED", banked_at: "2026-08-03T00:05:00.000Z", claimable_at: null, claim_expires_at: null },
          season: { season_id: "2026", eligible: true, inclusion_state: "COUNTING" },
          supu: { state: "AVAILABLE", visibility: "private", reference: "mock-replay-owner-04", web_url: "/replays/mock-replay-owner-04" },
          versions: { rules_version: "RULES_V8_1_R2", scoring_version: "SCORING_V8_1_R2", schedule_id: "RP_WEEKLY_V2", placement_version: "PERFORMANCE_PLACEMENT_V1", result_revision: 1 },
          data_quality: { state: "COMPLETE", missing_fields: [] },
        },
        {
          result_id: "result_daily_09",
          event: { event_id: "event_daily_2026_08_05", event_name: "Daily Competition — 2026-08-05", competition_type: "daily", season_id: "2026", event_date: "2026-08-05", window_opens_at: "2026-08-05T05:00:00.000Z", window_closes_at: "2026-08-05T05:00:00.000Z", finalized_at: "2026-08-05T06:00:00.000Z", difficulty: "hard" },
          participation_state: "SUBMITTED", finality: "FINAL", outcome: "QUALIFYING_CORRECT", integrity_status: "CLEAR",
          elapsed_seconds: 480, placement: 3, event_rank: 3,
          score: { applicable: true, kind: "DAILY_SCORE", base: 300, performance: 150, total: 450, schedule_id: "SCORE_DAILY_V2" },
          ranking_points: { applicable: false, base: null, performance: null, total: null, settlement_state: "NOT_APPLICABLE", banked_at: null, claimable_at: null, claim_expires_at: null },
          season: { season_id: "2026", eligible: false, inclusion_state: "NOT_APPLICABLE" },
          supu: { state: "UNAVAILABLE", visibility: null, reference: null, web_url: null },
          versions: { rules_version: "RULES_V8_1_R2", scoring_version: "SCORING_V8_1_R2", schedule_id: "SCORE_DAILY_V2", placement_version: "PERFORMANCE_PLACEMENT_V1", result_revision: 1 },
          data_quality: { state: "COMPLETE", missing_fields: [] },
        },
      ],
      pagination: { page: 1, page_size: 25, total_items: 2, total_pages: 1 },
      data_state: "AVAILABLE",
      server_now: new Date().toISOString(),
    })),
    getMyResultDetail: mockCall("getMyResultDetail", (resultId) => ({
      contract_version: "RANKING_RESULTS_WIRE_V1",
      item: {
        result_id: resultId || "result_weekly_04",
        event: { event_id: "event_weekly_2026_31", event_name: "Weekly Cup — 2026 Week 31", competition_type: "weekly", season_id: "2026", event_date: "2026-08-01", window_opens_at: "2026-08-01T00:00:00.000Z", window_closes_at: "2026-08-02T23:59:59.999Z", finalized_at: "2026-08-03T00:05:00.000Z", difficulty: "medium" },
        participation_state: "SUBMITTED", finality: "FINAL", outcome: "QUALIFYING_CORRECT", integrity_status: "CLEAR",
        elapsed_seconds: 913, placement: 2, event_rank: 2,
        score: { applicable: false, kind: "NOT_APPLICABLE", base: null, performance: null, total: null, schedule_id: null },
        ranking_points: { applicable: true, base: 600, performance: 1200, total: 1800, settlement_state: "BANKED", banked_at: "2026-08-03T00:05:00.000Z", claimable_at: null, claim_expires_at: null },
        season: { season_id: "2026", eligible: true, inclusion_state: "COUNTING" },
        supu: { state: "AVAILABLE", visibility: "private", reference: "mock-replay-owner-04", web_url: "/replays/mock-replay-owner-04" },
        versions: { rules_version: "RULES_V8_1_R2", scoring_version: "SCORING_V8_1_R2", schedule_id: "RP_WEEKLY_V2", placement_version: "PERFORMANCE_PLACEMENT_V1", result_revision: 1 },
        data_quality: { state: "COMPLETE", missing_fields: [] },
      },
      server_now: new Date().toISOString(),
    })),
    getCircuitStanding: mockCall("getCircuitStanding", () => ({
      player_id: "mock-player", rank: 5, total_grand_rp: 7500, grand_events_played: 1,
      wins: 0, podiums: 1, best_placement: 2, server_now: new Date().toISOString(),
    })),
    // COMPETITION_IN_PROGRESS_V1 (draft) mock -- shape taken verbatim from
    // docs/shared_artifacts/Team-Web-Mobile-Contract-Request-2026-08-17-In-
    // Progress-Competition-Results.md §3. Self-contained (no mock-data.js
    // entry needed), same precedent as getCompeteOverview above -- mixes
    // PLAYING/SUBMITTED rows plus one is_you:true row so the UI's every
    // branch (Playing · mm:ss, Submitted | time | Base Points, "You" row
    // highlight) is exercisable offline. Never includes rank/performance/
    // ranking_points fields -- the mock must not model a violation the real
    // contract forbids.
    getLiveParticipants: mockCall("getLiveParticipants", (gameType) => {
      var type = gameType === "tournament" ? "grand" : gameType;
      return {
        contract_version: "COMPETITION_IN_PROGRESS_V1",
        event: {
          event_id: "evt-mock-live-" + type,
          game_type: gameType,
          competition_type: type,
          label: null,
          status: "OPEN",
          window_opens_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          window_closes_at: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
        },
        players_started: 4,
        participants: [
          { participant_ref: "p1", display_name: "Player A", is_you: false, status: "SUBMITTED", elapsed_seconds: 522, base_points: 100 },
          { participant_ref: "p2", display_name: "Player B", is_you: false, status: "SUBMITTED", elapsed_seconds: 676, base_points: 100 },
          { participant_ref: "p3", display_name: "MockYou", is_you: true, status: "PLAYING", elapsed_seconds: 381, base_points: 100 },
          { participant_ref: "p4", display_name: "Player D", is_you: false, status: "PLAYING", elapsed_seconds: 843, base_points: 100 },
        ],
        data_state: "AVAILABLE",
        server_now: new Date().toISOString(),
      };
    }),
    // Pre-existing gap found while testing In Progress Competition Results
    // CX (2026-08-17): js/page-rankings.js's "Event Results"/"Final
    // Results" tab has called OrbaceAPI.getEventLeaderboard() since
    // 2026-08-10, but only the real adapter (below) ever defined it --
    // USE_MOCKS:true threw "getEventLeaderboard is not a function" the
    // instant that tab tried to load, with no prior test catching it
    // (test/smoke.test.js never visits /rankings). Same one-finalized-event
    // shape getLeaderboardHistory's mock already uses just below.
    getLatestFinalLeaderboard: mockCall("getLatestFinalLeaderboard", () => ({
      entries: [
        { rank: 1, player_name: "MockChampion", time_seconds: 312, base_points: 100, bonus_points: 300, total_points: 400, is_clean: true, replay: { state: "AVAILABLE", reference: "mock-replay-1", web_url: "/replays/mock-replay-1" } },
        { rank: 2, player_name: "MockRunnerUp", time_seconds: 401, base_points: 100, bonus_points: 150, total_points: 250, is_clean: true, replay: { state: "UNAVAILABLE", reference: null, web_url: null } },
      ],
      event_id: "evt-mock-daily", game_type: "daily", date: "2026-08-16", total: 2, finalized: true,
    })),
    getEventLeaderboard: mockCall("getEventLeaderboard", (gameType) => ({
      entries: [
        { rank: 1, player_name: "MockChampion", time_seconds: 312, base_points: 100, bonus_points: 300, total_points: 400, is_clean: true, replay: { state: "AVAILABLE", reference: "mock-replay-1", web_url: "/replays/mock-replay-1" } },
        { rank: 2, player_name: "MockRunnerUp", time_seconds: 401, base_points: 100, bonus_points: 150, total_points: 250, is_clean: true },
      ],
      event_id: "evt-mock-" + gameType, game_type: gameType, date: "2026-08-16", total: 2, finalized: true,
    })),
    getLeaderboardByEvent: mockCall("getLeaderboardByEvent", (eventId) => ({
      entries: [{ rank: 1, player_name: "MockChampion", time_seconds: 312, base_points: 100, bonus_points: 300, total_points: 400, is_clean: true, replay: { state: "AVAILABLE", reference: "mock-replay-1", web_url: "/replays/mock-replay-1" } }],
      event_id: eventId, game_type: eventId.indexOf("weekly") !== -1 ? "weekly" : (eventId.indexOf("tournament") !== -1 ? "tournament" : "daily"), date: "2026-08-16", total: 1, finalized: true,
    })),
    // "prev" simulates one real earlier finalized event existing; "next"
    // simulates already being at the most recent (nothing more recent to
    // show) — good enough to exercise both the found and exhausted UI paths
    // without needing to model real event-chain state in mock mode.
    getLeaderboardHistory: mockCall("getLeaderboardHistory", (gameType, eventId, direction) =>
      direction === "prev"
        ? {
            entries: [{ rank: 1, player_name: "OlderChampion", time_seconds: 290, base_points: 50, bonus_points: 200, total_points: 250, is_clean: true }],
            event_id: "evt-mock-" + gameType + "-prev", game_type: gameType, date: "2026-07-17", total: 1, finalized: true,
          }
        : { entries: [], event_id: null, game_type: gameType, date: null, total: 0, finalized: false },
    ),
    getMonthlyLeaderboard: mockCall("getMonthlyLeaderboard", () => M.rankingLeaderboards.monthly),
    getAnnualLeaderboard: mockCall("getAnnualLeaderboard", () => M.rankingLeaderboards.annual),
    shareSupu: mockCall("shareSupu", () => ({ id: "SP-mock-" + Date.now().toString(36), url: "https://orbacesudoku.com/su-pu/SP-mock" })),
    recordAttempt: mockCall("recordAttempt", () => ({ id: "attempt-mock-" + Date.now().toString(36) })),
    getToken: () => authToken,
    getDeviceFingerprint: () => "mock-device-fp",
    getAbuseSignal: () => "mock-ua|1920x1080|America/New_York",
    auth: {
      registerUuid: mockCall("registerUuid", () => {
        authToken = "mock-jwt";
        try { localStorage.setItem("orbace_auth_token", "mock-jwt"); } catch (_) {}
        try { localStorage.setItem("orbace_tier1_uuid", "mock-uuid-player"); } catch (_) {}
        try { localStorage.setItem("orbace_player_name", "CalmPuzzle_847"); } catch (_) {}
        return { player_id: "mock-uuid-player", friendly_name: "CalmPuzzle_847", token: "mock-jwt" };
      }),
      signInProvider: mockCall("signInProvider", () => { authToken = "mock-jwt"; return M.profile; }),
      // No-op in mock mode — there's no real OAuth redirect round-trip to detect.
      restoreSession: mockCall("restoreSession", () => null),
      checkName: mockCall("checkName", { available: true }),
      updateProfile: mockCall("updateProfile", (data) => Object.assign({}, M.profile, data.display_name ? { display_name: data.display_name } : {})),
      signOut: mockCall("signOut", () => {
        authToken = null;
        try { localStorage.removeItem("orbace_auth_token"); } catch (_) {}
        try { localStorage.removeItem("orbace_tier1_uuid"); } catch (_) {}
        try { localStorage.removeItem("orbace_player_name"); } catch (_) {}
        return { ok: true };
      }),
      getProfile: mockCall("getProfile", M.profile)
    },
    getMySubmissions: mockCall("getMySubmissions", M.mySubmissions),
    // Phase 6 (ADR-005) — appeal a rejected submission.
    submitAppeal: mockCall("submitAppeal", () => ({ appeal_id: "mock-appeal-1", status: "pending" })),
    getMyAppeals: mockCall("getMyAppeals", []),
    exportMyData: mockCall("exportMyData", () => ({
      account: { display_name: M.profile.display_name, total_rp: M.profile.total_rp },
      submissions: [],
      rp_history: [],
    })),
    deleteMyAccount: mockCall("deleteMyAccount", { status: "deleted" }),
  };

  /* ---------------- shape mappers (backend → frontend) ---------------- */

  const ORG_STATE_MAP = {
    none: "window_open",
    started: "in_progress",
    completed: "completed_not_submitted",
    submitted: "submitted_waiting",
    accepted: "results_published",
  };

  function mapOrgStatus(raw) {
    const r = { server_now: raw.server_now };
    if (raw.today) {
      const subCount = typeof raw.today.total_submissions === "number"
        ? raw.today.total_submissions
        : null;
      r.today_event = {
        event_id: raw.today.event_id,
        event_type: raw.today.event_type || "daily",
        puzzle_tier: raw.today.puzzle_tier || "精深",
        puzzle_index: raw.today.puzzle_index || 0,
        window_start: raw.today.window_opens_at || raw.today.window_start,
        window_end: raw.today.window_closes_at || raw.today.window_end,
        total_submissions: subCount,
      };
    }
    if (raw.player_status) {
      const subStatus = raw.player_status.submission_status || "none";
      r.player_status = {
        state: ORG_STATE_MAP[subStatus] || "no_account",
        player_id: raw.player_status.player_id,
        display_name: raw.player_status.display_name,
      };
    } else {
      r.player_status = { state: "no_account" };
    }
    if (raw.yesterday_winner) {
      r.yesterday_winner = {
        display_name: raw.yesterday_winner.display_name,
        country_code: raw.yesterday_winner.country_code || raw.yesterday_winner.country,
        account_tier: raw.yesterday_winner.account_tier || "tier2_registered",
      };
    }
    if (raw.tomorrow) {
      r.tomorrow_event = {
        event_id: raw.tomorrow.event_id,
        event_type: raw.tomorrow.event_type || "daily",
        window_start: raw.tomorrow.window_opens_at || raw.tomorrow.window_start,
      };
    }
    return r;
  }

  function fmtTime(seconds) {
    if (seconds == null || seconds === 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function mapLeaderboard(raw, period, date) {
    const entries = raw.entries || raw.rankings || [];
    const rankings = entries.map((e, i) => {
      if (e == null) return null;
      return {
        rank: e.rank,
        display_name: e.displayName || e.playerName || e.display_name || "Unknown",
        marks: e.marks || (e.isAnonymous ? "🎭" : ""),
        rp: e.totalRp || e.rp || 0,
        time: fmtTime(e.timeSeconds || e.time || 0),
        badge: e.badge || (e.isAnonymous != null && !e.isAnonymous ? null : "clean"),
        supu_id: e.supu_id || e.supuId || null,
        is_me: e.is_me || e.isMe || false,
      };
    });

    const now = new Date();
    const title = period === "daily"
      ? "🏆 Daily 名谱榜 · " + (date || now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))
      : period === "weekly"
        ? "🏆 Weekly Cup 名谱榜 · Week " + (date || "")
        : period === "monthly"
          ? "🏆 Monthly 名谱榜 · " + (date || now.toLocaleDateString("en-US", { month: "long", year: "numeric" }))
          : period === "annual"
            ? "🏆 Annual 名谱榜 · " + (date || String(now.getFullYear()))
            : "🏆 All-Time 名谱榜";

    return {
      title: raw.title || title,
      subtitle: raw.subtitle || "",
      rankings,
    };
  }

  // Normalizes GET /leaderboard/monthly|annual|alltime's raw shape
  // ({rank, totalRp, playerId, playerName, isAnonymous, eventsPlayed}) into
  // the same {entries:[{rank, player_name, time_seconds, total_points,
  // is_clean}]} shape GET /ranking/leaderboard already returns, so the
  // Ranking Games leaderboard table (rankingEntryToLbRow() in app.js) can
  // render all 6 periods through one code path. No time_seconds — these are
  // RP totals across many puzzles, not a single timed attempt.
  function periodEntriesFromRaw(raw) {
    const list = (raw && raw.entries) || [];
    return {
      entries: list.map((e) => ({
        rank: e.rank,
        player_name: e.playerName || e.display_name || "Unknown",
        time_seconds: null,
        base_points: 0,
        bonus_points: 0,
        total_points: e.totalRp ?? e.rp ?? 0,
        is_clean: false,
      })),
    };
  }

  function mapSubmitResponse(raw) {
    return {
      submission_id: raw.submission_id,
      status: raw.status === "submitted" ? "accepted" : raw.status,
      completion_bonus: raw.completion_bonus || 0,
      speed_bonus_pending: raw.speed_bonus_pending !== undefined ? raw.speed_bonus_pending : true,
      total_rp: raw.total_rp || raw.completion_bonus || 0,
      provisional_rank: raw.provisional_rank || null,
      total_submissions: raw.total_submissions || (raw.live_top10 ? raw.live_top10.length : null),
    };
  }

  function mapProfile(raw) {
    return {
      player_id: raw.player_id || raw.sub,
      display_name: raw.display_name || "Unknown",
      country_code: raw.country_code || raw.country || null,
      account_tier: raw.account_tier || raw.trust_tier || "tier1",
      total_rp: raw.total_rp || 0,
      total_orgs_completed: raw.total_orgs_completed || raw.org_count || 0,
      best_daily_rank: raw.best_daily_rank || raw.best_rank || 0,
      mingpu_count: raw.mingpu_count || raw.supu_count || 0,
      // R5: real account privacy preferences (player-privacy.service.ts on
      // the backend) — {} rather than undefined so applyPrivacyToUI()'s
      // `key in privacy` check is well-defined even for a stale mock/error
      // shape that omits this field entirely.
      privacy: raw.privacy || {},
    };
  }

  /* ---------------- real adapter (PRD §3.4) ---------------- */

  let supabaseClient = null;
  function getSupabase() {
    if (!supabaseClient && typeof supabase !== "undefined") {
      supabaseClient = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      // The SDK silently rotates the access token in the background
      // (autoRefreshToken, on by default) well before a long-running tab
      // needs it again -- but `authToken` above was only ever set once, at
      // sign-in/restoreSession() time, with nothing keeping it in sync
      // afterwards. A single-page session left open past the original
      // token's ~1hr lifetime (e.g. a Daily Ranking Game's 60-minute solve
      // allowance started late in that window) kept sending the now-stale
      // token on every write, 401ing at the server with no way for a
      // same-page "Try again" retry to ever succeed (root-caused
      // 2026-09-08: "daily ranking submit not success multiple times").
      // TOKEN_REFRESHED only -- SIGNED_IN/SIGNED_OUT are already handled
      // explicitly by finalizeSession()/signOut(), and folding them in here
      // too would risk the exact races those call sites were hardened
      // against (see the 2026-09-07 auth-session RCs).
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "TOKEN_REFRESHED" && session && session.access_token) {
          authToken = session.access_token;
        }
      });
    }
    return supabaseClient;
  }

  const real = {
    getDailyPuzzle: () => api("/puzzles/daily"),

    getFeatured: () => api("/featured"),

    getTeamomentPuzzles: (params) => {
      const p = params || {};
      const qs = [];
      if (p.tier) qs.push("tier=" + encodeURIComponent(p.tier));
      if (p.technique) qs.push("technique=" + encodeURIComponent(p.technique));
      if (p.sort) qs.push("sort=" + encodeURIComponent(p.sort));
      if (p.page) qs.push("page=" + encodeURIComponent(p.page));
      if (p.limit) qs.push("limit=" + encodeURIComponent(p.limit));
      return api("/puzzles/teamoment" + (qs.length ? "?" + qs.join("&") : ""));
    },

    getTeaMomentToday: () => api("/tea-moment/today"),

    getTeaMomentHistory: (params) => {
      const p = params || {};
      const qs = [];
      if (p.page) qs.push("page=" + encodeURIComponent(p.page));
      if (p.limit) qs.push("limit=" + encodeURIComponent(p.limit));
      return api("/tea-moment/history" + (qs.length ? "?" + qs.join("&") : ""));
    },

    getRecentPuzzles: (limit) => api("/puzzles/recent?limit=" + encodeURIComponent(limit || 7)),

    getOrgStatus: () => api("/org/status").then(mapOrgStatus),

    // Unmapped GET /org/status (2026-08-10, js/page-competition-calendar.js) --
    // mapOrgStatus() above drops ranking_events/next_ranking_event/
    // event_status, which the Calendar needs (today's real per-type
    // status, not just the daily-shaped today_event mapOrgStatus builds).
    getOrgStatusRaw: () => api("/org/status"),

    getOrgPuzzle: (eventId) =>
      orgApi("/org/" + encodeURIComponent(eventId) + "/puzzle"),

    // Best-effort "attempt started" ping (resume is handled server-side). Kept
    // behind OrbaceAPI so app.js never calls fetch() directly (integration
    // principle — no raw fetch in the UI layer).
    startOrg: (eventId) =>
      orgApi("/org/" + encodeURIComponent(eventId) + "/start", { method: "POST" }),

    // Orbace Promo Code capability (2026-08-17) — paths match the literal
    // routes registered in backend/org-api/src/routes/promotion.routes.ts
    // (already carry their own /api/v1 prefix, unlike most other org-api
    // routes above). Preview never reserves inventory; redeem requires a
    // fresh-per-activation-intent Idempotency-Key header (js/promo.js owns
    // generating/reusing that key, not this module — see PromoCopy.newIdempotencyKey()).
    previewPromoCode: (code, surface) =>
      api("/api/v1/promotions/preview", { method: "POST", body: { code: code, surface: surface || "web" } }),

    redeemPromoCode: (code, surface, termsVersion, idempotencyKey) =>
      api("/api/v1/promotions/redeem", {
        method: "POST",
        body: { code: code, surface: surface || "web", termsVersion: termsVersion },
        headers: { "Idempotency-Key": idempotencyKey },
      }),

    getEntitlements: () => api("/api/v1/me/entitlements"),

    getToken: () => authToken,

    // A stable per-browser fingerprint, persisted so the SAME Tier-1 identity
    // (device-bound anonymous account) is recovered on every reload and by
    // both quickStart() (explicit "Instant Identity" click) and the
    // auto-registration below — otherwise each would mint its own device
    // fingerprint and end up as two orphaned player accounts.
    getDeviceFingerprint: () => {
      try {
        let fp = localStorage.getItem("orbace_device_fp");
        if (!fp) {
          fp = "web-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
          localStorage.setItem("orbace_device_fp", fp);
        }
        return fp;
      } catch (_) {
        return "web-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
      }
    },

    getAbuseSignal: getAbuseSignal,

    getLeaderboard: (period, date) => {
      const path = "/leaderboard/" + period + (date ? "/" + date : "");
      return api(path).then(r => mapLeaderboard(r, period, date));
    },

    getLiveLeaderboard: (eventId) => api("/leaderboard/live/" + encodeURIComponent(eventId)),

    getSupu: (id) => api("/supu/" + encodeURIComponent(id)),

    shareSupu: (body) => orgApi("/supu", { method: "POST", body }),

    // Su-Pu Replay v2 Phase 4 (2026-09-09) — the lab's isolated write path
    // (backend/org-api/src/routes/supu-lab.routes.ts). Flag-gated server
    // side (supu_lab_write); 404s until that flag is on. Same read/write
    // API-base split as getSupu/shareSupu above.
    saveSupuLabDraft: (body) => orgApi("/supu/lab", { method: "POST", body }),
    getSupuLabDraft: (id) => api("/supu/lab/" + encodeURIComponent(id)),
    // Su-Pu Capture workspace execution plan (2026-09-22), Package 3.
    getSupuLabDraftVersions: (id) => api("/supu/lab/" + encodeURIComponent(id) + "/versions"),
    // W5 (2026-09-13 execution plan, P0) — page/limit for the discoverability
    // fix (the old hard 100-cap-with-no-cursor hid anything past it).
    getMySupuLabDrafts: (params) => {
      var p = params || {};
      var qs = [];
      if (p.page) qs.push("page=" + encodeURIComponent(p.page));
      if (p.limit) qs.push("limit=" + encodeURIComponent(p.limit));
      return api("/supu/lab/mine" + (qs.length ? "?" + qs.join("&") : ""));
    },
    deleteSupuLabDraft: (id) => orgApi("/supu/lab/" + encodeURIComponent(id), { method: "DELETE" }),
    // Su-Pu Capture: Publish for Teaching, Task 4 (2026-09-15) — hits the
    // new POST /supu/lab/:draftId/publish (Task 2), flag-gated server side
    // (supu_capture_v2_share); 404s until that flag is on. Same read/write
    // API-base split as the rest of this section.
    publishSupuLabDraft: (id) => orgApi("/supu/lab/" + encodeURIComponent(id) + "/publish", { method: "POST" }),

    // Su-Pu Replay v2 Phase 5 (2026-09-09) — annotation layer
    // (backend/org-api/src/routes/supu-annotation.routes.ts). Flag-gated
    // server side (supu_annotation_write); 404s until that flag is on.
    getSupuAnnotation: (supuId) => api("/supu/" + encodeURIComponent(supuId) + "/annotation"),
    putSupuAnnotation: (supuId, body) => orgApi("/supu/" + encodeURIComponent(supuId) + "/annotation", { method: "PUT", body }),

    // Su-Pu six-priorities implementation brief, Priority 2 (2026-09-21) —
    // the Story editor's write path
    // (backend/org-api/src/routes/supu-story.routes.ts). Flag-gated server
    // side (supu_story_write); 404s until that flag is on. Draft-scoped
    // (not supuId-scoped like annotations) — a story lives on the author's
    // own unpublished SupuLabDraft in this pass.
    getSupuLabDraftStory: (draftId) => api("/supu/lab/" + encodeURIComponent(draftId) + "/story"),
    putSupuLabDraftStory: (draftId, body) => orgApi("/supu/lab/" + encodeURIComponent(draftId) + "/story", { method: "PUT", body }),

    // Best-effort attempt recording. Requires auth (sups up the token); if the
    // user isn't signed in, the call silently fails. Web solves without a token
    // just don't count toward the server-side play-count aggregations.
    recordAttempt: (body) => api("/attempts", { method: "POST", body }).catch(() => null),

    getSupuLibrary: (params) => {
      const p = params || {};
      const qs = [];
      if (p.tier) qs.push("tier=" + encodeURIComponent(p.tier));
      if (p.clean) qs.push("clean=true");
      if (p.type) qs.push("type=" + encodeURIComponent(p.type));
      if (p.technique) qs.push("technique=" + encodeURIComponent(p.technique));
      if (p.q) qs.push("q=" + encodeURIComponent(p.q));
      if (p.sort) qs.push("sort=" + encodeURIComponent(p.sort));
      if (p.page) qs.push("page=" + encodeURIComponent(p.page));
      if (p.limit) qs.push("limit=" + encodeURIComponent(p.limit));
      return api("/supu/library" + (qs.length ? "?" + qs.join("&") : ""));
    },

    getSupuSpotlight: () => api("/supu/library/spotlight"),

    // My Su-Pu — owner-scoped, returns authenticated player's replays
    // (all visibilities). R0.7, 2026-07-24.
    getMySupu: (params) => {
      const p = params || {};
      const qs = [];
      if (p.tier) qs.push("tier=" + encodeURIComponent(p.tier));
      if (p.clean) qs.push("clean=true");
      if (p.type) qs.push("type=" + encodeURIComponent(p.type));
      if (p.technique) qs.push("technique=" + encodeURIComponent(p.technique));
      if (p.q) qs.push("q=" + encodeURIComponent(p.q));
      if (p.sort) qs.push("sort=" + encodeURIComponent(p.sort));
      if (p.page) qs.push("page=" + encodeURIComponent(p.page));
      if (p.limit) qs.push("limit=" + encodeURIComponent(p.limit));
      return api("/supu/mine" + (qs.length ? "?" + qs.join("&") : ""));
    },

    getBlogPosts: (params) => {
      const p = params || {};
      const qs = [];
      if (p.page) qs.push("page=" + encodeURIComponent(p.page));
      if (p.limit) qs.push("limit=" + encodeURIComponent(p.limit));
      return api("/blog" + (qs.length ? "?" + qs.join("&") : ""));
    },

    getBlogPost: (slug) => api("/blog/" + encodeURIComponent(slug)).catch((e) => {
      if (e.status === 404) return null;
      throw e;
    }),

    // Puzzle Challenge (2026-08-28, public page only). Paths + shapes match
    // the authoritative wire contract Team A committed the same day —
    // docs/shared_artifacts/puzzle-challenge-api-contract-v1.md §2.1/§2.2
    // (note the /api/ prefix here, unlike this file's other endpoints —
    // that's Team A's contract, not a typo).
    validatePuzzleChallenge: (givens) => api("/api/puzzle-challenge/validate", { method: "POST", body: { givens } }),
    submitPuzzleChallenge: (payload) => api("/api/puzzle-challenge/submissions", { method: "POST", body: payload }),

    // Challenge the House v2 (2026-08-29) — docs/plans/
    // 2026-08-29-challenge-the-house-v2-execution-plan.md §7.1/§7.2. camelCase
    // wire shapes, unlike v1's contract above — not a typo, the build plan's
    // own convention. Session cookie (tier2 fast path) rides along
    // automatically via http()'s credentials:"include"; this file never
    // reads or sends an email for a signed-in submitter.
    checkChallengePuzzle: (givens, turnstileToken, website) =>
      api("/api/puzzles/check", { method: "POST", body: { givens, turnstileToken, website } }),
    submitChallenge: (payload) => api("/api/submissions", { method: "POST", body: payload }),
    getChallengeStatus: (statusToken) => api("/api/submissions/status/" + encodeURIComponent(statusToken)),
    // 2026-08-30 — replaces /challenge's former localStorage-only board
    // (Phase 2 backlog #1). Public, unpaginated (current volume is small);
    // never returns pending_confirmation/received/not_selected rows or any
    // admin-only field (see the route's own privacy-rule comment).
    getCommunityBoard: () => api("/api/community"),
    // Follow-up fix (user report, 2026-09-05): the "Puzzle Challenge"
    // section on /puzzle-packs used to list individually-pinned submissions
    // (superseded getPublishedPuzzleChallenges()/getPuzzleChallengeStats(),
    // Phase 3 2026-08-28) — in practice that meant exactly one puzzle
    // forever, since every new community grid gets solved into the same
    // 'imported' pack but nothing surfaced it here. Now treated as a real
    // (if hidden-from-browse) pack: one row with pack-level stats, and
    // Practice rotates through the whole pool — same contract as
    // getPacks()/getPackStats()/selectPackPuzzle() below, just pointed at
    // its own dedicated routes since 'imported' is deliberately excluded
    // from the general pack browse/select surface.
    getPuzzleChallengePack: () => api("/api/puzzle-challenge/pack"),
    selectPuzzleChallengePuzzle: () => api("/api/puzzle-challenge/select"),

    getTechniquePuzzles: (technique) => api("/techniques/" + encodeURIComponent(technique) + "/puzzles"),

    getPacks: () => api("/packs"),

    // Puzzle Packs community statistics (unique players, qualifying solves,
    // fastest published-Su-Pu solve, Su-Pu submitted count) — batched for
    // all visible packs. Decoupled from getPacks() so a slow/failed stats
    // fetch never blocks core practice (doc §18).
    getPackStats: (params) => {
      var p = params || {};
      var qs = p.clean ? "?clean=true" : "";
      return api("/packs/stats" + qs);
    },

    // Puzzle Packs "Play <difficulty>" / "Practice <technique>" — server
    // picks one eligible puzzle (recent-play avoidance, technique filter);
    // Web must never pick the puzzle client-side. Response shape mirrors
    // getTeamomentPuzzles() items so it drops straight into OrbaceGrid.
    selectPackPuzzle: (packId, params) => {
      var p = params || {};
      var qs = p.technique ? "?technique=" + encodeURIComponent(p.technique) : "";
      return api("/packs/" + encodeURIComponent(packId) + "/select" + qs);
    },

    getPuzzleByExternalId: (externalId) => api("/puzzles/" + encodeURIComponent(externalId)).catch((e) => {
      if (e.status === 404) return null;
      throw e;
    }),

    // Su-Pu Capture bridge W1 (2026-09-13 execution plan) — public,
    // metadata-only puzzle search backing /su-pu/capture's "Find a puzzle"
    // panel. Never returns givens/solution — callers load the actual
    // puzzle content via getPuzzleByExternalId() once the player picks one.
    searchPuzzles: (params) => {
      var p = params || {};
      var qs = [];
      if (p.q) qs.push("q=" + encodeURIComponent(p.q));
      if (p.pack) qs.push("pack=" + encodeURIComponent(p.pack));
      if (p.technique) qs.push("technique=" + encodeURIComponent(p.technique));
      if (p.page) qs.push("page=" + encodeURIComponent(p.page));
      if (p.limit) qs.push("limit=" + encodeURIComponent(p.limit));
      return api("/puzzles/search" + (qs.length ? "?" + qs.join("&") : ""));
    },

    // Su-Pu Capture bridge W3 (2026-09-13 execution plan, P0) — validate a
    // pasted puzzle and return its solution; never persisted server-side.
    // Turnstile-gated. Rejections carry `e.body.givens` (the entered
    // givens echoed back) and `e.body.error.code` so the caller can show a
    // specific reason without clearing what the player typed.
    importPuzzle: (body) => api("/puzzles/import", { method: "POST", body: body }),

    // Phase 3 of the technique-playbook proposal (2026-07-18) — backs the
    // practice grid's "Show" tool (js/orbace-grid.js's techniqueHint()).
    getTechniqueHint: (params) => api("/solve/technique-hint", {
      method: "POST",
      body: { board: params.board, technique: params.technique },
    }),

    submitOrg: (eventId, payload) => {
      const body = {
        time_seconds: payload.elapsed_seconds || payload.time_seconds,
        solution: payload.replay_data
          ? Object.fromEntries(
              (Array.isArray(payload.replay_data) ? payload.replay_data : [])
                .filter(m => m && m.v != null)
                .map(m => [String(m.i !== undefined ? m.i : m.cell), m.v !== undefined ? m.v : m.value])
            )
          : payload.solution || {},
        score_details: {
          quality_score: payload.score_breakdown?.quality_score ?? payload.score_details?.quality_score,
          moves_count: payload.total_steps || payload.score_details?.moves_count,
          techniques_used: payload.replay_data
            ? [...new Set(
                (Array.isArray(payload.replay_data) ? payload.replay_data : [])
                  .map(m => m?.t || m?.technique)
                  .filter(Boolean)
              )]
            : payload.score_details?.techniques_used,
          puzzle_checksum: payload.score_breakdown?.checksum || payload.score_details?.puzzle_checksum,
        },
      };
      return orgApi("/org/" + encodeURIComponent(eventId) + "/submit", {
        method: "POST",
        body: { ...body, client_version: cfg.CLIENT_VERSION, platform: cfg.PLATFORM },
      }).then(mapSubmitResponse);
    },

    // Ranking Games (Phase 4, 2026-07-18) — distinct from submitOrg()/the
    // legacy single-daily ORG flow above. gameType-tagged events only; hits
    // the dedicated /ranking/* routes, which actually implement the
    // mistake-tier/bonus-pool scoring (submitOrg posts to the old flat-100pt
    // /org/:eventId/submit route and does not apply here).
    // Monthly/Annual/All-Time added 2026-07-22 (Global Ranking consolidation
    // — one leaderboard UI instead of two). These hit the legacy-but-real
    // /leaderboard/* routes (org.routes.ts) — confirmed working with a real
    // date/year param during the consolidation audit, unlike the bare-path
    // 404s an earlier QA pass reported. Raw shape ({rank, totalRp, playerId,
    // playerName, isAnonymous, eventsPlayed}) differs from /ranking/leaderboard's
    // ({rank, player_name, total_points, ...}), so periodEntriesFromRaw()
    // normalizes both into the one shape rankingEntryToLbRow() (app.js) already
    // knows how to render — no second table renderer needed.
    getRankingData: () => {
      const now = new Date();
      const monthStart = now.toISOString().slice(0, 7) + "-01";
      const year = String(now.getUTCFullYear());
      return Promise.all([
        api("/org/status"),
        api("/ranking/leaderboard?game_type=daily"),
        api("/ranking/leaderboard?game_type=weekly"),
        api("/ranking/leaderboard?game_type=tournament"),
        api("/leaderboard/monthly/" + monthStart).catch(() => ({ entries: [] })),
        api("/leaderboard/annual/" + year).catch(() => ({ entries: [] })),
        api("/leaderboard/alltime").catch(() => ({ entries: [] })),
        api("/ranking/player-stats").catch(() => null), // unauthenticated (no token yet) — skip, don't fail the whole batch
      ]).then(([status, daily, weekly, tournament, monthly, annual, alltime, stats]) => ({
        // Grand (Monthly) events are created by the backend scheduler with
        // game_type "grand", but every consumer of this shape predates the
        // Grand rename and keys on the V1 "tournament" vocabulary (app.js's
        // lobby cards + next-event checks, page-compete.js's Monthly tab +
        // Upcoming sidebar). Normalize game_type (and the predicted
        // next_ranking_event.type) here at the adapter layer — the one place
        // all consumers share — mirroring page-competition-calendar.js's
        // tournament→grand read-time mapping in the other direction and the
        // backend's own leaderboardEventTypes('tournament')
        // = ['grand','tournament'] equivalence. competition_type passes
        // through verbatim: all V8 capability routing (app.js:1562,
        // page-compete.js:122, CompeteCard variants) keys on that field,
        // never game_type.
        events: (status.ranking_events || []).map((e) => ({
          ...e,
          game_type: e.game_type === "grand" ? "tournament" : e.game_type,
        })),
        nextEvent: status.next_ranking_event
          ? { ...status.next_ranking_event, type: status.next_ranking_event.type === "grand" ? "tournament" : status.next_ranking_event.type }
          : null,
        leaderboards: {
          daily, weekly, tournament,
          monthly: periodEntriesFromRaw(monthly),
          annual: periodEntriesFromRaw(annual),
          alltime: periodEntriesFromRaw(alltime),
        },
        playerStats: stats,
      }));
    },

    // Globally latest finalized ranking result. Homepage Featured Su-Pu uses
    // this first so it follows the server's cross-type event ordering rather
    // than inventing a client-side Daily/Weekly/Grand priority.
    getLatestFinalLeaderboard: () => api("/ranking/leaderboard"),

    // Single game type's most-recently-finalized leaderboard (2026-08-10,
    // js/page-rankings.js's "Event Results" tab) — same endpoint
    // getRankingData() already calls three times in parallel above, split
    // out so a page can fetch just the one type it needs.
    getEventLeaderboard: (gameType) => api("/ranking/leaderboard?game_type=" + encodeURIComponent(gameType)),

    // Exact finalized event result for stable Featured-Su-Pu deep links.
    getLeaderboardByEvent: (eventId) => api("/ranking/leaderboard?event_id=" + encodeURIComponent(eventId)),

    // COMPETITION_IN_PROGRESS_V1 (draft, not yet implemented server-side --
    // see docs/shared_artifacts/Team-Web-Mobile-Contract-Request-2026-08-17-
    // In-Progress-Competition-Results.md). Gated behind
    // cfg.IN_PROGRESS_RESULTS_ENABLED (config.js), default false, same
    // inert-until-backend-ships pattern as RANKING_RESULTS_WIRE_V1_ENABLED
    // was before Stage-2 deploy. Public read, same game_type vocabulary as
    // getEventLeaderboard() above.
    getLiveParticipants: (gameType) => api("/ranking/live?game_type=" + encodeURIComponent(gameType)),

    // Daily/weekly/tournament Prev/Next browsing (2026-07-22) — the adjacent
    // finalized event's board, in the exact same response shape as
    // getRankingData()'s own daily/weekly/tournament fetch above.
    getLeaderboardHistory: (gameType, eventId, direction) => {
      const qs = ["game_type=" + encodeURIComponent(gameType), "direction=" + encodeURIComponent(direction)];
      if (eventId) qs.push("event_id=" + encodeURIComponent(eventId));
      return api("/ranking/leaderboard/history?" + qs.join("&"));
    },

    // Monthly/Annual Prev/Next browsing (2026-07-22) — same normalized shape
    // periodEntriesFromRaw() already gives getRankingData()'s own monthly/
    // annual fetch, so the leaderboard table renderer needs no branching.
    getMonthlyLeaderboard: (monthStart) => api("/leaderboard/monthly/" + monthStart).then(periodEntriesFromRaw),
    getAnnualLeaderboard: (year) => api("/leaderboard/annual/" + year).then(periodEntriesFromRaw),

    // R6 (site re-imagined v2): server-issued attempt start — the server's
    // own clock, not the client's, is now what determines a ranking
    // submission's official elapsed time. Must be called (and succeed)
    // before submitRanking(); see startRankingPlay() in app.js.
    startRanking: (eventId) =>
      orgApi("/ranking/" + encodeURIComponent(eventId) + "/start", { method: "POST" }),

    submitRanking: (eventId, payload) =>
      orgApi("/ranking/" + encodeURIComponent(eventId) + "/submit", {
        method: "POST",
        body: payload,
      }),

    // Su-Pu replay auto-saved on every ranking submission (2026-07-22) —
    // submitRanking()'s response includes replay_id when this succeeded.
    getReplay: (id) => orgApi("/replays/" + encodeURIComponent(id)),

    // Unified V8 competition semantic contract (js/compete-competition.js)
    // — the single source of presentation_state/capabilities/reason_codes
    // for a V8 Daily, Weekly, or Grand/Monthly Tournament event alike. A
    // 404 means eventId isn't any V8 competition event (a genuinely legacy
    // pre-V8 event still renders through getRankingData()/
    // renderOfficialRoute()'s fallback, not this call) — callers rely on
    // that to branch, so the error is left uncaught here.
    getCompeteOverview: (eventId) =>
      api("/compete/overview?event_id=" + encodeURIComponent(eventId)),

    // V8.1 Round 2 public rankings (Team Web) -- GET /competition/events and
    // GET /competition/events/:eventId/results are unauthenticated on the
    // backend (no authenticate() call in competition.routes.ts, confirmed
    // by reading the route directly) -- authoritative event-by-date
    // discovery and public Top-N results, per Team A's deployed R2
    // integration (3f1cad9). A 409 means the event exists but isn't FINAL
    // yet; a 404 means it's not an R2 event at all -- callers branch on
    // err.status, same convention as getCompeteOverview's 404.
    getCompetitionEventsByDate: (date) =>
      api("/competition/events?date=" + encodeURIComponent(date)),
    getCompetitionEventResults: (eventId, limit) =>
      api("/competition/events/" + encodeURIComponent(eventId) + "/results" + (limit ? "?limit=" + encodeURIComponent(limit) : "")),

    // Event Results "Play this puzzle" card (UAT 2026-09-18, js/page-
    // rankings.js) -- same public GET /competition/events/:eventId/puzzle
    // mobile's leaderboard practice card already uses. 409 means the event
    // exists but isn't finalized yet; 404 means no event/no puzzle data --
    // callers treat both as "no practice card for this event" (same honest
    // degradation the backend route's own comment describes), never a
    // rendered error.
    getCompetitionEventPuzzle: (eventId) =>
      api("/competition/events/" + encodeURIComponent(eventId) + "/puzzle"),

    // Personal Season/Grand Circuit standing (auth-gated) -- the "My
    // Season" panel's data source, kept structurally separate from the
    // public results table above per the instruction's "never render
    // personal projections as a fake multi-player leaderboard" rule.
    getSeasonStanding: () => api("/season/standing"),
    getCircuitStanding: () => api("/circuit/standing"),

    // RANKING_RESULTS_WIRE_V1 (Team A, Stage-1 preview-verified 2026-08-09 --
    // NOT yet on production; only justinzero-preview). Five new routes, all
    // returning the new nested {error:{code,message,retryable}} shape on
    // failure rather than the legacy flat {error:"string"} every other route
    // here uses -- see RankingResultsWireV1.errorCode/errorMessage in
    // js/ranking-results-wire-v1.js for the one place that distinction is
    // handled, rather than every call site re-checking typeof err.body.error.
    //
    // getRankingsSeasons -- GET /rankings/seasons, public, no auth.
    getRankingsSeasons: () => api("/rankings/seasons"),

    // getSeasonLeaderboard -- GET /rankings/seasons/:season_id/standings,
    // public. Revision-pinned pagination per the PM's contract-freeze
    // clarification #2 (2026-08-09): page 1 returns season.revision; pass it
    // back on subsequent pages so one browsing session sees one coherent
    // snapshot of an open (non-FINAL) Season even as banked RP changes rank
    // order underneath it. Exact query-param name is Team A's documented
    // sketch (`revision=`) -- not yet exercised against real multi-page data
    // in preview (the preview DB has zero persisted Season rows today), so
    // treat this as best-effort until a real paginated response confirms it.
    getSeasonLeaderboard: (seasonId, opts) => {
      opts = opts || {};
      const qs = ["page=" + encodeURIComponent(opts.page || 1), "page_size=" + encodeURIComponent(opts.pageSize || 25)];
      if (opts.country) qs.push("country=" + encodeURIComponent(opts.country));
      if (opts.revision) qs.push("revision=" + encodeURIComponent(opts.revision));
      return api("/rankings/seasons/" + encodeURIComponent(seasonId) + "/standings?" + qs.join("&"));
    },

    // getAllTimeLeaderboard -- GET /leaderboard/alltime, public. PM
    // correction (2026-08-12): page-rankings.js's "Global Ranking" tab
    // previously called getSeasonLeaderboard() above, which is a single
    // Season's best-eight-results projection (SeasonStanding) -- reads as
    // "one week's data" for a player early in a season. "Global" per the
    // PM's requirement means the true career-lifetime sum of every banked
    // Weekly + Grand result, which is exactly PlayerAccount.totalRp, always
    // fresh, no season scoping -- this route (already live, previously only
    // used inline by getRankingData() for an unrelated SPA widget).
    getAllTimeLeaderboard: (opts) => {
      opts = opts || {};
      const qs = ["page=" + encodeURIComponent(opts.page || 1), "page_size=" + encodeURIComponent(opts.pageSize || 25)];
      return api("/leaderboard/alltime?" + qs.join("&"));
    },

    // getMyResults -- GET /me/results, auth required. Unified persistent
    // Daily/Weekly/Grand history (the "My Results" tab) -- distinct from
    // getSeasonStanding()'s RP-only projection above.
    getMyResults: (opts) => {
      opts = opts || {};
      const qs = ["page=" + encodeURIComponent(opts.page || 1), "page_size=" + encodeURIComponent(opts.pageSize || 25)];
      if (opts.competitionType) qs.push("competition_type=" + encodeURIComponent(opts.competitionType));
      if (opts.seasonId) qs.push("season_id=" + encodeURIComponent(opts.seasonId));
      if (opts.finality) qs.push("finality=" + encodeURIComponent(opts.finality));
      return api("/me/results?" + qs.join("&"));
    },

    // getMyResultDetail -- GET /me/results/:result_id, auth required, same
    // canonical item shape as a getMyResults() list row.
    getMyResultDetail: (resultId) => api("/me/results/" + encodeURIComponent(resultId)),

    auth: {
      // turnstileToken is only needed on a retry after a captcha_required
      // error (ADR-010) — omitted on the normal, common-case first call.
      registerUuid: (deviceUuid, fingerprint, turnstileToken) =>
        api("/auth/uuid/register", {
          method: "POST",
          body: {
            device_fingerprint: fingerprint,
            platform: cfg.PLATFORM,
            abuse_signal: getAbuseSignal(),
            ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
          },
        }).then(r => {
          authToken = r.token;
          // Persisted so a later social sign-in's restoreSession() can send
          // it as tier1_uuid in the /auth/uuid/upgrade call — without this,
          // there is no way to know which anonymous account to upgrade
          // (found in code review, 2026-07-19: this value was previously
          // fetched here and immediately discarded, which is why the
          // upgrade call was always malformed and Google sign-in never
          // actually linked an account).
          try { localStorage.setItem("orbace_tier1_uuid", r.tier1_uuid); } catch (_) {}
          try { localStorage.setItem("orbace_auth_token", r.token); } catch (_) {}
          try { localStorage.setItem("orbace_player_name", r.friendly_name || r.tier1_uuid); } catch (_) {}
          try { localStorage.removeItem(EXPLICIT_SIGNOUT_KEY); } catch (_) {}
          return {
            player_id: r.player_id || r.tier1_uuid,
            friendly_name: r.friendly_name || r.tier1_uuid,
            token: r.token,
          };
        }),

      // Renders Google's real "Sign in with Google" button — the reliable
      // entry point (see renderGoogleButton() above). `container` is a DOM
      // node or element id string.
      renderGoogleButton: (container, opts) =>
        renderGoogleButton(
          typeof container === "string" ? document.getElementById(container) : container,
          opts
        ),

      signInProvider: async (provider) => {
        if (provider === "google") {
          return signInWithGoogle();
        }
        // Apple/email — redirect approach. Blocked by Supabase Auth Site URL
        // being com.orbace.mobile:// (must be a subdirectory of Site URL to be
        // accepted as redirect_to). Apple JS SDK popup would need a custom
        // Service ID configured in Supabase dashboard — same fix pattern as
        // Google (GIS + signInWithIdToken). For now the redirect will not
        // complete successfully; the fallback is kept so the user at least
        // gets an error page rather than a silent no-op.
        const sb = getSupabase();
        if (!sb) throw new Error("Supabase SDK not loaded. Add script tag to index.html.");
        const { error } = await sb.auth.signInWithOAuth({
          provider,
          options: { redirectTo: window.location.origin + window.location.pathname },
        });
        if (error) throw error;
        return null;
      },

      // Identical contract to signInProvider's code after the Supabase
      // session is obtained. Shared by:
      //   - signInProvider() for Google (GIS popup → signInWithIdToken)
      //   - restoreSession() for every page load (recovered from localStorage)
      // Extracted to avoid duplicating the upgrade + profile fetch logic.
      finalizeSession: async (session, googleIdToken) => {
        authToken = session.access_token;
        try { localStorage.removeItem(EXPLICIT_SIGNOUT_KEY); } catch (_) {}
        try {
          const tier1Uuid = localStorage.getItem("orbace_tier1_uuid");
          // Nothing to upgrade FROM if this browser never had a Tier-1
          // identity (e.g. Google was the very first sign-in ever on this
          // device — no Instant Identity/quickStart() call preceded it).
          // The backend's uuidUpgradeSchema requires tier1_uuid as a
          // non-empty string, so sending null here always 400s (found
          // 2026-08-05: harmless since the whole block is caught below and
          // sign-in proceeds regardless, but a guaranteed-failing network
          // call is still worth not making).
          if (tier1Uuid) {
            const body = {
              tier1_uuid: tier1Uuid,
              supabase_id: session.user.id,
              supabase_token: session.access_token,
            };
            if (googleIdToken) body.google_id_token = googleIdToken;
            const upgradeRes = await fetch(cfg.API_BASE_URL + "/auth/uuid/upgrade", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (upgradeRes.ok) {
              await upgradeRes.json();
              // Upgrade succeeded: clear stale Tier-1 token so a future
              // Supabase-restore failure doesn't silently downgrade back to
              // anonymous identity via the Tier-1 fallback.
              try { localStorage.removeItem("orbace_auth_token"); } catch (_) {}
            }
          }
        } catch {}
        try {
          const _profile = mapProfile(await api("/player/me"));
          try { localStorage.setItem("orbace_player_name", _profile.display_name); } catch (_) {}
          return _profile;
        } catch (e) {
          // Was a bare `return null` — the caller (signInProvider/
          // restoreSession) had zero way to distinguish "profile fetch
          // failed" from "not signed in", so a real backend error here
          // looked exactly like nothing happened at all when a sign-in
          // actually succeeded at the Supabase layer (user-reported
          // 2026-07-19: "login process stopped", no error, no account).
          console.error("finalizeSession: /player/me failed after sign-in:", e);
          throw new Error("Signed in, but couldn't load your profile — please try again");
        }
      },
      restoreSession: async () => {
        const sb = getSupabase();
        if (!sb) return null;

        // PKCE flow (the SDK's default for signInWithOAuth as of
        // supabase-js v2) returns a `?code=` query param, not a hash
        // fragment — and critically, plain getSession() does NOT
        // automatically exchange it (verified directly against the SDK,
        // 2026-07-18: getSession() with a real `?code=` in the URL just
        // returns no session and no error, silently). The exchange must be
        // called explicitly with exchangeCodeForSession(code). This was the
        // actual reason "Google sign-in hangs at the Supabase
        // authentication" step even after fixing the router's hash-
        // clobbering bug — restoreSession() was calling the one method
        // that never processes this flow's return leg at all.
        const codeMatch = window.location.search.match(/[?&]code=([^&]+)/);
        let session;
        if (codeMatch) {
          const { data, error } = await sb.auth.exchangeCodeForSession(decodeURIComponent(codeMatch[1]));
          if (error || !data.session?.access_token) return null;
          session = data.session;
        } else {
          // Implicit-flow hash fragment (#access_token=...) or an
          // already-persisted session from an earlier visit — both of
          // these ARE handled automatically by detectSessionInUrl at
          // createClient() time, so plain getSession() is correct here.
          const { data, error } = await sb.auth.getSession();
          if (error || !data.session?.access_token) {
            // Reverted 2026-07-26: two rounds of "retry via an explicit
            // refresh" here both made things worse — confirmed by the
            // user, the second attempt (refreshSession() with a manually
            // extracted refresh_token) made EVERY page lose the session,
            // not just some. Most likely cause: a refresh token is
            // single-use — manually forcing a refresh through this path
            // consumed it without reliably persisting the newly-rotated
            // replacement the way the SDK's own internal refresh-and-
            // persist cycle does, so once one page's forced refresh fired,
            // every subsequent page's stored token was already spent.
            // Trust getSession() alone; the actual fix now lives in the
            // caller, AuthSession.restore() — don't destroy storage on a
            // getSession() failure, so a session that's genuinely still
            // valid gets a chance to recover on its own on a later load
            // instead of us forcing (and risking corrupting) a refresh.
            return null;
          }
          session = data.session;
        }
        // Bug fix (2026-07-26): this called the bare identifier
        // `finalizeSession`, but it's a property of this same `auth`
        // object (`finalizeSession: async (...) => {...}` above), not a
        // name in this closure's scope — every other call site in this
        // file correctly uses `real.auth.finalizeSession(...)`. This one
        // threw "finalizeSession is not defined" on every single call,
        // confirmed via temporary console logging: restoreSession() logged
        // a valid, live Supabase session (hasSession/hasAccessToken both
        // true, no error) immediately before throwing this ReferenceError.
        // That means this was very likely the true root cause of the
        // whole "Google session doesn't survive navigation" report from
        // the start — every restore() after the first sign-in hit this
        // exception, not an actual Supabase/token-refresh problem.
        return real.auth.finalizeSession(session);
      },

      checkName: (name) => api("/auth/check-name/" + encodeURIComponent(name)),

      updateProfile: (data) =>
        api("/player/me", { method: "PUT", body: data })
          .catch((e) => {
            if (e.status === 409) throw new Error("That name is already taken — try another");
            if (e.status === 400) throw new Error("Name must be 3-20 characters");
            throw e;
          })
          .then(mapProfile),

      emailSignIn: async (email, password) => {
        const sb = getSupabase();
        if (!sb) throw new Error("Supabase SDK not loaded");
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) throw new Error("No session returned");
        return real.auth.finalizeSession(data.session);
      },

      emailSignUp: async (email, password) => {
        const sb = getSupabase();
        if (!sb) throw new Error("Supabase SDK not loaded");
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) return real.auth.finalizeSession(data.session);
        throw new Error("Check your email for the confirmation link, then sign in");
      },

      signOut: async () => {
        const sb = getSupabase();
        try { if (sb) await sb.auth.signOut(); } catch {}
        authToken = null;
        // Force-clean any Supabase session artefacts from localStorage so
        // the next page load doesn't find a stale session and re-create
        // an authToken that the backend considers expired/invalid.
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("sb-") || key.startsWith("supabase."))) {
            toRemove.push(key);
          }
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
        try { localStorage.removeItem("orbace_auth_token"); } catch (_) {}
        try { localStorage.removeItem("orbace_tier1_uuid"); } catch (_) {}
        try { localStorage.removeItem("orbace_player_name"); } catch (_) {}
        // Sign-out only clears local state; without this flag, the very next
        // fresh page load (e.g. a full navigation to a hash-only route like
        // #supu, which re-runs this whole module) would see no auth token
        // and unconditionally auto-register a new anonymous identity via
        // tier1Init below — silently undoing the sign-out the user just
        // performed. Cleared the next time the user takes an explicit
        // identity-creating action (registerUuid, a real sign-in).
        try { localStorage.setItem(EXPLICIT_SIGNOUT_KEY, "1"); } catch (_) {}
        return { ok: true };
      },

      getProfile: (playerId) =>
        api("/player/" + encodeURIComponent(playerId) + "/profile").then(mapProfile),
    },
    // R5 (site re-imagined v2): the account page's "Download my data" /
    // "Delete my account" buttons had no handler at all despite these two
    // endpoints already working server-side (GET /player/me/export,
    // DELETE /player/me) — found while wiring privacy persistence.
    getMySubmissions: () => api("/player/me/submissions").then(r => r || { items: [], total: 0 }),
    // Phase 6 (ADR-005) — appeal a rejected submission. Never rewrites the
    // submission itself; a correction (if upheld) arrives as RP, not a
    // changed status — see backend appeal.service.ts.
    submitAppeal: (submissionId, reason) =>
      api("/submissions/" + encodeURIComponent(submissionId) + "/appeal", { method: "POST", body: { reason: reason } }),
    getMyAppeals: () => api("/player/me/appeals"),
    exportMyData: () => api("/player/me/export"),
    deleteMyAccount: () => api("/player/me", { method: "DELETE" }),
  };

  // ── GIS (Google Identity Services) helpers ────────────────────────
  // These live outside the `real` object because they are internal
  // callbacks / helpers used by real.auth.signInProvider/renderGoogleButton
  // and the GIS onload handler, not externally exported methods.
  //
  // NOTE: this MUST use the `google.accounts.id` (Sign In With Google)
  // API, not `google.accounts.oauth2.initCodeClient`. initCodeClient's
  // popup returns an OAuth *authorization code*, which requires a
  // server-side exchange (with a client secret we don't hold) to become
  // tokens — it is NOT an ID token. A previous version of this file passed
  // that code straight to Supabase's signInWithIdToken(), which requires a
  // real ID token (JWT); that call silently rejected on every sign-in,
  // after the user had already picked a Google account, and app.js's
  // catch-all then fell through to creating a random guest identity
  // (user-reported 2026-07-19: "signed in as PatientSolver_3678" instead
  // of their Google account). google.accounts.id's callback receives an
  // actual ID token (`response.credential`), which is what
  // signInWithIdToken is designed to consume.
  let gisInitialized = false;
  // Sink for whichever caller is currently waiting on the *next* credential
  // callback — either a rendered button's click (persists indefinitely,
  // re-armed on every render) or a one-shot signInWithGoogle()/prompt() call.
  let currentGsiHandler = null;

  function ensureGsiInitialized() {
    if (gisInitialized) return;
    // NOTE: do NOT write this as `typeof google?.accounts?...`. Optional
    // chaining on an UNDECLARED global throws `ReferenceError: google is not
    // defined` — the `typeof x` safety only covers the bare identifier, not
    // `x?.prop`. When the GIS script is blocked (ad blocker, privacy setting,
    // proxy, flaky network) `google` is undeclared, and the old form threw a
    // ReferenceError instead of this function's intended Error. Guard the
    // global explicitly. (Found live 2026-09-15 — see
    // docs/plans/2026-09-15-blank-auth-page-gis-block-lessons-learned.md.)
    if (typeof google === "undefined" || !google.accounts || !google.accounts.id
      || typeof google.accounts.id.initialize !== "function") {
      throw new Error("Google Identity Services SDK not yet loaded — try again");
    }
    google.accounts.id.initialize({
      client_id: cfg.GOOGLE_CLIENT_ID,
      callback: (response) => {
        const handler = currentGsiHandler;
        currentGsiHandler = null;
        if (!handler) return; // stray callback, nothing listening
        if (!response?.credential) {
          handler.reject(new Error("GIS: no credential returned"));
          return;
        }
        handleGsiCredential(response.credential).then(handler.resolve).catch(handler.reject);
      },
    });
    gisInitialized = true;
  }

  // Renders Google's own "Sign in with Google" button into `container` and
  // arms it so a click resolves via onSuccess(profile)/onError(err). This
  // must be Google's real, visibly-clicked button (not a custom button
  // whose click is forwarded synthetically) — Google's account chooser
  // popup only opens on a genuine, trusted click event, and this is the
  // only GIS entry point that reliably shows the chooser on every click
  // (unlike prompt()/One Tap, which Google can silently skip).
  function renderGoogleButton(container, { onSuccess, onError, ...opts } = {}) {
    if (!container) return;
    ensureGsiInitialized();
    currentGsiHandler = {
      resolve: (profile) => {
        try { onSuccess && onSuccess(profile); }
        catch (e) { console.error("GSI onSuccess handler threw:", e); }
      },
      reject: (err) => {
        try { onError && onError(err); }
        catch (e) { console.error("GSI onError handler threw:", e); }
      },
    };
    container.innerHTML = "";
    // Google's button can't take arbitrary CSS (it's a cross-origin iframe,
    // and Google's brand guidelines require the button keep its own
    // colors/fonts regardless) — but width/height/shape are configurable,
    // so match those to the site's own .btn elements as closely as Google's
    // API allows: filled_black mirrors .btn.dark (the class the old custom
    // "Continue with Google"/"Continue with Apple" buttons used), "large" +
    // "rectangular" is the closest match to those buttons' ~44px height and
    // 10px corner radius, and width is measured from the container itself
    // so it fills the same space as every other stacked button in
    // .auth-card (which are all width:100% via CSS — Google's API only
    // accepts a fixed px width, not a percentage, so this has to be read
    // from the DOM at render time rather than set once in CSS).
    const measuredWidth = Math.round(container.getBoundingClientRect().width);
    google.accounts.id.renderButton(container, Object.assign({
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "center",
      width: measuredWidth > 0 ? Math.min(measuredWidth, 400) : 300,
    }, opts));
  }

  // Promise-based fallback for callers without a rendered button (e.g.
  // signInProvider("google") compatibility). Uses One Tap's prompt(), which
  // Google may silently skip — renderGoogleButton() above is the reliable
  // path and is what the account page actually uses.
  async function signInWithGoogle() {
    ensureGsiInitialized();
    return new Promise((resolve, reject) => {
      const wrappedResolve = (v) => { clearTimeout(timeout); resolve(v); };
      const wrappedReject = (e) => { clearTimeout(timeout); reject(e); };
      const timeout = setTimeout(() => {
        currentGsiHandler = null;
        reject(new Error("Sign-in cancelled or timed out"));
      }, 120_000);
      currentGsiHandler = { resolve: wrappedResolve, reject: wrappedReject };
      google.accounts.id.prompt();
    });
  }

  async function handleGsiCredential(idToken) {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase SDK not loaded. Add script tag to index.html.");
    const { data, error } = await sb.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    if (error) throw error;
    if (!data.session) throw new Error("GIS: no session returned from signInWithIdToken");
    // Pass the raw Google ID token so the backend can independently verify it
    // (defense-in-depth against compromised/replayed Supabase session JWTs).
    return real.auth.finalizeSession(data.session, idToken);
  }

  // Auto-register a Tier-1 (anonymous, device-bound) identity on first load,
  // mirroring apps/web's SessionService. Without this, authToken stays null
  // for every visitor who never explicitly signs in / clicks "Instant
  // Identity" — POST /attempts (and any other authed write) 401s silently,
  // and their play counts never move.
  //
  // Exposed as a promise so app.js boot() can await it and update the nav UI
  // from "Sign In" to the user's friendly name — without this, the token is
  // recovered silently by the module init but "Sign In" stays visible until
  // the user explicitly clicks "Instant Identity" (reported 2026-07-22:
  // "login id not persistent after navigate to other pages/urls").
  const tier1Init = cfg.USE_MOCKS
    ? (function () {
        try {
          var t = localStorage.getItem("orbace_auth_token");
          var n = localStorage.getItem("orbace_player_name");
          if (t && n) {
            authToken = t;
            return Promise.resolve({ player_id: "mock-uuid-player", friendly_name: n, token: t });
          }
        } catch (_) {}
        return Promise.resolve(null);
      })()
    : (function () {
        var t = authToken;
        // Restore from localStorage on fresh page load (authToken is null
        // until a session is recovered or an identity is created).
        if (!t) {
          try { t = localStorage.getItem("orbace_auth_token"); } catch (_) {}
        }
        if (t) {
          authToken = t;
          return api("/player/me").then(function (profile) {
            return { player_id: profile.player_id || profile.sub, friendly_name: profile.display_name || profile.tier1_uuid, token: t, account_tier: profile.account_tier || 'tier1' };
          }).catch(function () {
            try { localStorage.removeItem("orbace_auth_token"); } catch (_) {}
            try { localStorage.removeItem("orbace_tier1_uuid"); } catch (_) {}
            try { localStorage.removeItem("orbace_player_name"); } catch (_) {}
            // Only clear the shared in-memory token if it's still the stale
            // one this check started with — tier1Init fires unconditionally
            // at module load, in parallel with (not after) restoreSession()/
            // finalizeSession(), which can already have installed a real
            // Supabase-session token by the time this rejects. Stomping it
            // to null unconditionally raced finalizeSession()'s own /player/me
            // call — landing between its `authToken = session.access_token`
            // and that call going out — stripping the Authorization header
            // from a call that should have been authenticated, and reporting
            // the whole restore as signed-out despite a valid Google session
            // (2026-07-27: root cause of "/play reverts to Sign in" while "/"
            // worked, since /play's heavier concurrent page load tips this
            // race the wrong way more often).
            if (authToken === t) authToken = null;
            return null;
          });
        }
        return Promise.resolve(null);
      })();

  return Object.assign(cfg.USE_MOCKS ? mock : real, { tier1Init });
})();

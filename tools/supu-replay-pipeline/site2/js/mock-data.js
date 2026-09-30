/* Orbace Sudoku Web v4 — mock fixtures.
 * Shapes intentionally mirror the response contracts in docs/INTEGRATION-GUIDE.md
 * (derived from PRD §3.4). Backend responses must satisfy these shapes.
 */
window.ORBACE_MOCKS = (function () {
  const GIVENS = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
  const SOLUTION = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

  // Derived replay: every empty cell in scan order, cycling technique tags.
  // NS/HS moves also carry e/p (explanationTemplateKey/params, round 3 of
  // validation feedback, 2026-07-18) so mock mode can exercise the Su-Pu
  // replay's per-move "why" caption end-to-end — real saves only ever get
  // e/p on NS/HS moves too (see solve-path.ts's tagMovesWithTechniques()
  // doc comment), so this mirrors production shape exactly.
  const TECH = ["NS", "HS", "NP", "LC", "HP"];
  const moves = [];
  for (let i = 0; i < 81; i++) {
    if (+GIVENS[i] === 0) {
      const t = TECH[moves.length % TECH.length];
      const v = +SOLUTION[i];
      const mv = { i, v, t };
      if (t === "NS") { mv.e = "naked_single"; mv.p = { value: String(v) }; }
      else if (t === "HS") { mv.e = "hidden_single"; mv.p = { value: String(v), unit: "row " + (Math.floor(i / 9) + 1) }; }
      moves.push(mv);
    }
  }

  return {
    // GET /puzzles/daily (Tea Moment — see Open Questions in integration guide)
    dailyPuzzle: {
      puzzle_id: "P-0896",
      tier: "精深",
      tier_index: 896,
      date: "2026-07-03",
      givens: GIVENS,
      solution: SOLUTION, // local modes only; NEVER sent for ORG puzzles
      checksum: "mock-checksum-0896"
    },

    // GET /org/status
    orgStatus: {
      today_event: {
        event_id: "ORG-2026-0703-DAILY",
        event_type: "daily",
        puzzle_tier: "精深",
        puzzle_index: 251,
        window_start: "2026-07-03T05:00:00Z", // 01:00 ET
        window_end: "2026-07-04T02:00:00Z",   // 22:00 ET
        total_submissions: 3847
      },
      player_status: { state: "no_account" }, // one of 9 ORG card states, PRD §1.3.3
      yesterday_winner: { display_name: "ZenSolver", country_code: "CN", account_tier: "tier2_registered" }
    },

    // GET /leaderboard/{period}/{date}
    leaderboards: {
      daily: { title: "🏆 Daily 名谱榜 · July 3, 2026", subtitle: "精深 #251 · 3,847 弈者", rankings: [
        { rank: 1, display_name: "ZenSolver",      marks: "🇨🇳 ⭐", rp: 500, time: "3:58", badge: "clean", supu_id: "SP-20260703-REAL01" },
        { rank: 2, display_name: "SharpLogic_502", marks: "🎭",     rp: 300, time: "4:15", badge: "clean" },
        { rank: 3, display_name: "SudokuMaster",   marks: "🇯🇵 ⭐", rp: 200, time: "4:22", badge: "clean" },
        { rank: 4, display_name: "CalmPuzzle_847", marks: "🎭",     rp: 150, time: "4:28", badge: "clean" },
        { rank: 5, display_name: "InkBrush",       marks: "🇰🇷 ⭐", rp: 120, time: "4:41", badge: "clean" },
        null,
        { rank: 42, display_name: "You", marks: "🇨🇳 ⭐", rp: 100, time: "4:32", badge: "1错", is_me: true, supu_id: "SP-20260703-REAL01" }
      ]},
      weekly: { title: "🏆 Weekly Cup 名谱榜 · Week 27, 2026", subtitle: "7 puzzles · 5,214 弈者", rankings: [
        { rank: 1, display_name: "SudokuMaster", marks: "🇯🇵 ⭐", rp: 2840, time: "—", badge: "clean" },
        { rank: 2, display_name: "ZenSolver",    marks: "🇨🇳 ⭐", rp: 2710, time: "—", badge: "clean" },
        { rank: 3, display_name: "InkBrush",     marks: "🇰🇷 ⭐", rp: 2445, time: "—", badge: "clean" },
        { rank: 4, display_name: "QuietGrid",    marks: "🇩🇪 ⭐", rp: 2200, time: "—", badge: "clean" },
        null,
        { rank: 38, display_name: "You", marks: "🇨🇳 ⭐", rp: 1050, time: "—", is_me: true }
      ]},
      monthly: { title: "🏆 Monthly 名谱榜 · June 2026", subtitle: "30 puzzles + Saturday tournaments · 8,911 弈者", rankings: [
        { rank: 1, display_name: "ZenSolver",    marks: "🇨🇳 ⭐", rp: 11200, time: "—", badge: "clean" },
        { rank: 2, display_name: "SudokuMaster", marks: "🇯🇵 ⭐", rp: 10850, time: "—", badge: "clean" },
        { rank: 3, display_name: "PaperCrane",   marks: "🇹🇼 ⭐", rp: 9400,  time: "—", badge: "clean" },
        null,
        { rank: 51, display_name: "You", marks: "🇨🇳 ⭐", rp: 4120, time: "—", is_me: true }
      ]},
      annual: { title: "🏆 Annual 名谱榜 · 2026", subtitle: "Year to date · 21,402 弈者", rankings: [
        { rank: 1, display_name: "SudokuMaster", marks: "🇯🇵 ⭐", rp: 64100, time: "—", badge: "clean" },
        { rank: 2, display_name: "ZenSolver",    marks: "🇨🇳 ⭐", rp: 61870, time: "—", badge: "clean" },
        { rank: 3, display_name: "InkBrush",     marks: "🇰🇷 ⭐", rp: 58200, time: "—", badge: "clean" },
        null,
        { rank: 104, display_name: "You", marks: "🇨🇳 ⭐", rp: 18930, time: "—", is_me: true }
      ]},
      alltime: { title: "🏆 All-Time 名谱榜", subtitle: "Since 2025 · 34,006 弈者", rankings: [
        { rank: 1, display_name: "SudokuMaster", marks: "🇯🇵 ⭐", rp: 204500, time: "—", badge: "clean" },
        { rank: 2, display_name: "PaperCrane",   marks: "🇹🇼 ⭐", rp: 198200, time: "—", badge: "clean" },
        { rank: 3, display_name: "ZenSolver",    marks: "🇨🇳 ⭐", rp: 192750, time: "—", badge: "clean" },
        null,
        { rank: 163, display_name: "You", marks: "🇨🇳 ⭐", rp: 44210, time: "—", is_me: true }
      ]}
    },

    // GET /supu/{id}
    supu: {
      supu_id: "supu-zen-0703",
      puzzle: { puzzle_id: "P-0247", tier: "精深", tier_index: 247, givens: GIVENS },
      meta: {
        score: 14400, official: true, clean: true,
        steps: moves.length, duration_seconds: 272, date: "2026-06-15",
        player: { display_name: "ZenSolver", country_code: "CN", account_tier: "tier2_registered", shared_publicly: true }
      },
      moves // [{i: cellIndex 0-80, v: value, t: technique tag}]
    },

    // GET /supu/library — public replay browser (only visibility=public rows)
    // type/techniques/watched added for the Su-Pu Library redesign (2026-08-06)
    // — real fields (solveContext, tagged-move techniques, viewCount), matching
    // the shape supu-discovery.service.ts now returns.
    supuLibrary: {
      items: [
        { supu_id: "SP-20260703-REAL01", puzzle_id: "P-0247", givens: GIVENS, tier: "精深", tier_index: 247, score: 14400, clean: true, official: true, type: "Puzzle Pack", techniques: ["x_wing"], watched: 1840, date: "2026-07-03", duration_seconds: 272, player: { display_name: "ZenSolver", country_code: "CN", account_tier: "tier2_registered" } },
        { supu_id: "SP-20260702-042318", puzzle_id: "P-0246", givens: GIVENS, tier: "贯通", tier_index: 246, score: 9800, clean: false, official: true, type: "Tea Moment", techniques: ["pointing_pair", "naked_pair"], watched: 962, date: "2026-07-02", duration_seconds: 431, player: { display_name: "TeaLeaf_77", country_code: "JP", account_tier: "tier2_registered" } },
        { supu_id: "SP-20260701-callme", puzzle_id: "P-0245", givens: GIVENS, tier: "入门", tier_index: 245, score: 5200, clean: true, official: false, type: "Practice", techniques: ["naked_single"], watched: 418, date: "2026-07-01", duration_seconds: 188, player: { display_name: "CalmPuzzle_847", country_code: null, account_tier: "tier1" } }
      ],
      total: 3, page: 1, limit: 20
    },

    // GET /supu/library/spotlight — Featured Su-Pu (1 curated + 2 algorithmic, v1 scope decision 2026-08-06)
    supuSpotlight: {
      editor: { supu_id: "SP-20260703-REAL01", puzzle_id: "P-0247", givens: GIVENS, tier: "精深", tier_index: 247, score: 14400, clean: true, official: true, type: "Puzzle Pack", techniques: ["x_wing"], watched: 1840, date: "2026-07-03", duration_seconds: 272, player: { display_name: "ZenSolver", country_code: "CN", account_tier: "tier2_registered" } },
      clean: { supu_id: "SP-20260701-callme", puzzle_id: "P-0245", givens: GIVENS, tier: "入门", tier_index: 245, score: 5200, clean: true, official: false, type: "Practice", techniques: ["naked_single"], watched: 418, date: "2026-07-01", duration_seconds: 188, player: { display_name: "CalmPuzzle_847", country_code: null, account_tier: "tier1" } },
      rare_technique: { supu_id: "SP-20260702-042318", puzzle_id: "P-0246", givens: GIVENS, tier: "贯通", tier_index: 246, score: 9800, clean: false, official: true, type: "Tea Moment", techniques: ["pointing_pair", "naked_pair"], watched: 962, date: "2026-07-02", duration_seconds: 431, player: { display_name: "TeaLeaf_77", country_code: "JP", account_tier: "tier2_registered" } },
      total_public: 3, total_clean: 2,
      tier_counts: { "入门": 1, "初成": 0, "贯通": 1, "精深": 1, "入神": 0 },
      technique_counts: { naked_single: 1, hidden_single: 0, naked_pair: 1, hidden_pair: 0, pointing_pair: 1, x_wing: 1 },
    },

    // GET /supu/mine — owner-scoped private collection (R0.7, 2026-07-24)
    mySupu: {
      items: [
        { supu_id: "SP-20260722-123456", puzzle_id: "P-0112", givens: GIVENS, tier: "精深", tier_index: 112, score: 12800, clean: true, official: false, type: "Puzzle Pack", techniques: ["hidden_pair"], watched: 6, date: "2026-07-22", duration_seconds: 315, visibility: "private", player: { display_name: "ZenSolver", country_code: "CN", account_tier: "tier2_registered" } },
        { supu_id: "SP-20260720-789012", puzzle_id: "P-0247", givens: GIVENS, tier: "贯通", tier_index: 247, score: 9600, clean: false, official: false, type: "Tea Moment", techniques: ["naked_pair"], watched: 3, date: "2026-07-20", duration_seconds: 402, visibility: "private", player: { display_name: "ZenSolver", country_code: "CN", account_tier: "tier2_registered" } },
        { supu_id: "SP-20260715-345678", puzzle_id: "P-0301", givens: GIVENS, tier: "入门", tier_index: 301, score: 4400, clean: true, official: false, type: "Practice", techniques: ["naked_single"], watched: 21, date: "2026-07-15", duration_seconds: 185, visibility: "public", player: { display_name: "ZenSolver", country_code: "CN", account_tier: "tier2_registered" } },
        { supu_id: "SP-20260710-901234", puzzle_id: "P-0402", givens: GIVENS, tier: "初成", tier_index: 402, score: 7200, clean: true, official: false, type: "Practice", techniques: ["hidden_single"], watched: 9, date: "2026-07-10", duration_seconds: 291, visibility: "private", player: { display_name: "ZenSolver", country_code: "CN", account_tier: "tier2_registered" } },
      ],
      total: 4, page: 1, limit: 20
    },

    // GET /player/{id}/profile
    profile: {
      player_id: "mock-player-uuid",
      display_name: "ZenSolver",
      country_code: "CN",
      account_tier: "tier2_registered",
      total_rp: 1250, total_orgs_completed: 14, best_daily_rank: 5, mingpu_count: 3,
      // R5: matches player-privacy.service.ts's default column values.
      privacy: { show_country_on_leaderboard: true, org_default: "public", practice_default: "private", share_as_anonymous: false }
    },

    // POST /org/{eventId}/submit response
    submitResult: {
      submission_id: "mock-submission-uuid",
      status: "accepted",
      completion_bonus: 50, speed_bonus_pending: true,
      total_rp: 50, provisional_rank: 847, total_submissions: 3848
    },

    // GET /featured — homepage managed content (hero replay + Tea Moment)
    featured: {
      hero_supu_id: "SP-20260703-REAL01",
      tea_moment_puzzle_id: "P-0912",
      tea_moment: {
        puzzle_id: "P-0912", tier: "通", tier_index: 912,
        date: "2026-07-09", givens: GIVENS, solution: SOLUTION
      }
    },

    // GET /puzzles/recent?limit=N — past dailies (Previous Tea Moments + fallback)
    recentPuzzles: [
      { puzzle_id: "P-0912", tier: "通", tier_index: 912, date: "2026-07-09", givens: GIVENS, solution: SOLUTION, checksum: "mock-0912" },
      { puzzle_id: "P-0911", tier: "深", tier_index: 911, date: "2026-07-08", givens: GIVENS, solution: SOLUTION, checksum: "mock-0911" },
      { puzzle_id: "P-0910", tier: "深", tier_index: 910, date: "2026-07-07", givens: GIVENS, solution: SOLUTION, checksum: "mock-0910" }
    ],

    // GET /puzzles/teamoment — 1,800 catalog (E2E item 26, 2026-07-13)
    teamomentPuzzles: {
      items: [
        // First item on purpose (2026-07-16): the Playground tab's fetch has
        // no `tier` filter, so this is the item `initPlay()`'s isPlayground
        // branch actually receives as `res.items[0]`. Its `tier: "medium"` is
        // the REAL backend's literal (non-id-form) self-reported value for
        // both discipline/Easy and insight/Medium puzzles — see the
        // TIER_ALIASES comment in orbace-game-card.js. This fixture exists
        // specifically so smoke.test.js can pin that the Playground card
        // label normalizes "medium" to a real word, not the raw string.
        //
        // `pack_id` (2026-07-17, holistic-review fix cycle): the mock
        // adapter's `tier` filter below matches on `pack_id || tier` rather
        // than `tier` alone, so this item is ALSO reachable via a
        // tier-chip-filtered Browse Puzzles query (tier=insight) — not just
        // the unfiltered Playground path. This mirrors the real backend: the
        // query param is the actual canonical pack the puzzle belongs to,
        // but the response's own `tier` field is still the mislabeled
        // literal "medium" string. Without `pack_id` here, the holistic
        // review found this fixture was reachable only via the unfiltered
        // path, so Browse Puzzles' identical tier-label bug (fixed in
        // loadPlayResults()/loadSpecificPuzzle() this same cycle) had no
        // regression coverage of its own.
        { puzzle_id: "tea_moments_999", tier: "medium", pack_id: "insight", tier_index: 999, givens: GIVENS, solution: SOLUTION, checksum: "mock-tm-0", completed_play_count: 1, shortest_time_seconds: null, shortest_time_timestamp: null, title: null, is_milestone: false, required_techniques: ["naked_single"] },
        // title is non-null here on purpose (2026-07-17, holistic-review fix
        // cycle): every other item in this fixture has title: null, which
        // exercises loadPlayResults()'s `p.title || p.puzzle_id` fallback —
        // this one exercises the non-null branch (the title must actually
        // render, not just the fallback).
        { puzzle_id: "tea_moments_180", tier: "foundation", tier_index: 540, givens: GIVENS, solution: SOLUTION, checksum: "mock-tm-1", completed_play_count: 12, shortest_time_seconds: 187, shortest_time_timestamp: "2026-07-10T14:23:00Z", title: "Quiet Morning Draw", is_milestone: true, required_techniques: ["naked_single"] },
        { puzzle_id: "tea_moments_179", tier: "discipline", tier_index: 359, givens: GIVENS, solution: SOLUTION, checksum: "mock-tm-2", completed_play_count: 5, shortest_time_seconds: 245, shortest_time_timestamp: "2026-07-11T09:15:00Z", title: null, is_milestone: false, required_techniques: ["x_wing"] },
        { puzzle_id: "tea_moments_178", tier: "insight", tier_index: 358, givens: GIVENS, solution: SOLUTION, checksum: "mock-tm-3", completed_play_count: 0, shortest_time_seconds: null, shortest_time_timestamp: null, title: null, is_milestone: false, required_techniques: ["naked_single"] }
      ],
      total: 1800, page: 1, limit: 4
    },

    // GET /tea-moment/today — today's assigned Tea Moment (item 31, 2026-07-13)
    teaMomentToday: {
      puzzle_id: "tea_moments_180", tier: "入门", tier_index: 540,
      givens: GIVENS, solution: SOLUTION, checksum: "mock-tm-today",
      completed_play_count: 8, shortest_time_seconds: 142, shortest_time_timestamp: "2026-07-12T08:15:00Z",
    },
    // GET /tea-moment/history — past assignments (item 30, 2026-07-13)
    teaMomentHistory: {
      items: [
        { date: "2026-07-12", assigned_by: "auto", puzzle_id: "tea_moments_179", tier: "入门", tier_index: 539, givens: GIVENS, solution: SOLUTION, completed_play_count: 5, tea_moment_play_count: 3, shortest_time_seconds: 245, shortest_time_timestamp: "2026-07-11T09:15:00Z", latest_play_timestamp: "2026-07-12T18:30:00Z" },
        { date: "2026-07-11", assigned_by: "admin", puzzle_id: "tea_moments_178", tier: "入门", tier_index: 538, givens: GIVENS, solution: SOLUTION, completed_play_count: 3, tea_moment_play_count: 1, shortest_time_seconds: 312, shortest_time_timestamp: "2026-07-10T11:40:00Z", latest_play_timestamp: "2026-07-11T09:12:00Z" },
        { date: "2026-07-10", assigned_by: "auto", puzzle_id: "tea_moments_177", tier: "初成", tier_index: 360, givens: GIVENS, solution: SOLUTION, completed_play_count: 0, tea_moment_play_count: 0, shortest_time_seconds: null, shortest_time_timestamp: null, latest_play_timestamp: null },
      ],
      total: 3, page: 1, limit: 20,
    },

    // GET /blog — blog redesign (2026-07-18): excerpt/cover_image_url added
    // to the list shape (docs/plans/2026-07-18-blog-redesign-design.md §3/§6).
    blogPosts: {
      items: [
        { slug: "chain-trigger-001", title: "Solving an Extreme Puzzle with Orbace Chain Elimination", excerpt: "This 神 Expert puzzle looked unsolvable with basic techniques alone — until a chain of eliminations cracked it open.", cover_image_url: "https://picsum.photos/seed/chain-trigger-001/800/450", published_at: "2026-07-15T00:00:00Z" },
      ],
      total: 1,
    },
    // GET /blog/:slug — gains excerpt/cover_image_url + a new `image` block
    // type (alongside the existing heading/paragraph/puzzle_embed), so mock
    // mode can exercise the extended renderBlockHtml() end-to-end.
    blogPostDetail: {
      "chain-trigger-001": {
        slug: "chain-trigger-001",
        title: "Solving an Extreme Puzzle with Orbace Chain Elimination",
        excerpt: "This 神 Expert puzzle looked unsolvable with basic techniques alone — until a chain of eliminations cracked it open.",
        cover_image_url: "https://picsum.photos/seed/chain-trigger-001/800/450",
        blocks: [
          { type: "heading", text: "The setup" },
          { type: "paragraph", text: "This 神 Expert puzzle looked unsolvable with basic techniques alone..." },
          { type: "image", url: "https://picsum.photos/seed/chain-trigger-001-mid/800/450", alt: "The board midway through the solve, several cells still blank", caption: "Midway through — three chains converging on r5c5" },
          { type: "puzzle_embed", puzzleId: "extreme_001", caption: "The board at the critical moment" },
          // Second embed in the same post — regression guard for the Task 13
          // review fix: OrbaceSupuReplay.mount() must not share state across
          // simultaneous instances the way the Task 12 practiceGrid singleton
          // did (see smoke.test.js SMOKE-08e multi-embed check).
          { type: "puzzle_embed", puzzleId: "extreme_002", caption: "A second board, later in the same post" },
          // Full step-by-step replay embed (2026-07-18 follow-up) — getSupu()
          // mock always resolves M.supu regardless of id, so any id works
          // here; real solve path (51 moves, cycling NS/HS/NP/LC/HP tags).
          { type: "supu_replay", supuId: "supu-zen-0703", caption: "The full solve, move by move" },
        ],
        published_at: "2026-07-15T00:00:00Z",
      },
    },
    // GET /techniques/:technique/puzzles
    techniquePuzzles: {
      naked_single: [{ external_id: "foundation_001", sort_index: 0, title: "Foundation 01", seal: "門", difficulty: "beginner", required_techniques: ["naked_single"], ranked_eligible: true, is_milestone: false }],
    },

    // Ranking Games (Phase 4, 2026-07-18) — GET /org/status's ranking_events[]
    // shape. Three fixtures, one per game_type, all mid-window so the "Play"
    // CTA is active in mock mode by default (see app.js's window_opens_at/
    // window_closes_at gating).
    // competition_type mirrors the real GET /org/status field (Team Web
    // M2, org.routes.ts) -- drives the lobby's /official/:eventId routing
    // in mock mode exactly like a real deploy. null = legacy/non-V8 event.
    // Only Weekly defaults to V8 here (matching M1's existing default and
    // keeping the large pre-existing RGK-* deep-engine test suite, which
    // exercises notes/hints/timer/submit/replay through the INLINE path,
    // unaffected by this change) -- Daily/Grand's OWN V8 routing is instead
    // exercised by smoke.test.js's WC-6/WC-7, which patch competition_type
    // onto these fixtures for that specific scenario only, the same
    // established pattern WC-8 already uses for the legacy-fallback case.
    rankingEvents: [
      { event_id: "evt-mock-daily", game_type: "daily", puzzle_ids: ["discipline_014"], puzzle_count: 1, bonus_pool_computed: false, window_opens_at: "2026-07-18T05:00:00Z", window_closes_at: "2026-07-19T02:00:00Z", results_at: "2026-07-19T03:00:00Z", submission_count: 128, status: "live", competition_type: null },
      { event_id: "evt-mock-weekly", game_type: "weekly", puzzle_ids: ["insight_027", "mastery_009"], puzzle_count: 2, bonus_pool_computed: false, window_opens_at: "2026-07-18T05:00:00Z", window_closes_at: "2026-07-19T02:00:00Z", results_at: "2026-07-19T03:00:00Z", submission_count: 64, status: "live", competition_type: "WEEKLY" },
      { event_id: "evt-mock-tournament", game_type: "tournament", puzzle_ids: ["extreme_031"], puzzle_count: 1, bonus_pool_computed: false, window_opens_at: "2026-07-18T05:00:00Z", window_closes_at: "2026-07-18T23:00:00Z", results_at: "2026-07-19T03:00:00Z", submission_count: 31, status: "live", competition_type: null },
    ],
    // GET /org/status's next_ranking_event — only meaningful when no event of
    // that type is live; kept here so the "no active events" gating state has
    // something to show ("next: tournament, opens ...").
    rankingNextEvent: { type: "tournament", window_opens_at: "2026-08-15T05:00:00Z" },

    // GET /compete/overview?event_id=... — one fixture per V8 mock event,
    // keyed by event_id (Team Web M2: Daily and Grand joined Weekly's M1
    // fixture, each in that type's real wire shape -- see
    // js/compete-competition.js's file header for why Weekly stays flat
    // while Daily/Grand nest under daily:{...}/grand:{...}). CUP_OPEN/
    // DAILY_OPEN/GRAND_OPEN by default; smoke.test.js's WC-* checks
    // override individual fields per fixture to exercise other
    // presentation_state/identity/rp_settlement_state combinations.
    competeOverviewByEvent: {
      "evt-mock-weekly": {
        competition_type: "WEEKLY",
        identity: "INSTANT",
        event_state: "OPEN",
        attempt_state: "CREATED",
        result_finality: null,
        rp_settlement_state: null,
        competition_score: null,
        rp_provisional: null,
        rp_final: null,
        claimable_at: null,
        rp_claim_expires_at: null,
        attempt_started_at: null,
        attempt_expires_at: null,
        resumable_until: null,
        event_entry_cutoff: "2026-07-19T02:00:00Z",
        server_now: "2026-07-18T12:00:00Z",
        capabilities: { can_start: true, can_submit: false, can_view_supu: false, can_compare_supu: false },
        reason_codes: { start: null, submit: "ATTEMPT_TIMEOUT", compare_supu: "SUPU_LOCKED_NOT_FINAL" },
        presentation_state: "CUP_OPEN",
      },
      "evt-mock-daily": {
        competition_type: "DAILY",
        server_time: "2026-07-18T12:00:00Z",
        identity: "INSTANT",
        daily: {
          event_id: "evt-mock-daily",
          event_type: "daily",
          date: "2026-07-18",
          day: "SATURDAY",
          difficulty: "Hard",
          lifecycle_state: "OPEN",
          entry_availability: "OPEN",
          entry_cutoff: "2026-07-19T02:00:00Z",
          attempt: { state: null, attempt_id: null, attempt_started_at: null, attempt_expires_at: null, resumable_until: null },
          result: { state: null, result_class: null, score: 0, errors: 0, is_final: false, daily_series_eligible: false, rank: null },
        },
        series: { series_id: null, week: "2026-W29", week_start: "2026-07-13T00:00:00Z", lifecycle_state: null, eligible_result_count: 0, counting_results: [], non_counting_results: [], ineligible_results: [], best_three_score: 0, results_played: 0, daily_results_attempted: 0, current_result_is_counting: false, current_result_ordinal: null, series_complete: false, is_final: false, revision: 1, rank: null, qualification_submitted_at: null },
        capabilities: { can_start: true, can_resume: false, can_submit: false },
        reason_codes: { start: null, submit: "ATTEMPT_TIMEOUT" },
        presentation_state: "DAILY_OPEN",
      },
      "evt-mock-tournament": {
        competition_type: "GRAND",
        server_time: "2026-07-18T12:00:00Z",
        identity: "VERIFIED",
        grand: {
          event_id: "evt-mock-tournament",
          event_type: "grand",
          month: "2026-07",
          lifecycle_state: "OPEN",
          entry_availability: "OPEN",
          entry_cutoff: "2026-07-18T23:00:00Z",
          attempt: { state: null, attempt_id: null, attempt_started_at: null, attempt_expires_at: null, resumable_until: null },
          result: { state: null, result_class: null, score: 0, rp_provisional: 0, rp_final: 0, rp_settlement_state: null, is_final: false, grand_circuit_eligible: false, season_eligible: false, rank: null },
          entitlement: { snapshot_id: "mock-entitlement", type: "standard", scope: "monthly", active: true },
        },
        season: { season_id: "2026", lifecycle_state: null, total_season_rp: 0, counting_result_ids: [], non_counting_result_ids: [], excluded_grand_result_ids: [], displaced_result_ids: [], counting_grand_id: null, grand_results_counted: 0, weekly_results_counted: 0, rank: null, is_final: false, revision: 1 },
        circuit: { circuit_id: "2026", lifecycle_state: null, eligible_grand_result_ids: [], total_grand_rp: 0, total_competition_score: 0, grand_events_played: 0, wins: 0, podiums: 0, best_placement: null, rank: null, is_final: false, revision: 1 },
        capabilities: { requires_verification: false, requires_entitlement: false, can_start: true, can_resume: false, can_submit: false },
        reason_codes: { start: null, submit: "ATTEMPT_TIMEOUT" },
        presentation_state: "GRAND_OPEN",
      },
    },

    // POST /ranking/evt-mock-weekly/submit's V8-only fields (js/api.js's
    // submitRanking mock merges these onto rankingSubmitResult only for the
    // mock Weekly Cup event id, the only mock event this suite currently
    // drives through a full V8 submit cycle) -- mirrors ranking.routes.ts's
    // `v8Weekly ? {...} : {}` spread on the real submit response.
    competeSubmitV8ByEvent: {
      "evt-mock-weekly": {
        event_state: "OPEN",
        attempt_state: "VALIDATED",
        result_finality: "PROVISIONAL",
        competition_score: 600,
        rp_provisional: 56,
        rp_settlement_state: "PENDING_FINAL",
        server_now: "2026-07-18T12:05:00Z",
      },
    },

    // GET /ranking/leaderboard?game_type=X — one per game type. `is_clean`
    // drives the "净谱" badge, matching the existing #page-ranking convention.
    rankingLeaderboards: {
      daily: {
        entries: [
          { rank: 1, player_name: "ZenSolver", time_seconds: 238, base_points: 100, bonus_points: 400, total_points: 500, is_clean: true },
          { rank: 2, player_name: "SharpLogic_502", time_seconds: 255, base_points: 100, bonus_points: 200, total_points: 300, is_clean: true },
          { rank: 3, player_name: "You", time_seconds: 301, base_points: 50, bonus_points: 0, total_points: 50, is_clean: false },
        ],
        event_id: "evt-mock-daily", game_type: "daily", date: "2026-07-18", total: 3, finalized: false,
      },
      weekly: {
        entries: [
          { rank: 1, player_name: "SudokuMaster", time_seconds: 601, base_points: 1200, bonus_points: 2400, total_points: 3600, is_clean: true },
        ],
        event_id: "evt-mock-weekly", game_type: "weekly", date: "2026-07-18", total: 1, finalized: false,
      },
      tournament: {
        entries: [
          { rank: 1, player_name: "InkBrush", time_seconds: 892, base_points: 100, bonus_points: 400, total_points: 500, is_clean: true },
        ],
        event_id: "evt-mock-tournament", game_type: "tournament", date: "2026-07-18", total: 1, finalized: false,
      },
      // Monthly/Annual/All-Time (Global Ranking consolidation, 2026-07-22) —
      // period-aggregate views, already normalized to the same {entries:[...]}
      // shape as daily/weekly/tournament above (no per-entry time_seconds —
      // these are RP totals across many puzzles, not a single timed attempt).
      monthly: {
        entries: [
          { rank: 1, player_name: "TestPlayer_1234", time_seconds: null, base_points: 0, bonus_points: 0, total_points: 400, is_clean: false },
          { rank: 2, player_name: "JustinZero", time_seconds: null, base_points: 0, bonus_points: 0, total_points: 20, is_clean: false },
        ],
      },
      annual: {
        entries: [
          { rank: 1, player_name: "TestSolver", time_seconds: null, base_points: 0, bonus_points: 0, total_points: 4200, is_clean: false },
          { rank: 2, player_name: "SpeedKing", time_seconds: null, base_points: 0, bonus_points: 0, total_points: 3720, is_clean: false },
        ],
      },
      alltime: {
        entries: [
          { rank: 1, player_name: "TestSolver", time_seconds: null, base_points: 0, bonus_points: 0, total_points: 4200, is_clean: false },
          { rank: 2, player_name: "SpeedKing", time_seconds: null, base_points: 0, bonus_points: 0, total_points: 3720, is_clean: false },
        ],
      },
    },

    // GET /ranking/player-stats
    rankingPlayerStats: {
      total_rp: 1250, total_ranking_points: 850, total_games_played: 5, best_rank: 3, best_points: 500,
      daily: { played: 3, points: 250, best_rank: 3 },
      weekly: { played: 1, points: 600, best_rank: 1 },
      tournament: { played: 1, points: 0, best_rank: 0, won: 0 },
    },

    // POST /ranking/:eventId/submit response
    rankingSubmitResult: {
      status: "submitted", submission_id: "mock-ranking-submission-uuid",
      time_seconds: 301, base_points: 50, bonus_pool_eligible: false,
      bonus_points: null, provisional_rank: 3,
      replay_id: "mock-replay-uuid", replay_share_hash: "mock-share-hash",
    },

    // GET /replays/:id response — auto-published Su-Pu replay for a ranking
    // submission (2026-07-22).
    myReplay: {
      id: "mock-replay-uuid", visibility: "private", favorite: false,
      title: "Daily Ranking — 2026-07-22", notes: null, official: false,
      created_at: "2026-07-22T12:05:00Z",
      attempt: {
        puzzle_id: "discipline_245", puzzle_source: "org",
        givens: "090703100002000060360000090208034010710000000430617058020048970070106005000070001",
        elapsed_seconds: 301, error_count: 0, clean_solve: true, score: null,
        player_display_name: "You",
      },
      moves: [], // Was pre-seeded with 2 fake moves (P3.5, bugfix plan) — real moves come from the controller's getLog() now.
    },

    // GET /player/me/submissions — ranking event history for the signed-in player
    mySubmissions: {
      items: [
        { id: "sub-daily-001", status: "accepted", event_id: "evt-mock-daily", event_type: "daily", date: "2026-07-18", tier: "discipline", tier_index: 14, time_seconds: 301, base_points: 50, bonus_points: 0, total_points: 50, rank: 3, clean: false, replay_id: "mock-replay-uuid", appeal: null },
        { id: "sub-daily-002", status: "accepted", event_id: "evt-mock-daily2", event_type: "daily", date: "2026-07-17", tier: "insight", tier_index: 27, time_seconds: 245, base_points: 100, bonus_points: 200, total_points: 300, rank: 2, clean: true, replay_id: "mock-replay-daily2", appeal: null },
        { id: "sub-weekly-001", status: "accepted", event_id: "evt-mock-weekly", event_type: "weekly", date: "2026-07-18", tier: "mastery", tier_index: 9, time_seconds: 601, base_points: 1200, bonus_points: 2400, total_points: 3600, rank: 1, clean: true, replay_id: "mock-replay-weekly1", appeal: null },
        { id: "sub-tourney-001", status: "accepted", event_id: "evt-mock-tournament", event_type: "tournament", date: "2026-07-11", tier: "extreme", tier_index: 31, time_seconds: 892, base_points: 100, bonus_points: 400, total_points: 500, rank: 4, clean: false, replay_id: null, appeal: null },
        // Phase 6 (ADR-005) — a rejected submission with no appeal yet, to
        // exercise the Appeal action in the mock adapter.
        { id: "sub-rejected-001", status: "rejected", event_id: "evt-mock-rejected", event_type: "daily", date: "2026-07-19", tier: "insight", tier_index: 12, time_seconds: 210, base_points: 0, bonus_points: 0, total_points: 0, rank: null, clean: false, replay_id: null, appeal: null },
      ],
      total: 5,
    },
  };
})();

/* Orbace Sudoku Web v4 — environment config
 * Dev team: replace values per environment. With USE_MOCKS=true the app runs
 * fully offline against js/mock-data.js — no backend required.
 */
window.ORBACE_CONFIG = {
  USE_MOCKS: false,            // false = real HTTP adapters in js/api.js
  MOCK_LATENCY_MS: 250,       // simulated network latency
  MOCK_FAIL: null,            // set to an API method name (e.g. "getLeaderboard") to force that call to reject — for testing error states

  // Fly.io Fastify — serves all API routes (auth, leaderboard, supu, org, player)
  API_BASE_URL: "https://justinzero.fly.dev",
  // ORG submit goes to the same Fly.io instance (always-warm, latency-sensitive)
  ORG_API_URL: "https://justinzero.fly.dev",

  // Supabase Auth (social + email) — used by real auth adapter
  SUPABASE_URL: "https://qzyfzpzncdmmqvcvgrmq.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_CaTVegqvquZJgoA05PZO0g_cFI-_6zr",

  // Google OAuth Client ID for GIS (Google Identity Services) popup sign-in.
  // Managed by Supabase as the default Google provider credential. The web app
  // uses GIS + supabase.auth.signInWithIdToken() to bypass Supabase Auth's
  // Site URL restriction (set to com.orbace.mobile:// for mobile deep links).
  // Must match the client_id in Google Cloud Console for JS origin validation.
  GOOGLE_CLIENT_ID: "751815823830-vrpn12t112r7pr3ouk2mj59msjolmb1m.apps.googleusercontent.com",

  CLIENT_VERSION: "web-2.0.0-proto4",
  PLATFORM: "web",

  // RANKING_RESULTS_WIRE_V1 (GET /rankings/seasons, /rankings/seasons/:id/
  // standings, /me/results, /me/results/:id) was Stage-1 preview-verified
  // 2026-08-09 (justinzero-preview) and deployed to production (API_BASE_URL
  // above) by Team D on 2026-08-10 (Stage-2, image
  // deployment-01KZNZS4PP3Y9GYAV4GVSGK85D, verified live: /rankings/seasons
  // 200, standings 200, /me/results 401 AUTH_REQUIRED, legacy /season/standing
  // unchanged). Web + Mobile golden-vector equivalence both signed off
  // (RANKING_RESULTS_ACCEPTANCE_V1, 82/82 web + 45 mobile checks). Keep this
  // true; flipping it off would point js/page-rankings.js's Global Ranking /
  // My Results views back to the pre-Wire events-only view.
  RANKING_RESULTS_WIRE_V1_ENABLED: true,

  // solve-event-capture-v5 branch-scoped trial pencil notes (2026-09-29
  // plan, docs/plans/2026-09-29-supu-capture-trial-notes-v5-web-
  // implementation-plan.md). Default OFF per the plan's release gate: the
  // backend v5 write path exists in source (capture-envelope.ts's
  // V5StatePass) but its write gate is off, and the cross-runtime parity
  // gate against Reddit's projector + Team A's golden fixtures has not
  // closed. Read once by orbace-grid-lab.js at mount (js/orbace-grid-lab.js
  // — see the v5Mode declaration) to decide, for that whole session,
  // whether Pencil taps route to the branch-scoped trial-note overlay
  // instead of the real committed notes while a Trial branch is open, and
  // whether the saved envelope declares move_history_schema_version
  // solve-event-capture-v5. Do NOT flip true in a production build until
  // Phase 5 of that plan (cross-runtime parity + release gate) closes.
  SUPU_CAPTURE_V5_TRIAL_NOTES_ENABLED: false,

  // In Progress Competition Results CX (docs/shared_artifacts/Orbace — In
  // Progress Competition Results CX Specification.md), 2026-08-17. Gates
  // js/page-rankings.js's "In Progress | Final Results" toggle inside the
  // Event Results view. `GET /ranking/live` (COMPETITION_IN_PROGRESS_V1,
  // docs/shared_artifacts/Team-Web-Mobile-Contract-Request-2026-08-17-In-
  // Progress-Competition-Results.md) implemented + deployed
  // (`RC_team_backend_ranking-live-in-progress-results_2026-08-17.md`) —
  // flipped true 2026-08-17 for end-to-end QA. If this ever needs to go
  // back to inert, set false; js/api.js's mock getLiveParticipants() still
  // serves a realistic offline roster when USE_MOCKS is also true for
  // local dev.
  IN_PROGRESS_RESULTS_ENABLED: true,

  // ADR-010 abuse controls (Phase 0.5, 2026-07-25) — Cloudflare Turnstile
  // site key (public by design, same category as GOOGLE_CLIENT_ID above).
  // Widget shared with blinkingchorus.com; orbacesudoku.com added to its
  // domain list 2026-07-26. Backend's TURNSTILE_SECRET_KEY is set as a Fly
  // secret on org-api — never goes in this file.
  TURNSTILE_SITE_KEY: "0x4AAAAAADFIlcuUnnXlwCqt",

  // ---- V1 marketing homepage (Phase 1+) ----
  // Locale is English-first for v1. The homepage is built i18n-ready (all copy
  // via window.t() / data-i18n); adding "zh" is a data change in js/i18n.js.
  LOCALE: "en",

  // Ad slot is architected in. Post-launch: flipped ON 2026-07-10. Consent for
  // EU/UK/CH is gated by the Consent Mode v2 defaults in index.html <head>,
  // same mechanism GA4 uses — no separate app-level gating needed. Single
  // manual AdSense unit (Auto Ads must stay OFF in the AdSense dashboard).
  ADS: {
    ENABLED: true,
    CLIENT: "ca-pub-7497527413129091",
    SLOT_ID: "6402239893"
  },

  // GA4 measurement (wired with Consent Mode v2 in Phase 1.5). ID provisioned
  // 2026-07-10 (PM checklist #1). Do NOT load gtag before consent for EU.
  ANALYTICS: {
    GA4_ID: "G-0RWLZBGC6Y",
    UTM_OVERRIDE: null
  },

  // Orbace Promo Code capability (Front End Sprint 1, 2026-08-17). These
  // hide ENTRY POINTS only — the backend campaign/code state is the real
  // authorization (docs/shared_artifacts/orbace_promo_code_frontend_cx_
  // ui_ux_implementation_plan.md §20). Both prerequisites are now met: the
  // backend RC is live (v113) and a real, redeemable QA campaign/code can
  // be seeded via POST /admin/promo/campaigns (admin-cli.ts's
  // create-promo-campaign, 2026-08-17) — flipped ENTRY_WEB true for
  // end-to-end QA. FOUNDERS_CAMPAIGN_VISIBILITY/REMAINING_COUNT_VISIBILITY
  // are declared but currently read by no code anywhere in this codebase
  // (grepped app.js/page-compete.js/promo.js/page-redeem.js) — flipping
  // them is a no-op today; left true here only so a future implementation
  // doesn't silently inherit a stale "off" default. /redeem itself still
  // works when linked to directly even with ENTRY_WEB off; that flag only
  // gates the discovery links (account tab, compete hub).
  PROMO: {
    ENTRY_WEB: true,
    FOUNDERS_CAMPAIGN_VISIBILITY: true,
    REMAINING_COUNT_VISIBILITY: true
  },

  // Web Capture Parity, Step 4 (2026-09-04) — independently reversible from
  // backend deploy, per docs/plans/2026-09-04-web-capture-parity-execution-
  // plan-v3.md §5/Step 6. Backend acceptance of a versioned moveHistory
  // envelope is already additive/safe and can be live regardless of this
  // flag; this flag controls ONLY whether the web client ever actually
  // SENDS the versioned shape instead of the legacy {i,v,t} one. No prior
  // feature-flag system existed on this frontend (unlike the backend's own
  // feature-flags.ts) — this is the first, deliberately minimal: a master
  // switch plus a 0-100 rollout percentage, bucketed per-browser via
  // js/capture-emission.js's stable localStorage-persisted random bucket
  // (so one visitor doesn't flicker in and out across page loads).
  //
  // Step 6 ramp (2026-09-05): first real activation, 1% — conservative
  // opening percentage for a code path that has never carried real user
  // traffic before. A failure here is safe by design (invalid/degraded
  // capture falls back to the legacy shape, per
  // docs/architecture/2026-09-04-extension-failure-policy.md), but 1% still
  // bounds the blast radius of anything the test suite didn't catch to a
  // small slice of real saves while it's watched. Raise ROLLOUT_PERCENT in
  // a later, separately-decided step once this percentage is observed clean.
  CAPTURE_EMISSION: {
    ENABLED: true,
    ROLLOUT_PERCENT: 1
  }
};

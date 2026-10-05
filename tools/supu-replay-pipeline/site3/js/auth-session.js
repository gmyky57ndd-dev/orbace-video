/* Orbace Sudoku — AuthSession state machine (Phase 1, 2026-07-22).
 *
 * One session authority for the SPA and all static-page surfaces.
 * States: unknown → restoring → signedOut | instant | registered → error
 * Phase 3 (ADR-009) adds: conflict — a bearer credential and a session
 * cookie resolved to two different players (GET /auth/session reports this
 * instead of silently preferring one). No caller sets this yet — the
 * frontend doesn't call GET /auth/session until Phase 4 wires the merge
 * flow — but isAuthenticated()/canEnterRanked() in app.js already exclude it
 * by construction (positive allowlists, not a `!== 'signedIn'` denylist).
 *
 * Depends on: OrbaceAPI (js/api.js). Loaded after api.js, before
 * auth-utility.js and app.js.
 *
 * Integrates the previously separate Supabase session restore + Tier-1
 * auto-registration + static-auth.js localStorage recovery into one
 * observable state machine with BroadcastChannel multi-tab sync.
 */
window.OrbaceAuthSession = (function () {
  var state = 'unknown';        // string: unknown|restoring|signedOut|instant|registered|error
  var player = { id: null, displayName: null, totalRp: 0, accountTier: null };
  var listeners = [];
  var bc = null;
  var restorePromise = null;
  // Monotonic generation counter — restore() is a passive/background
  // validator that can take a while (Supabase restore, then a Tier-1
  // check), while createInstantIdentity()/signIn()/etc. are explicit,
  // user-triggered actions that must always win if both are in flight at
  // once. Found 2026-09-07: restore()'s own Tier-1 step (`OrbaceAPI.
  // tier1Init`, api.js's own auto-registration on first load) and an
  // explicit createInstantIdentity() call from an "Instant Identity"
  // click can both independently call POST /auth/uuid/register at once —
  // if tier1Init's copy trips ADR-010's captcha_required gate (it has no
  // Turnstile retry of its own, unlike createInstantIdentity()), it
  // rejects and restore() falls through to setState('signedOut'), which —
  // if it resolves AFTER createInstantIdentity()'s own retried call
  // already succeeded — silently clobbered the just-created signed-in
  // state back to signed-out for the rest of that page's lifetime (self-
  // corrected only on the next full reload, since a fresh restore() then
  // finds the now-persisted token with nothing else racing it). Every
  // setState() call bumps this; restore() captures it before starting its
  // own async work and skips its own setState() once a newer one has
  // already landed, rather than overwriting it.
  var generation = 0;

  function getSession() {
    return { status: state, player: player };
  }

  function setState(newState, data) {
    generation++;
    state = newState;
    if (data) {
      // `undefined`/omitted means "not provided, keep the previous value";
      // an explicit `null` means "clear it". `||` used to conflate the two,
      // so signOut()'s `{id: null, displayName: null, accountTier: null}`
      // silently fell back to the stale previous player's values instead of
      // clearing them (only totalRp actually reset, since 0 passes the
      // typeof check below rather than an `||`) — any reader of
      // getSession().player that doesn't check status first (e.g.
      // page-redeem.js) could see a signed-out session still carrying the
      // last signed-in player's identity. Found 2026-09-05.
      player = {
        id: data.id !== undefined ? data.id : player.id,
        displayName: data.displayName !== undefined ? data.displayName : player.displayName,
        totalRp: typeof data.totalRp === 'number' ? data.totalRp : player.totalRp,
        accountTier: data.accountTier !== undefined ? data.accountTier : player.accountTier,
      };
    }
    // P6.2: identity-safe analytics — no PII (no name, id, email).
    try { if (window.trackEvent) window.trackEvent('auth_state', { state: newState }); } catch (e) {}
    notify();
  }

  var _sending = false;

  function notify() {
    var session = getSession();
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](session); } catch (e) { /* swallow */ }
    }
    try {
      if (bc && !_sending) {
        _sending = true;
        bc.postMessage({ type: 'session_change', state: state, player: player });
      }
    } catch (e) { /* BroadcastChannel may be unavailable */ }
    _sending = false;
  }

  // Set by bootstrap() alongside state='restoring' so the no-OrbaceAPI
  // early-return in restore() (static pages) knows which tier to render —
  // see the bug fix note below.
  var bootstrapTier = 'instant';

  // Synchronous check at module init — reads localStorage so the initial
  // render can start in 'restoring' instead of flashing 'signedOut'.
  // Returns true when a saved session hint exists (needs async validation).
  function bootstrap() {
    try {
      var t = localStorage.getItem('orbace_auth_token');
      var n = localStorage.getItem('orbace_player_name');
      if (t && n) {
        state = 'restoring';
        player = { id: null, displayName: n, totalRp: 0, accountTier: null };
        bootstrapTier = 'instant';
        return true;
      }
      // Bug fix (2026-07-26, UAT report): Google sign-in removes
      // orbace_auth_token once the upgrade succeeds — the real session
      // lives entirely in Supabase's own sb-* localStorage keys, not this
      // tier1 pair. The check above alone can never recognize a signed-in
      // Google user, which is exactly the reported symptom on static pages
      // that never load api.js (compete/learn-sudoku/su-pu/download/
      // puzzle-packs — see restore()'s own "typeof OrbaceAPI === undefined"
      // comment): the token stays completely untouched in storage, but the
      // header still rendered "Sign in" because this function had no way
      // to recognize it. These pages structurally cannot validate a
      // session (no api.js), so — matching the exact same "trust the
      // cache, don't verify" risk tolerance the tier1 branch above already
      // accepts — treat any sb-*/supabase.* key plus a cached display name
      // as good enough evidence to render as signed in.
      if (n) {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && (k.indexOf('sb-') === 0 || k.indexOf('supabase.') === 0)) {
            state = 'restoring';
            player = { id: null, displayName: n, totalRp: 0, accountTier: null };
            bootstrapTier = 'registered';
            return true;
          }
        }
      }
    } catch (e) {}
    state = 'signedOut';
    return false;
  }

  // Async validation: Supabase session → Tier-1 → signedOut.
  // Called once at boot; subsequent calls are no-ops.
  function restore() {
    if (restorePromise) return restorePromise;
    var myGeneration = generation;
    restorePromise = (async function () {
      // Static pages (/about, /compete, /learn-sudoku, ...) never load
      // api.js, so OrbaceAPI doesn't exist here — there's no way to reach
      // the backend for real session validation on these pages. Trust the
      // locally bootstrapped cache instead of falling through steps 1-3
      // below (which would throw on every OrbaceAPI reference, always
      // landing on signedOut regardless of the real session).
      if (typeof OrbaceAPI === 'undefined') {
        // bootstrapTier distinguishes a tier1 cache hit from a tier2/Google
        // one (see bootstrap()'s bug-fix comment) — render the right icon
        // instead of always assuming a guest.
        if (state === 'restoring' && generation === myGeneration) setState(bootstrapTier, player);
        return getSession();
      }

      // 1. Try Supabase session restore (Google/email sign-in)
      try {
        var profile = await OrbaceAPI.auth.restoreSession();
        if (profile) {
          // A more authoritative action (explicit sign-in, Instant
          // Identity, sign-out) already landed while this awaited —
          // don't clobber it with a stale result (see `generation`'s
          // header comment).
          if (generation !== myGeneration) return getSession();
          setState('registered', {
            id: profile.player_id,
            displayName: profile.display_name,
            totalRp: profile.total_rp || 0,
            accountTier: 'tier2',
          });
          try { if (window.trackEvent) window.trackEvent('auth_restore', { result: 'registered' }); } catch (e) {}
          return getSession();
        }
      } catch (e) {
        try { if (window.trackEvent) window.trackEvent('auth_restore', { result: 'supabase_failed' }); } catch (e2) {}
      }

      // 2. Reverted 2026-07-26: this step used to wipe sb-*/supabase.*
      //    localStorage keys and force signedOut whenever step 1 came back
      //    empty, on the theory that an empty restoreSession() meant the
      //    session had genuinely expired. Two rounds of trying to make
      //    step 1 more resilient (retrying the refresh) didn't fix the
      //    real problem and one of them made it actively worse (confirmed
      //    by the user: every page started losing the session, not just
      //    some) — because forcing our own refresh outside the SDK's own
      //    managed cycle risked consuming the one-time-use refresh token
      //    without reliably persisting its replacement.
      //
      //    The actual fix is here, not in api.js: stop being destructive
      //    on a mere empty result. A step-1 failure might be a genuine
      //    expiry, or might be a transient blip (network hiccup, a normal
      //    part of this site's full-page-reload-per-nav-click
      //    architecture racing the SDK's own internal refresh) — we can't
      //    reliably tell which from here, so don't gamble on "probably
      //    expired" by deleting the evidence. Falling through to step 3
      //    below without touching storage means: if the session is
      //    genuinely still valid, a LATER restore() call (next page load)
      //    gets another honest chance to recover it via the SDK's own
      //    logic; if it's genuinely expired, the user just sees signed-out
      //    UI without us having made anything irreversible worse.

      // 3. Try Tier-1 (anonymous device-bound identity)
      try {
        var result = await OrbaceAPI.tier1Init;
        if (result) {
          if (generation !== myGeneration) return getSession();
          // Use result.account_tier from /player/me if available (a previously
          // upgraded user hitting this path via a stale Tier-1 token should
          // still render as registered, not silently downgrade to guest).
          var tier = result.account_tier === 'tier2' ? 'registered' : 'instant';
          setState(tier, {
            id: result.player_id,
            displayName: result.friendly_name,
            totalRp: 0,
            accountTier: result.account_tier || 'tier1',
          });
          try { if (window.trackEvent) window.trackEvent('auth_restore', { result: 'instant' }); } catch (e) {}
          return getSession();
        }
      } catch (e) {
        try { if (window.trackEvent) window.trackEvent('auth_restore', { result: 'tier1_failed' }); } catch (e2) {}
      }

      if (generation === myGeneration) {
        setState('signedOut');
        try { if (window.trackEvent) window.trackEvent('auth_restore', { result: 'signed_out' }); } catch (e) {}
      }
      return getSession();
    })();
    return restorePromise;
  }

  // Sign-in: wraps OrbaceAPI.auth.signInProvider and transitions.
  async function signIn(provider) {
    try {
      try { if (window.trackEvent) window.trackEvent('auth_signin', { provider: provider || 'unknown' }); } catch (e) {}
      var profile = await OrbaceAPI.auth.signInProvider(provider);
      if (profile) {
        setState(profile.account_tier === 'tier2' ? 'registered' : 'instant', {
          id: profile.player_id,
          displayName: profile.display_name,
          totalRp: profile.total_rp || 0,
          accountTier: profile.account_tier || 'tier2',
        });
        try { if (window.trackEvent) window.trackEvent('auth_signin_result', { result: 'success', tier: profile.account_tier }); } catch (e) {}
      }
      return profile;
    } catch (e) {
      setState('error');
      try { if (window.trackEvent) window.trackEvent('auth_signin_result', { result: 'error' }); } catch (e2) {}
      throw e;
    }
  }

  // Quick-start (Instant Identity button).
  async function createInstantIdentity() {
    try {
      try { if (window.trackEvent) window.trackEvent('auth_register', { type: 'instant' }); } catch (e) {}
      var fp = OrbaceAPI.getDeviceFingerprint();
      var result;
      try {
        result = await OrbaceAPI.auth.registerUuid(fp, fp);
      } catch (e) {
        // ADR-010 abuse controls: the server signals captcha_required after
        // repeated rapid Instant Identity attempts from the same IP+signal —
        // show the Turnstile challenge and retry once with the solved
        // token. Any other error (including a cancelled challenge) falls
        // through to the outer catch below, unretried.
        if (e && e.status === 400 && e.body && e.body.error === 'captcha_required' && window.showTurnstileChallenge) {
          var token = await window.showTurnstileChallenge();
          result = await OrbaceAPI.auth.registerUuid(fp, fp, token);
        } else {
          throw e;
        }
      }
      setState('instant', {
        id: result.player_id,
        displayName: result.friendly_name,
        totalRp: 0,
        accountTier: 'tier1',
      });
      try { if (window.trackEvent) window.trackEvent('auth_register_result', { result: 'success' }); } catch (e) {}
      return result;
    } catch (e) {
      setState('error');
      try { if (window.trackEvent) window.trackEvent('auth_register_result', { result: 'error' }); } catch (e2) {}
      throw e;
    }
  }

  // Google upgrade. Calls finalizeSession on the OAuth result.
  async function upgradeWithGoogle() {
    var profile = await OrbaceAPI.auth.signInProvider('google');
    if (profile) {
      setState('registered', {
        id: profile.player_id,
        displayName: profile.display_name,
        totalRp: profile.total_rp || player.totalRp,
        accountTier: 'tier2',
      });
    }
    return profile;
  }

  // Called by app.js's showAuthedState() and other external auth-completion
  // call sites to sync the session state after a sign-in flow that AuthSession
  // didn't initiate (e.g. GIS button callback, OAuth return leg).
  function applyProfile(profile) {
    if (!profile) return;
    var tier = profile.account_tier === 'tier2' ? 'registered' : 'instant';
    setState(tier, {
      id: profile.player_id,
      displayName: profile.display_name,
      totalRp: profile.total_rp || 0,
      accountTier: profile.account_tier || 'tier2',
    });
  }

  async function signOut() {
    try {
      await OrbaceAPI.auth.signOut();
    } catch (e) { /* still clear local state */ }
    setState('signedOut', { id: null, displayName: null, totalRp: 0, accountTier: null });
    try { if (window.trackEvent) window.trackEvent('auth_signout', {}); } catch (e) {}
  }

  // Expose hasSubmitted by querying the ranking events endpoint.
  async function hasSubmitted(eventId) {
    try {
      var data = await OrbaceAPI.getRankingData();
      if (!data || !data.events) return false;
      var evt = data.events.find(function (e) { return e.event_id === eventId; });
      return evt ? !!evt.player_submitted : false;
    } catch (e) { return false; }
  }

  function onChange(cb) {
    listeners.push(cb);
    // Immediately call with current state so new subscribers are initialised.
    try { cb(getSession()); } catch (e) {}
    return function () {
      for (var i = 0; i < listeners.length; i++) {
        if (listeners[i] === cb) { listeners.splice(i, 1); break; }
      }
    };
  }

  // Set up BroadcastChannel for multi-tab session sync (P6.1).
  // Uses _sending guard to suppress self-broadcast echo (the sending tab
  // also receives its own onmessage — without this guard, notify() re-enters
  // infinitely via _sending→postMessage→onmessage→setState→notify→...).
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('orbace-auth');
      bc.onmessage = function (evt) {
        if (!evt.data || evt.data.type !== 'session_change') return;
        if (evt.data.state === state) return;
        if (_sending) { _sending = false; return; }
        setState(evt.data.state, evt.data.player || undefined);
      };
    }
  } catch (e) { /* BroadcastChannel unavailable — single-tab only */ }

  // Close the BroadcastChannel on page leave to prevent stale listeners.
  try {
    window.addEventListener('beforeunload', function () { if (bc) { bc.close(); bc = null; } });
  } catch (e) {}

  bootstrap();

  return {
    getState: function () { return state; },
    getPlayer: function () { return player; },
    getSession: getSession,
    restore: restore,
    applyProfile: applyProfile,
    signIn: signIn,
    createInstantIdentity: createInstantIdentity,
    upgradeWithGoogle: upgradeWithGoogle,
    signOut: signOut,
    hasSubmitted: hasSubmitted,
    onChange: onChange,
  };
})();

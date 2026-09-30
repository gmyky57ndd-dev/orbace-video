/* Orbace Sudoku — AuthUtility shared component (Phase 1, 2026-07-22).
 *
 * Renders the header auth state: placeholder, sign-in action, or signed-in
 * display name with tier icon. Mounts into a container with id="authMount"
 * (both SPA and static pages). Subscribes to OrbaceAuthSession.onChange()
 * and re-renders automatically.
 *
 * Depends on: OrbaceAuthSession (js/auth-session.js).
 * Loaded after auth-session.js, before app.js.
 */
window.OrbaceAuthUtility = (function () {
  var container = document.getElementById('authMount');
  var unsubscribe = null;

  // Fallback: if no #authMount in the page, create one and append to the nav.
  // Static pages always have it (site-src/shell/header.html); the SPA's
  // index.html gets it added at boot if missing.
  function ensureContainer() {
    if (container) return;
    container = document.createElement('div');
    container.id = 'authMount';
    container.className = 'osh-account';
    var nav = document.querySelector('.osh-header .osh-nav') || document.querySelector('nav.top');
    if (nav) { nav.appendChild(container); }
    else { document.body.insertBefore(container, document.body.firstChild); }
  }

  function render(session) {
    ensureContainer();
    container.setAttribute('aria-live', 'polite');
    var s = session || (window.OrbaceAuthSession ? OrbaceAuthSession.getSession() : { status: 'unknown', player: {} });
    switch (s.status) {
      case 'restoring':
        container.innerHTML = '<span class="osh-auth-placeholder" role="status" aria-label="Restoring session">—</span>';
        break;
      case 'signedOut':
      case 'unknown':
      case 'error':
        // Signed-out visitors go to /signin — the one identity entry page
        // (Instant Identity + Google). Registered sessions go to /account.
        container.innerHTML = '<a href="/signin" class="osh-auth-link osh-auth-signin" data-role="authsignin" aria-label="Sign in to your account">Sign in</a>';
        break;
      case 'instant':
        container.innerHTML = '<a href="/account" class="osh-auth-link osh-auth-in" data-role="authin" aria-label="Account settings, signed in as guest"><span class="osh-auth-name">' +
          escHtml(s.player.displayName || 'Player') + '</span> <span class="osh-auth-tier" aria-hidden="true">🎭</span></a>';
        break;
      case 'registered':
        container.innerHTML = '<a href="/account" class="osh-auth-link osh-auth-in" data-role="authin" aria-label="Account settings, signed in"><span class="osh-auth-name">' +
          escHtml(s.player.displayName || 'Player') + '</span> <span class="osh-auth-tier" aria-hidden="true">⭐</span></a>';
        break;
      case 'conflict':
        // ADR-009: bearer credential and session cookie point at two
        // different players. No merge UI exists yet (Phase 4) — a plain,
        // non-interactive indicator avoids linking to a page that isn't
        // built, while still being visibly distinct from "Sign in".
        container.innerHTML = '<span class="osh-auth-conflict" role="status" aria-label="Account conflict, action needed">⚠️ Account conflict</span>';
        break;
    }
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function init() {
    if (!window.OrbaceAuthSession) return;
    // Render synchronously from the current session state (already bootstrapped).
    render();
    // Subscribe to future changes.
    if (unsubscribe) unsubscribe();
    unsubscribe = OrbaceAuthSession.onChange(function (session) { render(session); });
    // Hybrid pages (e.g. /play) load api.js (so OrbaceAPI exists) but NOT
    // app.js — the guard below previously only self-restored when OrbaceAPI
    // was completely absent (genuinely static pages, no api.js). Hybrid pages
    // fell through: api.js was present so they were expected to have app.js
    // calling restore(), but they don't.
    //
    // Now self-restore in two cases:
    //   A) OrbaceAPI absent — static page (trust bootstrap cache)
    //   B) OrbaceAPI present, no OAuth PKCE ?code= in the URL — hybrid page
    //      without app.js, OR a non-OAuth SPA visit (restore() is idempotent,
    //      app.js's later call just returns the same cached promise).
    // Exception: OAuth return pages have a one-time-use PKCE code in the URL
    // — those MUST only be handled by app.js's OAuth handler, never here.
    if (!window.OrbaceAPI || !/[?&]code=/.test(location.search)) {
      OrbaceAuthSession.restore().then(render).catch(function () { render(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { render: render, init: init };
})();

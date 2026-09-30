/* Orbace Sudoku Web — analytics, attribution & event tracking (V1 homepage, Phase 1.5).
 *
 * Implements docs/plans/2026-07-10-web-v1-analytics-attribution-spec.md.
 *
 * Consent: Google's built-in CMP (AdSense → Privacy & messaging) owns the consent
 * UI and drives Consent Mode v2 for BOTH GA4 and AdSense. The only consent code we
 * ship is the `gtag('consent','default', …denied…)` block in index.html <head>,
 * set before any Google tag loads. We do NOT build a banner or call consent-update.
 * Because collection is gated by Consent Mode, trackEvent() pushes unconditionally —
 * gtag holds/drops per the live consent state automatically.
 *
 * Load order: config.js -> i18n.js -> analytics.js -> mock-data.js -> api.js -> app.js
 */
(function () {
  "use strict";

  var cfg = window.ORBACE_CONFIG || {};
  var A = cfg.ANALYTICS || {};

  // gtag() is defined by the inline Consent Mode block in <head>. Guard in case
  // this file loads in a context without it (e.g. jsdom without the head block).
  function gtagSafe() {
    if (typeof window.gtag === "function") window.gtag.apply(null, arguments);
  }

  window.OrbaceAnalytics = { enabled: !!A.GA4_ID };

  /* trackEvent(name, params) — single choke point for all GA4 custom events. */
  window.trackEvent = function (name, params) {
    if (!window.OrbaceAnalytics.enabled) return;
    gtagSafe("event", name, params || {});
  };

  var STORE_URLS = {
    ios: "https://apps.apple.com/us/app/orbace-sudoku/id6792410222",
    android: "https://play.google.com/store/apps/details?id=com.orbace.mobile"
  };

  /* storeLink(platform, placement) — canonical store URL with UTM taxonomy.
   * ANALYTICS.UTM_OVERRIDE (config) lets a paid/social campaign remap every
   * link without touching markup. */
  window.storeLink = function (platform, placement) {
    var base = STORE_URLS[platform] || STORE_URLS.ios;
    var params = new URLSearchParams({
      utm_source: "web",
      utm_medium: "landing",
      utm_campaign: "launch_v1",
      utm_content: placement || "unknown"
    });
    var o = A.UTM_OVERRIDE;
    if (o) {
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) params.set(k, o[k]);
    }
    // base may already carry a query string (the Android Play Store URL has
    // ?id=...) — a bare "?" there produces a second "?" that corrupts the
    // existing param instead of extending it.
    var sep = base.indexOf("?") === -1 ? "?" : "&";
    return base + sep + params.toString();
  };

  /* Rewrite every store anchor's href to carry UTM (so even a right-click/copy
   * or middle-click keeps attribution). */
  function applyStoreLinks() {
    var links = document.querySelectorAll("a[data-store]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.setAttribute("href", window.storeLink(
        a.getAttribute("data-store"),
        a.getAttribute("data-placement") || "unknown"
      ));
    }
  }

  /* Delegated click tracking (capture phase so it fires even when other handlers
   * preventDefault, e.g. the SPA nav router). */
  function onClick(e) {
    var el = e.target;
    if (!el || !el.closest) return;

    // store_click is emitted by js/campaign-events.js (every store link, not
    // just a[data-store]) — don't re-emit it here or it double-counts.
    if (el.closest("a[data-store]")) return;

    var prev = el.closest("[data-teamoment]");
    if (prev) {
      window.trackEvent("previous_teamoment_click", {
        puzzle_id: prev.getAttribute("data-teamoment") || "",
        position: prev.getAttribute("data-position") || ""
      });
      return;
    }

    var feat = el.closest(".v1-home-feat-card");
    if (feat) {
      window.trackEvent("feature_card_click", { feature: feat.getAttribute("data-feature") || "" });
      return;
    }

    var nav = el.closest("a.navlink[data-nav]");
    if (nav) {
      window.trackEvent("nav_click", { target: nav.getAttribute("data-nav") });
      return;
    }
  }

  function init() {
    applyStoreLinks();
    document.addEventListener("click", onClick, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* Google Ads campaign key events — replay_start + store_click (2026-09-26).
 *
 * GA4 marks these two events as key events and Google Ads imports them as
 * conversions (replay_start = Primary, drives Demand Gen bidding;
 * store_click = Secondary, observation only). Event names and the
 * event_category/event_label params are the exact shape the marketing
 * brief specified — renaming either breaks the GA4 → Ads import.
 *
 * Loaded on every page that loads gtag (site-src/shell/head.html, the SPA
 * shells, and the /ios-launch + /android-launch pages), right after
 * consent-init.js defines gtag(). One delegated capture-phase listener, so
 * it covers markup rendered later (replay controls mounted by
 * orbace-supu-replay(-v2).js, score-card store buttons) and fires even
 * when another handler calls preventDefault/stopPropagation.
 *
 * Collection is gated by Consent Mode v2 (consent-init.js), same as every
 * other GA4 event — no consent logic here.
 *
 * This is the ONLY emitter of store_click — js/analytics.js used to emit it
 * for a[data-store] anchors only; that branch was removed so a page loading
 * both files does not double-count the conversion.
 */
(function () {
  "use strict";

  if (window.__orbaceCampaignEvents) return;
  window.__orbaceCampaignEvents = true;

  function send(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params);
  }

  var STORE_HOSTS = {
    "apps.apple.com": { platform: "ios", label: "App Store Badge Click" },
    "play.google.com": { platform: "android", label: "Google Play Badge Click" }
  };

  /* A store link is any anchor to an App Store / Google Play host, or an
   * a[data-store] anchor (analytics.js's canonical badges — kept so nothing
   * its old store_click emitter tracked is lost, whatever the href holds). */
  function storeTarget(a) {
    var url;
    try { url = new URL(a.getAttribute("href"), window.location.href); } catch (e) { return null; }
    if (STORE_HOSTS[url.hostname]) return { url: url, info: STORE_HOSTS[url.hostname] };
    var ds = a.getAttribute("data-store");
    if (ds === "ios") return { url: url, info: STORE_HOSTS["apps.apple.com"] };
    if (ds === "android") return { url: url, info: STORE_HOSTS["play.google.com"] };
    return null;
  }

  /* Capture phase runs before the button's own onclick toggles playback, so
   * the button still shows its pre-click state: "Play" means this click
   * starts playback, "Pause" (aria-pressed=true / ⏸ glyph) means it stops
   * it — a pause is not a replay start. */
  function isStartingPlayback(btn) {
    if (btn.disabled) return false;
    if (btn.getAttribute("aria-pressed") === "true") return false;
    return btn.textContent.trim() !== "⏸";
  }

  function onClick(e) {
    var el = e.target;
    if (!el || !el.closest) return;

    var play = el.closest(".osr-btn-play");
    if (play) {
      if (isStartingPlayback(play)) {
        send("replay_start", {
          event_category: "engagement",
          event_label: "Play Button Click",
          page_path: window.location.pathname
        });
      }
      return;
    }

    var a = el.closest("a[href]");
    if (!a) return;
    var store = storeTarget(a);
    if (!store) return;
    var redeem = store.url.pathname.indexOf("/redeem") === 0;
    send("store_click", {
      event_category: "outbound",
      event_label: redeem ? "App Store Redeem Click" : store.info.label,
      platform: store.info.platform,
      placement: a.getAttribute("data-placement") || "unknown",
      page_path: window.location.pathname,
      link_url: store.url.origin + store.url.pathname
    });
  }

  document.addEventListener("click", onClick, true);
})();

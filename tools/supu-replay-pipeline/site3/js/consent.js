/* Shared consent-manager control — opens Google's certified CMP (AdSense's
 * Funding Choices / "Privacy & Messaging") so a visitor can review or
 * withdraw their consent choice (GDPR/UK/CH revocation). Single
 * implementation for every "Cookie Settings" control on the site — SPA
 * footer, every static/hybrid page footer (site-src/shell/footer.html),
 * and the /cookies page's inline button. Previously duplicated three ways
 * (site-src/shell/head.html, js/analytics.js) as window.openConsentSettings.
 *
 * Loaded on both shells (site-src/shell/head.html for static pages,
 * index.html for the SPA) ahead of any button that calls it.
 */
function openConsentManager() {
  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  window.googlefc.callbackQueue.push({
    "CONSENT_DATA_READY": function () {
      if (typeof window.googlefc.showRevocationMessage === "function") {
        window.googlefc.showRevocationMessage();
      }
    }
  });
}
window.openConsentManager = openConsentManager;

/* Back-compat alias — grep the repo for openConsentSettings before removing
 * this; it existed under that name until 2026-07-24. */
window.openConsentSettings = openConsentManager;

/* Delegated listener (CSP script-src unsafe-inline remediation, Phase 0.5,
 * 2026-07-25) — replaces onclick="openConsentManager()" on every "Cookie
 * Settings" button (SPA footer, static-page footer, /cookies page). Bound on
 * document so it works regardless of whether this script runs before the
 * button exists in the DOM (it does, on every static page — consent.js loads
 * in <head>). */
document.addEventListener("click", function (e) {
  if (e.target.closest(".cookie-settings-button")) openConsentManager();
});

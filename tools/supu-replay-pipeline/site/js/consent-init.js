/* Google Consent Mode v2 defaults — set BEFORE any Google tag loads so
 * EEA/UK/CH visitors start denied. Loaded first on both shells
 * (site-src/shell/head.html for static pages, index.html for the SPA),
 * ahead of consent.js and the GTM/AdSense script tags. Externalized from an
 * inline <script> (CSP script-src unsafe-inline remediation, Phase 0.5,
 * 2026-07-25) — content is identical on every page, so one file covers all.
 */
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500,
  region: ['EU', 'GB', 'CH', 'IS', 'LI', 'NO']
});
gtag('js', new Date());
gtag('config', 'G-0RWLZBGC6Y');

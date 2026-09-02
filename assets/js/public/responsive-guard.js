(() => {
  'use strict';
  if (window.__BRGY_RESPONSIVE_GUARD__) return;
  window.__BRGY_RESPONSIVE_GUARD__ = true;

  const BREAKPOINT = 991;
  const root = document.documentElement;
  let scheduled = false;

  function isCompactNavigation() {
    return window.innerWidth <= BREAKPOINT;
  }

  function syncStructure() {
    const compact = isCompactNavigation();
    const structure = compact ? 'mobile-locked' : 'desktop-wide';
    root.dataset.publicStructure = structure;
    root.dataset.publicResponsiveMode = structure;

    const body = document.body;
    const nav = document.getElementById('mainNav');
    const toggler = document.querySelector('.site-header .navbar-toggler');

    document.querySelectorAll('.public-nav-backdrop').forEach((node) => node.remove());

    if (!compact) {
      body?.classList.remove('public-menu-open');
      nav?.classList.remove('show', 'collapsing');
      nav?.setAttribute('aria-hidden', 'false');
      toggler?.setAttribute('aria-expanded', 'false');
    } else if (!body?.classList.contains('public-menu-open')) {
      nav?.classList.remove('show', 'collapsing');
      nav?.setAttribute('aria-hidden', 'true');
      toggler?.setAttribute('aria-expanded', 'false');
    }
  }

  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      syncStructure();
    });
  }

  window.addEventListener('resize', scheduleSync, { passive:true });
  window.addEventListener('orientationchange', scheduleSync, { passive:true });
  window.addEventListener('pageshow', scheduleSync);
  document.addEventListener('DOMContentLoaded', scheduleSync, { once:true });
  scheduleSync();
})();

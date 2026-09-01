(() => {
  'use strict';

  const BREAKPOINT = 900;
  const GUARD_VERSION = '20260901-guard1';
  const root = document.documentElement;
  let scheduled = false;

  function isMobileViewport() {
    return window.innerWidth < BREAKPOINT;
  }

  function ensureSafetyCssLast() {
    let link = document.querySelector('link[data-brgy-mobile-menu-fix]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `assets/css/mobile-menu-fix.css?v=${GUARD_VERSION}`;
      link.setAttribute('data-brgy-mobile-menu-fix', 'true');
      document.head.appendChild(link);
      return;
    }
    if (!link.href.includes(GUARD_VERSION)) {
      link.href = `assets/css/mobile-menu-fix.css?v=${GUARD_VERSION}`;
    }
    if (document.head.lastElementChild !== link) document.head.appendChild(link);
  }

  function syncStructure() {
    const mobile = isMobileViewport();
    root.dataset.publicStructure = mobile ? 'mobile-locked' : 'desktop-wide';
    root.dataset.publicResponsiveMode = mobile ? 'mobile-locked' : 'desktop-wide';

    const body = document.body;
    const nav = document.getElementById('mainNav');
    const backdrop = document.querySelector('.public-nav-backdrop');
    const toggler = document.querySelector('.site-header .navbar-toggler');

    if (!mobile) {
      body?.classList.remove('public-menu-open');
      nav?.classList.remove('show', 'collapsing');
      nav?.setAttribute('aria-hidden', 'false');
      backdrop?.classList.remove('show');
      backdrop?.setAttribute('aria-hidden', 'true');
      toggler?.setAttribute('aria-expanded', 'false');
      toggler?.setAttribute('aria-label', 'Open navigation');
    } else if (!body?.classList.contains('public-menu-open')) {
      nav?.classList.remove('show', 'collapsing');
      nav?.setAttribute('aria-hidden', 'true');
      backdrop?.classList.remove('show');
      backdrop?.setAttribute('aria-hidden', 'true');
      toggler?.setAttribute('aria-expanded', 'false');
    }

    ensureSafetyCssLast();
  }

  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      syncStructure();
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target === root &&
          (mutation.attributeName === 'data-public-structure' || mutation.attributeName === 'data-public-responsive-mode')) {
        scheduleSync();
        return;
      }
      if (mutation.type === 'childList' && mutation.target === document.head) {
        scheduleSync();
        return;
      }
    }
  });

  observer.observe(root, { attributes: true, attributeFilter: ['data-public-structure', 'data-public-responsive-mode'] });
  observer.observe(document.head, { childList: true });
  window.addEventListener('resize', scheduleSync, { passive: true });
  window.addEventListener('orientationchange', scheduleSync, { passive: true });
  window.addEventListener('pageshow', scheduleSync);
  document.addEventListener('DOMContentLoaded', scheduleSync, { once: true });
  scheduleSync();
})();

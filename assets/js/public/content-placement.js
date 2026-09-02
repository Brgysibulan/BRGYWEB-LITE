(() => {
  'use strict';

  const BREAKPOINT = 900;
  const DEFAULT_LAYOUT = 'card-block';
  const root = document.documentElement;

  const ZONES = Object.freeze({
    hero: '.hero-section',
    trust: '.civic-trust-strip',
    utilities: '.quick-links',
    portal: '.premium-home-band',
    profile: '#profile',
    officials: '#officials',
    announcements: '#announcements',
    services: '#services',
    location: '#barangay-hall-map-section'
  });

  const DESKTOP = Object.freeze({
    'two-column': ['hero','trust','announcements','services','profile','officials','utilities','portal','location'],
    'split-screen': ['hero','announcements','trust','utilities','services','portal','officials','profile','location'],
    'asymmetrical': ['hero','utilities','portal','services','announcements','profile','officials','trust','location'],
    'f-shape': ['hero','announcements','services','utilities','profile','officials','portal','trust','location'],
    'z-shape': ['hero','utilities','announcements','services','profile','officials','portal','trust','location'],
    'card-block': ['hero','trust','utilities','services','announcements','profile','officials','portal','location'],
    'featured-media': ['hero','announcements','utilities','services','portal','officials','profile','trust','location'],
    'masonry': ['hero','utilities','announcements','services','profile','officials','portal','trust','location'],
    'magazine': ['hero','announcements','trust','services','utilities','profile','officials','portal','location'],
    'fixed-navigation': ['hero','utilities','announcements','services','trust','officials','profile','portal','location'],
    'hidden-navigation': ['hero','announcements','services','profile','officials','trust','utilities','portal','location'],
    'interactive': ['hero','utilities','services','announcements','officials','trust','profile','portal','location']
  });

  const MOBILE = Object.freeze({
    'two-column': ['hero','utilities','announcements','services','trust','profile','officials','portal','location'],
    'split-screen': ['hero','announcements','utilities','services','trust','officials','profile','portal','location'],
    'asymmetrical': ['hero','utilities','services','announcements','trust','profile','officials','portal','location'],
    'f-shape': ['hero','announcements','services','utilities','trust','profile','officials','portal','location'],
    'z-shape': ['hero','utilities','announcements','services','trust','officials','profile','portal','location'],
    'card-block': ['hero','utilities','services','announcements','trust','officials','profile','portal','location'],
    'featured-media': ['hero','announcements','utilities','services','officials','profile','trust','portal','location'],
    'masonry': ['hero','utilities','announcements','services','trust','profile','officials','portal','location'],
    'magazine': ['hero','announcements','services','utilities','trust','officials','profile','portal','location'],
    'fixed-navigation': ['hero','utilities','services','announcements','trust','officials','profile','portal','location'],
    'hidden-navigation': ['hero','announcements','services','profile','officials','trust','utilities','portal','location'],
    'interactive': ['hero','utilities','services','announcements','trust','officials','profile','portal','location']
  });

  let lastKey = '';
  let resizeTimer = 0;

  function isHomePage() {
    const page = (document.body?.dataset.publicPage || '').toLowerCase();
    if (page === 'index') return true;
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    return !file || file === 'index.html';
  }

  function getMain() {
    if (!isHomePage()) return null;
    return document.querySelector('body main');
  }

  function normalizeLayout(value) {
    return window.BRGY_WEB_LAYOUT_RUNTIME?.normalize?.(value) || (DESKTOP[value] ? value : DEFAULT_LAYOUT);
  }

  function tagZones(main) {
    const tagged = new Map();
    Object.entries(ZONES).forEach(([zone, selector]) => {
      const node = main.querySelector(`:scope > ${selector}`);
      if (!node) return;
      node.dataset.contentZone = zone;
      tagged.set(zone, node);
    });
    return tagged;
  }

  function applyPlacement(layoutValue = root.dataset.webLayout, force = false) {
    const main = getMain();
    if (!main) return null;

    const layout = normalizeLayout(layoutValue);
    const mode = window.innerWidth <= BREAKPOINT ? 'mobile' : 'desktop';
    const key = `${layout}:${mode}`;
    const zones = tagZones(main);
    if (!zones.size) return null;

    const plan = (mode === 'mobile' ? MOBILE : DESKTOP)[layout] || (mode === 'mobile' ? MOBILE : DESKTOP)[DEFAULT_LAYOUT];
    if (!force && key === lastKey && plan.every((zone, index) => zones.get(zone)?.dataset.contentRank === String(index + 1))) return { layout, mode };

    const knownNodes = new Set(zones.values());
    const unknown = [...main.children].filter((node) => !knownNodes.has(node));

    plan.forEach((zone, index) => {
      const node = zones.get(zone);
      if (!node) return;
      node.dataset.contentRank = String(index + 1);
      main.appendChild(node);
    });
    unknown.forEach((node) => main.appendChild(node));

    main.dataset.contentPlacement = layout;
    main.dataset.contentPlacementMode = mode;
    root.dataset.contentPlacementReady = 'true';
    lastKey = key;
    window.dispatchEvent(new CustomEvent('brgy:content-placement-applied', { detail:{ layout, mode, order:[...plan] } }));
    return { layout, mode };
  }

  window.addEventListener('brgy:web-layout-applied', (event) => applyPlacement(event.detail?.layout, true));
  window.addEventListener('pageshow', () => applyPlacement(root.dataset.webLayout, true));
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => applyPlacement(root.dataset.webLayout), 90);
  }, { passive:true });

  const boot = () => requestAnimationFrame(() => applyPlacement(root.dataset.webLayout || DEFAULT_LAYOUT, true));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();

  window.BRGY_CONTENT_PLACEMENT = Object.freeze({ zones:{...ZONES}, desktop:{...DESKTOP}, mobile:{...MOBILE}, apply:applyPlacement });
})();

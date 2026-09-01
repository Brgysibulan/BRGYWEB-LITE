(() => {
  'use strict';

  const DEFAULT_LAYOUT = 'card-block';
  const LAYOUTS = new Set([
    'two-column','split-screen','asymmetrical','f-shape','z-shape','card-block',
    'featured-media','masonry','magazine','fixed-navigation','hidden-navigation','interactive'
  ]);
  const root = document.documentElement;

  const normalize = (value) => LAYOUTS.has(String(value || '')) ? String(value) : DEFAULT_LAYOUT;

  function apply(layout) {
    const id = normalize(layout);
    root.dataset.webLayout = id;
    root.dataset.webLayoutReady = 'true';
    return id;
  }

  function setHiddenMenu(open) {
    if (root.dataset.webLayout !== 'hidden-navigation' || window.innerWidth < 901) return false;
    const collapse = document.getElementById('mainNav');
    const toggler = document.querySelector('.site-header .navbar-toggler');
    if (!collapse || !toggler) return false;
    document.body.classList.toggle('public-menu-open', open);
    collapse.classList.toggle('show', open);
    collapse.setAttribute('aria-hidden', open ? 'false' : 'true');
    toggler.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggler.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    return true;
  }

  window.addEventListener('brgy:government-theme-applied', (event) => {
    apply(event.detail?.config?.webLayout);
    if (root.dataset.webLayout !== 'hidden-navigation') setHiddenMenu(false);
  });

  document.addEventListener('click', (event) => {
    if (root.dataset.webLayout !== 'hidden-navigation' || window.innerWidth < 901) return;
    const toggler = event.target.closest?.('.site-header .navbar-toggler');
    if (toggler) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setHiddenMenu(!document.body.classList.contains('public-menu-open'));
      return;
    }
    if (event.target.closest?.('.public-menu-close')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setHiddenMenu(false);
      return;
    }
    const collapse = document.getElementById('mainNav');
    if (document.body.classList.contains('public-menu-open') && collapse && !collapse.contains(event.target)) {
      setHiddenMenu(false);
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.dataset.webLayout === 'hidden-navigation') setHiddenMenu(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth < 901) document.body.classList.remove('public-menu-open');
    else if (root.dataset.webLayout !== 'hidden-navigation') setHiddenMenu(false);
  }, { passive:true });

  window.BRGY_WEB_LAYOUT_RUNTIME = Object.freeze({ layouts:[...LAYOUTS], normalize, apply });
})();

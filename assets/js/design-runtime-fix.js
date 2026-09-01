(() => {
  'use strict';
  if (window.__BRGY_DESIGN_RUNTIME_FIX__) return;
  window.__BRGY_DESIGN_RUNTIME_FIX__ = true;

  const root = document.documentElement;
  const BREAKPOINT = 900;

  function isDesktopMenuMode(){
    return window.innerWidth >= BREAKPOINT && root.dataset.publicNavRequestedMode === 'menu';
  }

  function nav(){ return document.getElementById('mainNav'); }
  function toggler(){ return document.querySelector('.site-header .navbar-toggler'); }

  function setDesktopMenu(open){
    const menu = nav();
    const button = toggler();
    if (!menu || !button) return;
    const shouldOpen = Boolean(open && isDesktopMenuMode());
    menu.classList.toggle('show', shouldOpen);
    menu.classList.remove('collapsing');
    menu.setAttribute('aria-hidden', shouldOpen ? 'false' : (isDesktopMenuMode() ? 'true' : 'false'));
    button.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    button.setAttribute('aria-label', shouldOpen ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('public-desktop-menu-open', shouldOpen);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.site-header .navbar-toggler');
    if (button && isDesktopMenuMode()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setDesktopMenu(!nav()?.classList.contains('show'));
      return;
    }

    if (!isDesktopMenuMode() || !nav()?.classList.contains('show')) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (nav()?.contains(target) || toggler()?.contains(target)) return;
    setDesktopMenu(false);
  }, true);

  document.addEventListener('click', (event) => {
    if (!isDesktopMenuMode()) return;
    if (event.target.closest?.('#mainNav a[href]')) setDesktopMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setDesktopMenu(false);
  });

  window.addEventListener('resize', () => setDesktopMenu(false), { passive:true });
  window.addEventListener('pageshow', () => setDesktopMenu(false));

  const observer = new MutationObserver(() => {
    if (!isDesktopMenuMode()) setDesktopMenu(false);
  });
  observer.observe(root, { attributes:true, attributeFilter:['data-public-nav-requested-mode','data-public-nav-requested'] });
})();

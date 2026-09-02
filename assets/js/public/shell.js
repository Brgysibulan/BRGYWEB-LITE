(() => {
  'use strict';

  const SITE_CACHE_VERSION = 4;
  const SITE_CACHE_KEY = 'brgyweb:site-settings:v4';
  const BREAKPOINT = 991;
  const PUBLIC_SUPABASE_URL = 'https://pkvorwvkqjnbgktkgjhr.supabase.co';
  const PUBLIC_SUPABASE_KEY = 'sb_publishable_RbaENAflMzLgXpemymGApA_TkVAhMoU';
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const maintenanceBootStyle = document.createElement('style');
  maintenanceBootStyle.id = 'brgy-maintenance-boot';
  maintenanceBootStyle.textContent = 'html[data-maintenance-checking="true"] body{visibility:hidden!important}';
  document.head.appendChild(maintenanceBootStyle);
  document.documentElement.dataset.maintenanceChecking = 'true';

  async function checkMaintenanceMode() {
    try {
      const endpoint = `${PUBLIC_SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=maintenance_mode`;
      const response = await fetch(endpoint, { cache:'no-store', headers:{ apikey:PUBLIC_SUPABASE_KEY, Authorization:`Bearer ${PUBLIC_SUPABASE_KEY}`, Accept:'application/json' } });
      if (!response.ok) throw new Error(`Maintenance check failed (${response.status}).`);
      const rows = await response.json();
      const settings = Array.isArray(rows) ? rows[0] : null;
      if (settings?.maintenance_mode === true) {
        window.location.replace('maintenance.html');
        return;
      }
    } catch (error) {
      console.warn('Maintenance status unavailable; public site remains available:', error);
    }
    document.documentElement.dataset.maintenanceChecking = 'false';
    maintenanceBootStyle.remove();
  }
  checkMaintenanceMode();

  function registerCacheManager() {
    if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('sw.js', location.href), { updateViaCache:'none' })
        .then((registration) => registration.update())
        .catch((error) => console.warn('Cache manager unavailable:', error));
    }, { once:true });
  }
  registerCacheManager();

  document.body.dataset.publicPage = page.replace(/\.html$/, '') || 'home';
  const escapeHtml = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const isCompactNavigation = () => window.innerWidth <= BREAKPOINT;
  document.documentElement.dataset.publicStructure = isCompactNavigation() ? 'mobile-locked' : 'desktop-wide';

  function readCachedSite() {
    try {
      const raw = localStorage.getItem(SITE_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.version !== SITE_CACHE_VERSION) return null;
      return parsed?.data && typeof parsed.data === 'object' ? parsed.data : null;
    } catch { return null; }
  }

  const cachedSite = readCachedSite();
  const initialName = cachedSite?.siteName || 'Barangay Website';
  const initialAddress = cachedSite?.address || '';
  const initialContact = [cachedSite?.phone, cachedSite?.email].filter(Boolean).join(' • ');
  const initialMark = String(cachedSite?.shortName || cachedSite?.siteName || 'B').trim().charAt(0).toUpperCase() || 'B';

  const primaryNavItems = [
    ['index.html','Home'],
    ['barangay-profile.html','Profile'],
    ['services.html','Services'],
    ['verify.html','Verify ID']
  ];
  const moreNavItems = [
    ['officials.html','Officials'],
    ['announcements.html','Announcements'],
    ['forms.html','Forms'],
    ['barangay-directory.html','Directory'],
    ['barangay-disclosure.html','Disclosure'],
    ['gallery.html','Gallery'],
    ['contact.html','Contact']
  ];

  const moreActive = moreNavItems.some(([href]) => href === page);
  const navLink = ([href,label], extraClass='') => `<a class="${extraClass || 'nav-link'}${page === href ? ' active' : ''}" href="${href}"${page === href ? ' aria-current="page"' : ''}>${label}</a>`;
  const moreMenu = `<li class="nav-item public-more-item"><details class="public-more"><summary class="nav-link${moreActive ? ' active' : ''}">More</summary><div class="public-more-menu">${moreNavItems.map((item) => navLink(item,'public-more-link')).join('')}<a class="public-more-link public-more-admin" href="login.html">Admin Portal</a></div></details></li>`;

  if (header) {
    header.innerHTML = `<nav class="navbar navbar-expand-lg navbar-light"><div class="container"><a class="navbar-brand d-flex align-items-center gap-2" href="index.html" aria-label="Home"><span class="brand-mark" id="brand-mark" aria-hidden="true">${escapeHtml(initialMark)}</span><img class="brand-logo d-none" id="brand-logo" alt=""><span id="site-name">${escapeHtml(initialName)}</span></a><button class="navbar-toggler" type="button" aria-controls="mainNav" aria-expanded="false" aria-label="Open navigation"><span class="navbar-toggler-icon"></span></button><div class="navbar-collapse" id="mainNav" aria-hidden="true"><div class="public-mobile-menu-head"><div><strong>Navigation</strong><small>Official barangay website</small></div><button class="public-menu-close" type="button" aria-label="Close navigation">×</button></div><ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">${primaryNavItems.map((item) => `<li class="nav-item">${navLink(item)}</li>`).join('')}${moreMenu}</ul></div></div></nav>`;

    const collapseElement = document.getElementById('mainNav');
    const toggler = header.querySelector('.navbar-toggler');
    const closeButton = header.querySelector('.public-menu-close');

    function closeMoreMenus(except=null) {
      header.querySelectorAll('.public-more[open]').forEach((details) => {
        if (details !== except) details.removeAttribute('open');
      });
    }

    function setMenuState(open) {
      const shouldOpen = isCompactNavigation() && open;
      document.body.classList.toggle('public-menu-open', shouldOpen);
      collapseElement?.classList.toggle('show', shouldOpen);
      collapseElement?.setAttribute('aria-hidden', shouldOpen ? 'false' : (isCompactNavigation() ? 'true' : 'false'));
      toggler?.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
      toggler?.setAttribute('aria-label', shouldOpen ? 'Close navigation' : 'Open navigation');
      if (!shouldOpen) closeMoreMenus();
    }

    toggler?.addEventListener('click', (event) => {
      event.preventDefault();
      setMenuState(!document.body.classList.contains('public-menu-open'));
    });
    closeButton?.addEventListener('click', (event) => {
      event.preventDefault();
      setMenuState(false);
    });
    collapseElement?.querySelectorAll('a[href]').forEach((link) => link.addEventListener('click', () => setMenuState(false)));
    header.querySelectorAll('.public-more').forEach((details) => details.addEventListener('toggle', () => {
      if (details.open) closeMoreMenus(details);
    }));
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.public-more')) closeMoreMenus();
      if (isCompactNavigation() && document.body.classList.contains('public-menu-open') && !event.target.closest('.navbar-collapse') && !event.target.closest('.navbar-toggler')) setMenuState(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenuState(false);
    });
    window.addEventListener('pageshow', () => setMenuState(false));
    window.addEventListener('resize', () => {
      document.documentElement.dataset.publicStructure = isCompactNavigation() ? 'mobile-locked' : 'desktop-wide';
      setMenuState(false);
    }, { passive:true });
    setMenuState(false);
  }

  if (footer) {
    footer.classList.add('py-4');
    footer.innerHTML = `<div class="container"><div class="d-flex flex-column flex-lg-row justify-content-between gap-3"><div><strong id="footer-name">${escapeHtml(initialName)}</strong><p class="small mb-0" id="footer-address">${escapeHtml(initialAddress)}</p><p class="small mb-0" id="footer-contact">${escapeHtml(initialContact)}</p></div><div class="small">&copy; <span id="current-year"></span> <span id="copyright-name">${escapeHtml(initialName)}</span></div></div></div>`;
  }
})();

(() => {
  'use strict';

  const SITE_CACHE_VERSION = 3;
  const SITE_CACHE_KEY = 'brgyweb:site-settings:v3';
  const UI_VERSION = '20260901-stability2';
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function addStyle(key, file) {
    if (document.querySelector(`link[data-brgy-${key}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `assets/css/${file}?v=${UI_VERSION}`;
    link.setAttribute(`data-brgy-${key}`, 'true');
    document.head.appendChild(link);
  }

  function ensureThemeEngine() {
    if (window.BRGY_THEME || document.querySelector('script[data-brgy-design-theme]')) return;
    const script = document.createElement('script');
    script.src = `assets/js/design-theme.js?v=${UI_VERSION}`;
    script.dataset.brgyDesignTheme = 'true';
    document.head.appendChild(script);
  }

  addStyle('premium-public', 'premium-public.css');
  addStyle('premium-pages', 'premium-pages.css');
  addStyle('mobile-menu-fix', 'mobile-menu-fix.css');
  ensureThemeEngine();
  document.body.dataset.publicPage = page.replace(/\.html$/,'') || 'home';

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function isCompactNavigation() { return window.matchMedia('(max-width:1199.98px), (hover:none), (pointer:coarse)').matches || navigator.maxTouchPoints > 0; }
  document.documentElement.dataset.publicStructure = isCompactNavigation() ? 'mobile-locked' : 'desktop-themed';
  function readCachedSite() { try { const raw=localStorage.getItem(SITE_CACHE_KEY); if(!raw)return null; const parsed=JSON.parse(raw); if(parsed?.version!==SITE_CACHE_VERSION)return null; const data=parsed?.data; return data&&typeof data==='object'?data:null; } catch { return null; } }

  const cachedSite = readCachedSite();
  const initialName = cachedSite?.siteName || '';
  const initialAddress = cachedSite?.address || '';
  const initialContact = [cachedSite?.phone, cachedSite?.email].filter(Boolean).join(' • ');
  const initialMark = String(cachedSite?.shortName || cachedSite?.siteName || 'B').trim().charAt(0).toUpperCase() || 'B';

  const navItems = [['index.html','Home'],['barangay-profile.html','Profile'],['officials.html','Officials'],['announcements.html','Announcements'],['services.html','Services'],['forms.html','Forms'],['barangay-directory.html','Directory'],['barangay-disclosure.html','Disclosure'],['gallery.html','Gallery'],['verify.html','Verify ID'],['contact.html','Contact']];
  const adminMenu = `<li class="nav-item ms-xl-2"><a class="btn btn-sm btn-outline-light" href="editor/login.html">Admin Portal</a></li>`;

  if (header) {
    header.innerHTML = `<nav class="navbar navbar-expand-xl navbar-dark"><div class="container"><a class="navbar-brand d-flex align-items-center gap-2" href="index.html" aria-label="Home"><span class="brand-mark" id="brand-mark" aria-hidden="true">${escapeHtml(initialMark)}</span><img class="brand-logo d-none" id="brand-logo" alt=""><span id="site-name">${escapeHtml(initialName)}</span></a><button class="navbar-toggler" type="button" aria-controls="mainNav" aria-expanded="false" aria-label="Open navigation"><span class="navbar-toggler-icon"></span></button><div class="navbar-collapse" id="mainNav" aria-hidden="true"><div class="public-mobile-menu-head"><div><strong>Navigation</strong><small>Official barangay website</small></div><button class="public-menu-close" type="button" aria-label="Close navigation">×</button></div><ul class="navbar-nav ms-auto align-items-xl-center gap-xl-1">${navItems.map(([href,label]) => `<li class="nav-item"><a class="nav-link${page === href ? ' active' : ''}" href="${href}"${page === href ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}${adminMenu}</ul></div></div></nav>`;
    const backdrop=document.createElement('div');backdrop.className='public-nav-backdrop';backdrop.setAttribute('aria-hidden','true');document.body.appendChild(backdrop);
    const collapseElement=document.getElementById('mainNav'),toggler=header.querySelector('.navbar-toggler');
    function setMenuState(open){
      document.body.classList.toggle('public-menu-open',open);
      collapseElement?.classList.toggle('show',open);
      collapseElement?.setAttribute('aria-hidden',open?'false':'true');
      backdrop.classList.toggle('show',open);
      backdrop.setAttribute('aria-hidden',open?'false':'true');
      toggler?.setAttribute('aria-expanded',open?'true':'false');
      toggler?.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    }
    function openMenu(){ if(isCompactNavigation()) setMenuState(true); }
    function closeMenu(){ setMenuState(false); }
    toggler?.addEventListener('click',(event)=>{event.preventDefault();document.body.classList.contains('public-menu-open')?closeMenu():openMenu();});
    header.querySelector('.public-menu-close')?.addEventListener('click',(event)=>{event.preventDefault();closeMenu();});
    backdrop.addEventListener('click',closeMenu);
    collapseElement?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{if(isCompactNavigation())closeMenu();}));
    document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&document.body.classList.contains('public-menu-open'))closeMenu();});
    window.addEventListener('pageshow',()=>closeMenu());
    window.addEventListener('resize',()=>{document.documentElement.dataset.publicStructure=isCompactNavigation()?'mobile-locked':'desktop-themed';if(!isCompactNavigation())closeMenu();},{passive:true});
    setMenuState(false);
  }

  if (footer) {
    footer.classList.add('py-5');
    footer.innerHTML = `<div class="container"><div class="row g-4 align-items-start"><div class="col-lg-7"><span class="eyebrow mb-3">Official Digital Portal</span><h2 class="h4 mb-2" id="footer-name">${escapeHtml(initialName)}</h2><p class="mb-0 text-white-50">Official barangay information, public services, transparency records, downloadable forms, and verification in one secure digital portal.</p></div><div class="col-lg-5 text-lg-end"><p class="mb-1" id="footer-address">${escapeHtml(initialAddress)}</p><p class="mb-3" id="footer-contact">${escapeHtml(initialContact)}</p><div class="d-flex flex-wrap gap-2 justify-content-lg-end"><a class="btn btn-sm btn-outline-light" href="forms.html">Download Forms</a><a class="btn btn-sm btn-outline-light" href="contact.html">Contact Barangay Office</a></div></div></div><hr class="border-light opacity-25 my-4"><div class="d-flex flex-wrap justify-content-between gap-2"><p class="small mb-0 text-white-50">&copy; <span id="current-year"></span> <span id="copyright-name">${escapeHtml(initialName)}</span>. All rights reserved.</p><p class="small mb-0 text-white-50">Official community information portal</p></div></div>`;
  }
})();
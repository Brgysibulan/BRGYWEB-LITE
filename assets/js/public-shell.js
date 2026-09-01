(() => {
  'use strict';

  const SITE_CACHE_VERSION = 3;
  const SITE_CACHE_KEY = 'brgyweb:site-settings:v3';
  const UI_VERSION = '20260901-designfix1';
  const BREAKPOINT = 900;
  const PUBLIC_SUPABASE_URL = 'https://pkvorwvkqjnbgktkgjhr.supabase.co';
  const PUBLIC_SUPABASE_KEY = 'sb_publishable_RbaENAflMzLgXpemymGApA_TkVAhMoU';
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  /* Public availability guard: hide normal content until maintenance state is known. */
  const maintenanceBootStyle = document.createElement('style');
  maintenanceBootStyle.id = 'brgy-maintenance-boot';
  maintenanceBootStyle.textContent = 'html[data-maintenance-checking="true"] body{visibility:hidden!important}';
  document.head.appendChild(maintenanceBootStyle);
  document.documentElement.dataset.maintenanceChecking = 'true';

  async function checkMaintenanceMode(){
    try{
      const endpoint = `${PUBLIC_SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=maintenance_mode`;
      const response = await fetch(endpoint,{cache:'no-store',headers:{apikey:PUBLIC_SUPABASE_KEY,Authorization:`Bearer ${PUBLIC_SUPABASE_KEY}`,Accept:'application/json'}});
      if(!response.ok) throw new Error(`Maintenance check failed (${response.status}).`);
      const rows = await response.json();
      const settings = Array.isArray(rows) ? rows[0] : null;
      if(settings?.maintenance_mode === true){
        window.location.replace('maintenance.html');
        return;
      }
    }catch(error){
      /* Fail open: a maintenance-check outage must not accidentally take the public site offline. */
      console.warn('Maintenance status unavailable; public site remains available:',error);
    }
    document.documentElement.dataset.maintenanceChecking = 'false';
    maintenanceBootStyle.remove();
  }
  checkMaintenanceMode();

  function registerCacheManager(){if(!('serviceWorker' in navigator)||location.protocol!=='https:')return;window.addEventListener('load',()=>{navigator.serviceWorker.register(new URL('sw.js',location.href),{updateViaCache:'none'}).then((registration)=>registration.update()).catch((error)=>console.warn('Cache manager unavailable:',error));},{once:true});}
  registerCacheManager();
  function addStyle(key,file){if(document.querySelector(`link[data-brgy-${key}]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=`assets/css/${file}?v=${UI_VERSION}`;link.setAttribute(`data-brgy-${key}`,'true');document.head.appendChild(link);}
  function addScript(key,file){if(document.querySelector(`script[data-brgy-${key}]`))return;const script=document.createElement('script');script.src=`assets/js/${file}?v=${UI_VERSION}`;script.setAttribute(`data-brgy-${key}`,'true');document.head.appendChild(script);}
  function ensureThemeEngine(){if(window.BRGY_THEME||document.querySelector('script[data-brgy-design-theme]'))return;const script=document.createElement('script');script.src=`assets/js/design-theme.js?v=${UI_VERSION}`;script.dataset.brgyDesignTheme='true';document.head.appendChild(script);}
  addStyle('premium-public','premium-public.css');addStyle('premium-pages','premium-pages.css');addStyle('mobile-menu-fix','mobile-menu-fix.css');addStyle('nav-more','nav-more.css');addStyle('brand-name-fix','brand-name-fix.css');addStyle('footer-polish','footer-polish.css');ensureThemeEngine();addScript('responsive-guard','public-responsive-guard.js');
  document.body.dataset.publicPage=page.replace(/\.html$/,'')||'home';
  const escapeHtml=(value)=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  function isCompactNavigation(){return window.innerWidth < BREAKPOINT;}
  document.documentElement.dataset.publicStructure=isCompactNavigation()?'mobile-locked':'desktop-wide';
  function readCachedSite(){try{const raw=localStorage.getItem(SITE_CACHE_KEY);if(!raw)return null;const parsed=JSON.parse(raw);if(parsed?.version!==SITE_CACHE_VERSION)return null;const data=parsed?.data;return data&&typeof data==='object'?data:null;}catch{return null;}}
  const cachedSite=readCachedSite(),initialName=cachedSite?.siteName||'',initialAddress=cachedSite?.address||'',initialContact=[cachedSite?.phone,cachedSite?.email].filter(Boolean).join(' • '),initialMark=String(cachedSite?.shortName||cachedSite?.siteName||'B').trim().charAt(0).toUpperCase()||'B';

  const primaryNavItems=[
    ['index.html','Home'],
    ['barangay-profile.html','Profile'],
    ['services.html','Services'],
    ['verify.html','Verify ID']
  ];
  const moreNavItems=[
    ['officials.html','Officials'],
    ['announcements.html','Announcements'],
    ['forms.html','Forms'],
    ['barangay-directory.html','Directory'],
    ['barangay-disclosure.html','Disclosure'],
    ['gallery.html','Gallery'],
    ['contact.html','Contact']
  ];
  const moreActive=moreNavItems.some(([href])=>href===page);
  const navLink=([href,label],extraClass='')=>`<a class="${extraClass||'nav-link'}${page===href?' active':''}" href="${href}"${page===href?' aria-current="page"':''}>${label}</a>`;
  const moreMenu=`<li class="nav-item public-more-item"><details class="public-more"><summary class="nav-link${moreActive?' active':''}"${moreActive?' aria-current="page"':''}>More <span class="public-more-caret" aria-hidden="true">⌄</span></summary><div class="public-more-menu">${moreNavItems.map((item)=>navLink(item,'public-more-link')).join('')}<a class="public-more-link public-more-admin" href="editor/login.html">Admin Portal</a></div></details></li>`;

  if(header){
    header.innerHTML=`<nav class="navbar navbar-expand-xl navbar-dark"><div class="container"><a class="navbar-brand d-flex align-items-center gap-2" href="index.html" aria-label="Home"><span class="brand-mark" id="brand-mark" aria-hidden="true">${escapeHtml(initialMark)}</span><img class="brand-logo d-none" id="brand-logo" alt=""><span id="site-name">${escapeHtml(initialName)}</span></a><button class="navbar-toggler" type="button" aria-controls="mainNav" aria-expanded="false" aria-label="Open navigation"><span class="navbar-toggler-icon"></span></button><div class="navbar-collapse" id="mainNav" aria-hidden="true"><div class="public-mobile-menu-head"><div><strong>Navigation</strong><small>Official barangay website</small></div><button class="public-menu-close" type="button" aria-label="Close navigation">×</button></div><ul class="navbar-nav ms-auto align-items-xl-center gap-xl-1">${primaryNavItems.map((item)=>`<li class="nav-item">${navLink(item)}</li>`).join('')}${moreMenu}</ul></div></div></nav>`;

    document.querySelectorAll('.public-nav-backdrop').forEach((node)=>node.remove());

    const collapseElement=document.getElementById('mainNav');
    const toggler=header.querySelector('.navbar-toggler');
    const closeButton=header.querySelector('.public-menu-close');

    function closeMoreMenus(except=null){
      header.querySelectorAll('.public-more[open]').forEach((details)=>{if(details!==except)details.removeAttribute('open');});
    }

    function setMenuState(open){
      const compact=isCompactNavigation();
      const shouldOpen=compact&&open;
      document.body.classList.toggle('public-menu-open',shouldOpen);
      collapseElement?.classList.toggle('show',shouldOpen);
      collapseElement?.classList.remove('collapsing');
      collapseElement?.setAttribute('aria-hidden',shouldOpen?'false':compact?'true':'false');
      toggler?.setAttribute('aria-expanded',shouldOpen?'true':'false');
      toggler?.setAttribute('aria-label',shouldOpen?'Close navigation':'Open navigation');
      if(!shouldOpen)closeMoreMenus();
    }

    const closeMenu=()=>setMenuState(false);

    toggler?.addEventListener('click',(event)=>{
      event.preventDefault();
      event.stopPropagation();
      setMenuState(!document.body.classList.contains('public-menu-open'));
    });

    closeButton?.addEventListener('click',(event)=>{
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    });

    collapseElement?.querySelectorAll('a[href]').forEach((link)=>{
      link.addEventListener('click',()=>{ if(isCompactNavigation()) closeMenu(); else closeMoreMenus(); });
    });

    header.querySelectorAll('.public-more').forEach((details)=>{
      details.addEventListener('toggle',()=>{if(details.open)closeMoreMenus(details);});
    });

    document.addEventListener('pointerdown',(event)=>{
      const target=event.target;
      if(!(target instanceof Node))return;
      const openMore=header.querySelector('.public-more[open]');
      if(openMore&&!openMore.contains(target))closeMoreMenus();
      if(!document.body.classList.contains('public-menu-open'))return;
      if(collapseElement?.contains(target)||toggler?.contains(target))return;
      closeMenu();
    },{passive:true});

    document.addEventListener('keydown',(event)=>{if(event.key==='Escape'){closeMoreMenus();closeMenu();}});
    window.addEventListener('pageshow',()=>{closeMoreMenus();closeMenu();});
    window.addEventListener('resize',()=>{document.documentElement.dataset.publicStructure=isCompactNavigation()?'mobile-locked':'desktop-wide';closeMoreMenus();closeMenu();},{passive:true});
    setMenuState(false);
  }

  if(footer){footer.classList.add('py-5');footer.innerHTML=`<div class="container"><div class="row g-4 align-items-start"><div class="col-lg-7"><span class="eyebrow mb-3">Official Digital Portal</span><h2 class="h4 mb-2" id="footer-name">${escapeHtml(initialName)}</h2><p class="mb-0 text-white-50">Official barangay information, public services, transparency records, downloadable forms, and verification in one secure digital portal.</p></div><div class="col-lg-5 text-lg-end"><p class="mb-1" id="footer-address">${escapeHtml(initialAddress)}</p><p class="mb-3" id="footer-contact">${escapeHtml(initialContact)}</p><div class="d-flex flex-wrap gap-2 justify-content-lg-end"><a class="btn btn-sm btn-outline-light" href="forms.html">Download Forms</a><a class="btn btn-sm btn-outline-light" href="contact.html">Contact Barangay Office</a></div></div></div><hr class="border-light opacity-25 my-4"><div class="d-flex flex-wrap justify-content-between gap-2"><p class="small mb-0 text-white-50">&copy; <span id="current-year"></span> <span id="copyright-name">${escapeHtml(initialName)}</span>. All rights reserved.</p><p class="small mb-0 text-white-50">Official community information portal</p></div></div>`;}
})();

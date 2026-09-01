(() => {
  'use strict';
  if (window.__BRGY_RESPONSIVE_GUARD__) return;
  window.__BRGY_RESPONSIVE_GUARD__ = true;
  const BREAKPOINT = 900;
  const GUARD_VERSION = '20260901-viewport2';
  const root = document.documentElement;
  let scheduled = false;
  function isCompactNavigation(){return window.innerWidth < BREAKPOINT;}
  function ensureStyleLast(selector,file,key){let link=document.querySelector(selector);if(!link){link=document.createElement('link');link.rel='stylesheet';link.href=`assets/css/${file}?v=${GUARD_VERSION}`;link.setAttribute(key,'true');document.head.appendChild(link);return link;}if(!link.href.includes(GUARD_VERSION))link.href=`assets/css/${file}?v=${GUARD_VERSION}`;if(document.head.lastElementChild!==link)document.head.appendChild(link);return link;}
  function ensureSafetyCssLast(){ensureStyleLast('link[data-brgy-mobile-menu-fix]','mobile-menu-fix.css','data-brgy-mobile-menu-fix');}
  function setDatasetValue(key,value){if(root.dataset[key]!==value)root.dataset[key]=value;}
  function syncStructure(){const compact=isCompactNavigation(),structure=compact?'mobile-locked':'desktop-wide';setDatasetValue('publicStructure',structure);setDatasetValue('publicResponsiveMode',structure);const body=document.body,nav=document.getElementById('mainNav'),backdrop=document.querySelector('.public-nav-backdrop'),toggler=document.querySelector('.site-header .navbar-toggler');if(!compact){body?.classList.remove('public-menu-open');nav?.classList.remove('show','collapsing');nav?.setAttribute('aria-hidden','false');backdrop?.classList.remove('show');backdrop?.setAttribute('aria-hidden','true');toggler?.setAttribute('aria-expanded','false');toggler?.setAttribute('aria-label','Open navigation');}else if(!body?.classList.contains('public-menu-open')){nav?.classList.remove('show','collapsing');nav?.setAttribute('aria-hidden','true');backdrop?.classList.remove('show');backdrop?.setAttribute('aria-hidden','true');toggler?.setAttribute('aria-expanded','false');}ensureSafetyCssLast();}
  function scheduleSync(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;syncStructure();});}
  const observer=new MutationObserver((mutations)=>{for(const mutation of mutations){if(mutation.type==='attributes'&&mutation.target===root){scheduleSync();return;}if(mutation.type==='childList'&&mutation.target===document.head){scheduleSync();return;}}});
  observer.observe(root,{attributes:true,attributeFilter:['data-public-structure','data-public-responsive-mode']});observer.observe(document.head,{childList:true});window.addEventListener('resize',scheduleSync,{passive:true});window.addEventListener('orientationchange',scheduleSync,{passive:true});window.addEventListener('pageshow',scheduleSync);document.addEventListener('DOMContentLoaded',scheduleSync,{once:true});scheduleSync();
})();

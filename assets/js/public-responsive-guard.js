(() => {
  'use strict';
  if (window.__BRGY_RESPONSIVE_GUARD__) return;
  window.__BRGY_RESPONSIVE_GUARD__ = true;

  const BREAKPOINT = 900;
  const GUARD_VERSION = '20260901-designfix1';
  const root = document.documentElement;
  let scheduled = false;

  function isCompactNavigation(){ return window.innerWidth < BREAKPOINT; }

  function ensureStyle(selector,file,key){
    let link=document.querySelector(selector);
    if(!link){
      link=document.createElement('link');
      link.rel='stylesheet';
      link.href=`assets/css/${file}?v=${GUARD_VERSION}`;
      link.setAttribute(key,'true');
      document.head.appendChild(link);
      return link;
    }
    if(!link.href.includes(GUARD_VERSION)) link.href=`assets/css/${file}?v=${GUARD_VERSION}`;
    return link;
  }

  function ensureStyleLast(selector,file,key){
    const link=ensureStyle(selector,file,key);
    if(document.head.lastElementChild!==link) document.head.appendChild(link);
    return link;
  }

  function ensureScript(selector,file,key){
    let script=document.querySelector(selector);
    if(script) return script;
    script=document.createElement('script');
    script.src=`assets/js/${file}?v=${GUARD_VERSION}`;
    script.setAttribute(key,'true');
    document.head.appendChild(script);
    return script;
  }

  function ensureResponsiveAssets(){
    /* Keep the proven mobile safety CSS, then place the Design Studio bridge after it so saved layout choices can win safely. */
    ensureStyle('link[data-brgy-mobile-menu-fix]','mobile-menu-fix.css','data-brgy-mobile-menu-fix');
    ensureScript('script[data-brgy-design-runtime-fix]','design-runtime-fix.js','data-brgy-design-runtime-fix');
    ensureStyleLast('link[data-brgy-design-runtime-fix]','design-runtime-fix.css','data-brgy-design-runtime-fix');
  }

  function setDatasetValue(key,value){ if(root.dataset[key]!==value) root.dataset[key]=value; }

  function syncStructure(){
    const compact=isCompactNavigation();
    const structure=compact?'mobile-locked':'desktop-wide';
    setDatasetValue('publicStructure',structure);
    setDatasetValue('publicResponsiveMode',structure);

    const body=document.body;
    const nav=document.getElementById('mainNav');
    const toggler=document.querySelector('.site-header .navbar-toggler');

    document.querySelectorAll('.public-nav-backdrop').forEach((node)=>node.remove());

    if(!compact){
      body?.classList.remove('public-menu-open');
      /* Do not force-close the Design Studio desktop menu here; design-runtime-fix owns it. */
      if(root.dataset.publicNavRequestedMode!=='menu'){
        nav?.classList.remove('show','collapsing');
        nav?.setAttribute('aria-hidden','false');
        toggler?.setAttribute('aria-expanded','false');
        toggler?.setAttribute('aria-label','Open navigation');
      }
    }else if(!body?.classList.contains('public-menu-open')){
      nav?.classList.remove('show','collapsing');
      nav?.setAttribute('aria-hidden','true');
      toggler?.setAttribute('aria-expanded','false');
    }

    ensureResponsiveAssets();
  }

  function scheduleSync(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;syncStructure();});
  }

  const observer=new MutationObserver((mutations)=>{
    for(const mutation of mutations){
      if(mutation.type==='attributes'&&mutation.target===root){scheduleSync();return;}
      if(mutation.type==='childList'&&mutation.target===document.head){scheduleSync();return;}
    }
  });
  observer.observe(root,{attributes:true,attributeFilter:['data-public-structure','data-public-responsive-mode','data-public-nav-requested','data-public-nav-requested-mode','data-public-nav-requested-align']});
  observer.observe(document.head,{childList:true});

  window.addEventListener('resize',scheduleSync,{passive:true});
  window.addEventListener('orientationchange',scheduleSync,{passive:true});
  window.addEventListener('pageshow',scheduleSync);
  document.addEventListener('DOMContentLoaded',scheduleSync,{once:true});
  scheduleSync();
})();

(() => {
  'use strict';

  const SUPABASE_URL = 'https://pkvorwvkqjnbgktkgjhr.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RbaENAflMzLgXpemymGApA_TkVAhMoU';
  const STAFF_ASSET_VERSION = '20260901-gov10';
  const GOV_THEME_VERSION = '20260901-gov10';
  const HEADER_TEXT_VERSION = '20260901-header1';
  const path = window.location.pathname;
  const isStaffPage = /\/(admin|editor)\//.test(path);
  const isAccessPage = /\/(admin|editor)\/(?:login|apply|activate)\.html$/.test(path);
  const isDesignStudio = /\/admin\/design-studio\.html$/.test(path);
  const thisScript = document.currentScript?.src || new URL('assets/js/supabase-config.js', location.href).href;

  window.BRGY_SUPABASE_CONFIG = { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY };

  function registerCacheManager(){
    if(!('serviceWorker' in navigator)||location.protocol!=='https:')return;
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register(new URL('../sw.js',location.href),{updateViaCache:'none'}).then((registration)=>registration.update()).catch((error)=>console.warn('Cache manager unavailable:',error));
    },{once:true});
  }
  registerCacheManager();

  function clearLegacyStaffThemeBootCache(){
    if(!isStaffPage)return;
    try{
      [
        'brgyweb:design-theme:v9','brgyweb:design-theme:v8','brgyweb:design-theme:v7',
        'brgyweb:design-theme:v6','brgyweb:design-theme:v1'
      ].forEach((key)=>localStorage.removeItem(key));
    }catch{}
  }

  function syncReady(){const root=document.documentElement;if(root.dataset.adminShellReady==='true'&&root.dataset.adminThemeReady==='true')root.dataset.adminUiReady='true';}
  function markAssetFailure(kind){const root=document.documentElement;if(kind==='theme')root.dataset.adminThemeReady='true';if(kind==='shell')root.dataset.adminShellReady='true';syncReady();}
  function addStaffScript(src,dataKey){
    if(document.querySelector(`script[${dataKey}]`))return null;
    const script=document.createElement('script');
    script.src=src;
    script.async=false;
    script.setAttribute(dataKey,'true');
    document.head.appendChild(script);
    return script;
  }
  function addStaffStyle(href,dataKey){
    if(document.querySelector(`link[${dataKey}]`))return null;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    link.setAttribute(dataKey,'true');
    document.head.appendChild(link);
    return link;
  }

  function ensureAuthorityLast(){
    const link=document.querySelector('link[data-brgy-government-theme-authority]');
    if(link&&link.parentNode===document.head)document.head.appendChild(link);
  }

  function loadStaffAssets(){
    if(!isStaffPage)return;
    addStaffStyle(`../assets/css/premium-admin.css?v=${STAFF_ASSET_VERSION}`,'data-brgy-premium-admin');
    if(!isAccessPage)addStaffStyle(`../assets/css/admin-steady-shell.css?v=${STAFF_ASSET_VERSION}`,'data-brgy-admin-steady-shell');
    if(!document.querySelector('script[data-brgy-design-theme]')){
      const script=addStaffScript(`../assets/js/design-theme.js?v=${STAFF_ASSET_VERSION}`,'data-brgy-design-theme');
      script?.addEventListener('error',()=>markAssetFailure('theme'),{once:true});
      script?.addEventListener('load',()=>setTimeout(ensureAuthorityLast,0),{once:true});
    }
    if(!isAccessPage&&!document.querySelector('script[data-brgy-admin-shell]')){
      const shellScript=addStaffScript(`../assets/js/admin-shell.js?v=${STAFF_ASSET_VERSION}`,'data-brgy-admin-shell');
      shellScript?.addEventListener('error',()=>markAssetFailure('shell'),{once:true});
    }
    if(!isAccessPage)addStaffScript(`../assets/js/staff-forms-nav.js?v=${STAFF_ASSET_VERSION}`,'data-brgy-staff-forms-nav');
    if(!isAccessPage)addStaffScript(`../assets/js/admin-table-tools.js?v=${STAFF_ASSET_VERSION}`,'data-brgy-admin-table-tools');
  }

  function loadGovernmentThemeAssets(){
    if(!document.querySelector('link[data-brgy-government-themes]')){
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href=new URL(`../css/government-themes.css?v=${GOV_THEME_VERSION}`,thisScript).href;
      link.dataset.brgyGovernmentThemes='true';
      document.head.appendChild(link);
    }
    if(!document.querySelector('link[data-brgy-government-theme-authority]')){
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href=new URL(`../css/government-theme-authority.css?v=${GOV_THEME_VERSION}`,thisScript).href;
      link.dataset.brgyGovernmentThemeAuthority='true';
      document.head.appendChild(link);
    }
    if(!document.querySelector('script[data-brgy-government-theme-runtime]')){
      const script=document.createElement('script');
      script.src=new URL(`government-theme-runtime.js?v=${GOV_THEME_VERSION}`,thisScript).href;
      script.async=false;
      script.dataset.brgyGovernmentThemeRuntime='true';
      document.head.appendChild(script);
    }
    ensureAuthorityLast();
    requestAnimationFrame(ensureAuthorityLast);
    setTimeout(ensureAuthorityLast,250);
    setTimeout(ensureAuthorityLast,1000);
  }

  function loadHeaderTextAssets(){
    addStaffStyle(new URL(`../css/header-text-color.css?v=${HEADER_TEXT_VERSION}`,thisScript).href,'data-brgy-header-text-color');
    addStaffScript(new URL(`header-text-runtime.js?v=${HEADER_TEXT_VERSION}`,thisScript).href,'data-brgy-header-text-runtime');
    if(isDesignStudio)addStaffScript(new URL(`design-studio-header-text.js?v=${HEADER_TEXT_VERSION}`,thisScript).href,'data-brgy-design-studio-header-text');
  }

  if(!window.supabase||typeof window.supabase.createClient!=='function'){
    console.error('Supabase client library is not loaded.');
    return;
  }

  window.BRGY_SUPABASE=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

  /* Staff pages must not paint stale Design Studio colors before the published theme arrives. */
  clearLegacyStaffThemeBootCache();
  loadStaffAssets();
  loadGovernmentThemeAssets();
  loadHeaderTextAssets();
})();

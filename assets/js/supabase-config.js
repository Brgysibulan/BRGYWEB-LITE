(() => {
  'use strict';

  const SUPABASE_URL = 'https://pkvorwvkqjnbgktkgjhr.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RbaENAflMzLgXpemymGApA_TkVAhMoU';
  const ASSET_VERSION = '20260902-plain1';
  const path = window.location.pathname;
  const isStaffPage = /\/(admin|editor)\//.test(path);
  const isAccessPage = /\/(admin|editor)\/(?:login|apply|activate)\.html$/.test(path);
  const thisScript = document.currentScript?.src || new URL('assets/js/supabase-config.js', location.href).href;

  window.BRGY_SUPABASE_CONFIG = { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY };

  function absoluteAssetUrl(value) {
    try { return new URL(value, document.baseURI).href; }
    catch { return value; }
  }

  function addScript(src, dataKey) {
    const absoluteSrc = absoluteAssetUrl(src);
    const existing = Array.from(document.scripts).find((script) => script.hasAttribute(dataKey) || script.src === absoluteSrc);
    if (existing) {
      existing.setAttribute(dataKey, 'true');
      return existing;
    }
    const script = document.createElement('script');
    script.src = absoluteSrc;
    script.async = false;
    script.setAttribute(dataKey, 'true');
    document.head.appendChild(script);
    return script;
  }

  function addStyle(href, dataKey) {
    const absoluteHref = absoluteAssetUrl(href);
    const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((link) => link.hasAttribute(dataKey) || link.href === absoluteHref);
    if (existing) {
      existing.setAttribute(dataKey, 'true');
      return existing;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = absoluteHref;
    link.setAttribute(dataKey, 'true');
    document.head.appendChild(link);
    return link;
  }

  function registerCacheManager() {
    if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('../sw.js', location.href), { updateViaCache:'none' })
        .then((registration) => registration.update())
        .catch((error) => console.warn('Cache manager unavailable:', error));
    }, { once:true });
  }

  function markPlainReady() {
    const root = document.documentElement;
    root.dataset.adminThemeReady = 'true';
    if (root.dataset.adminShellReady === 'true') root.dataset.adminUiReady = 'true';
  }

  function clearOldThemeCaches() {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (/^brgyweb:(design-theme|gov-theme|system-brand-main)/.test(key)) localStorage.removeItem(key);
      });
    } catch {}
  }

  addStyle(new URL(`../css/plain.css?v=${ASSET_VERSION}`, thisScript).href, 'data-brgy-plain-style');
  clearOldThemeCaches();

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase client library is not loaded.');
    markPlainReady();
    return;
  }

  window.BRGY_SUPABASE = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
  });

  if (isStaffPage && !isAccessPage) {
    addStyle(`../assets/css/admin-steady-shell.css?v=${ASSET_VERSION}`, 'data-brgy-admin-steady-shell');
    addStyle(`../assets/css/admin-shell.css?v=${ASSET_VERSION}`, 'data-brgy-admin-shell');
    addScript(`../assets/js/admin-shell-prime.js?v=${ASSET_VERSION}`, 'data-brgy-admin-shell-prime');
    addScript(`../assets/js/admin-shell.js?v=${ASSET_VERSION}`, 'data-brgy-admin-shell');
    addScript(`../assets/js/staff-forms-nav.js?v=${ASSET_VERSION}`, 'data-brgy-staff-forms-nav');
    addScript(`../assets/js/admin-table-tools.js?v=${ASSET_VERSION}`, 'data-brgy-admin-table-tools');
  }

  markPlainReady();
  registerCacheManager();
})();
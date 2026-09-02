/**
 * BRGYWEB-LITE — Supabase Core Configuration
 * Purpose: Initialize the shared Supabase client and load staff-wide runtime modules.
 * Depends on: Supabase JS browser library
 * Used by: public, admin, and editor pages that require Supabase.
 */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://pkvorwvkqjnbgktkgjhr.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RbaENAflMzLgXpemymGApA_TkVAhMoU';
  const ASSET_VERSION = '20260902-modern-lgu1';
  const path = window.location.pathname;
  const isStaffPage = /\/(admin|editor)\//.test(path);
  const isAccessPage = /\/(admin|editor)\/(?:login|apply|activate)\.html$/.test(path);

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

  function registerCacheManager() {
    if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('../sw.js', location.href), { updateViaCache:'none' })
        .then((registration) => registration.update())
        .catch((error) => console.warn('Cache manager unavailable:', error));
    }, { once:true });
  }

  function markReady() {
    const root = document.documentElement;
    root.dataset.adminThemeReady = 'true';
    if (root.dataset.adminShellReady === 'true') root.dataset.adminUiReady = 'true';
  }

  try {
    Object.keys(localStorage).forEach((key) => {
      if (/^brgyweb:(design-theme|gov-theme|system-brand-main)/.test(key)) localStorage.removeItem(key);
    });
  } catch {}

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase client library is not loaded.');
    markReady();
    return;
  }

  window.BRGY_SUPABASE = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
  });

  if (isStaffPage && !isAccessPage) {
    addScript(`../assets/js/admin/shell-prime.js?v=${ASSET_VERSION}`, 'data-brgy-admin-shell-prime');
    addScript(`../assets/js/admin/shell.js?v=${ASSET_VERSION}`, 'data-brgy-admin-shell');
    addScript(`../assets/js/editor/forms-nav.js?v=${ASSET_VERSION}`, 'data-brgy-staff-forms-nav');
  } else if (!isStaffPage) {
    addScript(`assets/js/public/color-preset.js?v=${ASSET_VERSION}`, 'data-brgy-color-preset');
  }

  markReady();
  registerCacheManager();
})();

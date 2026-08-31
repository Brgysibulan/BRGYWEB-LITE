(() => {
  'use strict';

  const SUPABASE_URL = 'https://pkvorwvkqjnbgktkgjhr.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RbaENAflMzLgXpemymGApA_TkVAhMoU';
  const STAFF_ASSET_VERSION = '20260901-premium1';
  const path = window.location.pathname;
  const isStaffPage = /\/(admin|editor)\//.test(path);
  const isAccessPage = /\/(admin|editor)\/(?:login|apply|activate)\.html$/.test(path);
  const isDesignStudio = /\/admin\/design-studio\.html$/.test(path);

  window.BRGY_SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    publishableKey: SUPABASE_PUBLISHABLE_KEY
  };

  function syncReady() {
    const root = document.documentElement;
    if (root.dataset.adminShellReady === 'true' && root.dataset.adminThemeReady === 'true') {
      root.dataset.adminUiReady = 'true';
    }
  }

  function markAssetFailure(kind) {
    const root = document.documentElement;
    if (kind === 'theme') root.dataset.adminThemeReady = 'true';
    if (kind === 'shell') root.dataset.adminShellReady = 'true';
    syncReady();
  }

  function addStaffScript(src, dataKey) {
    if (document.querySelector(`script[${dataKey}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.setAttribute(dataKey, 'true');
    document.head.appendChild(script);
  }

  function addStaffStyle(href, dataKey) {
    if (document.querySelector(`link[${dataKey}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(dataKey, 'true');
    document.head.appendChild(link);
  }

  function loadStaffAssets() {
    if (!isStaffPage) return;

    addStaffStyle(`../assets/css/premium-admin.css?v=${STAFF_ASSET_VERSION}`, 'data-brgy-premium-admin');

    // Admin design settings also apply to login / access pages.
    if (!isDesignStudio && !document.querySelector('script[data-brgy-design-theme]')) {
      const script = document.createElement('script');
      script.src = `../assets/js/design-theme.js?v=${STAFF_ASSET_VERSION}`;
      script.dataset.brgyDesignTheme = 'true';
      script.addEventListener('error', () => markAssetFailure('theme'), { once:true });
      document.head.appendChild(script);
    }

    // The unified sidebar/navigation shell is only for authenticated workspaces.
    if (!isAccessPage && !document.querySelector('script[data-brgy-admin-shell]')) {
      const shellScript = document.createElement('script');
      shellScript.src = `../assets/js/admin-shell.js?v=${STAFF_ASSET_VERSION}`;
      shellScript.dataset.brgyAdminShell = 'true';
      shellScript.addEventListener('error', () => markAssetFailure('shell'), { once:true });
      document.head.appendChild(shellScript);
    }

    // Shared content tool entry for both System Admin and Content Admin.
    if (!isAccessPage) {
      addStaffScript(`../assets/js/staff-forms-nav.js?v=${STAFF_ASSET_VERSION}`, 'data-brgy-staff-forms-nav');
    }

    if (!isAccessPage) {
      window.setTimeout(() => {
        const root = document.documentElement;
        if (root.dataset.adminUiReady !== 'true') {
          console.warn('Admin UI boot exceeded safe wait time; releasing the interface fallback.');
          root.dataset.adminShellReady = 'true';
          root.dataset.adminThemeReady = 'true';
          root.dataset.adminUiReady = 'true';
          root.classList.remove('admin-menu-open');
          document.querySelector('.admin-mobile-overlay')?.setAttribute('aria-hidden','true');
        }
      }, 4500);
    }
  }

  loadStaffAssets();

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('Supabase client library is not loaded; interface fallback remains available.');
    return;
  }

  window.BRGY_SUPABASE = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();

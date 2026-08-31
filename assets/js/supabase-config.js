(() => {
  'use strict';

  const SUPABASE_URL = 'https://pkvorwvkqjnbgktkgjhr.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RbaENAflMzLgXpemymGApA_TkVAhMoU';

  window.BRGY_SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    publishableKey: SUPABASE_PUBLISHABLE_KEY
  };

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('Supabase client library is not loaded; config remains available for direct API calls.');
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

  const path = window.location.pathname;
  const isStaffPage = /\/(admin|editor)\//.test(path);
  const isLoginPage = /\/(admin|editor)\/login\.html$/.test(path);
  const isDesignStudio = /\/admin\/design-studio\.html$/.test(path);

  if (isStaffPage && !isDesignStudio && !document.querySelector('script[data-brgy-design-theme]')) {
    const script = document.createElement('script');
    script.src = '../assets/js/design-theme.js';
    script.dataset.brgyDesignTheme = 'true';
    document.head.appendChild(script);
  }

  if (isStaffPage && !isLoginPage && !document.querySelector('script[data-brgy-admin-shell]')) {
    const shellScript = document.createElement('script');
    shellScript.src = '../assets/js/admin-shell.js';
    shellScript.dataset.brgyAdminShell = 'true';
    document.head.appendChild(shellScript);
  }

  if (isStaffPage && !isLoginPage) {
    window.setTimeout(() => {
      const root = document.documentElement;
      if (root.dataset.adminUiReady !== 'true') {
        console.warn('Admin UI boot exceeded safe wait time; revealing current interface.');
        root.dataset.adminUiReady = 'true';
      }
    }, 6000);
  }
})();

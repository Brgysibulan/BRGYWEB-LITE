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

  const isStaffPage = /\/(admin|editor)\//.test(window.location.pathname);
  const isDesignStudio = /\/admin\/design-studio\.html$/.test(window.location.pathname);
  if (isStaffPage && !isDesignStudio && !document.querySelector('script[data-brgy-design-theme]')) {
    const script = document.createElement('script');
    script.src = '../assets/js/design-theme.js';
    script.dataset.brgyDesignTheme = 'true';
    document.head.appendChild(script);
  }
})();
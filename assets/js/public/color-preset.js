/** BRGYWEB-LITE — fixed Modern LGU color preset runtime */
(() => {
  'use strict';

  const DEFAULT_PRESET = 'heritage-green';
  const ALLOWED = new Set(['civic-blue','heritage-green','public-maroon','executive-indigo']);
  const CACHE_KEY = 'brgyweb:color-preset:v1';

  function normalize(value) {
    return ALLOWED.has(value) ? value : DEFAULT_PRESET;
  }

  function apply(value) {
    const preset = normalize(value);
    document.documentElement.dataset.colorPreset = preset;
    try { localStorage.setItem(CACHE_KEY, preset); } catch {}
    return preset;
  }

  try { apply(localStorage.getItem(CACHE_KEY) || DEFAULT_PRESET); }
  catch { apply(DEFAULT_PRESET); }

  async function refresh() {
    const config = window.BRGY_SUPABASE_CONFIG;
    if (!config?.url || !config?.publishableKey) return;
    try {
      const endpoint = `${config.url}/rest/v1/site_settings?id=eq.1&select=color_preset`;
      const response = await fetch(endpoint, {
        cache:'no-store',
        headers:{ apikey:config.publishableKey, Authorization:`Bearer ${config.publishableKey}`, Accept:'application/json' }
      });
      if (!response.ok) return;
      const rows = await response.json();
      apply(Array.isArray(rows) ? rows[0]?.color_preset : DEFAULT_PRESET);
    } catch (error) {
      console.warn('Unable to refresh color preset:', error);
    }
  }

  refresh();
  window.BRGY_COLOR_PRESET = Object.freeze({ apply, refresh, allowed:[...ALLOWED] });
})();

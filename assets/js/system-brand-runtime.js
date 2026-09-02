(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const CACHE_KEY = 'brgyweb:system-brand:v1';
  const DEFAULTS = Object.freeze({ name: 'BRGYWEB-LITE', tagline: 'Administration Access', logoUrl: '' });

  function normalize(input = {}) {
    const name = String(input.name || DEFAULTS.name).trim().slice(0, 60) || DEFAULTS.name;
    const tagline = String(input.tagline || DEFAULTS.tagline).trim().slice(0, 100) || DEFAULTS.tagline;
    let logoUrl = String(input.logoUrl || '').trim();
    if (logoUrl && !/^https:\/\//i.test(logoUrl)) logoUrl = '';
    return { name, tagline, logoUrl };
  }

  function readCache() {
    try { return normalize(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') || {}); }
    catch { return { ...DEFAULTS }; }
  }

  function writeCache(brand) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(normalize(brand))); } catch {}
  }

  function mark(node, brand) {
    if (!node) return;
    if (node.matches?.('[data-system-brand-name],.sidebar-brand,.access-brand strong')) node.textContent = brand.name;
    if (node.matches?.('[data-system-brand-tagline],.access-brand small')) node.textContent = brand.tagline;
    if (node.matches?.('[data-system-brand-logo],.sidebar-logo,.access-brand-mark')) {
      if (brand.logoUrl) {
        node.innerHTML = `<img src="${brand.logoUrl.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}" alt="" style="width:100%;height:100%;object-fit:contain;display:block">`;
        node.classList.add('has-system-brand-logo');
      } else {
        node.textContent = (brand.name.charAt(0) || 'B').toUpperCase();
        node.classList.remove('has-system-brand-logo');
      }
    }
  }

  function apply(brandInput) {
    const brand = normalize(brandInput);
    document.querySelectorAll('[data-system-brand-name],.sidebar-brand,.access-brand strong').forEach((node) => mark(node, brand));
    document.querySelectorAll('[data-system-brand-tagline],.access-brand small').forEach((node) => mark(node, brand));
    document.querySelectorAll('[data-system-brand-logo],.sidebar-logo,.access-brand-mark').forEach((node) => mark(node, brand));
    if (document.title.includes('BRGYWEB-LITE')) document.title = document.title.replaceAll('BRGYWEB-LITE', brand.name);
    document.documentElement.dataset.systemBrandReady = 'true';
    window.dispatchEvent(new CustomEvent('brgyweb:system-brand', { detail: brand }));
    return brand;
  }

  let current = apply(readCache());

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        mark(node, current);
        node.querySelectorAll?.('[data-system-brand-name],.sidebar-brand,.access-brand strong,[data-system-brand-tagline],.access-brand small,[data-system-brand-logo],.sidebar-logo,.access-brand-mark').forEach((child) => mark(child, current));
      });
    }
  });
  const startObserver = () => observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.documentElement) startObserver();

  async function refresh() {
    if (!client) return current;
    try {
      const { data, error } = await client.from('site_settings').select('design_theme').eq('id', 1).single();
      if (error) throw error;
      const next = normalize(data?.design_theme?.systemBrand || DEFAULTS);
      writeCache(next);
      current = apply(next);
    } catch (error) {
      console.warn('Unable to refresh system brand:', error);
    }
    return current;
  }

  window.BRGY_SYSTEM_BRAND = {
    defaults: { ...DEFAULTS },
    cached: readCache,
    apply(brand) { current = apply(brand); writeCache(current); return current; },
    refresh,
    normalize
  };

  refresh();
})();
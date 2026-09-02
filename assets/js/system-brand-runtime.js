(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const CACHE_KEY = 'brgyweb:system-brand:v1';
  const MAIN_COLOR_CACHE_KEY = 'brgyweb:system-brand-main:v1';
  const DEFAULT_MAIN = '#0b2f21';
  const DEFAULTS = Object.freeze({ name: 'BRGYWEB-LITE', tagline: 'Administration Access', logoUrl: '' });

  function normalize(input = {}) {
    const name = String(input.name || DEFAULTS.name).trim().slice(0, 60) || DEFAULTS.name;
    const tagline = String(input.tagline || DEFAULTS.tagline).trim().slice(0, 100) || DEFAULTS.tagline;
    let logoUrl = String(input.logoUrl || '').trim();
    if (logoUrl && !/^https:\/\//i.test(logoUrl)) logoUrl = '';
    return { name, tagline, logoUrl };
  }

  function normalizeHex(value, fallback = DEFAULT_MAIN) {
    const text = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
  }

  function contrastText(hex) {
    const value = normalizeHex(hex).slice(1);
    const channels = [0,2,4].map((index) => parseInt(value.slice(index,index+2),16) / 255).map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    return luminance > 0.42 ? '#17201a' : '#ffffff';
  }

  function readCache() {
    try { return normalize(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') || {}); }
    catch { return { ...DEFAULTS }; }
  }

  function writeCache(brand) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(normalize(brand))); } catch {}
  }

  function readMainColorCache() {
    try { return normalizeHex(localStorage.getItem(MAIN_COLOR_CACHE_KEY) || DEFAULT_MAIN); }
    catch { return DEFAULT_MAIN; }
  }

  function applyMainColor(value) {
    const main = normalizeHex(value);
    const onMain = contrastText(main);
    const root = document.documentElement;
    root.style.setProperty('--system-brand-main', main);
    root.style.setProperty('--system-brand-on-main', onMain);
    try { localStorage.setItem(MAIN_COLOR_CACHE_KEY, main); } catch {}
    return main;
  }

  function bindLogoTheme(node, hasImage) {
    if (!node) return;
    if (hasImage) {
      node.style.removeProperty('background');
      node.style.removeProperty('background-color');
      node.style.removeProperty('color');
      node.style.removeProperty('border');
      node.style.removeProperty('box-shadow');
      return;
    }
    node.style.setProperty('background', 'var(--system-brand-main)');
    node.style.setProperty('color', 'var(--system-brand-on-main)');
    node.style.setProperty('border', '1px solid color-mix(in srgb, var(--system-brand-on-main) 42%, transparent)');
    node.style.setProperty('box-shadow', 'inset 0 0 0 1px color-mix(in srgb, var(--system-brand-on-main) 10%, transparent)');
  }

  function mark(node, brand) {
    if (!node) return;
    if (node.matches?.('[data-system-brand-name],.sidebar-brand,.access-brand strong')) node.textContent = brand.name;
    if (node.matches?.('[data-system-brand-tagline],.access-brand small')) node.textContent = brand.tagline;
    if (node.matches?.('[data-system-brand-logo],.sidebar-logo,.access-brand-mark')) {
      if (brand.logoUrl) {
        node.innerHTML = `<img src="${brand.logoUrl.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}" alt="" style="width:100%;height:100%;object-fit:contain;display:block">`;
        node.classList.add('has-system-brand-logo');
        bindLogoTheme(node, true);
      } else {
        node.textContent = (brand.name.charAt(0) || 'B').toUpperCase();
        node.classList.remove('has-system-brand-logo');
        bindLogoTheme(node, false);
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

  applyMainColor(readMainColorCache());
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
      const savedTheme = data?.design_theme || {};
      applyMainColor(savedTheme?.public?.colors?.primary || DEFAULT_MAIN);
      const next = normalize(savedTheme?.systemBrand || DEFAULTS);
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
    normalize,
    applyMainColor
  };

  refresh();
})();
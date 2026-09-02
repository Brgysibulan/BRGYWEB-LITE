/**
 * BRGYWEB-LITE — Public Site Runtime
 * Purpose: Load, cache, and apply shared public barangay identity and site settings.
 * Depends on: core/supabase-config.js and core/site-config.js
 * Used by: resident-facing pages.
 */
(() => {
  'use strict';

  const SITE_CACHE_VERSION = 4;
  const SITE_CACHE_KEY = 'brgyweb:site-settings:v4';
  const LEGACY_SITE_CACHE_KEYS = ['brgyweb:site-settings:v3','brgyweb:site-settings:v2'];
  const INITIAL_TITLE = document.title;
  const DEFAULT_SITE = Object.freeze({
    siteName:'Barangay Website', shortName:'Barangay', municipality:'Municipality', province:'Province',
    tagline:'Official Community Website', heroTitle:'Welcome to Our Barangay',
    heroText:'A simple, accessible, and transparent digital home for barangay information, services, programs, and community updates.',
    address:'Barangay Office Address', phone:'', email:'', logoUrl:''
  });

  function setText(id, value, fallback='') {
    const element = document.getElementById(id);
    if (!element) return;
    const text = typeof value === 'string' ? value.trim() : '';
    element.textContent = text || fallback;
  }

  function isHttpsUrl(value) {
    try { return new URL(value).protocol === 'https:'; }
    catch { return false; }
  }

  // Cache
  function readCachedSettings() {
    try {
      const raw = localStorage.getItem(SITE_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.version !== SITE_CACHE_VERSION) return null;
      return parsed?.data && typeof parsed.data === 'object' ? parsed.data : null;
    } catch { return null; }
  }

  function writeCachedSettings(site) {
    try {
      localStorage.setItem(SITE_CACHE_KEY, JSON.stringify({ version:SITE_CACHE_VERSION, savedAt:Date.now(), data:site }));
      LEGACY_SITE_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {}
  }

  function mergeSite(base={}, next={}) { return { ...base, ...next }; }

  // Rendering
  function applyLogo(site) {
    const logo = document.getElementById('brand-logo');
    const mark = document.getElementById('brand-mark');
    const logoUrl = isHttpsUrl(site.logoUrl) ? site.logoUrl : '';
    const markText = String(site.shortName || site.siteName || 'B').trim().charAt(0).toUpperCase() || 'B';
    if (mark) mark.textContent = markText;
    if (logo && mark) {
      if (logoUrl) {
        logo.src = logoUrl;
        logo.alt = `${site.siteName} logo`;
        logo.classList.remove('d-none');
        mark.classList.add('d-none');
        logo.addEventListener('error', () => { logo.classList.add('d-none'); mark.classList.remove('d-none'); }, { once:true });
      } else {
        logo.removeAttribute('src');
        logo.classList.add('d-none');
        mark.classList.remove('d-none');
      }
    }
  }

  function applyDocumentTitle(siteName) {
    const raw = INITIAL_TITLE.trim();
    const isHome = /^(Barangay Website|Home)$/i.test(raw) || /(?:^|\/)index\.html$/i.test(window.location.pathname) || window.location.pathname.endsWith('/');
    if (isHome) { document.title = siteName; return; }
    const pageTitle = raw.replace(/\s*\|\s*Barangay Website\s*$/i,'').replace(/^Barangay\s+/i,'').trim();
    document.title = `${pageTitle || 'Official Website'} | ${siteName}`;
  }

  function applySiteSettings(settings={}) {
    const site = { ...DEFAULT_SITE, ...settings };
    setText('site-name', site.siteName, '');
    setText('hero-title', site.heroTitle, DEFAULT_SITE.heroTitle);
    setText('hero-text', site.heroText, DEFAULT_SITE.heroText);
    setText('footer-name', site.siteName, '');
    setText('footer-address', site.address, '');
    setText('footer-contact', [site.phone,site.email].filter(Boolean).join(' • '), '');
    setText('copyright-name', site.siteName, '');
    const eyebrow = document.querySelector('.hero-section .eyebrow');
    if (eyebrow) eyebrow.textContent = site.tagline || DEFAULT_SITE.tagline;
    applyLogo(site);
    applyDocumentTitle(site.siteName || DEFAULT_SITE.siteName);
    document.documentElement.dataset.siteSettingsReady = 'true';
    return site;
  }

  // Data loading
  function mapSupabaseSettings(row) {
    if (!row) return null;
    const locationParts = [row.municipality_city,row.province].filter(Boolean);
    return {
      siteName:row.barangay_name || DEFAULT_SITE.siteName, shortName:row.barangay_name || DEFAULT_SITE.shortName,
      municipality:row.municipality_city || '', province:row.province || '',
      tagline:locationParts.length ? `Official Website • ${locationParts.join(', ')}` : DEFAULT_SITE.tagline,
      heroTitle:row.hero_title || DEFAULT_SITE.heroTitle, heroText:row.hero_text || DEFAULT_SITE.heroText,
      address:row.address || DEFAULT_SITE.address, phone:row.contact_number || '', email:row.email || '', logoUrl:row.logo_url || ''
    };
  }

  async function loadRemoteSettings() {
    const config = window.BRGY_SUPABASE_CONFIG;
    if (!config?.url || !config?.publishableKey) return null;
    const endpoint = `${config.url}/rest/v1/site_settings?id=eq.1&select=barangay_name,municipality_city,province,address,contact_number,email,logo_url,hero_title,hero_text`;
    const response = await fetch(endpoint, { cache:'no-store', headers:{ apikey:config.publishableKey, Authorization:`Bearer ${config.publishableKey}`, Accept:'application/json' } });
    if (!response.ok) throw new Error(`Site settings request failed (${response.status}).`);
    const rows = await response.json();
    return mapSupabaseSettings(Array.isArray(rows) ? rows[0] : null);
  }

  // Initialization
  function initYear() { setText('current-year', String(new Date().getFullYear())); }
  const fallback = window.BRGYWEB_CONFIG || {};
  const earlyCache = readCachedSettings();
  if (earlyCache) { applySiteSettings(mergeSite(fallback, earlyCache)); initYear(); }

  async function boot() {
    const cached = readCachedSettings();
    initYear();
    if (cached) applySiteSettings(mergeSite(fallback, cached));
    try {
      const remote = await loadRemoteSettings();
      if (remote) {
        const merged = mergeSite(fallback, remote);
        applySiteSettings(merged);
        writeCachedSettings(merged);
      } else if (!cached) applySiteSettings(fallback);
    } catch (error) {
      console.warn('Unable to refresh site settings; using last known settings:', error);
      if (!cached) applySiteSettings(fallback);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
  window.BRGYWEB = Object.freeze({ applySiteSettings, loadRemoteSettings, readCachedSettings });
})();
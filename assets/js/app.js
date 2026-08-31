(() => {
  'use strict';

  const DEFAULT_SITE = Object.freeze({
    siteName: 'Barangay Website',
    shortName: 'Barangay',
    municipality: 'Municipality',
    province: 'Province',
    tagline: 'Official Community Website',
    heroTitle: 'Welcome to Our Barangay',
    heroText: 'A simple, accessible, and transparent digital home for barangay information, services, programs, and community updates.',
    address: 'Barangay Office Address',
    phone: '',
    email: '',
    theme: {
      primary: '#0f5132',
      secondary: '#198754',
      accent: '#ffc107',
      surface: '#f7f9f8',
      text: '#1f2937'
    }
  });

  function setText(id, value, fallback = '') {
    const element = document.getElementById(id);
    if (!element) return;
    const text = typeof value === 'string' ? value.trim() : '';
    element.textContent = text || fallback;
  }

  function applyTheme(theme = {}) {
    const root = document.documentElement;
    const merged = { ...DEFAULT_SITE.theme, ...theme };
    root.style.setProperty('--brand-primary', merged.primary);
    root.style.setProperty('--brand-secondary', merged.secondary);
    root.style.setProperty('--brand-accent', merged.accent);
    root.style.setProperty('--surface-soft', merged.surface);
    root.style.setProperty('--text-main', merged.text);
  }

  function applySiteSettings(settings = {}) {
    const site = {
      ...DEFAULT_SITE,
      ...settings,
      theme: { ...DEFAULT_SITE.theme, ...(settings.theme || {}) }
    };

    setText('site-name', site.siteName, DEFAULT_SITE.siteName);
    setText('hero-title', site.heroTitle, DEFAULT_SITE.heroTitle);
    setText('hero-text', site.heroText, DEFAULT_SITE.heroText);
    setText('footer-name', site.siteName, DEFAULT_SITE.siteName);
    setText('footer-address', site.address, DEFAULT_SITE.address);

    const contact = [site.phone, site.email].filter(Boolean).join(' • ');
    setText('footer-contact', contact, 'Contact information');
    setText('copyright-name', site.siteName, DEFAULT_SITE.siteName);

    const eyebrow = document.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = site.tagline || DEFAULT_SITE.tagline;

    document.title = site.siteName || DEFAULT_SITE.siteName;
    applyTheme(site.theme);
  }

  function mapSupabaseSettings(row) {
    if (!row) return null;
    const locationParts = [row.municipality_city, row.province].filter(Boolean);
    return {
      siteName: row.barangay_name || DEFAULT_SITE.siteName,
      shortName: row.barangay_name || DEFAULT_SITE.shortName,
      municipality: row.municipality_city || '',
      province: row.province || '',
      tagline: locationParts.length ? `Official Website • ${locationParts.join(', ')}` : DEFAULT_SITE.tagline,
      heroTitle: row.hero_title || DEFAULT_SITE.heroTitle,
      heroText: row.hero_text || DEFAULT_SITE.heroText,
      address: row.address || DEFAULT_SITE.address,
      phone: row.contact_number || '',
      email: row.email || '',
      theme: {
        primary: row.primary_color || DEFAULT_SITE.theme.primary,
        secondary: row.secondary_color || DEFAULT_SITE.theme.secondary,
        accent: row.accent_color || DEFAULT_SITE.theme.accent
      }
    };
  }

  async function loadRemoteSettings() {
    const config = window.BRGY_SUPABASE_CONFIG;
    if (!config?.url || !config?.publishableKey) return null;

    const endpoint = `${config.url}/rest/v1/site_settings?id=eq.1&select=barangay_name,municipality_city,province,address,contact_number,email,hero_title,hero_text,primary_color,secondary_color,accent_color`;
    const response = await fetch(endpoint, {
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) throw new Error(`Site settings request failed (${response.status}).`);
    const rows = await response.json();
    return mapSupabaseSettings(Array.isArray(rows) ? rows[0] : null);
  }

  function initYear() {
    setText('current-year', String(new Date().getFullYear()));
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const fallback = window.BRGYWEB_CONFIG || {};
    applySiteSettings(fallback);
    initYear();

    try {
      const remote = await loadRemoteSettings();
      if (remote) applySiteSettings({ ...fallback, ...remote, theme: { ...(fallback.theme || {}), ...(remote.theme || {}) } });
    } catch (error) {
      console.warn('Using local site settings fallback:', error);
    }
  });

  window.BRGYWEB = Object.freeze({ applySiteSettings, loadRemoteSettings });
})();

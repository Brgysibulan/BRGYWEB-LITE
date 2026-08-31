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

  function initYear() {
    setText('current-year', String(new Date().getFullYear()));
  }

  document.addEventListener('DOMContentLoaded', () => {
    applySiteSettings(window.BRGYWEB_CONFIG || {});
    initYear();
  });

  window.BRGYWEB = Object.freeze({ applySiteSettings });
})();

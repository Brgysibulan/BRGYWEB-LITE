(() => {
  'use strict';

  const DEFAULT_SITE = Object.freeze({
    name: 'Barangay Website',
    heroTitle: 'Welcome to Our Barangay',
    heroText: 'A simple, accessible, and transparent digital home for barangay information, services, programs, and community updates.',
    address: 'Barangay Office Address',
    contact: 'Contact information'
  });

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element && typeof value === 'string' && value.trim()) {
      element.textContent = value.trim();
    }
  }

  function applySiteSettings(settings = DEFAULT_SITE) {
    const site = { ...DEFAULT_SITE, ...settings };

    setText('site-name', site.name);
    setText('hero-title', site.heroTitle);
    setText('hero-text', site.heroText);
    setText('footer-name', site.name);
    setText('footer-address', site.address);
    setText('footer-contact', site.contact);
    setText('copyright-name', site.name);

    document.title = site.name;
  }

  function initYear() {
    setText('current-year', String(new Date().getFullYear()));
  }

  document.addEventListener('DOMContentLoaded', () => {
    applySiteSettings();
    initYear();
  });

  // Later, Supabase site_settings will feed this function.
  window.BRGYWEB = Object.freeze({ applySiteSettings });
})();

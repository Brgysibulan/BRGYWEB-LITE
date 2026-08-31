(() => {
  'use strict';

  const SITE_CACHE_KEY = 'brgyweb:site-settings:v2';
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function readCachedSite() {
    try {
      const raw = localStorage.getItem(SITE_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const data = parsed?.data || parsed;
      return data && typeof data === 'object' ? data : null;
    } catch {
      return null;
    }
  }

  const cachedSite = readCachedSite();
  const initialName = cachedSite?.siteName || '';
  const initialAddress = cachedSite?.address || '';
  const initialContact = [cachedSite?.phone, cachedSite?.email].filter(Boolean).join(' • ');
  const initialMark = String(cachedSite?.shortName || cachedSite?.siteName || 'B').trim().charAt(0).toUpperCase() || 'B';

  const navItems = [
    ['index.html', 'Home'],
    ['barangay-profile.html', 'Profile'],
    ['officials.html', 'Officials'],
    ['announcements.html', 'Announcements'],
    ['services.html', 'Services'],
    ['barangay-directory.html', 'Directory'],
    ['barangay-disclosure.html', 'Disclosure'],
    ['gallery.html', 'Gallery'],
    ['verify.html', 'Verify'],
    ['contact.html', 'Contact']
  ];

  const adminMenu = `<li class="nav-item dropdown ms-xl-2"><button class="btn btn-sm btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Admin</button><ul class="dropdown-menu dropdown-menu-end"><li><a class="dropdown-item" href="admin/login.html">System Admin Login</a></li><li><a class="dropdown-item" href="editor/login.html">Content Admin Login</a></li></ul></li>`;

  if (header) {
    header.innerHTML = `<nav class="navbar navbar-expand-xl navbar-dark"><div class="container"><a class="navbar-brand d-flex align-items-center gap-2" href="index.html" aria-label="Home"><span class="brand-mark" id="brand-mark" aria-hidden="true">${escapeHtml(initialMark)}</span><img class="brand-logo d-none" id="brand-logo" alt=""><span id="site-name">${escapeHtml(initialName)}</span></a><button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav ms-auto align-items-xl-center gap-xl-1">${navItems.map(([href,label]) => `<li class="nav-item"><a class="nav-link${page === href ? ' active' : ''}" href="${href}"${page === href ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}${adminMenu}</ul></div></div></nav>`;
  }

  if (footer) {
    footer.classList.add('py-5');
    footer.innerHTML = `<div class="container"><div class="row g-4 align-items-start"><div class="col-lg-7"><h2 class="h5 mb-2" id="footer-name">${escapeHtml(initialName)}</h2><p class="mb-0 text-white-50">Official barangay information, transparency, verification, and public service portal.</p></div><div class="col-lg-5 text-lg-end"><p class="mb-1" id="footer-address">${escapeHtml(initialAddress)}</p><p class="mb-3" id="footer-contact">${escapeHtml(initialContact)}</p><a class="btn btn-sm btn-outline-light" href="contact.html">Contact Barangay Office</a></div></div><hr class="border-light opacity-25 my-4"><p class="small mb-0 text-white-50">&copy; <span id="current-year"></span> <span id="copyright-name">${escapeHtml(initialName)}</span>. All rights reserved.</p></div>`;
  }
})();

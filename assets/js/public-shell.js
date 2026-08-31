(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

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

  if (header) {
    header.innerHTML = `<nav class="navbar navbar-expand-xl navbar-dark"><div class="container"><a class="navbar-brand d-flex align-items-center gap-2" href="index.html"><span class="brand-mark" aria-hidden="true">B</span><span id="site-name">Barangay Website</span></a><button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav ms-auto align-items-xl-center gap-xl-1">${navItems.map(([href,label]) => `<li class="nav-item"><a class="nav-link${page === href ? ' active' : ''}" href="${href}"${page === href ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul></div></div></nav>`;
  }

  if (footer) {
    footer.classList.add('py-5');
    footer.innerHTML = `<div class="container"><div class="row g-4 align-items-start"><div class="col-lg-7"><h2 class="h5 mb-2" id="footer-name">Barangay Website</h2><p class="mb-0 text-white-50">Official barangay information, transparency, verification, and public service portal.</p></div><div class="col-lg-5 text-lg-end"><p class="mb-1" id="footer-address">Barangay Office Address</p><p class="mb-3" id="footer-contact">Contact information</p><a class="btn btn-sm btn-outline-light" href="contact.html">Contact Barangay Office</a></div></div><hr class="border-light opacity-25 my-4"><p class="small mb-0 text-white-50">&copy; <span id="current-year"></span> <span id="copyright-name">Barangay Website</span>. All rights reserved.</p></div>`;
  }
})();
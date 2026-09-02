(() => {
  'use strict';

  const path = window.location.pathname;
  const inAdmin = /\/admin\//.test(path);
  const inEditor = /\/editor\//.test(path);
  const file = (path.split('/').pop() || '').toLowerCase();
  if ((!inAdmin && !inEditor) || /^(login|apply|activate)\.html$/.test(file)) return;

  const ROLE_CACHE_KEY = 'brgyweb:staff-role:v1';
  let role = inEditor ? 'editor' : 'admin';
  try {
    const cached = localStorage.getItem(ROLE_CACHE_KEY);
    if (cached === 'admin' || cached === 'editor') role = cached;
  } catch {}

  const labels = {
    'dashboard.html':'Dashboard','announcements.html':'Announcements','officials.html':'Officials','services.html':'Services','directory.html':'Directory','disclosure.html':'Disclosure','gallery.html':'Gallery','profile.html':'Barangay Profile','verification.html':'Verification / QR','settings.html':'Site Settings','design-studio.html':'Design Studio','editors.html':'Content Admin Access'
  };

  const contentItems = [
    ['announcements.html','Announcements'],['officials.html','Officials'],['services.html','Services'],
    ['directory.html','Directory'],['disclosure.html','Disclosure'],['gallery.html','Gallery'],['profile.html','Barangay Profile']
  ];
  const adminItems = [
    ['verification.html','Verification / QR'],['settings.html','Site Settings'],
    ['design-studio.html','Design Studio'],['editors.html','Content Admin Access']
  ];

  function hrefFor(target) {
    if (target === 'dashboard.html') {
      if (role === 'editor') return inEditor ? 'dashboard.html' : '../editor/dashboard.html';
      return inAdmin ? 'dashboard.html' : '../admin/dashboard.html';
    }
    return inAdmin ? target : `../admin/${target}`;
  }

  function navLink(target,label) {
    const active = target === 'dashboard.html'
      ? ((role === 'editor' ? inEditor : inAdmin) && file === 'dashboard.html')
      : file === target;
    return `<a class="${active ? 'active' : ''}" href="${hrefFor(target)}"${active ? ' aria-current="page"' : ''}>${label}</a>`;
  }

  function markup() {
    const roleLabel = role === 'admin' ? 'System Admin' : 'Content Admin';
    const administration = role === 'admin'
      ? `<div class="sidebar-label">Administration</div>${adminItems.map(([target,label])=>navLink(target,label)).join('')}`
      : '';
    return `<div class="sidebar-head"><div class="sidebar-logo">B</div><div class="sidebar-identity"><div class="sidebar-brand">BRGYWEB-LITE</div><div class="sidebar-role-badge"><span class="sidebar-role-dot"></span><span class="sidebar-role">${roleLabel}</span></div></div><button class="admin-sidebar-collapse" type="button" data-admin-sidebar-collapse aria-label="Hide admin navigation" aria-expanded="true" title="Hide navigation">‹</button></div><nav class="sidebar-nav mt-3"><div class="sidebar-label">Overview</div>${navLink('dashboard.html','Dashboard')}<div class="sidebar-label">Content</div>${contentItems.map(([target,label])=>navLink(target,label)).join('')}${administration}<div class="sidebar-divider"></div><button class="unified-signout" type="button" data-unified-signout>Sign out</button></nav><a class="sidebar-exit" href="../index.html">View public site</a>`;
  }

  function sidebarIsComplete(sidebar) {
    if (!sidebar) return false;
    const nav = sidebar.querySelector('.sidebar-nav');
    if (!nav || !sidebar.querySelector('.sidebar-head')) return false;
    if (!nav.querySelector('[data-unified-signout]')) return false;
    if (!nav.querySelector('a[href$="announcements.html"]')) return false;
    if (!nav.querySelector('a[href$="officials.html"]')) return false;
    if (role === 'admin' && !nav.querySelector('a[href$="design-studio.html"]')) return false;
    return true;
  }

  function ensureFinalShellExtras(main) {
    if (!document.querySelector('.admin-mobile-overlay')) {
      const overlay = document.createElement('button');
      overlay.type = 'button';
      overlay.className = 'admin-mobile-overlay';
      overlay.dataset.adminMenuClose = 'true';
      overlay.setAttribute('aria-label','Close admin menu');
      overlay.setAttribute('aria-hidden','true');
      document.body.appendChild(overlay);
    }

    if (!document.querySelector('[data-admin-sidebar-reopen]')) {
      const reopen = document.createElement('button');
      reopen.type = 'button';
      reopen.className = 'admin-sidebar-reopen';
      reopen.dataset.adminSidebarReopen = 'true';
      reopen.setAttribute('aria-label','Show admin navigation');
      reopen.setAttribute('aria-expanded','false');
      reopen.title = 'Show navigation';
      reopen.innerHTML = '<span aria-hidden="true">☰</span><span>Menu</span>';
      document.body.appendChild(reopen);
    }

    if (!main.querySelector(':scope > .admin-mobile-bar')) {
      const roleLabel = role === 'admin' ? 'System Admin' : 'Content Admin';
      const mobile = document.createElement('div');
      mobile.className = 'admin-mobile-bar';
      mobile.innerHTML = `<button class="admin-mobile-menu-btn" type="button" aria-label="Open admin menu" aria-expanded="false" data-admin-menu-toggle>☰</button><div class="admin-mobile-title"><strong>${labels[file] || document.title || 'Admin Panel'}</strong><small data-mobile-role>${roleLabel}</small></div><a class="admin-mobile-public" href="../index.html">Public site</a>`;
      main.prepend(mobile);
    }
  }

  function prime() {
    if (!document.body) return false;
    document.body.classList.add('dashboard-page');
    let shell = document.querySelector('.dashboard-shell');
    let main;
    let sidebar;

    if (shell) {
      shell.classList.add('unified-admin-shell');
      main = shell.querySelector(':scope > main') || shell.querySelector('.dashboard-main');
      sidebar = shell.querySelector(':scope > .sidebar');
      if (!sidebar) {
        sidebar = document.createElement('aside');
        shell.prepend(sidebar);
      }
    } else {
      main = document.querySelector('body > main');
      if (!main) return false;
      shell = document.createElement('div');
      shell.className = 'dashboard-shell unified-admin-shell';
      document.body.insertBefore(shell, main);
      sidebar = document.createElement('aside');
      shell.append(sidebar, main);
    }

    if (!main || !sidebar) return false;
    sidebar.className = 'sidebar unified-sidebar';
    main.classList.add('dashboard-main','admin-module-main');
    main.classList.remove('py-4','py-lg-5');

    if (!sidebarIsComplete(sidebar)) sidebar.innerHTML = markup();
    ensureFinalShellExtras(main);

    document.documentElement.dataset.adminShellPrimed = 'true';
    document.documentElement.dataset.staffRole = role;
    return true;
  }

  if (!prime()) document.addEventListener('DOMContentLoaded', prime, { once:true });
})();

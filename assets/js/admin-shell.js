(() => {
  'use strict';

  const ROLE_CACHE_KEY = 'brgyweb:staff-role:v1';
  const SIDEBAR_CACHE_KEY = 'brgyweb:admin-sidebar-collapsed:v1';
  const ASSET_VERSION = '20260901nav2';
  const path = window.location.pathname;
  const inAdmin = /\/admin\//.test(path);
  const inEditor = /\/editor\//.test(path);
  const file = (path.split('/').pop() || '').toLowerCase();
  if ((!inAdmin && !inEditor) || file === 'login.html') return;

  let stylesPromise = null;
  const prefetched = new Set();

  function syncUiReady() {
    const root = document.documentElement;
    if (root.dataset.adminShellReady === 'true' && root.dataset.adminThemeReady === 'true') {
      root.dataset.adminUiReady = 'true';
    }
  }

  function readRoleCache() {
    try {
      const role = localStorage.getItem(ROLE_CACHE_KEY);
      return role === 'admin' || role === 'editor' ? role : null;
    } catch { return null; }
  }

  function writeRoleCache(role) {
    try {
      if (role === 'admin' || role === 'editor') localStorage.setItem(ROLE_CACHE_KEY, role);
      else localStorage.removeItem(ROLE_CACHE_KEY);
    } catch {}
  }

  function readSidebarCollapsed() {
    try { return localStorage.getItem(SIDEBAR_CACHE_KEY) === 'true'; }
    catch { return false; }
  }

  function writeSidebarCollapsed(collapsed) {
    try { localStorage.setItem(SIDEBAR_CACHE_KEY, collapsed ? 'true' : 'false'); }
    catch {}
  }

  function applySidebarState(collapsed = readSidebarCollapsed()) {
    const root = document.documentElement;
    root.classList.toggle('admin-sidebar-collapsed', Boolean(collapsed));
    document.querySelectorAll('[data-admin-sidebar-collapse]').forEach((button) => {
      button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      button.setAttribute('aria-label', collapsed ? 'Show admin navigation' : 'Hide admin navigation');
      button.title = collapsed ? 'Show navigation' : 'Hide navigation';
    });
    document.querySelectorAll('[data-admin-sidebar-reopen]').forEach((button) => {
      button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  }

  function setSidebarCollapsed(collapsed) {
    writeSidebarCollapsed(collapsed);
    applySidebarState(collapsed);
  }

  const cachedRoleAtBoot = readRoleCache();
  let currentRole = cachedRoleAtBoot || (inEditor ? 'editor' : 'admin');

  const labels = {
    'dashboard.html':'Dashboard','announcements.html':'Announcements','officials.html':'Officials','services.html':'Services','directory.html':'Directory','disclosure.html':'Disclosure','gallery.html':'Gallery','profile.html':'Barangay Profile','verification.html':'Verification / QR','settings.html':'Site Settings','design-studio.html':'Design Studio','editors.html':'Content Admin Access'
  };

  const contentItems = [
    ['announcements.html','Announcements'],['officials.html','Officials'],['services.html','Services'],['directory.html','Directory'],['disclosure.html','Disclosure'],['gallery.html','Gallery'],['profile.html','Barangay Profile']
  ];
  const adminItems = [
    ['verification.html','Verification / QR'],['settings.html','Site Settings'],['design-studio.html','Design Studio'],['editors.html','Content Admin Access']
  ];

  function ensureStyles() {
    if (stylesPromise) return stylesPromise;
    stylesPromise = Promise.resolve();
    return stylesPromise;
  }

  function hrefFor(target) {
    if (target === 'dashboard.html') {
      if (currentRole === 'editor') return inEditor ? 'dashboard.html' : '../editor/dashboard.html';
      return inAdmin ? 'dashboard.html' : '../admin/dashboard.html';
    }
    return inAdmin ? target : `../admin/${target}`;
  }

  function navLink(target,label) {
    const active = target === 'dashboard.html'
      ? ((currentRole === 'editor' ? inEditor : inAdmin) && file === 'dashboard.html')
      : file === target;
    return `<a class="${active ? 'active' : ''}" href="${hrefFor(target)}"${active ? ' aria-current="page"' : ''}>${label}</a>`;
  }

  function sidebarMarkup(role) {
    const roleLabel = role === 'admin' ? 'System Admin' : 'Content Admin';
    const administration = role === 'admin'
      ? `<div class="sidebar-label">Administration</div>${adminItems.map(([target,label])=>navLink(target,label)).join('')}`
      : '';
    return `<div class="sidebar-head"><div class="sidebar-logo">B</div><div class="sidebar-identity"><div class="sidebar-brand">BRGYWEB-LITE</div><div class="sidebar-role-badge"><span class="sidebar-role-dot"></span><span class="sidebar-role">${roleLabel}</span></div></div><button class="admin-sidebar-collapse" type="button" data-admin-sidebar-collapse aria-label="Hide admin navigation" aria-expanded="true" title="Hide navigation">‹</button></div><nav class="sidebar-nav mt-3"><div class="sidebar-label">Overview</div>${navLink('dashboard.html','Dashboard')}<div class="sidebar-label">Content</div>${contentItems.map(([target,label])=>navLink(target,label)).join('')}${administration}<div class="sidebar-divider"></div><button class="unified-signout" type="button" data-unified-signout>Sign out</button></nav><a class="sidebar-exit" href="../index.html">View public site</a>`;
  }

  function ensureLayout() {
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
      if (!main) return null;
      shell = document.createElement('div');
      shell.className = 'dashboard-shell unified-admin-shell';
      document.body.insertBefore(shell, main);
      sidebar = document.createElement('aside');
      shell.append(sidebar, main);
    }
    if (!main || !sidebar) return null;
    sidebar.className = 'sidebar unified-sidebar';
    main.classList.add('dashboard-main','admin-module-main');
    main.classList.remove('py-4','py-lg-5');

    let overlay = document.querySelector('.admin-mobile-overlay');
    if (!overlay) {
      overlay = document.createElement('button');
      overlay.type = 'button';
      overlay.className = 'admin-mobile-overlay';
      overlay.dataset.adminMenuClose = 'true';
      overlay.setAttribute('aria-label','Close admin menu');
      overlay.setAttribute('aria-hidden','true');
      document.body.appendChild(overlay);
    }

    let reopen = document.querySelector('[data-admin-sidebar-reopen]');
    if (!reopen) {
      reopen = document.createElement('button');
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
      const mobile = document.createElement('div');
      mobile.className = 'admin-mobile-bar';
      mobile.innerHTML = `<button class="admin-mobile-menu-btn" type="button" aria-label="Open admin menu" aria-expanded="false" data-admin-menu-toggle>☰</button><div class="admin-mobile-title"><strong>${labels[file] || document.title || 'Admin Panel'}</strong><small data-mobile-role>Admin workspace</small></div><a class="admin-mobile-public" href="../index.html">Public site</a>`;
      main.prepend(mobile);
    }
    return { shell, main, sidebar, overlay, reopen };
  }

  function render(role) {
    currentRole = role || currentRole;
    const layout = ensureLayout();
    if (!layout) return;
    const expectedRoleLabel = currentRole === 'admin' ? 'System Admin' : 'Content Admin';
    const existingRoleLabel = layout.sidebar.querySelector('.sidebar-role')?.textContent?.trim() || '';
    const hasCompleteSidebar = Boolean(
      layout.sidebar.querySelector('.sidebar-nav') &&
      layout.sidebar.querySelector('[data-admin-sidebar-collapse]') &&
      layout.sidebar.querySelector('[data-unified-signout]')
    );
    if (!hasCompleteSidebar || existingRoleLabel !== expectedRoleLabel) {
      layout.sidebar.innerHTML = sidebarMarkup(currentRole);
    }
    const mobileRole = layout.main.querySelector('[data-mobile-role]');
    if (mobileRole) mobileRole.textContent = expectedRoleLabel;
    const root = document.documentElement;
    root.dataset.staffRole = currentRole;
    root.dataset.adminShellReady = 'true';
    applySidebarState();
    syncUiReady();
  }

  function closeMenu() {
    document.documentElement.classList.remove('admin-menu-open');
    document.querySelector('[data-admin-menu-toggle]')?.setAttribute('aria-expanded','false');
    document.querySelector('.admin-mobile-overlay')?.setAttribute('aria-hidden','true');
  }

  function openMenu() {
    document.documentElement.classList.add('admin-menu-open');
    document.querySelector('[data-admin-menu-toggle]')?.setAttribute('aria-expanded','true');
    document.querySelector('.admin-mobile-overlay')?.setAttribute('aria-hidden','false');
  }

  function prefetchNavigation(link) {
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    if (url.origin !== location.origin || url.href === location.href || prefetched.has(url.href)) return;
    if (!/\/(admin|editor)\//.test(url.pathname)) return;
    prefetched.add(url.href);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = url.href;
    hint.as = 'document';
    document.head.appendChild(hint);
  }

  async function resolveRole() {
    const client = window.BRGY_SUPABASE;
    if (!client) return null;
    try {
      const { data, error } = await client.auth.getUser();
      if (error || !data?.user) return null;
      const { data: profile, error: profileError } = await client.from('profiles').select('role,is_active').eq('user_id',data.user.id).maybeSingle();
      if (profileError || profile?.is_active !== true) return null;
      if (profile.role === 'admin' || profile.role === 'editor') return profile.role;
    } catch (error) { console.warn('Unable to resolve unified admin shell role:', error); }
    return null;
  }

  async function signOut() {
    const client = window.BRGY_SUPABASE;
    const role = currentRole;
    closeMenu();
    writeRoleCache(null);
    try { if (client) await client.auth.signOut(); } catch (error) { console.warn('Sign out warning:', error); }
    if (role === 'editor') window.location.href = inEditor ? 'login.html' : '../editor/login.html';
    else window.location.href = inAdmin ? 'login.html' : '../admin/login.html';
  }

  document.addEventListener('pointerenter', (event) => {
    const link = event.target.closest?.('.unified-sidebar a');
    if (link) prefetchNavigation(link);
  }, true);

  document.addEventListener('focusin', (event) => {
    const link = event.target.closest?.('.unified-sidebar a');
    if (link) prefetchNavigation(link);
  });

  document.addEventListener('click', (event) => {
    const desktopCollapse = event.target.closest('[data-admin-sidebar-collapse]');
    if (desktopCollapse && window.matchMedia('(min-width:901px)').matches) {
      event.preventDefault();
      setSidebarCollapsed(true);
      return;
    }

    const desktopReopen = event.target.closest('[data-admin-sidebar-reopen]');
    if (desktopReopen && window.matchMedia('(min-width:901px)').matches) {
      event.preventDefault();
      setSidebarCollapsed(false);
      return;
    }

    const toggle = event.target.closest('[data-admin-menu-toggle]');
    if (toggle) {
      event.preventDefault();
      document.documentElement.classList.contains('admin-menu-open') ? closeMenu() : openMenu();
      return;
    }
    if (event.target.closest('[data-admin-menu-close]')) { closeMenu(); return; }
    if (event.target.closest('.unified-sidebar a') && window.matchMedia('(max-width:900px)').matches) closeMenu();
    if (event.target.closest('[data-unified-signout]')) { event.preventDefault(); signOut(); }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
    if ((event.ctrlKey || event.metaKey) && event.key === '\\') {
      event.preventDefault();
      if (window.matchMedia('(min-width:901px)').matches) setSidebarCollapsed(!readSidebarCollapsed());
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
    applySidebarState();
  });
  window.addEventListener('pageshow', () => {
    closeMenu();
    applySidebarState();
  });

  async function init() {
    closeMenu();
    await ensureStyles();
    applySidebarState();
    const cached = readRoleCache();
    if (cached) render(cached);

    const resolved = await resolveRole();
    if (resolved) {
      writeRoleCache(resolved);
      if (!cached || resolved !== cached) render(resolved);
      return;
    }

    if (!cached) render(inEditor ? 'editor' : 'admin');
  }

  /* If this file is loaded after the dashboard shell markup, build the final shell
     immediately instead of waiting for DOMContentLoaded/auth. This prevents the
     legacy horizontal sidebar from painting first on mobile/desktop-site reloads. */
  if (document.body && document.querySelector('.dashboard-shell')) {
    render(cachedRoleAtBoot || (inEditor ? 'editor' : 'admin'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
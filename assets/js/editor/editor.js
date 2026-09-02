(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('editor-login-form');
  const status = document.getElementById('editor-login-status');
  const applicationForm = document.getElementById('content-admin-application-form');
  const applicationStatus = document.getElementById('content-admin-application-status');
  const signout = document.getElementById('editor-signout');
  const refresh = document.getElementById('editor-refresh');
  const isDashboard = Boolean(signout);

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-secondary', !isError);
  }

  function setApplicationStatus(message, isError = false) {
    if (!applicationStatus) return;
    applicationStatus.textContent = message;
    applicationStatus.classList.toggle('text-danger', isError);
    applicationStatus.classList.toggle('text-success', !isError && Boolean(message));
    applicationStatus.classList.toggle('text-secondary', !isError && !message);
  }

  async function getRole(userId) {
    const { data, error } = await client.from('profiles').select('role,is_active').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  function isApprovedContentAdmin(profile) {
    return Boolean(profile && profile.role === 'editor' && profile.is_active === true);
  }

  function cacheRole(role) {
    try {
      if (role === 'admin' || role === 'editor') localStorage.setItem('brgyweb:staff-role:v1', role);
    } catch {}
  }

  async function routeExistingSession() {
    if (!form || !client) return;
    try {
      const { data } = await client.auth.getUser();
      if (!data?.user) return;
      const profile = await getRole(data.user.id);
      if (profile?.role === 'admin' && profile?.is_active === true) {
        cacheRole('admin');
        window.location.replace('../admin/dashboard.html');
        return;
      }
      if (isApprovedContentAdmin(profile)) {
        cacheRole('editor');
        window.location.replace('dashboard.html');
      }
    } catch (error) {
      console.warn('Unable to route existing session:', error);
    }
  }

  async function requireContentAdminAccess() {
    if (!client) { window.location.href = 'login.html'; return false; }
    const { data, error } = await client.auth.getUser();
    const user = data?.user;
    if (error || !user) { window.location.href = 'login.html'; return false; }
    try {
      const profile = await getRole(user.id);
      if (profile?.role === 'admin' && profile?.is_active === true) {
        cacheRole('admin');
        window.location.replace('../admin/dashboard.html');
        return false;
      }
      if (!isApprovedContentAdmin(profile)) {
        await client.auth.signOut();
        try { localStorage.removeItem('brgyweb:staff-role:v1'); } catch {}
        window.location.href = 'login.html';
        return false;
      }
      cacheRole('editor');
      return true;
    } catch (error) {
      console.error(error);
      await client.auth.signOut();
      window.location.href = 'login.html';
      return false;
    }
  }

  const defs = [
    { key:'Announcements', table:'announcements', flag:'is_published' },
    { key:'Officials', table:'officials', flag:'is_active' },
    { key:'Services', table:'services', flag:'is_active' },
    { key:'Gallery', table:'gallery_items', flag:'is_published' },
    { key:'Directory', table:'directory_entries', flag:'is_active' },
    { key:'Disclosure', table:'disclosures', flag:'is_published' },
    { key:'Profile', table:'pages', flag:'is_published' }
  ];

  const text = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = String(value); };

  async function loadStats() {
    if (!isDashboard) return;
    if (refresh) refresh.disabled = true;
    const target = document.getElementById('editor-module-bars');
    try {
      const modules = await Promise.all(defs.map(async (def) => {
        const { data, error } = await client.from(def.table).select(`id,${def.flag}`);
        if (error) throw error;
        return { ...def, rows:data || [] };
      }));

      const published = modules.reduce((sum, module) => sum + module.rows.filter((row) => row[module.flag] === true).length, 0);
      const total = modules.reduce((sum, module) => sum + module.rows.length, 0);
      text('editor-metric-published', published);
      text('editor-metric-hidden', Math.max(0, total - published));
      text('editor-metric-announcements', modules.find((module) => module.key === 'Announcements')?.rows.filter((row) => row.is_published === true).length || 0);
      text('editor-metric-gallery', modules.find((module) => module.key === 'Gallery')?.rows.filter((row) => row.is_published === true).length || 0);

      if (target) {
        const max = Math.max(1, ...modules.map((module) => module.rows.length));
        target.innerHTML = modules.map((module) => {
          const count = module.rows.filter((row) => row[module.flag] === true).length;
          const width = Math.max(2, Math.round((count / max) * 100));
          return `<div class="module-row"><span>${module.key}</span><div class="module-track"><div class="module-fill" style="width:${width}%"></div></div><div class="module-count">${count}</div></div>`;
        }).join('');
      }
    } catch (error) {
      console.error(error);
      if (target) target.innerHTML = '<div class="dashboard-data-error">Unable to load content statistics.</div>';
    } finally {
      if (refresh) refresh.disabled = false;
    }
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!client) return setStatus('Supabase connection is unavailable.', true);
      const email = document.getElementById('editor-email')?.value.trim();
      const password = document.getElementById('editor-password')?.value || '';
      const button = form.querySelector('button[type="submit"]');
      if (!email || !password) return setStatus('Enter your email and password.', true);
      if (button) button.disabled = true;
      setStatus('Signing in...');
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data?.user) {
        setStatus(error?.message || 'Unable to sign in.', true);
        if (button) button.disabled = false;
        return;
      }
      try {
        const profile = await getRole(data.user.id);
        if (profile?.role === 'admin' && profile?.is_active === true) {
          cacheRole('admin');
          window.location.replace('../admin/dashboard.html');
          return;
        }
        if (!isApprovedContentAdmin(profile)) {
          await client.auth.signOut();
          setStatus('This account is not an approved active Content Admin account.', true);
          if (button) button.disabled = false;
          return;
        }
        cacheRole('editor');
        window.location.href = 'dashboard.html';
      } catch (error) {
        console.error(error);
        await client.auth.signOut();
        setStatus('Unable to verify Content Admin access.', true);
        if (button) button.disabled = false;
      }
    });
  }

  if (applicationForm) {
    applicationForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!client) return setApplicationStatus('Supabase connection is unavailable.', true);
      const displayName = document.getElementById('application-name')?.value.trim() || '';
      const email = document.getElementById('application-email')?.value.trim().toLowerCase() || '';
      const reason = document.getElementById('application-reason')?.value.trim() || '';
      const button = applicationForm.querySelector('button[type="submit"]');
      if (displayName.length < 2) return setApplicationStatus('Enter your full name.', true);
      if (!email || !email.includes('@')) return setApplicationStatus('Enter a valid email address.', true);
      if (button) button.disabled = true;
      setApplicationStatus('Submitting application...');
      const { error } = await client.from('content_admin_applications').insert({
        display_name: displayName,
        email,
        reason: reason || null,
      });
      if (error) {
        console.error(error);
        const duplicate = error.code === '23505';
        setApplicationStatus(duplicate ? 'A pending application already exists for this email.' : (error.message || 'Unable to submit application.'), true);
        if (button) button.disabled = false;
        return;
      }
      applicationForm.reset();
      setApplicationStatus('Application submitted. Wait for System Admin approval. If approved, you will receive an activation email.');
      if (button) button.disabled = false;
    });
  }

  refresh?.addEventListener('click', loadStats);

  if (isDashboard) {
    requireContentAdminAccess().then((allowed) => {
      if (allowed) loadStats();
    });
  } else {
    routeExistingSession();
  }

  if (signout) {
    signout.addEventListener('click', async () => {
      if (client) await client.auth.signOut();
      try { localStorage.removeItem('brgyweb:staff-role:v1'); } catch {}
      window.location.href = 'login.html';
    });
  }
})();

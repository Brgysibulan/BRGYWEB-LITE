(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('editor-login-form');
  const status = document.getElementById('editor-login-status');
  const signout = document.getElementById('editor-signout');
  const refresh = document.getElementById('editor-refresh');
  const isDashboard = Boolean(signout);

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-secondary', !isError);
  }

  async function getRole(userId) {
    const { data, error } = await client.from('profiles').select('role,is_active').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function requireEditor() {
    if (!client) { window.location.href = 'login.html'; return false; }
    const { data, error } = await client.auth.getUser();
    const user = data?.user;
    if (error || !user) { window.location.href = 'login.html'; return false; }
    try {
      const profile = await getRole(user.id);
      if (!profile || profile.role !== 'editor' || profile.is_active !== true) {
        await client.auth.signOut();
        window.location.href = 'login.html';
        return false;
      }
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
        if (!profile || profile.role !== 'editor' || profile.is_active !== true) {
          await client.auth.signOut();
          setStatus('This account does not have active editor access.', true);
          if (button) button.disabled = false;
          return;
        }
        window.location.href = 'dashboard.html';
      } catch (error) {
        console.error(error);
        await client.auth.signOut();
        setStatus('Unable to verify editor access.', true);
        if (button) button.disabled = false;
      }
    });
  }

  refresh?.addEventListener('click', loadStats);

  if (isDashboard) {
    requireEditor().then((allowed) => {
      if (allowed) loadStats();
    });
  }

  if (signout) {
    signout.addEventListener('click', async () => {
      if (client) await client.auth.signOut();
      window.location.href = 'login.html';
    });
  }
})();

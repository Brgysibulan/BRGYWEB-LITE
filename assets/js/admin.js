(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('admin-login-form');
  const status = document.getElementById('admin-login-status');
  const signout = document.getElementById('admin-signout');
  const siteSettingsForm = document.getElementById('site-settings-form');
  const siteSettingsStatus = document.getElementById('site-settings-status');
  const editorInviteForm = document.getElementById('editor-invite-form');
  const editorList = document.getElementById('editor-list');
  const editorManageStatus = document.getElementById('editor-manage-status');
  const refreshButton = document.getElementById('dashboard-refresh');
  const activityRefresh = document.getElementById('activity-refresh');
  const isDashboard = /\/admin\/dashboard\.html$/.test(window.location.pathname);

  const setStatus = (message, error = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', error);
  };
  const setSiteSettingsStatus = (message, error = false) => {
    if (!siteSettingsStatus) return;
    siteSettingsStatus.textContent = message;
    siteSettingsStatus.classList.toggle('text-danger', error);
    siteSettingsStatus.classList.toggle('text-success', !error && Boolean(message));
  };
  const setEditorStatus = (message, error = false) => {
    if (!editorManageStatus) return;
    editorManageStatus.textContent = message;
    editorManageStatus.classList.toggle('text-danger', error);
  };
  const esc = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const value = (id) => document.getElementById(id)?.value.trim() || '';
  const setValue = (id, val, fallback = '') => { const element = document.getElementById(id); if (element) element.value = val || fallback; };
  const text = (id, val) => { const element = document.getElementById(id); if (element) element.textContent = String(val); };

  async function getRole(id) {
    const { data, error } = await client.from('profiles').select('role,is_active').eq('user_id', id).maybeSingle();
    if (error) throw error;
    return data;
  }

  function optionalHttpsUrl(id, label) {
    const raw = value(id);
    if (!raw) return null;
    let url;
    try { url = new URL(raw); } catch { throw new Error(`${label} must be a valid URL.`); }
    if (url.protocol !== 'https:') throw new Error(`${label} must use HTTPS.`);
    return url.href;
  }

  async function loadSiteSettings() {
    if (!siteSettingsForm) return;
    setSiteSettingsStatus('Loading site settings...');
    const { data, error } = await client.from('site_settings').select('id,barangay_name,municipality_city,province,address,contact_number,email,logo_url,facebook_url,map_embed_url,hero_title,hero_text,primary_color,secondary_color,accent_color').eq('id', 1).single();
    if (error) throw error;
    setValue('setting-barangay-name', data.barangay_name, 'Barangay Name');
    setValue('setting-logo', data.logo_url);
    setValue('setting-municipality', data.municipality_city);
    setValue('setting-province', data.province);
    setValue('setting-contact', data.contact_number);
    setValue('setting-email', data.email);
    setValue('setting-address', data.address);
    setValue('setting-facebook', data.facebook_url);
    setValue('setting-map', data.map_embed_url);
    setValue('setting-hero-title', data.hero_title, 'Welcome to Our Barangay');
    setValue('setting-hero-text', data.hero_text);
    setValue('setting-primary-color', data.primary_color, '#136b3a');
    setValue('setting-secondary-color', data.secondary_color, '#0d4d2b');
    setValue('setting-accent-color', data.accent_color, '#f2c94c');
    setSiteSettingsStatus('Settings loaded.');
  }

  async function saveSiteSettings() {
    const payload = {
      barangay_name: value('setting-barangay-name'),
      municipality_city: value('setting-municipality') || null,
      province: value('setting-province') || null,
      address: value('setting-address') || null,
      contact_number: value('setting-contact') || null,
      email: value('setting-email') || null,
      logo_url: optionalHttpsUrl('setting-logo', 'Logo URL'),
      facebook_url: optionalHttpsUrl('setting-facebook', 'Facebook URL'),
      map_embed_url: optionalHttpsUrl('setting-map', 'Google Maps Embed URL'),
      hero_title: value('setting-hero-title'),
      hero_text: value('setting-hero-text') || null,
      primary_color: document.getElementById('setting-primary-color')?.value || '#136b3a',
      secondary_color: document.getElementById('setting-secondary-color')?.value || '#0d4d2b',
      accent_color: document.getElementById('setting-accent-color')?.value || '#f2c94c',
      updated_at: new Date().toISOString()
    };
    if (!payload.barangay_name || !payload.hero_title) throw new Error('Barangay Name and Hero Title are required.');
    const { error } = await client.from('site_settings').update(payload).eq('id', 1);
    if (error) throw error;
  }

  async function callEditorManager(body) {
    const { data, error } = await client.functions.invoke('manage-editors', { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  function renderEditors(editors) {
    const activeCount = (editors || []).filter((item) => item.is_active === true).length;
    text('metric-editors', activeCount);
    if (!editorList) return;
    if (!editors?.length) {
      editorList.innerHTML = '<tr><td colspan="4" class="text-secondary">No editor accounts yet.</td></tr>';
      return;
    }
    editorList.innerHTML = editors.map((item) => {
      const active = item.is_active === true;
      return `<tr><td>${esc(item.display_name || 'Unnamed editor')}</td><td>${esc(item.email || '')}</td><td><span class="badge ${active ? 'text-bg-success' : 'text-bg-secondary'}">${active ? 'Active' : 'Disabled'}</span></td><td class="text-end"><button class="btn btn-sm ${active ? 'btn-outline-danger' : 'btn-outline-success'}" data-editor-toggle="${esc(item.user_id)}" data-active="${active}">${active ? 'Disable' : 'Enable'}</button></td></tr>`;
    }).join('');
  }

  async function loadEditors() {
    if (!editorList && !document.getElementById('metric-editors')) return;
    try {
      const data = await callEditorManager({ action: 'list' });
      renderEditors(data?.editors || []);
    } catch (error) {
      console.error(error);
      text('metric-editors', '—');
      setEditorStatus(error.message || 'Unable to load editor accounts.', true);
    }
  }

  async function requireAdmin() {
    if (!client) { location.href = 'login.html'; return false; }
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) { location.href = 'login.html'; return false; }
    try {
      const profile = await getRole(data.user.id);
      if (profile?.role !== 'admin' || profile?.is_active !== true) {
        await client.auth.signOut();
        location.href = 'login.html';
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      location.href = 'login.html';
      return false;
    }
  }

  const moduleDefs = [
    { key:'Announcements', table:'announcements', flag:'is_published', fields:'id,title,is_published,updated_at' },
    { key:'Officials', table:'officials', flag:'is_active', fields:'id,full_name,is_active,updated_at' },
    { key:'Services', table:'services', flag:'is_active', fields:'id,name,is_active,updated_at' },
    { key:'Gallery', table:'gallery_items', flag:'is_published', fields:'id,title,is_published,created_at' },
    { key:'Directory', table:'directory_entries', flag:'is_active', fields:'id,name,is_active,updated_at' },
    { key:'Disclosure', table:'disclosures', flag:'is_published', fields:'id,title,is_published,updated_at' },
    { key:'Profile', table:'pages', flag:'is_published', fields:'id,title,is_published,updated_at' }
  ];

  async function readModule(def) {
    const { data, error } = await client.from(def.table).select(def.fields);
    if (error) throw error;
    return { ...def, rows: data || [] };
  }

  function activityLabel(module, row) {
    return row.title || row.full_name || row.name || `${module} item`;
  }

  function relativeTime(iso) {
    if (!iso) return 'No timestamp';
    const diff = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(diff)) return 'Unknown';
    const mins = Math.max(0, Math.floor(diff / 60000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString();
  }

  function renderActivity(modules) {
    const target = document.getElementById('recent-activity');
    if (!target) return;
    const items = modules.flatMap((module) => module.rows.map((row) => ({
      module: module.key,
      label: activityLabel(module.key, row),
      time: row.updated_at || row.created_at || null,
      published: row[module.flag] === true
    }))).filter((item) => item.time).sort((a,b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

    if (!items.length) {
      target.innerHTML = '<div class="text-secondary">No recent content activity yet.</div>';
      return;
    }
    target.innerHTML = items.map((item) => `<div class="activity-item"><div class="activity-icon">${esc(item.module.slice(0,2).toUpperCase())}</div><div><strong>${esc(item.label)}</strong><small>${esc(item.module)} · ${item.published ? 'Published' : 'Hidden / Draft'}</small></div><div class="activity-time">${esc(relativeTime(item.time))}</div></div>`).join('');
  }

  function renderModuleBars(modules) {
    const target = document.getElementById('module-bars');
    if (!target) return;
    const max = Math.max(1, ...modules.map((module) => module.rows.length));
    target.innerHTML = modules.map((module) => {
      const published = module.rows.filter((row) => row[module.flag] === true).length;
      const width = Math.max(2, Math.round((published / max) * 100));
      return `<div class="module-row"><span>${esc(module.key)}</span><div class="module-track" title="${published} published"><div class="module-fill" style="width:${width}%"></div></div><div class="module-count">${published}</div></div>`;
    }).join('');
  }

  async function loadDashboardData() {
    if (!isDashboard) return;
    if (refreshButton) refreshButton.disabled = true;
    if (activityRefresh) activityRefresh.disabled = true;
    text('metric-published-note', 'Refreshing live data…');
    try {
      const modules = await Promise.all(moduleDefs.map(readModule));
      const published = modules.reduce((sum, module) => sum + module.rows.filter((row) => row[module.flag] === true).length, 0);
      const total = modules.reduce((sum, module) => sum + module.rows.length, 0);
      const hidden = Math.max(0, total - published);
      const percent = total ? Math.round((published / total) * 100) : 0;

      text('metric-published', published);
      text('metric-hidden', hidden);
      text('metric-published-note', `${total} total content records`);
      text('legend-published', published);
      text('legend-hidden', hidden);
      text('chart-published-percent', `${percent}%`);
      const donut = document.getElementById('content-donut');
      if (donut) donut.style.setProperty('--published-angle', `${percent * 3.6}deg`);
      const health = document.getElementById('content-health-label');
      if (health) health.textContent = total ? `${percent}% public` : 'No content yet';

      renderModuleBars(modules);
      renderActivity(modules);

      const { count, error } = await client.from('verification_records').select('id', { count:'exact', head:true });
      text('metric-verification', error ? '—' : (count ?? 0));
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      text('metric-published-note', 'Unable to load live statistics');
      const bars = document.getElementById('module-bars');
      const activity = document.getElementById('recent-activity');
      if (bars) bars.innerHTML = '<div class="dashboard-data-error">Unable to load module statistics.</div>';
      if (activity) activity.innerHTML = '<div class="dashboard-data-error">Unable to load recent activity.</div>';
    } finally {
      if (refreshButton) refreshButton.disabled = false;
      if (activityRefresh) activityRefresh.disabled = false;
    }
  }

  if (form) form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = value('admin-email');
    const password = document.getElementById('admin-password')?.value || '';
    if (!email || !password) return setStatus('Enter your email and password.', true);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data?.user) return setStatus(error?.message || 'Unable to sign in.', true);
    const profile = await getRole(data.user.id);
    if (profile?.role !== 'admin' || profile?.is_active !== true) {
      await client.auth.signOut();
      return setStatus('This account does not have active administrator access.', true);
    }
    location.href = 'dashboard.html';
  });

  if (siteSettingsForm) siteSettingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = siteSettingsForm.querySelector('button[type=submit]');
    if (button) button.disabled = true;
    try {
      setSiteSettingsStatus('Saving settings...');
      await saveSiteSettings();
      setSiteSettingsStatus('Site settings saved.');
    } catch (error) {
      setSiteSettingsStatus(error.message || 'Unable to save settings.', true);
    } finally { if (button) button.disabled = false; }
  });

  if (editorInviteForm) editorInviteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = value('editor-email');
    const displayName = value('editor-display-name');
    if (!email) return setEditorStatus('Enter the editor email address.', true);
    try {
      await callEditorManager({ action:'invite', email, display_name:displayName, redirect_to:new URL('../editor/login.html', location.href).href });
      editorInviteForm.reset();
      setEditorStatus('Editor invitation sent successfully.');
      await loadEditors();
    } catch (error) { setEditorStatus(error.message || 'Unable to invite editor.', true); }
  });

  if (editorList) editorList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-editor-toggle]');
    if (!button) return;
    button.disabled = true;
    try {
      await callEditorManager({ action:'set_active', user_id:button.dataset.editorToggle, is_active:button.dataset.active !== 'true' });
      await loadEditors();
    } catch (error) {
      setEditorStatus(error.message || 'Unable to update editor.', true);
      button.disabled = false;
    }
  });

  refreshButton?.addEventListener('click', async () => Promise.all([loadDashboardData(), loadEditors()]));
  activityRefresh?.addEventListener('click', loadDashboardData);

  if (isDashboard) requireAdmin().then(async (ok) => {
    if (!ok) return;
    await Promise.all([
      siteSettingsForm ? loadSiteSettings() : null,
      loadEditors(),
      loadDashboardData()
    ]);
  });

  if (signout) signout.addEventListener('click', async () => {
    if (client) await client.auth.signOut();
    location.href = 'login.html';
  });
})();

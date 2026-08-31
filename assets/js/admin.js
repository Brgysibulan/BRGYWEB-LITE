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
  const isDashboard = Boolean(signout);

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-secondary', !isError);
  }

  function setSiteSettingsStatus(message, isError = false) {
    if (!siteSettingsStatus) return;
    siteSettingsStatus.textContent = message;
    siteSettingsStatus.classList.toggle('text-danger', isError);
    siteSettingsStatus.classList.toggle('text-success', !isError && Boolean(message));
    siteSettingsStatus.classList.toggle('text-secondary', !message);
  }

  function setEditorStatus(message, isError = false) {
    if (!editorManageStatus) return;
    editorManageStatus.textContent = message;
    editorManageStatus.classList.toggle('text-danger', isError);
    editorManageStatus.classList.toggle('text-success', !isError && Boolean(message));
    editorManageStatus.classList.toggle('text-secondary', !message);
  }

  async function getRole(userId) {
    const { data, error } = await client.from('profiles').select('role,is_active').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  function value(id) {
    return document.getElementById(id)?.value.trim() || '';
  }

  function setValue(id, nextValue, fallback = '') {
    const field = document.getElementById(id);
    if (field) field.value = nextValue || fallback;
  }

  async function loadSiteSettings() {
    if (!siteSettingsForm) return;
    setSiteSettingsStatus('Loading site settings...');
    const { data, error } = await client
      .from('site_settings')
      .select('id,barangay_name,municipality_city,province,address,contact_number,email,hero_title,hero_text,primary_color,secondary_color,accent_color')
      .eq('id', 1)
      .single();

    if (error) throw error;
    setValue('setting-barangay-name', data.barangay_name, 'Barangay Name');
    setValue('setting-municipality', data.municipality_city);
    setValue('setting-province', data.province);
    setValue('setting-contact', data.contact_number);
    setValue('setting-email', data.email);
    setValue('setting-address', data.address);
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

  function escapeHtml(input) {
    return String(input ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function renderEditors(editors) {
    if (!editorList) return;
    if (!Array.isArray(editors) || editors.length === 0) {
      editorList.innerHTML = '<tr><td colspan="4" class="text-secondary">No editor accounts yet.</td></tr>';
      return;
    }

    editorList.innerHTML = editors.map((editor) => {
      const active = editor.is_active === true;
      return `<tr>
        <td>${escapeHtml(editor.display_name || 'Unnamed editor')}</td>
        <td>${escapeHtml(editor.email || '')}</td>
        <td><span class="badge ${active ? 'text-bg-success' : 'text-bg-secondary'}">${active ? 'Active' : 'Disabled'}</span></td>
        <td class="text-end"><button class="btn btn-sm ${active ? 'btn-outline-danger' : 'btn-outline-success'}" type="button" data-editor-toggle="${escapeHtml(editor.user_id)}" data-active="${active ? 'true' : 'false'}">${active ? 'Disable' : 'Enable'}</button></td>
      </tr>`;
    }).join('');
  }

  async function loadEditors() {
    if (!editorList) return;
    editorList.innerHTML = '<tr><td colspan="4" class="text-secondary">Loading editor accounts...</td></tr>';
    try {
      const data = await callEditorManager({ action: 'list' });
      renderEditors(data?.editors || []);
    } catch (error) {
      console.error(error);
      editorList.innerHTML = '<tr><td colspan="4" class="text-danger">Unable to load editor accounts.</td></tr>';
      setEditorStatus(error?.message || 'Unable to load editor accounts.', true);
    }
  }

  async function requireAdmin() {
    if (!client) {
      window.location.href = 'login.html';
      return false;
    }
    const { data, error } = await client.auth.getUser();
    const user = data?.user;
    if (error || !user) {
      window.location.href = 'login.html';
      return false;
    }
    try {
      const profile = await getRole(user.id);
      if (!profile || profile.role !== 'admin' || profile.is_active !== true) {
        await client.auth.signOut();
        window.location.href = 'login.html';
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      await client.auth.signOut();
      window.location.href = 'login.html';
      return false;
    }
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!client) return setStatus('Supabase connection is unavailable.', true);
      const email = document.getElementById('admin-email')?.value.trim();
      const password = document.getElementById('admin-password')?.value || '';
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
        if (!profile || profile.role !== 'admin' || profile.is_active !== true) {
          await client.auth.signOut();
          setStatus('This account does not have active administrator access.', true);
          if (button) button.disabled = false;
          return;
        }
        window.location.href = 'dashboard.html';
      } catch (err) {
        console.error(err);
        await client.auth.signOut();
        setStatus('Unable to verify administrator access.', true);
        if (button) button.disabled = false;
      }
    });
  }

  if (siteSettingsForm) {
    siteSettingsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = siteSettingsForm.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      setSiteSettingsStatus('Saving settings...');
      try {
        await saveSiteSettings();
        setSiteSettingsStatus('Site settings saved. Public homepage will use the new values.');
      } catch (error) {
        console.error(error);
        setSiteSettingsStatus(error?.message || 'Unable to save site settings.', true);
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  if (editorInviteForm) {
    editorInviteForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('editor-email')?.value.trim();
      const displayName = document.getElementById('editor-display-name')?.value.trim();
      const button = editorInviteForm.querySelector('button[type="submit"]');
      if (!email) return setEditorStatus('Enter the editor email address.', true);
      if (button) button.disabled = true;
      setEditorStatus('Sending editor invitation...');
      try {
        const redirectTo = new URL('../editor/login.html', window.location.href).href;
        await callEditorManager({ action: 'invite', email, display_name: displayName || '', redirect_to: redirectTo });
        editorInviteForm.reset();
        setEditorStatus('Editor invitation sent successfully.');
        await loadEditors();
      } catch (error) {
        console.error(error);
        setEditorStatus(error?.message || 'Unable to invite editor.', true);
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  if (editorList) {
    editorList.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-editor-toggle]');
      if (!button) return;
      const userId = button.getAttribute('data-editor-toggle');
      const currentlyActive = button.getAttribute('data-active') === 'true';
      if (!userId) return;
      button.disabled = true;
      setEditorStatus(currentlyActive ? 'Disabling editor...' : 'Enabling editor...');
      try {
        await callEditorManager({ action: 'set_active', user_id: userId, is_active: !currentlyActive });
        setEditorStatus(currentlyActive ? 'Editor disabled.' : 'Editor enabled.');
        await loadEditors();
      } catch (error) {
        console.error(error);
        setEditorStatus(error?.message || 'Unable to update editor access.', true);
        button.disabled = false;
      }
    });
  }

  if (isDashboard) {
    requireAdmin().then(async (allowed) => {
      if (!allowed) return;
      const tasks = [];
      if (siteSettingsForm) tasks.push(loadSiteSettings().catch((error) => {
        console.error(error);
        setSiteSettingsStatus(error?.message || 'Unable to load site settings.', true);
      }));
      if (editorList) tasks.push(loadEditors());
      await Promise.all(tasks);
    });
  }

  if (signout) {
    signout.addEventListener('click', async () => {
      if (client) await client.auth.signOut();
      window.location.href = 'login.html';
    });
  }
})();

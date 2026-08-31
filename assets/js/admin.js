(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('admin-login-form');
  const status = document.getElementById('admin-login-status');
  const signout = document.getElementById('admin-signout');
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

  function setEditorStatus(message, isError = false) {
    if (!editorManageStatus) return;
    editorManageStatus.textContent = message;
    editorManageStatus.classList.toggle('text-danger', isError);
    editorManageStatus.classList.toggle('text-success', !isError && Boolean(message));
    editorManageStatus.classList.toggle('text-secondary', !message);
  }

  async function getRole(userId) {
    const { data, error } = await client
      .from('profiles')
      .select('role,is_active')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function callEditorManager(body) {
    const { data, error } = await client.functions.invoke('manage-editors', { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  function renderEditors(editors) {
    if (!editorList) return;

    if (!Array.isArray(editors) || editors.length === 0) {
      editorList.innerHTML = '<tr><td colspan="4" class="text-secondary">No editor accounts yet.</td></tr>';
      return;
    }

    editorList.innerHTML = editors.map((editor) => {
      const name = escapeHtml(editor.display_name || 'Unnamed editor');
      const email = escapeHtml(editor.email || '');
      const active = editor.is_active === true;
      const actionLabel = active ? 'Disable' : 'Enable';
      const actionClass = active ? 'btn-outline-danger' : 'btn-outline-success';
      return `
        <tr>
          <td>${name}</td>
          <td>${email}</td>
          <td><span class="badge ${active ? 'text-bg-success' : 'text-bg-secondary'}">${active ? 'Active' : 'Disabled'}</span></td>
          <td class="text-end">
            <button class="btn btn-sm ${actionClass}" type="button" data-editor-toggle="${escapeHtml(editor.user_id)}" data-active="${active ? 'true' : 'false'}">${actionLabel}</button>
          </td>
        </tr>`;
    }).join('');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
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
      if (!client) {
        setStatus('Supabase connection is unavailable.', true);
        return;
      }

      const email = document.getElementById('admin-email')?.value.trim();
      const password = document.getElementById('admin-password')?.value || '';
      const button = form.querySelector('button[type="submit"]');

      if (!email || !password) {
        setStatus('Enter your email and password.', true);
        return;
      }

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

  if (editorInviteForm) {
    editorInviteForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('editor-email')?.value.trim();
      const displayName = document.getElementById('editor-display-name')?.value.trim();
      const button = editorInviteForm.querySelector('button[type="submit"]');

      if (!email) {
        setEditorStatus('Enter the editor email address.', true);
        return;
      }

      if (button) button.disabled = true;
      setEditorStatus('Sending editor invitation...');

      try {
        const redirectTo = new URL('../editor/login.html', window.location.href).href;
        await callEditorManager({
          action: 'invite',
          email,
          display_name: displayName || '',
          redirect_to: redirectTo,
        });
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
    requireAdmin().then((allowed) => {
      if (allowed) loadEditors();
    });
  }

  if (signout) {
    signout.addEventListener('click', async () => {
      if (client) await client.auth.signOut();
      window.location.href = 'login.html';
    });
  }
})();

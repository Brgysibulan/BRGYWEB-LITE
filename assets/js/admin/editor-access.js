/**
 * BRGYWEB-LITE — Content Admin Access Management
 * Purpose: Review editor applications and manage approved Content Admin accounts.
 * Depends on: core/supabase-config.js
 * Used by: admin/editors.html
 */
(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const list = document.getElementById('content-admin-application-list');
  const pendingCount = document.getElementById('content-admin-pending-count');
  const status = document.getElementById('content-admin-application-status');
  const accounts = document.getElementById('editor-list');
  const accountStatus = document.getElementById('editor-manage-status');
  if (!client || !list) return;

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-success', !isError && Boolean(message));
    status.classList.toggle('text-secondary', !isError && !message);
  }

  function setAccountStatus(message, isError = false) {
    if (!accountStatus) return;
    accountStatus.textContent = message;
    accountStatus.classList.toggle('text-danger', isError);
    accountStatus.classList.toggle('text-success', !isError && Boolean(message));
    accountStatus.classList.toggle('text-secondary', !isError && !message);
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '—';
    return date.toLocaleString([], { year:'numeric', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
  }

  async function requireSystemAdmin() {
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) {
      window.location.href = 'login.html';
      return false;
    }
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('role,is_active')
      .eq('user_id', data.user.id)
      .maybeSingle();
    if (profileError || profile?.role !== 'admin' || profile?.is_active !== true) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  async function callManager(body) {
    const { data, error } = await client.functions.invoke('manage-editors', { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data || {};
  }

  function renderApplications(items) {
    const pending = (items || []).filter((item) => item.status === 'pending');
    if (pendingCount) pendingCount.textContent = `${pending.length} pending`;
    if (!pending.length) {
      list.innerHTML = '<tr><td colspan="4" class="text-secondary">No pending Content Admin applications.</td></tr>';
      return;
    }
    list.innerHTML = pending.map((item) => `
      <tr>
        <td><strong>${esc(item.display_name)}</strong><div class="small text-secondary">${esc(item.email)}</div></td>
        <td>${esc(item.reason || '—')}</td>
        <td class="small text-secondary">${esc(formatDate(item.submitted_at))}</td>
        <td class="text-end">
          <div class="d-inline-flex flex-wrap gap-1 justify-content-end">
            <button class="btn btn-sm btn-success" type="button" data-application-approve="${item.id}" data-applicant-name="${esc(item.display_name)}">Approve</button>
            <button class="btn btn-sm btn-outline-danger" type="button" data-application-reject="${item.id}" data-applicant-name="${esc(item.display_name)}">Reject</button>
          </div>
        </td>
      </tr>`).join('');
  }

  function renderAccounts(items) {
    if (!accounts) return;
    if (!items?.length) {
      accounts.innerHTML = '<tr><td colspan="4" class="text-secondary">No approved Content Admin accounts yet.</td></tr>';
      return;
    }
    accounts.innerHTML = items.map((item) => {
      const active = item.is_active === true;
      const email = item.email || '';
      return `<tr>
        <td><strong>${esc(item.display_name || 'Unnamed Content Admin')}</strong></td>
        <td>${esc(email)}</td>
        <td><span class="badge ${active ? 'text-bg-success' : 'text-bg-secondary'}">${active ? 'Active' : 'Disabled'}</span></td>
        <td class="text-end">
          <div class="d-inline-flex flex-wrap gap-1 justify-content-end">
            <button class="btn btn-sm ${active ? 'btn-outline-warning' : 'btn-outline-success'}" type="button" data-editor-toggle="${esc(item.user_id)}" data-active="${active}">${active ? 'Disable' : 'Enable'}</button>
            <button class="btn btn-sm btn-outline-danger" type="button" data-editor-delete="${esc(item.user_id)}" data-editor-email="${esc(email)}" data-editor-name="${esc(item.display_name || 'Content Admin')}">Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  async function load() {
    setStatus('');
    const data = await callManager({ action:'list' });
    renderApplications(data.applications || []);
    renderAccounts(data.content_admins || data.editors || []);
  }

  list.addEventListener('click', async (event) => {
    const approve = event.target.closest('[data-application-approve]');
    const reject = event.target.closest('[data-application-reject]');
    if (!approve && !reject) return;

    const button = approve || reject;
    const applicationId = Number(approve?.dataset.applicationApprove || reject?.dataset.applicationReject);
    const applicantName = button?.dataset.applicantName || 'this applicant';
    if (!Number.isInteger(applicationId)) return;

    if (approve) {
      if (!window.confirm(`Approve ${applicantName} as Content Admin?`)) return;
      button.disabled = true;
      try {
        setStatus('Approving application and activating Content Admin access...');
        const redirectTo = new URL('../editor/activate.html', window.location.href).href;
        const data = await callManager({ action:'approve_application', application_id:applicationId, redirect_to:redirectTo });
        setStatus(data.invited
          ? 'Approved. A legacy activation email was sent to the applicant.'
          : 'Approved. Content Admin access is active; the user can now sign in with the password created during signup.');
        await load();
      } catch (error) {
        console.error(error);
        setStatus(error.message || 'Unable to approve application.', true);
        button.disabled = false;
      }
      return;
    }

    if (reject) {
      if (!window.confirm(`Reject ${applicantName}'s Content Admin application?`)) return;
      const note = window.prompt('Optional reason for rejection:', '') ?? '';
      button.disabled = true;
      try {
        setStatus('Rejecting application...');
        await callManager({ action:'reject_application', application_id:applicationId, decision_note:note });
        setStatus('Application rejected.');
        await load();
      } catch (error) {
        console.error(error);
        setStatus(error.message || 'Unable to reject application.', true);
        button.disabled = false;
      }
    }
  });

  accounts?.addEventListener('click', async (event) => {
    const toggle = event.target.closest('[data-editor-toggle]');
    const remove = event.target.closest('[data-editor-delete]');
    if (!toggle && !remove) return;

    if (toggle) {
      const userId = toggle.dataset.editorToggle || '';
      const active = toggle.dataset.active === 'true';
      if (!userId) return;
      const verb = active ? 'disable' : 'enable';
      if (!window.confirm(`Are you sure you want to ${verb} this Content Admin account?`)) return;
      toggle.disabled = true;
      try {
        setAccountStatus(`${active ? 'Disabling' : 'Enabling'} Content Admin...`);
        await callManager({ action:'set_active', user_id:userId, is_active:!active });
        setAccountStatus(`Content Admin ${active ? 'disabled' : 'enabled'} successfully.`);
        await load();
      } catch (error) {
        console.error(error);
        setAccountStatus(error.message || `Unable to ${verb} Content Admin.`, true);
        toggle.disabled = false;
      }
      return;
    }

    const userId = remove.dataset.editorDelete || '';
    const email = remove.dataset.editorEmail || '';
    const name = remove.dataset.editorName || 'Content Admin';
    if (!userId || !email) {
      setAccountStatus('This account is missing an email and cannot be safely deleted.', true);
      return;
    }

    if (!window.confirm(`Permanently delete ${name} (${email})?\n\nThis removes the Content Admin login account. This action cannot be undone.`)) return;
    const typed = window.prompt(`For safety, type the Content Admin email exactly:\n${email}`, '');
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== email.trim().toLowerCase()) {
      setAccountStatus('Delete cancelled: email confirmation did not match.', true);
      return;
    }

    remove.disabled = true;
    try {
      setAccountStatus('Deleting Content Admin account...');
      await callManager({ action:'delete_content_admin', user_id:userId, confirm_email:typed });
      setAccountStatus('Content Admin account permanently deleted.');
      await load();
    } catch (error) {
      console.error(error);
      setAccountStatus(error.message || 'Unable to delete Content Admin account.', true);
      remove.disabled = false;
    }
  });

  (async () => {
    try {
      if (!(await requireSystemAdmin())) return;
      await load();
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Unable to load Content Admin applications.', true);
      list.innerHTML = '<tr><td colspan="4" class="text-danger">Unable to load applications.</td></tr>';
    }
  })();
})();

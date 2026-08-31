(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('service-form');
  const list = document.getElementById('services-admin-list');
  const status = document.getElementById('service-status');
  const cancel = document.getElementById('service-cancel');
  const formTitle = document.getElementById('service-form-title');
  let services = [];

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-success', !isError && Boolean(message));
    status.classList.toggle('text-secondary', !message);
  }

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  async function requireStaff() {
    if (!client) return false;
    const { data, error } = await client.auth.getUser();
    const user = data?.user;
    if (error || !user) return false;
    const { data: profile } = await client.from('profiles').select('role,is_active').eq('user_id', user.id).maybeSingle();
    return Boolean(profile?.is_active && ['admin', 'editor'].includes(profile.role));
  }

  function resetForm() {
    form?.reset();
    document.getElementById('service-id').value = '';
    document.getElementById('service-order').value = '0';
    document.getElementById('service-active').checked = true;
    cancel?.classList.add('d-none');
    if (formTitle) formTitle.textContent = 'Add Service';
    setStatus('');
  }

  function fillForm(item) {
    document.getElementById('service-id').value = item.id;
    document.getElementById('service-name').value = item.name || '';
    document.getElementById('service-description').value = item.description || '';
    document.getElementById('service-requirements').value = item.requirements || '';
    document.getElementById('service-fee').value = item.fee_text || '';
    document.getElementById('service-processing').value = item.processing_time || '';
    document.getElementById('service-order').value = item.sort_order ?? 0;
    document.getElementById('service-active').checked = item.is_active === true;
    cancel?.classList.remove('d-none');
    if (formTitle) formTitle.textContent = 'Edit Service';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function render() {
    if (!list) return;
    if (!services.length) {
      list.innerHTML = '<tr><td colspan="6" class="text-secondary">No services yet.</td></tr>';
      return;
    }
    list.innerHTML = services.map((item) => `<tr>
      <td>${item.sort_order ?? 0}</td>
      <td><strong>${escapeHtml(item.name)}</strong><div class="small text-secondary text-truncate" style="max-width:320px">${escapeHtml(item.description || '')}</div></td>
      <td>${escapeHtml(item.fee_text || '—')}</td>
      <td>${escapeHtml(item.processing_time || '—')}</td>
      <td><span class="badge ${item.is_active ? 'text-bg-success' : 'text-bg-secondary'}">${item.is_active ? 'Published' : 'Hidden'}</span></td>
      <td class="text-end"><div class="d-inline-flex gap-2"><button class="btn btn-sm btn-outline-dark" type="button" data-edit="${item.id}">Edit</button><button class="btn btn-sm btn-outline-danger" type="button" data-delete="${item.id}">Delete</button></div></td>
    </tr>`).join('');
  }

  async function load() {
    const { data, error } = await client.from('services').select('id,name,description,requirements,fee_text,processing_time,sort_order,is_active,updated_at').order('sort_order', { ascending: true }).order('name', { ascending: true });
    if (error) throw error;
    services = data || [];
    render();
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const id = document.getElementById('service-id').value;
    const payload = {
      name: document.getElementById('service-name').value.trim(),
      description: document.getElementById('service-description').value.trim() || null,
      requirements: document.getElementById('service-requirements').value.trim() || null,
      fee_text: document.getElementById('service-fee').value.trim() || null,
      processing_time: document.getElementById('service-processing').value.trim() || null,
      sort_order: Number.parseInt(document.getElementById('service-order').value || '0', 10) || 0,
      is_active: document.getElementById('service-active').checked,
      updated_at: new Date().toISOString()
    };
    if (!payload.name) return setStatus('Service name is required.', true);
    if (button) button.disabled = true;
    setStatus(id ? 'Updating service...' : 'Adding service...');
    try {
      const query = id ? client.from('services').update(payload).eq('id', id) : client.from('services').insert(payload);
      const { error } = await query;
      if (error) throw error;
      resetForm();
      setStatus(id ? 'Service updated.' : 'Service added.');
      await load();
    } catch (error) {
      console.error(error);
      setStatus(error?.message || 'Unable to save service.', true);
    } finally {
      if (button) button.disabled = false;
    }
  });

  cancel?.addEventListener('click', resetForm);

  list?.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit]');
    const deleteButton = event.target.closest('[data-delete]');
    if (editButton) {
      const item = services.find((row) => String(row.id) === editButton.getAttribute('data-edit'));
      if (item) fillForm(item);
      return;
    }
    if (deleteButton) {
      const id = deleteButton.getAttribute('data-delete');
      if (!window.confirm('Delete this service?')) return;
      deleteButton.disabled = true;
      try {
        const { error } = await client.from('services').delete().eq('id', id);
        if (error) throw error;
        setStatus('Service deleted.');
        await load();
      } catch (error) {
        console.error(error);
        setStatus(error?.message || 'Unable to delete service.', true);
        deleteButton.disabled = false;
      }
    }
  });

  requireStaff().then(async (allowed) => {
    if (!allowed) {
      window.location.href = 'login.html';
      return;
    }
    try { await load(); } catch (error) { console.error(error); setStatus(error?.message || 'Unable to load services.', true); }
  });
})();

(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('official-form');
  const list = document.getElementById('officials-admin-list');
  const status = document.getElementById('official-status');
  const resetButton = document.getElementById('official-reset');
  const CACHE_KEY = 'brgyweb:admin-officials:v1';
  let officials = [];

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-success', !isError && Boolean(message));
    status.classList.toggle('text-secondary', !message);
  }

  function escapeHtml(input) {
    return String(input ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function readCache() {
    try {
      const value = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return Array.isArray(value) ? value : null;
    } catch { return null; }
  }

  function writeCache(value) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch {}
  }

  function render() {
    if (!list) return;
    if (!officials.length) {
      list.innerHTML = '<tr><td colspan="5" class="text-secondary">No officials yet.</td></tr>';
      return;
    }
    list.innerHTML = officials.map((item) => `<tr>
      <td>${Number(item.sort_order) || 0}</td>
      <td>${escapeHtml(item.full_name)}</td>
      <td>${escapeHtml(item.position)}</td>
      <td><span class="badge ${item.is_active ? 'text-bg-success' : 'text-bg-secondary'}">${item.is_active ? 'Published' : 'Hidden'}</span></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-dark me-1" type="button" data-edit-official="${item.id}">Edit</button>
        <button class="btn btn-sm btn-outline-danger" type="button" data-delete-official="${item.id}">Delete</button>
      </td>
    </tr>`).join('');
  }

  function resetForm() {
    if (!form) return;
    form.reset();
    document.getElementById('official-id').value = '';
    document.getElementById('official-order').value = '0';
    document.getElementById('official-active').checked = true;
    setStatus('');
  }

  async function ensureStaff() {
    if (!client) return false;
    const { data: userData } = await client.auth.getUser();
    const user = userData?.user;
    if (!user) return false;
    const { data: profile, error } = await client.from('profiles').select('role,is_active').eq('user_id', user.id).maybeSingle();
    return !error && profile?.is_active === true && ['admin','editor'].includes(profile.role);
  }

  async function loadOfficials(showLoading = false) {
    if (!list) return;
    if (showLoading && !officials.length) list.innerHTML = '<tr><td colspan="5" class="text-secondary">Loading officials...</td></tr>';
    const { data, error } = await client.from('officials').select('id,full_name,position,photo_url,bio,sort_order,is_active').order('sort_order', { ascending: true }).order('id', { ascending: true });
    if (error) throw error;
    officials = data || [];
    writeCache(officials);
    render();
  }

  function editOfficial(id) {
    const item = officials.find((row) => String(row.id) === String(id));
    if (!item) return;
    document.getElementById('official-id').value = item.id;
    document.getElementById('official-name').value = item.full_name || '';
    document.getElementById('official-position').value = item.position || '';
    document.getElementById('official-photo').value = item.photo_url || '';
    document.getElementById('official-bio').value = item.bio || '';
    document.getElementById('official-order').value = String(item.sort_order ?? 0);
    document.getElementById('official-active').checked = item.is_active === true;
    setStatus('Editing selected official.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteOfficial(id) {
    if (!window.confirm('Delete this official?')) return;
    setStatus('Deleting official...');
    const { error } = await client.from('officials').delete().eq('id', id);
    if (error) throw error;
    officials = officials.filter((row) => String(row.id) !== String(id));
    writeCache(officials);
    render();
    resetForm();
    setStatus('Official deleted.');
    loadOfficials().catch((refreshError) => console.warn('Officials refresh failed:', refreshError));
  }

  const cachedOfficials = readCache();
  if (cachedOfficials) {
    officials = cachedOfficials;
    render();
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const id = document.getElementById('official-id').value;
      const payload = {
        full_name: document.getElementById('official-name').value.trim(),
        position: document.getElementById('official-position').value.trim(),
        photo_url: document.getElementById('official-photo').value.trim() || null,
        bio: document.getElementById('official-bio').value.trim() || null,
        sort_order: Number.parseInt(document.getElementById('official-order').value, 10) || 0,
        is_active: document.getElementById('official-active').checked,
        updated_at: new Date().toISOString()
      };

      if (!payload.full_name || !payload.position) return setStatus('Full name and position are required.', true);
      if (button) button.disabled = true;
      setStatus(id ? 'Updating official...' : 'Adding official...');

      try {
        const query = id ? client.from('officials').update(payload).eq('id', id) : client.from('officials').insert(payload);
        const { error } = await query;
        if (error) throw error;
        resetForm();
        setStatus(id ? 'Official updated.' : 'Official added.');
        await loadOfficials();
      } catch (error) {
        console.error(error);
        setStatus(error?.message || 'Unable to save official.', true);
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  if (resetButton) resetButton.addEventListener('click', resetForm);

  if (list) {
    list.addEventListener('click', async (event) => {
      const edit = event.target.closest('[data-edit-official]');
      const remove = event.target.closest('[data-delete-official]');
      if (edit) editOfficial(edit.getAttribute('data-edit-official'));
      if (remove) {
        try { await deleteOfficial(remove.getAttribute('data-delete-official')); }
        catch (error) { console.error(error); setStatus(error?.message || 'Unable to delete official.', true); }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      if (!(await ensureStaff())) return;
      await loadOfficials(!cachedOfficials);
    } catch (error) {
      console.error(error);
      if (!cachedOfficials && list) list.innerHTML = '<tr><td colspan="5" class="text-danger">Unable to load officials.</td></tr>';
      setStatus(error?.message || 'Unable to load officials.', true);
    }
  });
})();
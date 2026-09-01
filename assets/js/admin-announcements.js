(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('announcement-form');
  const list = document.getElementById('announcement-list');
  const status = document.getElementById('announcement-status');
  const cancel = document.getElementById('announcement-cancel');
  const refresh = document.getElementById('announcement-refresh');
  const CACHE_KEY = 'brgyweb:admin-announcements:v1';
  let rows = [];

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-success', !isError && Boolean(message));
    status.classList.toggle('text-secondary', !message);
  }

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function slugify(value) {
    return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 160) || `announcement-${Date.now()}`;
  }

  function readCache() {
    try {
      const value = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return Array.isArray(value?.rows) ? value.rows : null;
    } catch { return null; }
  }

  function writeCache(value) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ rows:value || [], savedAt:Date.now() })); }
    catch {}
  }

  async function requireStaff() {
    if (!client) throw new Error('Supabase connection unavailable.');
    const { data: userData, error: userError } = await client.auth.getUser();
    const user = userData?.user;
    if (userError || !user) throw new Error('Please sign in first.');
    const { data: profile, error } = await client.from('profiles').select('role,is_active').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (!profile || profile.is_active !== true || !['admin','editor'].includes(profile.role)) throw new Error('Staff access required.');
  }

  function toLocalInput(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function resetForm() {
    form?.reset();
    document.getElementById('announcement-id').value = '';
    document.getElementById('announcement-published').checked = true;
    document.getElementById('announcement-form-title').textContent = 'Add Announcement';
    cancel.hidden = true;
  }

  function render() {
    if (!list) return;
    if (!rows.length) {
      list.innerHTML = '<div class="text-secondary">No announcements yet.</div>';
      return;
    }
    list.innerHTML = rows.map((row) => `
      <article class="manage-card">
        <div class="d-flex justify-content-between gap-3 align-items-start">
          <div>
            <div class="d-flex flex-wrap gap-2 mb-2">
              ${row.is_published ? '<span class="badge text-bg-success">Published</span>' : '<span class="badge text-bg-secondary">Hidden</span>'}
              ${row.is_featured ? '<span class="badge text-bg-warning">Featured</span>' : ''}
            </div>
            <strong>${escapeHtml(row.title)}</strong>
            <span>${escapeHtml(row.excerpt || 'No summary')}</span>
            <small class="text-secondary">${row.published_at ? new Date(row.published_at).toLocaleString() : 'No publish date'}</small>
          </div>
          <div class="d-flex gap-2 flex-shrink-0">
            <button class="btn btn-sm btn-outline-dark" type="button" data-edit="${row.id}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" type="button" data-delete="${row.id}">Delete</button>
          </div>
        </div>
      </article>`).join('');
  }

  function hydrateCache() {
    const cached = readCache();
    if (!cached) return false;
    rows = cached;
    render();
    return true;
  }

  async function load({ showLoading = false } = {}) {
    const hadCache = hydrateCache();
    if (showLoading && !hadCache && list) list.innerHTML = '<div class="text-secondary">Loading announcements...</div>';
    const { data, error } = await client.from('announcements').select('id,title,slug,excerpt,content,cover_url,published_at,is_published,is_featured,created_at,updated_at').order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
    if (error) throw error;
    const nextRows = data || [];
    const changed = JSON.stringify(nextRows) !== JSON.stringify(rows);
    rows = nextRows;
    writeCache(rows);
    if (changed || !hadCache) render();
  }

  hydrateCache();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    setStatus('Saving announcement...');
    try {
      const id = document.getElementById('announcement-id').value;
      const title = document.getElementById('announcement-title').value.trim();
      if (!title) throw new Error('Title is required.');
      const dateValue = document.getElementById('announcement-date').value;
      const payload = {
        title,
        slug: slugify(title),
        excerpt: document.getElementById('announcement-excerpt').value.trim() || null,
        content: document.getElementById('announcement-content').value.trim() || null,
        cover_url: document.getElementById('announcement-cover').value.trim() || null,
        published_at: dateValue ? new Date(dateValue).toISOString() : (document.getElementById('announcement-published').checked ? new Date().toISOString() : null),
        is_featured: document.getElementById('announcement-featured').checked,
        is_published: document.getElementById('announcement-published').checked,
        updated_at: new Date().toISOString()
      };
      const query = id ? client.from('announcements').update(payload).eq('id', id) : client.from('announcements').insert(payload);
      const { error } = await query;
      if (error) throw error;
      resetForm();
      setStatus(id ? 'Announcement updated.' : 'Announcement created.');
      await load();
    } catch (error) {
      console.error(error);
      setStatus(error?.message || 'Unable to save announcement.', true);
    } finally {
      if (button) button.disabled = false;
    }
  });

  list?.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit]');
    const deleteButton = event.target.closest('[data-delete]');
    if (editButton) {
      const row = rows.find((item) => String(item.id) === editButton.dataset.edit);
      if (!row) return;
      document.getElementById('announcement-id').value = row.id;
      document.getElementById('announcement-title').value = row.title || '';
      document.getElementById('announcement-excerpt').value = row.excerpt || '';
      document.getElementById('announcement-content').value = row.content || '';
      document.getElementById('announcement-cover').value = row.cover_url || '';
      document.getElementById('announcement-date').value = toLocalInput(row.published_at);
      document.getElementById('announcement-featured').checked = row.is_featured === true;
      document.getElementById('announcement-published').checked = row.is_published === true;
      document.getElementById('announcement-form-title').textContent = 'Edit Announcement';
      cancel.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (deleteButton) {
      const id = deleteButton.dataset.delete;
      if (!window.confirm('Delete this announcement?')) return;
      deleteButton.disabled = true;
      setStatus('Deleting announcement...');
      const { error } = await client.from('announcements').delete().eq('id', id);
      if (error) {
        setStatus(error.message || 'Unable to delete announcement.', true);
        deleteButton.disabled = false;
        return;
      }
      rows = rows.filter((item) => String(item.id) !== String(id));
      writeCache(rows);
      render();
      setStatus('Announcement deleted.');
      await load();
    }
  });

  cancel?.addEventListener('click', resetForm);
  refresh?.addEventListener('click', () => load({ showLoading:true }).catch((error) => setStatus(error.message || 'Unable to refresh.', true)));

  (async () => {
    try {
      await requireStaff();
      await load();
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Unable to load manager.', true);
      if (list && !rows.length) list.innerHTML = '<div class="text-danger">Staff access required.</div>';
    }
  })();
})();

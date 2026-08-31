(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const bucket = 'gallery-media';
  const form = document.getElementById('gallery-form');
  const list = document.getElementById('gallery-admin-list');
  const status = document.getElementById('gallery-status');
  const cancel = document.getElementById('gallery-cancel');
  const refresh = document.getElementById('gallery-refresh');
  const imageInput = document.getElementById('gallery-image');
  const preview = document.getElementById('gallery-preview');
  let previewObjectUrl = null;

  function setStatus(message, isError = false) {
    status.textContent = message || '';
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-success', !isError && Boolean(message));
    status.classList.toggle('text-secondary', !message);
  }

  function esc(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  async function requireStaff() {
    if (!client) return false;
    const { data: userData, error: userError } = await client.auth.getUser();
    const user = userData?.user;
    if (userError || !user) return false;
    const { data: profile, error } = await client.from('profiles').select('role,is_active').eq('user_id', user.id).maybeSingle();
    return !error && profile?.is_active === true && ['admin','editor'].includes(profile.role);
  }

  function storagePathFromUrl(url) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = String(url || '').indexOf(marker);
    return index >= 0 ? decodeURIComponent(String(url).slice(index + marker.length)) : null;
  }

  function clearPreviewObjectUrl() {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }

  function resetForm(clearStatus = true) {
    clearPreviewObjectUrl();
    form.reset();
    document.getElementById('gallery-id').value = '';
    document.getElementById('gallery-current-url').value = '';
    document.getElementById('gallery-order').value = '0';
    document.getElementById('gallery-published').checked = true;
    document.getElementById('gallery-form-title').textContent = 'Add Gallery Item';
    document.getElementById('gallery-save').textContent = 'Upload & Save';
    cancel.classList.add('d-none');
    preview.src = '';
    preview.classList.add('d-none');
    if (clearStatus) setStatus('');
  }

  function render(items) {
    if (!items.length) {
      list.innerHTML = '<div class="col-12"><div class="empty-state">No gallery items yet.</div></div>';
      return;
    }
    list.innerHTML = items.map((item) => `
      <div class="col-md-6">
        <article class="border rounded-3 overflow-hidden h-100 bg-white">
          <img src="${esc(item.image_url)}" alt="${esc(item.title || item.caption || 'Gallery image')}" style="width:100%;height:180px;object-fit:cover" loading="lazy">
          <div class="p-3">
            <div class="d-flex justify-content-between gap-2 align-items-start">
              <div><strong>${esc(item.title || 'Untitled')}</strong><div class="small text-secondary">${esc(item.album || 'No album')} · Order ${Number(item.sort_order) || 0}</div></div>
              <span class="badge ${item.is_published ? 'text-bg-success' : 'text-bg-secondary'}">${item.is_published ? 'Published' : 'Hidden'}</span>
            </div>
            ${item.caption ? `<p class="small mt-2 mb-3">${esc(item.caption)}</p>` : '<div class="mb-3"></div>'}
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-dark" type="button" data-edit="${item.id}">Edit</button>
              <button class="btn btn-sm btn-outline-danger" type="button" data-delete="${item.id}">Delete</button>
            </div>
          </div>
        </article>
      </div>`).join('');
  }

  async function loadItems() {
    list.innerHTML = '<div class="col-12"><div class="empty-state">Loading gallery...</div></div>';
    const { data, error } = await client.from('gallery_items').select('id,title,caption,image_url,album,sort_order,is_published,created_at').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (error) throw error;
    render(data || []);
    return data || [];
  }

  async function uploadImage(file) {
    if (!file) throw new Error('Choose an image to upload.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller.');
    const allowed = ['image/jpeg','image/png','image/webp','image/gif'];
    if (!allowed.includes(file.type)) throw new Error('Use JPG, PNG, WebP, or GIF.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const { error } = await client.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  async function deleteStoredImage(url) {
    const path = storagePathFromUrl(url);
    if (!path) return true;
    const { error } = await client.storage.from(bucket).remove([path]);
    if (error) {
      console.warn('Unable to remove gallery file:', error);
      return false;
    }
    return true;
  }

  imageInput.addEventListener('change', () => {
    clearPreviewObjectUrl();
    const file = imageInput.files?.[0];
    if (!file) return;
    previewObjectUrl = URL.createObjectURL(file);
    preview.src = previewObjectUrl;
    preview.classList.remove('d-none');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = document.getElementById('gallery-save');
    button.disabled = true;
    setStatus('Saving gallery item...');
    let uploaded = null;
    try {
      const id = document.getElementById('gallery-id').value;
      const currentUrl = document.getElementById('gallery-current-url').value;
      const file = imageInput.files?.[0] || null;
      let imageUrl = currentUrl;
      if (file) {
        uploaded = await uploadImage(file);
        imageUrl = uploaded.url;
      }
      if (!imageUrl) throw new Error('Choose an image to upload.');

      const payload = {
        title: document.getElementById('gallery-title').value.trim() || null,
        caption: document.getElementById('gallery-caption').value.trim() || null,
        image_url: imageUrl,
        album: document.getElementById('gallery-album').value.trim() || null,
        sort_order: Math.max(0, Number.parseInt(document.getElementById('gallery-order').value || '0', 10) || 0),
        is_published: document.getElementById('gallery-published').checked
      };

      const query = id ? client.from('gallery_items').update(payload).eq('id', id) : client.from('gallery_items').insert(payload);
      const { error } = await query;
      if (error) throw error;

      let cleanupOkay = true;
      if (id && uploaded && currentUrl && currentUrl !== imageUrl) cleanupOkay = await deleteStoredImage(currentUrl);
      resetForm(false);
      setStatus(cleanupOkay ? (id ? 'Gallery item updated.' : 'Gallery item uploaded.') : 'Gallery item saved, but the old image could not be removed.');
      await loadItems();
    } catch (error) {
      if (uploaded?.url) await deleteStoredImage(uploaded.url);
      console.error(error);
      setStatus(error?.message || 'Unable to save gallery item.', true);
    } finally {
      button.disabled = false;
    }
  });

  list.addEventListener('click', async (event) => {
    const edit = event.target.closest('[data-edit]');
    const del = event.target.closest('[data-delete]');
    if (edit) {
      const id = edit.getAttribute('data-edit');
      const { data, error } = await client.from('gallery_items').select('id,title,caption,image_url,album,sort_order,is_published').eq('id', id).single();
      if (error) return setStatus(error.message, true);
      clearPreviewObjectUrl();
      document.getElementById('gallery-id').value = data.id;
      document.getElementById('gallery-current-url').value = data.image_url;
      document.getElementById('gallery-title').value = data.title || '';
      document.getElementById('gallery-caption').value = data.caption || '';
      document.getElementById('gallery-album').value = data.album || '';
      document.getElementById('gallery-order').value = data.sort_order ?? 0;
      document.getElementById('gallery-published').checked = data.is_published === true;
      document.getElementById('gallery-form-title').textContent = 'Edit Gallery Item';
      document.getElementById('gallery-save').textContent = 'Save Changes';
      cancel.classList.remove('d-none');
      preview.src = data.image_url;
      preview.classList.remove('d-none');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (del) {
      const id = del.getAttribute('data-delete');
      if (!window.confirm('Delete this gallery item and its uploaded image?')) return;
      del.disabled = true;
      try {
        const { data, error: readError } = await client.from('gallery_items').select('image_url').eq('id', id).single();
        if (readError) throw readError;
        const { error } = await client.from('gallery_items').delete().eq('id', id);
        if (error) throw error;
        const cleanupOkay = await deleteStoredImage(data.image_url);
        setStatus(cleanupOkay ? 'Gallery item deleted.' : 'Gallery record deleted, but its image could not be removed from Storage.', !cleanupOkay);
        await loadItems();
      } catch (error) {
        console.error(error);
        setStatus(error?.message || 'Unable to delete gallery item.', true);
        del.disabled = false;
      }
    }
  });

  cancel.addEventListener('click', () => resetForm());
  refresh.addEventListener('click', () => loadItems().catch((error) => setStatus(error.message, true)));

  (async () => {
    const allowed = await requireStaff();
    if (!allowed) {
      window.location.href = 'login.html';
      return;
    }
    try { await loadItems(); } catch (error) { setStatus(error?.message || 'Unable to load gallery.', true); }
  })();
})();
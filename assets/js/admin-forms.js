(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const BUCKET = 'forms';
  const form = document.getElementById('downloadable-form-form');
  const list = document.getElementById('downloadable-form-list');
  const status = document.getElementById('downloadable-form-status');
  const cancel = document.getElementById('downloadable-form-cancel');
  const refresh = document.getElementById('downloadable-form-refresh');

  const esc = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const val = (id) => document.getElementById(id)?.value.trim() || '';
  const setVal = (id, value='') => { const el = document.getElementById(id); if (el) el.value = value ?? ''; };
  function signalStorageChange(source) { try { localStorage.setItem('brgyweb:storage-change:v1', JSON.stringify({ source, at: Date.now() })); } catch {} }
  function setStatus(message, error=false) { if (!status) return; status.textContent = message; status.className = `small ${error ? 'text-danger' : 'text-success'}`; }
  function readableSize(bytes) { const value = Number(bytes); if (!Number.isFinite(value) || value <= 0) return ''; if (value < 1024) return `${value} B`; if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`; return `${(value / (1024 * 1024)).toFixed(1)} MB`; }
  function storagePath(url) { const marker = `/storage/v1/object/public/${BUCKET}/`; return url?.includes(marker) ? decodeURIComponent(url.split(marker)[1].split('?')[0]) : null; }
  function publicUrl(path) { return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; }
  function reset() { form?.reset(); setVal('downloadable-form-id'); setVal('downloadable-form-existing-url'); setVal('downloadable-form-order','0'); const published = document.getElementById('downloadable-form-published'); if (published) published.checked = true; cancel?.classList.add('d-none'); const title = document.getElementById('form-manager-title'); if (title) title.textContent = 'Add Downloadable Form'; }

  async function requireStaff() {
    if (!client) { location.href='login.html'; return false; }
    const { data, error } = await client.auth.getUser(); const user = data?.user;
    if (error || !user) { location.href='login.html'; return false; }
    const { data: profile, error: profileError } = await client.from('profiles').select('role,is_active').eq('user_id', user.id).maybeSingle();
    if (profileError || !profile || profile.is_active !== true || !['admin','editor'].includes(profile.role)) { await client.auth.signOut(); location.href='login.html'; return false; }
    return true;
  }

  async function removeStored(url) { const path = storagePath(url); if (!path) return true; const { error } = await client.storage.from(BUCKET).remove([path]); if (error) { console.warn('Unable to remove form file:', error); return false; } signalStorageChange('forms-remove'); return true; }
  async function upload(file) {
    if (!file) throw new Error('Choose a file to upload.');
    if (file.size > 10 * 1024 * 1024) throw new Error('File must be 10 MB or smaller.');
    const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowed.includes(file.type)) throw new Error('Only PDF, Word, and Excel files are allowed.');
    const ext = (file.name.split('.').pop() || 'file').toLowerCase().replace(/[^a-z0-9]/g,''); const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const { error } = await client.storage.from(BUCKET).upload(path, file, { cacheControl:'3600', upsert:false, contentType:file.type }); if (error) throw error;
    signalStorageChange('forms-upload');
    return { path, url: publicUrl(path) };
  }

  async function load() {
    if (!list) return; list.innerHTML = '<div class="text-secondary">Loading forms...</div>';
    const { data, error } = await client.from('forms').select('*').order('sort_order').order('name'); if (error) throw error;
    if (!data?.length) { list.innerHTML = '<div class="empty-state">No downloadable forms yet.</div>'; return; }
    list.innerHTML = data.map((row) => { const meta = [row.category || 'Uncategorized', readableSize(row.file_size), `Order ${Number(row.sort_order) || 0}`].filter(Boolean).join(' • '); return `<div class="border rounded-3 p-3"><div class="d-flex flex-wrap justify-content-between gap-3"><div class="flex-grow-1"><div class="d-flex gap-2 align-items-center flex-wrap"><strong>${esc(row.name)}</strong><span class="badge ${row.is_published ? 'text-bg-success' : 'text-bg-secondary'}">${row.is_published ? 'Published' : 'Hidden'}</span></div><div class="small text-secondary mt-1">${esc(meta)}</div>${row.description ? `<p class="mb-1 mt-2">${esc(row.description)}</p>` : ''}<a class="small" href="${esc(row.file_url)}" target="_blank" rel="noopener noreferrer">Open uploaded file</a></div><div class="d-flex gap-2 align-self-start"><button class="btn btn-sm btn-outline-dark" type="button" data-edit="${row.id}">Edit</button><button class="btn btn-sm btn-outline-danger" type="button" data-delete="${row.id}">Delete</button></div></div></div>`; }).join('');
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault(); const button = form.querySelector('button[type="submit"]'); if (button) button.disabled = true; setStatus('Saving form...'); let newPath = null;
    try {
      const id = val('downloadable-form-id'); const oldUrl = val('downloadable-form-existing-url'); const file = document.getElementById('downloadable-form-file')?.files?.[0] || null; if (!id && !file) throw new Error('Choose a file for the new form.');
      let fileUrl = oldUrl || null, fileName = null, fileType = null, fileSize = null;
      if (id && !file) { const { data: existing, error: existingError } = await client.from('forms').select('file_name,file_type,file_size').eq('id',id).single(); if (existingError) throw existingError; fileName = existing.file_name; fileType = existing.file_type; fileSize = existing.file_size; }
      if (file) { const uploaded = await upload(file); newPath = uploaded.path; fileUrl = uploaded.url; fileName = file.name; fileType = file.type; fileSize = file.size; }
      const payload = { name: val('downloadable-form-name'), category: val('downloadable-form-category') || null, description: val('downloadable-form-description') || null, file_url: fileUrl, file_name: fileName, file_type: fileType, file_size: fileSize, is_published: document.getElementById('downloadable-form-published')?.checked === true, sort_order: Math.max(0, Number.parseInt(val('downloadable-form-order') || '0', 10) || 0), updated_at: new Date().toISOString() };
      if (!payload.name) throw new Error('Form name is required.'); if (!payload.file_url) throw new Error('A downloadable file is required.');
      const query = id ? client.from('forms').update(payload).eq('id',id) : client.from('forms').insert(payload); const { error } = await query; if (error) throw error;
      let cleanupOkay = true; if (file && oldUrl) cleanupOkay = await removeStored(oldUrl); reset(); setStatus(cleanupOkay ? 'Downloadable form saved.' : 'Form saved, but the old uploaded file could not be removed.', !cleanupOkay); await load();
    } catch (error) { console.error(error); if (newPath) { const rollback = await client.storage.from(BUCKET).remove([newPath]); if (rollback.error) console.warn('Unable to roll back uploaded form:', rollback.error); else signalStorageChange('forms-rollback'); } setStatus(error.message || 'Unable to save form.', true); } finally { if (button) button.disabled = false; }
  });

  list?.addEventListener('click', async (event) => {
    const edit = event.target.closest('[data-edit]'); const del = event.target.closest('[data-delete]');
    if (edit) { const { data, error } = await client.from('forms').select('*').eq('id', edit.dataset.edit).single(); if (error) return setStatus(error.message, true); setVal('downloadable-form-id', data.id); setVal('downloadable-form-existing-url', data.file_url || ''); setVal('downloadable-form-name', data.name || ''); setVal('downloadable-form-category', data.category || ''); setVal('downloadable-form-description', data.description || ''); setVal('downloadable-form-order', data.sort_order ?? 0); const published = document.getElementById('downloadable-form-published'); if (published) published.checked = data.is_published === true; cancel?.classList.remove('d-none'); const title = document.getElementById('form-manager-title'); if (title) title.textContent = 'Edit Downloadable Form'; window.scrollTo({ top:0, behavior:'smooth' }); }
    if (del) { if (!confirm('Delete this downloadable form and its uploaded file?')) return; del.disabled = true; try { const { data, error } = await client.from('forms').select('file_url').eq('id', del.dataset.delete).single(); if (error) throw error; const { error: deleteError } = await client.from('forms').delete().eq('id', del.dataset.delete); if (deleteError) throw deleteError; const cleanupOkay = await removeStored(data.file_url); setStatus(cleanupOkay ? 'Downloadable form deleted.' : 'Form record deleted, but its uploaded file could not be removed.', !cleanupOkay); await load(); } catch (error) { console.error(error); setStatus(error.message || 'Unable to delete form.', true); del.disabled = false; } }
  });

  cancel?.addEventListener('click', reset); refresh?.addEventListener('click', () => load().catch((error) => setStatus(error.message, true)));
  requireStaff().then((ok) => { if (ok) load().catch((error) => setStatus(error.message || 'Unable to load forms.', true)); });
})();
(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('site-settings-form');
  const fileInput = document.getElementById('setting-logo-file');
  const urlInput = document.getElementById('setting-logo');
  const preview = document.getElementById('setting-logo-preview');
  const previewEmpty = document.getElementById('setting-logo-empty');
  const removeButton = document.getElementById('setting-logo-remove');
  const status = document.getElementById('site-settings-status');
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!client || !form || !fileInput || !urlInput) return;

  const BUCKET = 'branding-media';
  const OBJECT_PATH = 'logo/current';
  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

  let selectedFile = null;
  let previewObjectUrl = null;
  let removeRequested = false;
  let bypassUploadHook = false;

  const signalStorageChange = (source) => { try { localStorage.setItem('brgyweb:storage-change:v1', JSON.stringify({ source, at: Date.now() })); } catch {} };
  const setMessage = (message, isError = false) => { if (!status) return; status.textContent = message; status.classList.toggle('text-danger', isError); status.classList.toggle('text-success', !isError && Boolean(message)); };
  const clearObjectPreview = () => { if (!previewObjectUrl) return; URL.revokeObjectURL(previewObjectUrl); previewObjectUrl = null; };
  const showPreview = (src) => { if (!preview) return; if (!src) { preview.removeAttribute('src'); preview.classList.add('d-none'); previewEmpty?.classList.remove('d-none'); removeButton?.classList.add('d-none'); return; } preview.src = src; preview.classList.remove('d-none'); previewEmpty?.classList.add('d-none'); removeButton?.classList.remove('d-none'); };

  async function loadCurrentLogo() {
    try { const { data, error } = await client.from('site_settings').select('logo_url').eq('id', 1).single(); if (error) throw error; if (data?.logo_url) { urlInput.value = data.logo_url; showPreview(data.logo_url); } else showPreview(''); }
    catch (error) { console.warn('Unable to load logo preview:', error); }
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0] || null; clearObjectPreview(); selectedFile = null; removeRequested = false;
    if (!file) { showPreview(urlInput.value.trim()); return; }
    if (!ALLOWED_TYPES.has(file.type)) { fileInput.value = ''; setMessage('Logo must be a PNG, JPG, or WebP image.', true); showPreview(urlInput.value.trim()); return; }
    if (file.size > MAX_SIZE) { fileInput.value = ''; setMessage('Logo must be 2 MB or smaller.', true); showPreview(urlInput.value.trim()); return; }
    selectedFile = file; previewObjectUrl = URL.createObjectURL(file); showPreview(previewObjectUrl); setMessage('Logo selected. Save Site Settings to upload it.');
  });

  removeButton?.addEventListener('click', () => { clearObjectPreview(); selectedFile = null; removeRequested = true; fileInput.value = ''; urlInput.value = ''; showPreview(''); setMessage('Logo will be removed when you save Site Settings.'); });

  form.addEventListener('submit', async (event) => {
    if (bypassUploadHook || (!selectedFile && !removeRequested)) return;
    event.preventDefault(); event.stopImmediatePropagation(); if (submitButton) submitButton.disabled = true;
    try {
      if (selectedFile) {
        setMessage('Uploading logo...');
        const { error: uploadError } = await client.storage.from(BUCKET).upload(OBJECT_PATH, selectedFile, { upsert: true, cacheControl: '3600', contentType: selectedFile.type });
        if (uploadError) throw uploadError;
        signalStorageChange('logo-upload');
        const { data } = client.storage.from(BUCKET).getPublicUrl(OBJECT_PATH); if (!data?.publicUrl) throw new Error('Unable to generate logo URL.');
        const publicUrl = `${data.publicUrl}?v=${Date.now()}`; urlInput.value = publicUrl; clearObjectPreview(); showPreview(publicUrl); selectedFile = null; fileInput.value = '';
      } else if (removeRequested) {
        setMessage('Removing logo...');
        const { error: removeError } = await client.storage.from(BUCKET).remove([OBJECT_PATH]);
        if (removeError && !String(removeError.message || '').toLowerCase().includes('not found')) throw removeError;
        if (!removeError) signalStorageChange('logo-remove');
        urlInput.value = ''; removeRequested = false;
      }
      bypassUploadHook = true; form.requestSubmit(); queueMicrotask(() => { bypassUploadHook = false; });
    } catch (error) { console.error('Logo upload error:', error); setMessage(error.message || 'Unable to update the logo.', true); if (submitButton) submitButton.disabled = false; }
  }, true);

  window.addEventListener('beforeunload', clearObjectPreview);
  loadCurrentLogo();
})();
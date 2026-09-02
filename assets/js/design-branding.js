(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const nameInput = document.getElementById('system-brand-name');
  const taglineInput = document.getElementById('system-brand-tagline');
  const logoUrlInput = document.getElementById('system-brand-logo-url');
  const logoFileInput = document.getElementById('system-brand-logo-file');
  const logoRemoveButton = document.getElementById('system-brand-logo-remove');
  const saveButton = document.getElementById('system-brand-save');
  const resetButton = document.getElementById('system-brand-reset');
  const status = document.getElementById('system-brand-status');
  const previewLogo = document.getElementById('system-brand-preview-logo');
  const previewName = document.getElementById('system-brand-preview-name');
  const previewTagline = document.getElementById('system-brand-preview-tagline');
  const designForm = document.getElementById('design-studio-form');
  const designChangeState = document.getElementById('design-change-state');
  if (!nameInput || !taglineInput || !logoUrlInput || !logoFileInput || !saveButton) return;

  const CACHE_KEY = 'brgyweb:system-brand:v1';
  const DEFAULTS = { name:'BRGYWEB-LITE', tagline:'Administration Access', logoUrl:'' };
  const BUCKET = 'branding-media';
  const OBJECT_PATH = 'system/current';
  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = new Set(['image/png','image/jpeg','image/webp']);
  let saved = { ...DEFAULTS };
  let selectedFile = null;
  let previewObjectUrl = null;
  let removeRequested = false;

  function normalize(input = {}) {
    const runtime = window.BRGY_SYSTEM_BRAND;
    if (runtime?.normalize) return runtime.normalize(input);
    const name = String(input.name || DEFAULTS.name).trim().slice(0, 60) || DEFAULTS.name;
    const tagline = String(input.tagline || DEFAULTS.tagline).trim().slice(0, 100) || DEFAULTS.tagline;
    let logoUrl = String(input.logoUrl || '').trim();
    if (logoUrl && !/^https:\/\//i.test(logoUrl)) logoUrl = '';
    return { name, tagline, logoUrl };
  }

  function sameBrand(a, b) {
    return a?.name === b?.name && a?.tagline === b?.tagline && a?.logoUrl === b?.logoUrl;
  }

  function readCache() {
    try { return normalize(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') || {}); }
    catch { return { ...DEFAULTS }; }
  }

  function setStatus(message, error = false) {
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('text-danger', error);
    status.classList.toggle('text-success', !error && Boolean(message));
  }

  function signalStorageChange(source) {
    try { localStorage.setItem('brgyweb:storage-change:v1', JSON.stringify({ source, at:Date.now() })); } catch {}
  }

  function clearObjectPreview() {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }

  function renderLogo(src, name) {
    if (src) previewLogo.innerHTML = `<img src="${src.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}" alt="">`;
    else previewLogo.textContent = (String(name || 'B').charAt(0) || 'B').toUpperCase();
  }

  function currentForm(logoOverride) {
    const brand = normalize({
      name: nameInput.value.trim(),
      tagline: taglineInput.value.trim(),
      logoUrl: logoOverride === undefined ? logoUrlInput.value.trim() : logoOverride
    });
    if (!brand.name) throw new Error('System name is required.');
    return brand;
  }

  function render(brandInput) {
    const brand = normalize(brandInput);
    clearObjectPreview();
    selectedFile = null;
    removeRequested = false;
    logoFileInput.value = '';
    nameInput.value = brand.name;
    taglineInput.value = brand.tagline;
    logoUrlInput.value = brand.logoUrl;
    previewName.textContent = brand.name;
    previewTagline.textContent = brand.tagline;
    renderLogo(brand.logoUrl, brand.name);
    logoRemoveButton?.classList.toggle('d-none', !brand.logoUrl);
  }

  function previewFromInputs() {
    try {
      const brand = currentForm(removeRequested ? '' : undefined);
      previewName.textContent = brand.name;
      previewTagline.textContent = brand.tagline;
      if (!selectedFile) renderLogo(brand.logoUrl, brand.name);
      setStatus('');
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function mergeBrandIntoLatest(brandInput, quiet = false) {
    if (!client) return false;
    const brand = normalize(brandInput);
    const { data: current, error: readError } = await client.from('site_settings').select('design_theme').eq('id', 1).single();
    if (readError) throw readError;
    const existingBrand = normalize(current?.design_theme?.systemBrand || DEFAULTS);
    if (sameBrand(existingBrand, brand)) return false;
    const nextTheme = { ...(current?.design_theme || {}), systemBrand: brand };
    const { error } = await client.from('site_settings').update({ design_theme: nextTheme, updated_at:new Date().toISOString() }).eq('id', 1);
    if (error) throw error;
    if (!quiet) setStatus('System branding saved.');
    return true;
  }

  async function uploadLogo(file) {
    const { error } = await client.storage.from(BUCKET).upload(OBJECT_PATH, file, { upsert:true, cacheControl:'3600', contentType:file.type });
    if (error) throw error;
    signalStorageChange('system-logo-upload');
    const { data } = client.storage.from(BUCKET).getPublicUrl(OBJECT_PATH);
    if (!data?.publicUrl) throw new Error('Unable to generate system logo URL.');
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async function removeLogoFile() {
    const { error } = await client.storage.from(BUCKET).remove([OBJECT_PATH]);
    if (error && !String(error.message || '').toLowerCase().includes('not found')) throw error;
    if (!error) signalStorageChange('system-logo-remove');
  }

  async function load() {
    const cached = readCache();
    saved = cached;
    render(cached);
    if (!client) return;
    try {
      const { data, error } = await client.from('site_settings').select('design_theme').eq('id', 1).single();
      if (error) throw error;
      saved = normalize(data?.design_theme?.systemBrand || DEFAULTS);
      render(saved);
      window.BRGY_SYSTEM_BRAND?.apply?.(saved);
    } catch (error) {
      console.warn('Unable to load system branding:', error);
      setStatus('Cached branding shown.');
    }
  }

  async function save() {
    if (!client) return setStatus('Supabase connection is unavailable.', true);
    saveButton.disabled = true;
    setStatus('Saving branding…');
    try {
      let logoUrl = logoUrlInput.value.trim();
      if (selectedFile) {
        setStatus('Uploading system logo…');
        logoUrl = await uploadLogo(selectedFile);
      } else if (removeRequested) {
        setStatus('Removing system logo…');
        await removeLogoFile();
        logoUrl = '';
      }
      const brand = currentForm(logoUrl);
      await mergeBrandIntoLatest(brand, true);
      saved = brand;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(brand)); } catch {}
      window.BRGY_SYSTEM_BRAND?.apply?.(brand);
      render(brand);
      setStatus('System branding saved.');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Unable to save system branding.', true);
    } finally {
      saveButton.disabled = false;
    }
  }

  async function preserveAfterDesignPublish() {
    const started = Date.now();
    while (Date.now() - started < 12000) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (designChangeState?.textContent?.trim() !== 'Published design is active') continue;
      try {
        const changed = await mergeBrandIntoLatest(saved, true);
        if (changed) window.BRGY_SYSTEM_BRAND?.apply?.(saved);
      } catch (error) {
        console.warn('Unable to preserve branding after design publish:', error);
      }
      return;
    }
  }

  nameInput.addEventListener('input', previewFromInputs);
  taglineInput.addEventListener('input', previewFromInputs);
  logoFileInput.addEventListener('change', () => {
    clearObjectPreview();
    selectedFile = null;
    removeRequested = false;
    const file = logoFileInput.files?.[0] || null;
    if (!file) { renderLogo(logoUrlInput.value.trim(), nameInput.value); return; }
    if (!ALLOWED_TYPES.has(file.type)) {
      logoFileInput.value = '';
      setStatus('Logo must be PNG, JPG, or WebP.', true);
      return;
    }
    if (file.size > MAX_SIZE) {
      logoFileInput.value = '';
      setStatus('Logo must be 2 MB or smaller.', true);
      return;
    }
    selectedFile = file;
    previewObjectUrl = URL.createObjectURL(file);
    renderLogo(previewObjectUrl, nameInput.value);
    logoRemoveButton?.classList.remove('d-none');
    setStatus('New logo selected. Save Branding to upload it.');
  });
  logoRemoveButton?.addEventListener('click', () => {
    clearObjectPreview();
    selectedFile = null;
    removeRequested = true;
    logoFileInput.value = '';
    renderLogo('', nameInput.value);
    logoRemoveButton.classList.add('d-none');
    setStatus('Logo will be removed when you Save Branding.');
  });
  saveButton.addEventListener('click', save);
  resetButton?.addEventListener('click', () => { render(saved); setStatus('Restored saved branding.'); });
  designForm?.addEventListener('submit', () => { preserveAfterDesignPublish(); });
  window.addEventListener('beforeunload', clearObjectPreview);

  load();
})();
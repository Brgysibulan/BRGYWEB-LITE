(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const nameInput = document.getElementById('system-brand-name');
  const taglineInput = document.getElementById('system-brand-tagline');
  const logoInput = document.getElementById('system-brand-logo-url');
  const saveButton = document.getElementById('system-brand-save');
  const resetButton = document.getElementById('system-brand-reset');
  const status = document.getElementById('system-brand-status');
  const previewLogo = document.getElementById('system-brand-preview-logo');
  const previewName = document.getElementById('system-brand-preview-name');
  const previewTagline = document.getElementById('system-brand-preview-tagline');
  const designForm = document.getElementById('design-studio-form');
  const designChangeState = document.getElementById('design-change-state');
  if (!nameInput || !taglineInput || !logoInput || !saveButton) return;

  const CACHE_KEY = 'brgyweb:system-brand:v1';
  const DEFAULTS = { name:'BRGYWEB-LITE', tagline:'Administration Access', logoUrl:'' };
  let saved = { ...DEFAULTS };

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

  function currentForm() {
    const rawLogo = logoInput.value.trim();
    if (rawLogo && !/^https:\/\//i.test(rawLogo)) throw new Error('Logo URL must use HTTPS.');
    const brand = normalize({
      name: nameInput.value.trim(),
      tagline: taglineInput.value.trim(),
      logoUrl: rawLogo
    });
    if (!brand.name) throw new Error('System name is required.');
    return brand;
  }

  function render(brandInput) {
    const brand = normalize(brandInput);
    nameInput.value = brand.name;
    taglineInput.value = brand.tagline;
    logoInput.value = brand.logoUrl;
    previewName.textContent = brand.name;
    previewTagline.textContent = brand.tagline;
    if (brand.logoUrl) previewLogo.innerHTML = `<img src="${brand.logoUrl.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}" alt="">`;
    else previewLogo.textContent = (brand.name.charAt(0) || 'B').toUpperCase();
  }

  function previewFromInputs() {
    try {
      const brand = currentForm();
      previewName.textContent = brand.name;
      previewTagline.textContent = brand.tagline;
      if (brand.logoUrl) previewLogo.innerHTML = `<img src="${brand.logoUrl.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}" alt="">`;
      else previewLogo.textContent = (brand.name.charAt(0) || 'B').toUpperCase();
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
    let brand;
    try { brand = currentForm(); }
    catch (error) { return setStatus(error.message, true); }
    saveButton.disabled = true;
    setStatus('Saving branding…');
    try {
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

  [nameInput, taglineInput, logoInput].forEach((input) => input.addEventListener('input', previewFromInputs));
  saveButton.addEventListener('click', save);
  resetButton?.addEventListener('click', () => { render(saved); setStatus('Restored saved branding.'); });
  designForm?.addEventListener('submit', () => { preserveAfterDesignPublish(); });

  load();
})();
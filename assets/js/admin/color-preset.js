/** BRGYWEB-LITE — simple fixed color preset picker */
(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('color-preset-form');
  const status = document.getElementById('color-preset-status');
  if (!client || !form) return;

  const DEFAULT_PRESET = 'civic-blue';
  const ALLOWED = new Set(['civic-blue','heritage-green','public-maroon','executive-indigo']);

  function setStatus(message, error = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', error);
    status.classList.toggle('text-success', !error && Boolean(message));
  }

  function apply(value) {
    const preset = ALLOWED.has(value) ? value : DEFAULT_PRESET;
    document.documentElement.dataset.colorPreset = preset;
    const input = form.querySelector(`input[name="color-preset"][value="${preset}"]`);
    if (input) input.checked = true;
    form.querySelectorAll('.color-preset-option').forEach((option) => {
      option.classList.toggle('is-selected', option.dataset.preset === preset);
    });
    return preset;
  }

  async function load() {
    setStatus('Loading color preset…');
    const { data, error } = await client.from('site_settings').select('color_preset').eq('id', 1).single();
    if (error) return setStatus(error.message || 'Unable to load color preset.', true);
    apply(data?.color_preset || DEFAULT_PRESET);
    setStatus('Color preset loaded.');
  }

  form.addEventListener('change', (event) => {
    const input = event.target.closest('input[name="color-preset"]');
    if (input) apply(input.value);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const selected = form.querySelector('input[name="color-preset"]:checked')?.value || DEFAULT_PRESET;
    const preset = apply(selected);
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    setStatus('Saving color preset…');
    const { error } = await client.from('site_settings').update({ color_preset:preset, updated_at:new Date().toISOString() }).eq('id', 1);
    if (button) button.disabled = false;
    if (error) return setStatus(error.message || 'Unable to save color preset.', true);
    try { localStorage.setItem('brgyweb:color-preset:v1', preset); } catch {}
    setStatus('Color preset saved.');
  });

  load();
})();

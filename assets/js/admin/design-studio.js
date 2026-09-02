/**
 * BRGYWEB-LITE — Design Studio
 * Purpose: Preview and persist public-site visual settings from the admin panel.
 * Depends on: core/supabase-config.js
 * Used by: admin/design-studio.html
 */
(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const primary = document.getElementById('studio-primary');
  const accent = document.getElementById('studio-accent');
  const radius = document.getElementById('studio-radius');
  const width = document.getElementById('studio-width');
  const preview = document.getElementById('studio-preview');
  const status = document.getElementById('studio-status');
  const save = document.getElementById('studio-save');
  const reset = document.getElementById('studio-reset');
  if (!client || !preview) return;

  const defaults = { primary:'#176b3a', accent:'#d4a72c', radius:'14', width:'1240' };

  function setStatus(message, error = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', error);
    status.classList.toggle('text-success', !error && Boolean(message));
    status.classList.toggle('text-secondary', !error && !message);
  }

  function values() {
    return { primary:primary.value, accent:accent.value, radius:radius.value, width:width.value };
  }

  function applyPreview() {
    const theme = values();
    preview.style.setProperty('--studio-primary', theme.primary);
    preview.style.setProperty('--studio-accent', theme.accent);
    preview.style.setProperty('--studio-radius', `${theme.radius}px`);
    preview.style.maxWidth = `${theme.width}px`;
  }

  function applyValues(theme = defaults) {
    primary.value = theme.primary || defaults.primary;
    accent.value = theme.accent || defaults.accent;
    radius.value = String(theme.radius || defaults.radius);
    width.value = String(theme.width || defaults.width);
    applyPreview();
  }

  async function requireAdmin() {
    const { data } = await client.auth.getUser();
    if (!data?.user) { window.location.href = 'login.html'; return null; }
    const { data: profile } = await client.from('profiles').select('role,is_active').eq('user_id', data.user.id).maybeSingle();
    if (profile?.role !== 'admin' || profile?.is_active !== true) { window.location.href = 'login.html'; return null; }
    return data.user;
  }

  async function loadTheme() {
    const { data, error } = await client.from('site_settings').select('value').eq('key', 'public_design').maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    applyValues(data?.value || defaults);
  }

  async function saveTheme() {
    save.disabled = true;
    try {
      setStatus('Saving design…');
      const { error } = await client.from('site_settings').upsert({ key:'public_design', value:values() }, { onConflict:'key' });
      if (error) throw error;
      setStatus('Design saved successfully.');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Unable to save design.', true);
    } finally {
      save.disabled = false;
    }
  }

  [primary, accent, radius, width].forEach((control) => control?.addEventListener('input', applyPreview));
  save?.addEventListener('click', saveTheme);
  reset?.addEventListener('click', () => { applyValues(defaults); setStatus('Preview reset. Save to keep these values.'); });

  (async () => {
    try {
      if (!(await requireAdmin())) return;
      await loadTheme();
    } catch (error) {
      console.error(error);
      applyValues(defaults);
      setStatus('Design Studio loaded with defaults. Site Settings storage may need configuration.', true);
    }
  })();
})();

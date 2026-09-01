(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const panel = document.getElementById('maintenance-control');
  const toggle = document.getElementById('maintenance-toggle');
  const state = document.getElementById('maintenance-state');
  const status = document.getElementById('maintenance-status');
  const titleInput = document.getElementById('maintenance-title');
  const messageInput = document.getElementById('maintenance-message');
  if (!client || !panel || !toggle) return;

  let active = false;
  const setStatus = (message, error = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', error);
    status.classList.toggle('text-success', !error && Boolean(message));
  };

  function paint() {
    if (state) {
      state.textContent = active ? 'MAINTENANCE ACTIVE' : 'PUBLIC SITE ONLINE';
      state.className = `badge rounded-pill ${active ? 'text-bg-warning' : 'text-bg-success'}`;
    }
    toggle.textContent = active ? 'Restore Public Site' : 'Enable Maintenance Mode';
    toggle.className = `btn ${active ? 'btn-success' : 'btn-warning'}`;
    panel.classList.toggle('border-warning', active);
  }

  async function load() {
    setStatus('Loading maintenance status...');
    const { data, error } = await client.from('site_settings')
      .select('maintenance_mode,maintenance_title,maintenance_message')
      .eq('id', 1).single();
    if (error) throw error;
    active = data.maintenance_mode === true;
    if (titleInput) titleInput.value = data.maintenance_title || 'We’ll be right back';
    if (messageInput) messageInput.value = data.maintenance_message || 'The barangay website is temporarily undergoing maintenance and improvements. Please check back shortly.';
    paint();
    setStatus(active ? 'Public visitors currently see the maintenance notice.' : 'The public website is available normally.');
  }

  toggle.addEventListener('click', async () => {
    const next = !active;
    const title = (titleInput?.value || '').trim() || 'We’ll be right back';
    const message = (messageInput?.value || '').trim() || 'The barangay website is temporarily undergoing maintenance and improvements. Please check back shortly.';
    if (next && !window.confirm('Enable Maintenance Mode now? Public visitors will see only the maintenance notice until you restore the site.')) return;
    if (!next && !window.confirm('Restore the normal public website now?')) return;

    toggle.disabled = true;
    setStatus(next ? 'Enabling Maintenance Mode...' : 'Restoring public website...');
    try {
      const { error } = await client.from('site_settings').update({
        maintenance_mode: next,
        maintenance_title: title,
        maintenance_message: message,
        updated_at: new Date().toISOString()
      }).eq('id', 1);
      if (error) throw error;
      active = next;
      paint();
      setStatus(active ? 'Maintenance Mode is ON. Public visitors now see the maintenance notice.' : 'Maintenance Mode is OFF. The normal public website is restored.');
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Unable to change Maintenance Mode.', true);
    } finally {
      toggle.disabled = false;
    }
  });

  load().catch((error) => {
    console.error(error);
    setStatus(error.message || 'Unable to load Maintenance Mode.', true);
  });
})();

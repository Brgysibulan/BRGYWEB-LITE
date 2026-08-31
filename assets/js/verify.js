(() => {
  'use strict';

  const form = document.getElementById('verify-form');
  const controlInput = document.getElementById('control-number');
  const lastNameInput = document.getElementById('last-name');
  const result = document.getElementById('verify-result');
  const submitButton = form?.querySelector('button[type="submit"]');
  const config = window.BRGY_SUPABASE_CONFIG;

  if (!form || !controlInput || !lastNameInput || !result || !config?.url || !config?.publishableKey) return;

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const setLoading = (loading, label = 'Verifying…') => {
    if (!submitButton) return;
    submitButton.disabled = loading;
    submitButton.textContent = loading ? label : 'Verify Record';
  };

  const showNotFound = (message = 'No matching record found.') => {
    result.className = 'empty-state mt-4 border border-danger-subtle';
    result.innerHTML = `<strong>${escapeHtml(message)}</strong><div class="small text-secondary mt-2">Check the ID details or ask the barangay office to confirm the record.</div>`;
  };

  const showRecord = (record, sourceLabel = 'Verification Result') => {
    const active = String(record.status || '').toUpperCase() === 'ACTIVE';
    result.className = `content-panel mt-4 border ${active ? 'border-success-subtle' : 'border-warning-subtle'}`;
    result.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between gap-3 align-items-start">
        <div><span class="eyebrow">${escapeHtml(sourceLabel)}</span><h2 class="h4 mt-2 mb-1">${escapeHtml(record.full_name || 'Verified Record')}</h2><p class="text-secondary mb-0">${escapeHtml(record.designation || 'Barangay record')}</p></div>
        <span class="badge ${active ? 'text-bg-success' : 'text-bg-warning'} fs-6">${escapeHtml(record.status || 'UNKNOWN')}</span>
      </div>
      <hr>
      <dl class="row mb-0">
        <dt class="col-sm-5">Control Number</dt><dd class="col-sm-7">${escapeHtml(record.control_number)}</dd>
        <dt class="col-sm-5">Date Acquired</dt><dd class="col-sm-7">${escapeHtml(formatDate(record.date_acquired))}</dd>
        <dt class="col-sm-5">Expiration Date</dt><dd class="col-sm-7">${escapeHtml(formatDate(record.expiration_date))}</dd>
      </dl>`;
  };

  async function rpc(name, body) {
    const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Verification service is unavailable.');
    const rows = await response.json();
    return Array.isArray(rows) ? rows[0] : null;
  }

  async function verifyManual(controlNumber, lastName) {
    return rpc('verify_barangay_record', {
      p_control_number: controlNumber,
      p_last_name: lastName
    });
  }

  async function verifyQr(token) {
    return rpc('verify_barangay_record_qr', { p_token: token });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const controlNumber = controlInput.value.trim();
    const lastName = lastNameInput.value.trim();

    if (!/^[A-Za-z0-9-]{4,40}$/.test(controlNumber) || !lastName || lastName.length > 80) {
      result.className = 'empty-state mt-4 border border-warning-subtle';
      result.textContent = 'Enter a valid control number and last name.';
      return;
    }

    setLoading(true);
    result.className = 'empty-state mt-4';
    result.textContent = 'Checking record…';

    try {
      const record = await verifyManual(controlNumber, lastName);
      if (!record) return showNotFound();
      showRecord(record);
    } catch (error) {
      console.error(error);
      result.className = 'empty-state mt-4 border border-danger-subtle';
      result.textContent = 'Unable to verify right now. Please try again later.';
    } finally {
      setLoading(false);
    }
  });

  (async () => {
    const token = new URLSearchParams(window.location.search).get('qr')?.trim() || '';
    if (!token) return;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
      showNotFound('Invalid QR verification link.');
      return;
    }

    setLoading(true, 'Checking QR…');
    result.className = 'empty-state mt-4';
    result.innerHTML = '<strong>Checking official QR…</strong><div class="small text-secondary mt-2">No typing is required.</div>';

    try {
      const record = await verifyQr(token);
      if (!record) return showNotFound('This QR verification link is not recognized.');
      showRecord(record, 'QR Verified');
    } catch (error) {
      console.error(error);
      result.className = 'empty-state mt-4 border border-danger-subtle';
      result.textContent = 'Unable to verify this QR right now. Please try again later.';
    } finally {
      setLoading(false);
    }
  })();
})();

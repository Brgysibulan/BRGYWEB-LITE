(() => {
  'use strict';

  const form = document.getElementById('verify-form');
  const controlInput = document.getElementById('control-number');
  const lastNameInput = document.getElementById('last-name');
  const result = document.getElementById('verify-result');
  const submitButton = form?.querySelector('button[type="submit"]');
  const startCameraButton = document.getElementById('verify-start-camera');
  const stopCameraButton = document.getElementById('verify-stop-camera');
  const scannerStatus = document.getElementById('verify-scanner-status');
  const scannerPlaceholder = document.getElementById('verify-scanner-placeholder');
  const config = window.BRGY_SUPABASE_CONFIG;

  if (!form || !controlInput || !lastNameInput || !result || !config?.url || !config?.publishableKey) return;

  let qrScanner = null;
  let scannerRunning = false;
  let scanLocked = false;

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
    submitButton.textContent = loading ? label : 'Verify ID';
  };

  const setScannerStatus = (message, state = '') => {
    if (!scannerStatus) return;
    scannerStatus.textContent = message;
    scannerStatus.classList.toggle('is-live', state === 'live');
    scannerStatus.classList.toggle('is-error', state === 'error');
  };

  const showNotFound = (message = 'No matching ID found.') => {
    result.className = 'empty-state mt-4 border border-danger-subtle';
    result.innerHTML = `<strong>${escapeHtml(message)}</strong><div class="small text-secondary mt-2">Check the ID details or ask the barangay office to confirm the record.</div>`;
  };

  const showRecord = (record, sourceLabel = 'ID Verification Result') => {
    const active = String(record.status || '').toUpperCase() === 'ACTIVE';
    result.className = `content-panel mt-4 border ${active ? 'border-success-subtle' : 'border-warning-subtle'}`;
    result.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between gap-3 align-items-start">
        <div><span class="eyebrow">${escapeHtml(sourceLabel)}</span><h2 class="h4 mt-2 mb-1">${escapeHtml(record.full_name || 'Verified ID')}</h2><p class="text-secondary mb-0">${escapeHtml(record.designation || 'Barangay ID holder')}</p></div>
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
    return rpc('verify_barangay_record', { p_control_number: controlNumber, p_last_name: lastName });
  }

  async function verifyQr(token) {
    return rpc('verify_barangay_record_qr', { p_token: token });
  }

  function extractQrToken(rawValue) {
    const raw = String(rawValue || '').trim();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(raw)) return raw;
    try {
      const parsed = new URL(raw, window.location.href);
      const token = parsed.searchParams.get('qr')?.trim() || '';
      return uuidPattern.test(token) ? token : '';
    } catch {
      return '';
    }
  }

  async function handleQrToken(token, sourceLabel = 'QR Verified') {
    if (!token || scanLocked) return;
    scanLocked = true;
    setLoading(true, 'Checking QR…');
    result.className = 'empty-state mt-4';
    result.innerHTML = '<strong>Checking official ID QR…</strong><div class="small text-secondary mt-2">No typing is required.</div>';
    setScannerStatus('QR detected. Checking official record…', 'live');

    try {
      const record = await verifyQr(token);
      if (!record) {
        showNotFound('This ID QR code is not recognized.');
        setScannerStatus('QR scanned, but no matching official ID was found.', 'error');
        return;
      }
      showRecord(record, sourceLabel);
      setScannerStatus('ID verified successfully.', 'live');
      await stopScanner();
    } catch (error) {
      console.error(error);
      result.className = 'empty-state mt-4 border border-danger-subtle';
      result.textContent = 'Unable to verify this QR right now. Please try again later.';
      setScannerStatus('Verification service is unavailable right now.', 'error');
    } finally {
      setLoading(false);
      window.setTimeout(() => { scanLocked = false; }, 900);
    }
  }

  async function startScanner() {
    if (scannerRunning) return;
    if (!window.Html5Qrcode) {
      setScannerStatus('QR scanner failed to load. Use manual verification below.', 'error');
      return;
    }
    if (!window.isSecureContext) {
      setScannerStatus('Camera scanning requires HTTPS. Use the secure site address or manual verification.', 'error');
      return;
    }

    try {
      if (!qrScanner) qrScanner = new window.Html5Qrcode('verify-qr-reader');
      startCameraButton.disabled = true;
      setScannerStatus('Requesting camera permission…');
      scannerPlaceholder?.classList.add('hidden');

      await qrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (viewWidth, viewHeight) => {
          const edge = Math.floor(Math.min(viewWidth, viewHeight) * 0.72);
          return { width: edge, height: edge };
        }, aspectRatio: 1.333334 },
        async (decodedText) => {
          const token = extractQrToken(decodedText);
          if (!token) {
            setScannerStatus('QR detected, but it is not a valid barangay ID verification code.', 'error');
            return;
          }
          await handleQrToken(token, 'Camera QR Verified');
        },
        () => {}
      );

      scannerRunning = true;
      startCameraButton.disabled = true;
      stopCameraButton.disabled = false;
      setScannerStatus('Camera is live. Hold the ID QR code steady inside the frame.', 'live');
    } catch (error) {
      console.error(error);
      scannerRunning = false;
      startCameraButton.disabled = false;
      stopCameraButton.disabled = true;
      scannerPlaceholder?.classList.remove('hidden');
      const denied = /permission|notallowed/i.test(String(error?.message || error));
      setScannerStatus(denied ? 'Camera permission was not granted. You can still verify manually.' : 'Unable to start the camera. Try again or use manual verification.', 'error');
    }
  }

  async function stopScanner() {
    if (!qrScanner || !scannerRunning) {
      scannerRunning = false;
      startCameraButton && (startCameraButton.disabled = false);
      stopCameraButton && (stopCameraButton.disabled = true);
      scannerPlaceholder?.classList.remove('hidden');
      return;
    }
    try { await qrScanner.stop(); } catch (error) { console.warn('QR scanner stop failed:', error); }
    scannerRunning = false;
    startCameraButton.disabled = false;
    stopCameraButton.disabled = true;
    scannerPlaceholder?.classList.remove('hidden');
    if (!scanLocked) setScannerStatus('Camera is off.');
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
    result.textContent = 'Checking ID…';

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

  startCameraButton?.addEventListener('click', startScanner);
  stopCameraButton?.addEventListener('click', stopScanner);
  window.addEventListener('pagehide', () => { if (scannerRunning) stopScanner(); });

  (async () => {
    const token = extractQrToken(new URLSearchParams(window.location.search).get('qr') || '');
    const rawQr = new URLSearchParams(window.location.search).get('qr')?.trim() || '';
    if (!rawQr) return;
    if (!token) {
      showNotFound('Invalid ID QR verification link.');
      return;
    }
    await handleQrToken(token, 'QR Link Verified');
  })();
})();

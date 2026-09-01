(() => {
  'use strict';

  const input = document.getElementById('setting-map');
  const form = document.getElementById('site-settings-form');
  const status = document.getElementById('site-settings-status');
  if (!input || !form) return;

  function extractUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const iframeMatch = raw.match(/<iframe[^>]+src\s*=\s*["']([^"']+)["']/i);
    return (iframeMatch ? iframeMatch[1] : raw).replaceAll('&amp;', '&').trim();
  }

  function decodeMapPathSegment(segment) {
    try {
      return decodeURIComponent(String(segment || '').replaceAll('+', '%20')).trim();
    } catch {
      return '';
    }
  }

  function normalizeGoogleMapsUrl(value) {
    const raw = extractUrl(value);
    if (!raw) return '';

    let url;
    try { url = new URL(raw); } catch { return null; }
    if (url.protocol !== 'https:') return null;

    const host = url.hostname.toLowerCase();
    const isGoogleHost = host === 'google.com' || host.endsWith('.google.com');
    if (!isGoogleHost) return null;

    if (/\/maps\/embed/i.test(url.pathname) || url.searchParams.get('output') === 'embed') {
      return url.href;
    }

    const placeMatch = url.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/i);
    if (placeMatch?.[1]) {
      const query = decodeMapPathSegment(placeMatch[1]);
      if (query) return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }

    const query = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('destination');
    if (query) return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

    const atMatch = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) return `https://www.google.com/maps?q=${encodeURIComponent(`${atMatch[1]},${atMatch[2]}`)}&output=embed`;

    const ll = url.searchParams.get('ll');
    if (ll && /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(ll)) {
      return `https://www.google.com/maps?q=${encodeURIComponent(ll)}&output=embed`;
    }

    return null;
  }

  function show(message, error = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', error);
    status.classList.toggle('text-success', !error && Boolean(message));
  }

  function normalizeField(showSuccess = false) {
    const raw = input.value.trim();
    if (!raw) return true;
    const normalized = normalizeGoogleMapsUrl(raw);
    if (!normalized) {
      show('Paste a full Google Maps place link or Google Maps embed code. Short maps.app.goo.gl links are not supported.', true);
      return false;
    }
    input.value = normalized;
    if (showSuccess) show('Google Maps link is ready to embed.');
    return true;
  }

  input.addEventListener('blur', () => normalizeField(true));
  form.addEventListener('submit', (event) => {
    if (normalizeField(false)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    input.focus();
  }, true);
})();

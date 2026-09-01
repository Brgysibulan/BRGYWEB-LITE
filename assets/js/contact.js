(() => {
  'use strict';

  const config = window.BRGY_SUPABASE_CONFIG;
  if (!config?.url || !config?.publishableKey) return;

  const text = (id, value, fallback = '—') => {
    const element = document.getElementById(id);
    if (element) element.textContent = value || fallback;
  };

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

  function googleEmbedUrl(value) {
    const raw = extractUrl(value);
    if (!raw) return '';
    let url;
    try { url = new URL(raw); } catch { return ''; }
    if (url.protocol !== 'https:') return '';
    const host = url.hostname.toLowerCase();
    if (!(host === 'google.com' || host.endsWith('.google.com'))) return '';

    if (/\/maps\/embed/i.test(url.pathname) || url.searchParams.get('output') === 'embed') return url.href;

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
    return '';
  }

  async function load() {
    try {
      const response = await fetch(`${config.url}/rest/v1/site_settings?id=eq.1&select=address,contact_number,email,facebook_url,map_embed_url`, {
        cache: 'no-store',
        headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}` }
      });
      if (!response.ok) throw new Error('Contact settings unavailable');
      const data = (await response.json())[0] || {};

      text('contact-address', data.address, 'Barangay Office Address');
      const phone = document.getElementById('contact-phone');
      if (phone) {
        phone.textContent = data.contact_number || 'Not provided';
        phone.href = data.contact_number ? `tel:${data.contact_number.replace(/[^+\d]/g, '')}` : '#';
      }
      const email = document.getElementById('contact-email');
      if (email) {
        email.textContent = data.email || 'Not provided';
        email.href = data.email ? `mailto:${data.email}` : '#';
      }
      const facebook = document.getElementById('contact-facebook');
      if (facebook && /^https:\/\//i.test(data.facebook_url || '')) {
        facebook.href = data.facebook_url;
        facebook.classList.remove('d-none');
      }

      const map = document.getElementById('contact-map');
      const empty = document.getElementById('contact-map-empty');
      const embed = googleEmbedUrl(data.map_embed_url);
      if (map && embed) {
        map.src = embed;
        map.classList.remove('d-none');
        empty?.classList.add('d-none');
      }
    } catch (error) {
      console.warn(error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();

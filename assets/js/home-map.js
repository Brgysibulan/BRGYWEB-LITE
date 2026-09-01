(() => {
  'use strict';

  const section = document.getElementById('barangay-hall-map-section');
  const frame = document.getElementById('barangay-hall-map');
  const address = document.getElementById('barangay-hall-map-address');
  const external = document.getElementById('barangay-hall-map-link');
  if (!section || !frame) return;

  function extractUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const iframeMatch = raw.match(/<iframe[^>]+src\s*=\s*["']([^"']+)["']/i);
    return (iframeMatch ? iframeMatch[1] : raw).replaceAll('&amp;', '&').trim();
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
      let query = placeMatch[1];
      try { query = decodeURIComponent(query); } catch {}
      query = query.replaceAll('+', ' ').trim();
      if (query) return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }

    const query = url.searchParams.get('q') || url.searchParams.get('query');
    if (query) return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    return '';
  }

  async function load() {
    const client = window.BRGY_SUPABASE;
    if (!client) return;
    const { data, error } = await client.from('site_settings')
      .select('barangay_name,address,map_embed_url')
      .eq('id', 1)
      .single();
    if (error || !data?.map_embed_url) return;

    const embed = googleEmbedUrl(data.map_embed_url);
    const raw = extractUrl(data.map_embed_url);
    if (!embed) return;

    frame.src = embed;
    frame.title = `${data.barangay_name || 'Barangay'} Hall location map`;
    if (address) address.textContent = data.address || 'Barangay Hall';
    if (external && raw) {
      external.href = raw;
      external.classList.remove('d-none');
    }
    section.classList.remove('d-none');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();

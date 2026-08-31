(() => {
  'use strict';

  const list = document.getElementById('officials-list');
  if (!list) return;

  function escapeHtml(input) {
    return String(input ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function render(items) {
    if (!Array.isArray(items) || items.length === 0) {
      list.innerHTML = '<div class="col-12"><div class="empty-state">No published officials yet.</div></div>';
      return;
    }

    const isHome = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html');
    const visible = isHome ? items.slice(0, 3) : items;

    list.innerHTML = visible.map((item) => {
      const photo = item.photo_url
        ? `<img src="${escapeHtml(item.photo_url)}" alt="${escapeHtml(item.full_name)}" class="img-fluid rounded mb-3" loading="lazy">`
        : '<div class="placeholder-avatar"></div>';
      const bio = item.bio ? `<p class="mb-0 text-secondary">${escapeHtml(item.bio)}</p>` : '';
      return `<div class="col-md-6 col-lg-4"><article class="placeholder-card h-100">${photo}<h3 class="h5">${escapeHtml(item.full_name)}</h3><p class="mb-2">${escapeHtml(item.position)}</p>${bio}</article></div>`;
    }).join('');
  }

  async function load() {
    const config = window.BRGY_SUPABASE_CONFIG;
    if (!config?.url || !config?.publishableKey) return render([]);

    const endpoint = `${config.url}/rest/v1/officials?is_active=eq.true&select=id,full_name,position,photo_url,bio,sort_order&order=sort_order.asc,id.asc`;
    const response = await fetch(endpoint, {
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
        Accept: 'application/json'
      }
    });
    if (!response.ok) throw new Error(`Officials request failed (${response.status}).`);
    render(await response.json());
  }

  load().catch((error) => {
    console.warn('Unable to load officials:', error);
    render([]);
  });
})();
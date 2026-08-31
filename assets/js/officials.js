(() => {
  'use strict';

  const list = document.getElementById('officials-list');
  if (!list) return;
  let rows = [];

  function escapeHtml(input) {
    return String(input ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function showState(message, isError = false) {
    list.innerHTML = `<div class="col-12"><div class="empty-state${isError ? ' border border-danger-subtle' : ''}">${escapeHtml(message)}</div></div>`;
  }

  function ensureControls() {
    const isHome = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html');
    if (isHome || document.getElementById('officials-search')) return;
    list.insertAdjacentHTML('beforebegin', `<div class="public-filter-panel"><div class="row g-3 align-items-end"><div class="col-12"><label class="form-label" for="officials-search">Search leadership directory</label><input id="officials-search" class="form-control" type="search" placeholder="Search by official name or position"></div></div><div id="officials-result-count" class="public-result-count">Loading officials…</div></div>`);
    document.getElementById('officials-search')?.addEventListener('input', render);
  }

  function officialCard(item) {
    const photo = item.photo_url
      ? `<img src="${escapeHtml(item.photo_url)}" alt="${escapeHtml(item.full_name)}" class="img-fluid rounded mb-3" loading="lazy" decoding="async">`
      : '<div class="placeholder-avatar"></div>';
    const bio = item.bio ? `<p class="mb-0 text-secondary">${escapeHtml(item.bio)}</p>` : '';
    return `<div class="col-md-6 col-lg-4"><article class="placeholder-card h-100">${photo}<span class="eyebrow">Public Official</span><h3 class="h5 mt-2">${escapeHtml(item.full_name)}</h3><p class="mb-2">${escapeHtml(item.position)}</p>${bio}</article></div>`;
  }

  function render() {
    const isHome = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/index.html');
    const q = isHome ? '' : String(document.getElementById('officials-search')?.value || '').trim().toLowerCase();
    const filtered = rows.filter((item) => !q || `${item.full_name || ''} ${item.position || ''} ${item.bio || ''}`.toLowerCase().includes(q));
    const visible = isHome ? filtered.slice(0, 3) : filtered;
    if (!visible.length) { showState(rows.length ? 'No officials match your search.' : 'No barangay officials have been published yet.'); return; }
    list.innerHTML = visible.map(officialCard).join('');
    const count = document.getElementById('officials-result-count');
    if (count) count.textContent = `${visible.length} ${visible.length === 1 ? 'official' : 'officials'} shown`;
  }

  async function load() {
    const config = window.BRGY_SUPABASE_CONFIG;
    ensureControls();
    showState('Loading barangay officials...');
    if (!config?.url || !config?.publishableKey) throw new Error('Public data service unavailable.');
    const endpoint = `${config.url}/rest/v1/officials?is_active=eq.true&select=id,full_name,position,photo_url,bio,sort_order&order=sort_order.asc,id.asc`;
    const response = await fetch(endpoint, { headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`, Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Officials request failed (${response.status}).`);
    rows = await response.json();
    render();
  }

  load().catch((error) => { console.warn('Unable to load officials:', error); showState('Barangay officials are temporarily unavailable. Please try again later.', true); const count=document.getElementById('officials-result-count');if(count)count.textContent='Officials unavailable'; });
})();

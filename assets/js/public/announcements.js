(() => {
  'use strict';

  const config = window.BRGY_SUPABASE_CONFIG;
  let fullRows = [];

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  async function fetchAnnouncements(limit) {
    if (!config?.url || !config?.publishableKey) return [];
    const query = new URLSearchParams({ select: 'id,title,slug,excerpt,content,cover_url,published_at,is_featured', is_published: 'eq.true', order: 'is_featured.desc,published_at.desc' });
    if (limit) query.set('limit', String(limit));
    const response = await fetch(`${config.url}/rest/v1/announcements?${query.toString()}`, { headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`, Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Announcements request failed (${response.status}).`);
    return response.json();
  }

  function card(row, compact = false) {
    const cover = row.cover_url ? `<img src="${escapeHtml(row.cover_url)}" alt="" class="img-fluid rounded mb-3" loading="lazy" decoding="async">` : '';
    const body = compact ? (row.excerpt || row.content || '') : (row.content || row.excerpt || '');
    return `<article class="content-panel h-100">${cover}<div class="d-flex flex-wrap gap-2 align-items-center mb-2">${row.is_featured ? '<span class="badge text-bg-warning">Featured</span>' : '<span class="badge text-bg-light border">Public Notice</span>'}<small class="text-secondary">${escapeHtml(formatDate(row.published_at))}</small></div><h3 class="h5">${escapeHtml(row.title)}</h3><p class="mb-0">${escapeHtml(body)}</p></article>`;
  }

  function ensureControls(target) {
    if (document.getElementById('announcements-search')) return;
    target.insertAdjacentHTML('beforebegin', `<div class="public-filter-panel"><div class="row g-3 align-items-end"><div class="col-md-9"><label class="form-label" for="announcements-search">Search announcements</label><input id="announcements-search" class="form-control" type="search" placeholder="Search notices, advisories, events, and community updates"></div><div class="col-md-3"><label class="form-label" for="announcements-type">Show</label><select id="announcements-type" class="form-select"><option value="">All announcements</option><option value="featured">Featured only</option></select></div></div><div id="announcements-result-count" class="public-result-count">Loading announcements…</div></div>`);
    document.getElementById('announcements-search')?.addEventListener('input', renderFullRows);
    document.getElementById('announcements-type')?.addEventListener('change', renderFullRows);
  }

  function renderFullRows() {
    const target = document.getElementById('announcements-list');
    if (!target) return;
    const q = String(document.getElementById('announcements-search')?.value || '').trim().toLowerCase();
    const type = String(document.getElementById('announcements-type')?.value || '');
    const rows = fullRows.filter((row) => {
      const haystack = `${row.title || ''} ${row.excerpt || ''} ${row.content || ''}`.toLowerCase();
      return (!q || haystack.includes(q)) && (type !== 'featured' || row.is_featured === true);
    });
    const count = document.getElementById('announcements-result-count');
    if (count) count.textContent = `${rows.length} ${rows.length === 1 ? 'announcement' : 'announcements'} shown`;
    if (!rows.length) { target.className = 'empty-state'; target.textContent = fullRows.length ? 'No announcements match your search.' : 'No announcements yet.'; return; }
    target.className = 'row g-4';
    target.innerHTML = rows.map((row) => `<div class="col-md-6">${card(row)}</div>`).join('');
  }

  async function renderFullPage() {
    const target = document.getElementById('announcements-list');
    if (!target) return;
    ensureControls(target);
    try { fullRows = await fetchAnnouncements(); renderFullRows(); }
    catch (error) { console.warn(error); target.className = 'empty-state'; target.textContent = 'Announcements are temporarily unavailable.'; const count=document.getElementById('announcements-result-count');if(count)count.textContent='Announcements unavailable'; }
  }

  async function renderHomepage() {
    const target = document.getElementById('homepage-announcements-list');
    if (!target) return;
    try {
      const rows = await fetchAnnouncements(3);
      if (!rows.length) { target.innerHTML = '<div class="col-12"><div class="empty-state">No announcements yet.</div></div>'; return; }
      target.innerHTML = rows.map((row) => `<div class="col-md-4">${card(row, true)}</div>`).join('');
    } catch (error) { console.warn(error); target.innerHTML = '<div class="col-12"><div class="empty-state">Announcements are temporarily unavailable.</div></div>'; }
  }

  document.addEventListener('DOMContentLoaded', () => { renderFullPage(); renderHomepage(); });
})();

(() => {
  'use strict';

  const config = window.BRGY_SUPABASE_CONFIG;

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  async function fetchAnnouncements(limit) {
    if (!config?.url || !config?.publishableKey) return [];
    const query = new URLSearchParams({
      select: 'id,title,slug,excerpt,content,cover_url,published_at,is_featured',
      is_published: 'eq.true',
      order: 'is_featured.desc,published_at.desc'
    });
    if (limit) query.set('limit', String(limit));
    const response = await fetch(`${config.url}/rest/v1/announcements?${query.toString()}`, {
      headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`, Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Announcements request failed (${response.status}).`);
    return response.json();
  }

  function card(row, compact = false) {
    const cover = row.cover_url ? `<img src="${escapeHtml(row.cover_url)}" alt="" class="img-fluid rounded mb-3" loading="lazy">` : '';
    const body = compact ? (row.excerpt || row.content || '') : (row.content || row.excerpt || '');
    return `<article class="content-panel h-100">
      ${cover}
      <div class="d-flex flex-wrap gap-2 align-items-center mb-2">${row.is_featured ? '<span class="badge text-bg-warning">Featured</span>' : ''}<small class="text-secondary">${escapeHtml(formatDate(row.published_at))}</small></div>
      <h3 class="h5">${escapeHtml(row.title)}</h3>
      <p class="mb-0">${escapeHtml(body)}</p>
    </article>`;
  }

  async function renderFullPage() {
    const target = document.getElementById('announcements-list');
    if (!target) return;
    try {
      const rows = await fetchAnnouncements();
      if (!rows.length) {
        target.className = 'empty-state';
        target.textContent = 'No announcements yet.';
        return;
      }
      target.className = 'row g-4';
      target.innerHTML = rows.map((row) => `<div class="col-md-6">${card(row)}</div>`).join('');
    } catch (error) {
      console.warn(error);
      target.className = 'empty-state';
      target.textContent = 'Announcements are temporarily unavailable.';
    }
  }

  async function renderHomepage() {
    const target = document.getElementById('homepage-announcements-list');
    if (!target) return;
    try {
      const rows = await fetchAnnouncements(3);
      if (!rows.length) {
        target.innerHTML = '<div class="col-12"><div class="empty-state">No announcements yet.</div></div>';
        return;
      }
      target.innerHTML = rows.map((row) => `<div class="col-md-4">${card(row, true)}</div>`).join('');
    } catch (error) {
      console.warn(error);
      target.innerHTML = '<div class="col-12"><div class="empty-state">Announcements are temporarily unavailable.</div></div>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderFullPage();
    renderHomepage();
  });
})();

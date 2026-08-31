(() => {
  'use strict';
  const client = window.BRGY_SUPABASE;
  const list = document.getElementById('gallery-list');
  if (!list) return;

  function esc(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  async function loadGallery() {
    if (!client) {
      list.innerHTML = '<div class="empty-state">Gallery is temporarily unavailable.</div>';
      return;
    }
    const { data, error } = await client
      .from('gallery_items')
      .select('id,title,caption,image_url,album,sort_order,created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data?.length) {
      list.innerHTML = '<div class="empty-state">No published gallery photos yet.</div>';
      return;
    }

    list.innerHTML = `<div class="row g-4">${data.map((item) => `
      <div class="col-sm-6 col-lg-4">
        <article class="content-panel h-100 p-0 overflow-hidden">
          <img src="${esc(item.image_url)}" alt="${esc(item.title || item.caption || 'Barangay gallery photo')}" loading="lazy" style="width:100%;height:240px;object-fit:cover">
          <div class="p-3">
            ${item.album ? `<div class="small text-uppercase fw-semibold text-success mb-1">${esc(item.album)}</div>` : ''}
            ${item.title ? `<h2 class="h5 mb-2">${esc(item.title)}</h2>` : ''}
            ${item.caption ? `<p class="mb-0 text-secondary">${esc(item.caption)}</p>` : ''}
          </div>
        </article>
      </div>`).join('')}</div>`;
  }

  loadGallery().catch((error) => {
    console.error(error);
    list.innerHTML = '<div class="empty-state">Unable to load gallery right now.</div>';
  });
})();

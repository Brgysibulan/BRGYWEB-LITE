(() => {
  'use strict';
  const client = window.BRGY_SUPABASE;
  const list = document.getElementById('gallery-list');
  if (!list) return;
  let rows = [];

  const esc = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function showState(message, type = 'empty') {
    const border = type === 'error' ? ' border border-danger-subtle' : '';
    list.innerHTML = `<div class="empty-state${border}">${esc(message)}</div>`;
  }

  function ensureControls() {
    if (document.getElementById('gallery-search')) return;
    list.insertAdjacentHTML('beforebegin', `<div class="public-filter-panel"><div class="row g-3 align-items-end"><div class="col-md-8"><label class="form-label" for="gallery-search">Search gallery</label><input id="gallery-search" class="form-control" type="search" placeholder="Search photo title, caption, or album"></div><div class="col-md-4"><label class="form-label" for="gallery-album">Album</label><select id="gallery-album" class="form-select"><option value="">All albums</option></select></div></div><div class="public-result-count" id="gallery-result-count">Loading gallery…</div></div>`);
    document.getElementById('gallery-search')?.addEventListener('input', render);
    document.getElementById('gallery-album')?.addEventListener('change', render);
  }

  function ensureLightbox() {
    if (document.getElementById('gallery-lightbox')) return;
    document.body.insertAdjacentHTML('beforeend', `<div class="gallery-lightbox" id="gallery-lightbox" aria-hidden="true"><div class="gallery-lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby="gallery-lightbox-title"><button class="gallery-lightbox-close" id="gallery-lightbox-close" type="button" aria-label="Close image">×</button><div class="gallery-lightbox-media"><img id="gallery-lightbox-image" alt=""></div><div class="gallery-lightbox-copy"><small id="gallery-lightbox-album"></small><h2 id="gallery-lightbox-title"></h2><p id="gallery-lightbox-caption"></p></div></div></div>`);
    const close = () => {
      const box = document.getElementById('gallery-lightbox');
      box?.classList.remove('open');
      box?.setAttribute('aria-hidden','true');
      document.body.style.removeProperty('overflow');
    };
    document.getElementById('gallery-lightbox-close')?.addEventListener('click', close);
    document.getElementById('gallery-lightbox')?.addEventListener('click', (event) => { if (event.target.id === 'gallery-lightbox') close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  }

  function openLightbox(id) {
    const item = rows.find((row) => String(row.id) === String(id));
    if (!item) return;
    ensureLightbox();
    const box = document.getElementById('gallery-lightbox');
    const image = document.getElementById('gallery-lightbox-image');
    const album = document.getElementById('gallery-lightbox-album');
    const title = document.getElementById('gallery-lightbox-title');
    const caption = document.getElementById('gallery-lightbox-caption');
    if (image) { image.src = item.image_url; image.alt = item.title || item.caption || 'Barangay gallery photo'; }
    if (album) album.textContent = item.album || 'Community Gallery';
    if (title) title.textContent = item.title || 'Community Photo';
    if (caption) caption.textContent = item.caption || 'Published barangay community photo.';
    box?.classList.add('open');
    box?.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function syncAlbums() {
    const select = document.getElementById('gallery-album');
    if (!select) return;
    const albums = [...new Set(rows.map((item) => String(item.album || '').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    select.innerHTML = '<option value="">All albums</option>' + albums.map((album)=>`<option value="${esc(album)}">${esc(album)}</option>`).join('');
  }

  function render() {
    ensureControls();
    const q = String(document.getElementById('gallery-search')?.value || '').trim().toLowerCase();
    const album = String(document.getElementById('gallery-album')?.value || '');
    const filtered = rows.filter((item) => {
      const haystack = `${item.title || ''} ${item.caption || ''} ${item.album || ''}`.toLowerCase();
      return (!q || haystack.includes(q)) && (!album || item.album === album);
    });
    const count = document.getElementById('gallery-result-count');
    if (count) count.textContent = `${filtered.length} ${filtered.length === 1 ? 'photo' : 'photos'} shown`;
    if (!filtered.length) { showState(rows.length ? 'No gallery photos match your search.' : 'No gallery photos have been published yet.'); return; }
    list.innerHTML = `<div class="public-gallery-grid">${filtered.map((item) => `<article class="public-gallery-card" data-gallery-id="${esc(item.id)}" tabindex="0" role="button" aria-label="View ${esc(item.title || 'gallery photo')}"><div class="public-gallery-media"><img src="${esc(item.image_url)}" alt="${esc(item.title || item.caption || 'Barangay gallery photo')}" loading="lazy" decoding="async"></div><div class="public-gallery-body">${item.album ? `<span class="public-gallery-album">${esc(item.album)}</span>` : ''}${item.title ? `<h2>${esc(item.title)}</h2>` : '<h2>Community Photo</h2>'}${item.caption ? `<p class="mb-0 text-secondary">${esc(item.caption)}</p>` : ''}</div></article>`).join('')}</div>`;
  }

  list.addEventListener('click', (event) => { const card=event.target.closest('[data-gallery-id]'); if(card)openLightbox(card.dataset.galleryId); });
  list.addEventListener('keydown', (event) => { if(event.key==='Enter'||event.key===' '){const card=event.target.closest('[data-gallery-id]');if(card){event.preventDefault();openLightbox(card.dataset.galleryId);}} });

  async function loadGallery() {
    ensureControls();
    showState('Loading gallery...');
    if (!client) { showState('Gallery is temporarily unavailable.', 'error'); return; }
    const { data, error } = await client.from('gallery_items').select('id,title,caption,image_url,album,sort_order,created_at').eq('is_published', true).order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (error) throw error;
    rows = data || [];
    syncAlbums();
    render();
  }

  loadGallery().catch((error) => { console.error(error); showState('Unable to load the gallery right now. Please try again later.', 'error'); const count=document.getElementById('gallery-result-count'); if(count)count.textContent='Gallery unavailable'; });
})();

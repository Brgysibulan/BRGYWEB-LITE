(() => {
  'use strict';
  const target = document.getElementById('directory-list');
  if (!target) return;
  const config = window.BRGY_SUPABASE_CONFIG;
  let rows = [];

  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const safeTel = (v) => String(v || '').replace(/[^+\d]/g,'');

  function ensureControls() {
    if (document.getElementById('directory-search')) return;
    target.insertAdjacentHTML('beforebegin', `<div class="public-filter-panel"><div class="row g-3 align-items-end"><div class="col-md-8"><label class="form-label" for="directory-search">Search directory</label><input id="directory-search" class="form-control" type="search" placeholder="Search office, person, role, contact, or location"></div><div class="col-md-4"><label class="form-label" for="directory-category">Category</label><select id="directory-category" class="form-select"><option value="">All categories</option></select></div></div><div class="public-result-count" id="directory-result-count">Loading directory entries…</div></div>`);
    document.getElementById('directory-search')?.addEventListener('input', render);
    document.getElementById('directory-category')?.addEventListener('change', render);
  }

  function syncCategories() {
    const select = document.getElementById('directory-category');
    if (!select) return;
    const current = select.value;
    const categories = [...new Set(rows.map((row) => String(row.category || 'Other').trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    select.innerHTML = '<option value="">All categories</option>' + categories.map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join('');
    if (categories.includes(current)) select.value = current;
  }

  function card(item) {
    const photo = item.photo_url
      ? `<img class="directory-photo" src="${esc(item.photo_url)}" alt="${esc(item.name || 'Directory entry')}" loading="lazy" decoding="async">`
      : `<div class="directory-mark" aria-hidden="true">${esc(String(item.name || 'B').trim().charAt(0).toUpperCase() || 'B')}</div>`;
    const contact = item.contact ? `<div><strong>Contact</strong><span>${safeTel(item.contact) ? `<a href="tel:${esc(safeTel(item.contact))}">${esc(item.contact)}</a>` : esc(item.contact)}</span></div>` : '';
    const location = item.location ? `<div><strong>Location</strong><span>${esc(item.location)}</span></div>` : '';
    return `<div class="col-md-6 col-xl-4"><article class="public-directory-card"><div class="d-flex align-items-center gap-3">${photo}<div><span class="eyebrow">${esc(item.category || 'Directory')}</span><h3 class="mt-2 mb-1">${esc(item.name)}</h3>${item.role_title ? `<div class="small text-secondary">${esc(item.role_title)}</div>` : ''}</div></div>${contact || location ? `<div class="directory-meta">${contact}${location}</div>` : ''}</article></div>`;
  }

  function render() {
    ensureControls();
    const q = String(document.getElementById('directory-search')?.value || '').trim().toLowerCase();
    const selected = String(document.getElementById('directory-category')?.value || '').trim();
    const filtered = rows.filter((row) => {
      const category = String(row.category || 'Other');
      const haystack = `${category} ${row.name || ''} ${row.role_title || ''} ${row.contact || ''} ${row.location || ''}`.toLowerCase();
      return (!q || haystack.includes(q)) && (!selected || category === selected);
    });
    const count = document.getElementById('directory-result-count');
    if (count) count.textContent = `${filtered.length} ${filtered.length === 1 ? 'directory entry' : 'directory entries'} shown`;
    if (!filtered.length) { target.innerHTML='<div class="empty-state">No directory entries match your search.</div>'; return; }
    const groups = filtered.reduce((acc,row)=>{ const key=row.category || 'Other'; (acc[key] ||= []).push(row); return acc; },{});
    target.innerHTML = Object.entries(groups).map(([category,items]) => `<section class="mb-5"><div class="section-heading mb-3"><span>Public Directory</span><h2 class="h3">${esc(category)}</h2><p>${items.length} ${items.length === 1 ? 'entry' : 'entries'} available in this category.</p></div><div class="row g-3">${items.map(card).join('')}</div></section>`).join('');
  }

  async function load() {
    ensureControls();
    if (!config?.url || !config?.publishableKey) throw new Error('Supabase config unavailable.');
    const url = `${config.url}/rest/v1/directory_entries?select=category,name,role_title,contact,location,photo_url,sort_order&is_active=eq.true&order=category.asc,sort_order.asc,name.asc`;
    const res = await fetch(url,{headers:{apikey:config.publishableKey,Authorization:`Bearer ${config.publishableKey}`,Accept:'application/json'}});
    if (!res.ok) throw new Error(`Directory request failed (${res.status}).`);
    rows = await res.json();
    syncCategories();
    render();
  }

  load().catch(err=>{ console.warn(err); target.innerHTML='<div class="empty-state">Directory is temporarily unavailable.</div>'; const count=document.getElementById('directory-result-count'); if(count)count.textContent='Directory unavailable'; });
})();

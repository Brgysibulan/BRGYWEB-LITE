(() => {
  'use strict';
  const target = document.getElementById('directory-list');
  if (!target) return;
  const config = window.BRGY_SUPABASE_CONFIG;
  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function render(rows) {
    if (!Array.isArray(rows) || !rows.length) { target.innerHTML='<div class="empty-state">No directory entries published yet.</div>'; return; }
    const groups = rows.reduce((acc,row)=>{ (acc[row.category] ||= []).push(row); return acc; },{});
    target.innerHTML = Object.entries(groups).map(([category,items]) => `<section class="mb-5"><div class="section-heading mb-3"><span>Directory</span><h2 class="h3">${esc(category)}</h2></div><div class="row g-3">${items.map(item=>`<div class="col-md-6 col-lg-4"><div class="service-card h-100">${item.photo_url?`<img src="${esc(item.photo_url)}" alt="" class="img-fluid rounded mb-3" loading="lazy">`:''}<h3 class="h5">${esc(item.name)}</h3>${item.role_title?`<p class="text-secondary mb-2">${esc(item.role_title)}</p>`:''}${item.contact?`<p class="mb-1"><strong>Contact:</strong> ${esc(item.contact)}</p>`:''}${item.location?`<p class="mb-0"><strong>Location:</strong> ${esc(item.location)}</p>`:''}</div></div>`).join('')}</div></section>`).join('');
  }

  async function load() {
    if (!config?.url || !config?.publishableKey) throw new Error('Supabase config unavailable.');
    const url = `${config.url}/rest/v1/directory_entries?select=category,name,role_title,contact,location,photo_url,sort_order&is_active=eq.true&order=category.asc,sort_order.asc,name.asc`;
    const res = await fetch(url,{headers:{apikey:config.publishableKey,Authorization:`Bearer ${config.publishableKey}`,Accept:'application/json'}});
    if (!res.ok) throw new Error(`Directory request failed (${res.status}).`);
    render(await res.json());
  }

  load().catch(err=>{ console.warn(err); target.innerHTML='<div class="empty-state">Directory is temporarily unavailable.</div>'; });
})();
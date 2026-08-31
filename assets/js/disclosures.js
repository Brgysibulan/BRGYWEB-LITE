(() => {
  'use strict';
  const config=window.BRGY_SUPABASE_CONFIG;
  const target=document.getElementById('disclosure-list');
  if(!target||!config?.url||!config?.publishableKey)return;
  const esc=(v)=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  async function load(){
    target.innerHTML='<div class="text-secondary">Loading disclosure documents...</div>';
    try{
      const endpoint=`${config.url}/rest/v1/disclosures?select=id,title,category,description,file_url,document_date,sort_order,is_published&is_published=eq.true&order=sort_order.asc,document_date.desc.nullslast,id.desc`;
      const res=await fetch(endpoint,{headers:{apikey:config.publishableKey,Authorization:`Bearer ${config.publishableKey}`,Accept:'application/json'}});
      if(!res.ok)throw new Error(`Disclosure request failed (${res.status}).`);
      const rows=await res.json();
      if(!rows.length){target.innerHTML='<div class="empty-state">No disclosure documents published yet.</div>';return;}
      const groups={}; rows.forEach(r=>{const key=r.category||'Other Documents';(groups[key]??=[]).push(r);});
      target.innerHTML=Object.entries(groups).map(([cat,items])=>`<section class="mb-5"><div class="section-heading mb-3"><span>Category</span><h2 class="h4">${esc(cat)}</h2></div><div class="row g-3">${items.map(r=>`<div class="col-md-6"><div class="service-card h-100"><div class="d-flex justify-content-between gap-2 align-items-start"><h3 class="h5">${esc(r.title)}</h3>${r.document_date?`<span class="badge text-bg-light border">${esc(r.document_date)}</span>`:''}</div>${r.description?`<p>${esc(r.description)}</p>`:''}${r.file_url?`<a class="btn btn-outline-success btn-sm" href="${esc(r.file_url)}" target="_blank" rel="noopener">Open Document</a>`:'<span class="text-secondary small">Document file unavailable</span>'}</div></div>`).join('')}</div></section>`).join('');
    }catch(err){console.error(err);target.innerHTML='<div class="empty-state">Unable to load disclosure documents right now.</div>';}
  }
  document.addEventListener('DOMContentLoaded',load);
})();
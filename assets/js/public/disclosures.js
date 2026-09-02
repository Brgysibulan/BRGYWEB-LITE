(() => {
  'use strict';
  const config = window.BRGY_SUPABASE_CONFIG;
  const target = document.getElementById('disclosure-list');
  if (!target || !config?.url || !config?.publishableKey) return;
  let rows = [];

  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'});
  };
  const yearOf = (value) => String(value || '').match(/^\d{4}/)?.[0] || '';

  function ensureControls() {
    if (document.getElementById('disclosure-search')) return;
    target.insertAdjacentHTML('beforebegin', `<div class="public-filter-panel"><div class="row g-3 align-items-end"><div class="col-lg-6"><label class="form-label" for="disclosure-search">Search transparency records</label><input id="disclosure-search" class="form-control" type="search" placeholder="Search title, category, or description"></div><div class="col-sm-6 col-lg-3"><label class="form-label" for="disclosure-category">Category</label><select id="disclosure-category" class="form-select"><option value="">All categories</option></select></div><div class="col-sm-6 col-lg-3"><label class="form-label" for="disclosure-year">Year</label><select id="disclosure-year" class="form-select"><option value="">All years</option></select></div></div><div class="public-result-count" id="disclosure-result-count">Loading transparency records…</div></div>`);
    document.getElementById('disclosure-search')?.addEventListener('input', render);
    document.getElementById('disclosure-category')?.addEventListener('change', render);
    document.getElementById('disclosure-year')?.addEventListener('change', render);
  }

  function syncFilters() {
    const category = document.getElementById('disclosure-category');
    const year = document.getElementById('disclosure-year');
    if (category) {
      const categories = [...new Set(rows.map((row) => String(row.category || 'Other Documents').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      category.innerHTML = '<option value="">All categories</option>' + categories.map((item)=>`<option value="${esc(item)}">${esc(item)}</option>`).join('');
    }
    if (year) {
      const years = [...new Set(rows.map((row) => yearOf(row.document_date)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
      year.innerHTML = '<option value="">All years</option>' + years.map((item)=>`<option value="${esc(item)}">${esc(item)}</option>`).join('');
    }
  }

  function downloadUrl(row) {
    if (!row.file_url) return '#';
    const separator = row.file_url.includes('?') ? '&' : '?';
    return `${row.file_url}${separator}download=${encodeURIComponent(row.title || 'barangay-document')}`;
  }

  function card(row) {
    return `<div class="col-md-6 col-xl-4"><article class="public-disclosure-card"><div class="d-flex justify-content-between align-items-start gap-3"><div class="doc-icon" aria-hidden="true">▤</div>${row.document_date ? `<span class="doc-date">${esc(formatDate(row.document_date))}</span>` : ''}</div><h3 class="mt-3 mb-2">${esc(row.title)}</h3>${row.description ? `<p class="mb-0">${esc(row.description)}</p>` : '<p class="mb-0">Public transparency document available for viewing.</p>'}${row.file_url ? `<div class="doc-actions"><a class="btn btn-outline-success btn-sm" href="${esc(row.file_url)}" target="_blank" rel="noopener noreferrer">View Document</a><a class="btn btn-success btn-sm" href="${esc(downloadUrl(row))}" target="_blank" rel="noopener noreferrer">Download</a></div>` : '<div class="small text-secondary mt-3">Document file unavailable.</div>'}</article></div>`;
  }

  function render() {
    ensureControls();
    const q = String(document.getElementById('disclosure-search')?.value || '').trim().toLowerCase();
    const category = String(document.getElementById('disclosure-category')?.value || '');
    const year = String(document.getElementById('disclosure-year')?.value || '');
    const filtered = rows.filter((row) => {
      const cat = String(row.category || 'Other Documents');
      const haystack = `${row.title || ''} ${cat} ${row.description || ''}`.toLowerCase();
      return (!q || haystack.includes(q)) && (!category || cat === category) && (!year || yearOf(row.document_date) === year);
    });
    const count = document.getElementById('disclosure-result-count');
    if (count) count.textContent = `${filtered.length} ${filtered.length === 1 ? 'public record' : 'public records'} shown`;
    if (!filtered.length) { target.innerHTML='<div class="empty-state">No transparency records match the selected filters.</div>'; return; }
    const groups = filtered.reduce((acc,row)=>{ const key=row.category || 'Other Documents'; (acc[key] ||= []).push(row); return acc; },{});
    target.innerHTML = Object.entries(groups).map(([cat,items])=>`<section class="public-disclosure-group"><div class="section-heading"><span>Transparency Category</span><h2 class="h3">${esc(cat)}</h2><p>${items.length} published ${items.length === 1 ? 'document' : 'documents'} in this category.</p></div><div class="row g-3">${items.map(card).join('')}</div></section>`).join('');
  }

  async function load() {
    ensureControls();
    target.innerHTML='<div class="empty-state">Loading disclosure documents...</div>';
    try {
      const endpoint = `${config.url}/rest/v1/disclosures?select=id,title,category,description,file_url,document_date,sort_order,is_published&is_published=eq.true&order=sort_order.asc,document_date.desc.nullslast,id.desc`;
      const res = await fetch(endpoint,{headers:{apikey:config.publishableKey,Authorization:`Bearer ${config.publishableKey}`,Accept:'application/json'}});
      if (!res.ok) throw new Error(`Disclosure request failed (${res.status}).`);
      rows = await res.json();
      syncFilters();
      if (!rows.length) { target.innerHTML='<div class="empty-state">No disclosure documents published yet.</div>'; const count=document.getElementById('disclosure-result-count'); if(count)count.textContent='0 public records'; return; }
      render();
    } catch (err) {
      console.error(err);
      target.innerHTML='<div class="empty-state">Unable to load disclosure documents right now.</div>';
      const count=document.getElementById('disclosure-result-count'); if(count)count.textContent='Transparency records unavailable';
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();

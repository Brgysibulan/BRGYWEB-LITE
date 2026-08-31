(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const list = document.getElementById('forms-list');
  const search = document.getElementById('forms-search');
  const category = document.getElementById('forms-category');
  let rows = [];

  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function readableSize(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) return '';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
    return `${(value / (1024 * 1024)).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  }

  function downloadUrl(row) {
    const url = String(row.file_url || '');
    if (!url) return '#';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}download=${encodeURIComponent(row.file_name || row.name || 'barangay-form')}`;
  }

  function renderCategories() {
    if (!category) return;
    const current = category.value;
    const categories = [...new Set(rows.map((row) => String(row.category || '').trim()).filter(Boolean))]
      .sort((a,b) => a.localeCompare(b));
    category.innerHTML = '<option value="">All categories</option>' + categories.map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join('');
    if (categories.includes(current)) category.value = current;
  }

  function render() {
    if (!list) return;
    const q = String(search?.value || '').trim().toLowerCase();
    const selectedCategory = String(category?.value || '').trim();
    const filtered = rows.filter((row) => {
      const haystack = `${row.name || ''} ${row.category || ''} ${row.description || ''} ${row.file_name || ''}`.toLowerCase();
      return (!q || haystack.includes(q)) && (!selectedCategory || row.category === selectedCategory);
    });

    if (!filtered.length) {
      list.innerHTML = `<div class="col-12"><div class="empty-state">${rows.length ? 'No forms match your search.' : 'No downloadable forms are published yet.'}</div></div>`;
      return;
    }

    list.innerHTML = filtered.map((row) => {
      const details = [row.category || 'Form', row.file_type ? String(row.file_type).split('/').pop()?.toUpperCase() : '', readableSize(row.file_size)].filter(Boolean).join(' • ');
      return `<div class="col-md-6 col-xl-4"><article class="content-panel h-100 d-flex flex-column"><span class="eyebrow">${esc(row.category || 'Download')}</span><h2 class="h5 mt-2 mb-2">${esc(row.name)}</h2>${row.description ? `<p class="text-secondary flex-grow-1">${esc(row.description)}</p>` : '<div class="flex-grow-1"></div>'}<div class="small text-secondary mb-3">${esc(details)}</div><a class="btn btn-success w-100" href="${esc(downloadUrl(row))}" target="_blank" rel="noopener noreferrer">Download Form</a></article></div>`;
    }).join('');
  }

  async function load() {
    if (!client || !list) {
      if (list) list.innerHTML = '<div class="col-12"><div class="empty-state">Downloadable forms are temporarily unavailable.</div></div>';
      return;
    }
    const { data, error } = await client.from('forms')
      .select('id,name,category,description,file_url,file_name,file_type,file_size,sort_order')
      .eq('is_published', true)
      .order('sort_order')
      .order('name');
    if (error) throw error;
    rows = data || [];
    renderCategories();
    render();
  }

  search?.addEventListener('input', render);
  category?.addEventListener('change', render);
  load().catch((error) => {
    console.error('Unable to load downloadable forms:', error);
    if (list) list.innerHTML = '<div class="col-12"><div class="empty-state">Unable to load downloadable forms right now.</div></div>';
  });
})();

(() => {
  'use strict';

  const config = window.BRGY_SUPABASE_CONFIG;

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function formatRequirements(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length <= 1) return `<p class="mb-0">${escapeHtml(text)}</p>`;
    return `<ul class="mb-0 ps-3">${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`;
  }

  async function fetchServices() {
    if (!config?.url || !config?.publishableKey) return [];
    const endpoint = `${config.url}/rest/v1/services?select=id,name,description,requirements,fee_text,processing_time,sort_order,is_active&is_active=eq.true&order=sort_order.asc,name.asc`;
    const response = await fetch(endpoint, { headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`, Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Services request failed (${response.status}).`);
    return response.json();
  }

  function serviceCard(item, compact = false) {
    const details = [
      item.fee_text ? `<div class="small"><strong>Fee:</strong> ${escapeHtml(item.fee_text)}</div>` : '',
      item.processing_time ? `<div class="small"><strong>Processing:</strong> ${escapeHtml(item.processing_time)}</div>` : ''
    ].filter(Boolean).join('');

    if (compact) {
      return `<div class="col-md-4"><div class="service-card h-100"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description || 'Service information available at the barangay office.')}</p>${details}</div></div>`;
    }

    return `<div class="col-12 col-lg-6"><article class="service-card h-100"><h2 class="h5">${escapeHtml(item.name)}</h2>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}${details}${item.requirements ? `<hr><div class="small"><strong>Requirements</strong>${formatRequirements(item.requirements)}</div>` : ''}</article></div>`;
  }

  async function init() {
    const fullList = document.getElementById('services-list');
    const homeList = document.getElementById('home-services-list');
    if (!fullList && !homeList) return;
    try {
      const rows = await fetchServices();
      if (fullList) fullList.innerHTML = rows.length ? rows.map((item) => serviceCard(item)).join('') : '<div class="col-12"><div class="empty-state">No services published yet.</div></div>';
      if (homeList) homeList.innerHTML = rows.length ? rows.slice(0, 3).map((item) => serviceCard(item, true)).join('') : '<div class="col-12"><div class="empty-state">No services published yet.</div></div>';
    } catch (error) {
      console.warn(error);
      const fallback = '<div class="col-12"><div class="empty-state">Unable to load services right now.</div></div>';
      if (fullList) fullList.innerHTML = fallback;
      if (homeList) homeList.innerHTML = fallback;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

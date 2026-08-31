(() => {
  'use strict';

  const PROFILE_CACHE_KEY = 'brgyweb:public-profile:v1';
  const client = window.BRGY_SUPABASE;
  const publicContainer = document.getElementById('barangay-profile-content');
  const homepageAbout = document.getElementById('homepage-profile-about');

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function readCache() {
    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.rows) ? parsed.rows : null;
    } catch {
      return null;
    }
  }

  function writeCache(rows) {
    try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rows })); } catch {}
  }

  function paragraphs(value) {
    return escapeHtml(value || '')
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => `<p>${part.replaceAll('\n', '<br>')}</p>`)
      .join('');
  }

  function renderPublic(rows) {
    if (!publicContainer) return;
    publicContainer.removeAttribute('aria-busy');
    const map = new Map(rows.map((row) => [row.slug, row]));
    const about = map.get('barangay-about')?.content || '';
    const history = map.get('barangay-history')?.content || '';
    const vision = map.get('barangay-vision')?.content || '';
    const mission = map.get('barangay-mission')?.content || '';
    const highlights = map.get('barangay-highlights')?.content || '';

    if (!about && !history && !vision && !mission && !highlights) {
      publicContainer.innerHTML = '<div class="empty-state">Barangay profile information has not been published yet.</div>';
      return;
    }

    const highlightItems = highlights.split('\n').map((item) => item.trim()).filter(Boolean);

    publicContainer.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="content-panel h-100">
            <h2>About the Barangay</h2>
            ${about ? paragraphs(about) : '<p class="text-secondary">General barangay information has not been published yet.</p>'}
            ${history ? `<h3 class="mt-4">History</h3>${paragraphs(history)}` : ''}
            <div class="row g-4 mt-1">
              ${vision ? `<div class="col-md-6"><h3>Vision</h3>${paragraphs(vision)}</div>` : ''}
              ${mission ? `<div class="col-md-6"><h3>Mission</h3>${paragraphs(mission)}</div>` : ''}
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="service-card h-100">
            <h3>Profile Highlights</h3>
            ${highlightItems.length ? `<ul class="mb-0 ps-3">${highlightItems.map((item) => `<li class="mb-2">${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="text-secondary mb-0">Community highlights have not been published yet.</p>'}
          </div>
        </div>
      </div>`;
  }

  function renderHomepage(rows) {
    if (!homepageAbout) return;
    const about = rows.find((row) => row.slug === 'barangay-about')?.content || '';
    if (!about) {
      homepageAbout.textContent = 'Barangay profile information will appear here once published.';
      return;
    }
    const shortText = about.length > 420 ? `${about.slice(0, 417).trim()}...` : about;
    homepageAbout.textContent = shortText;
  }

  function render(rows) {
    renderPublic(rows);
    renderHomepage(rows);
  }

  async function load() {
    if (!client) throw new Error('Public data service unavailable.');
    const { data, error } = await client
      .from('pages')
      .select('slug,title,content,sort_order')
      .eq('is_published', true)
      .in('slug', ['barangay-about', 'barangay-history', 'barangay-vision', 'barangay-mission', 'barangay-highlights'])
      .order('sort_order', { ascending: true });
    if (error) throw error;
    const rows = data || [];
    render(rows);
    writeCache(rows);
  }

  const cachedRows = readCache();
  if (cachedRows) render(cachedRows);

  document.addEventListener('DOMContentLoaded', () => {
    load().catch((error) => {
      console.warn('Unable to load public barangay profile:', error);
      if (cachedRows) return;
      if (publicContainer) {
        publicContainer.removeAttribute('aria-busy');
        publicContainer.innerHTML = '<div class="empty-state border border-danger-subtle">Barangay profile is temporarily unavailable. Please try again later.</div>';
      }
      if (homepageAbout) homepageAbout.textContent = 'Barangay profile is temporarily unavailable.';
    });
  });
})();
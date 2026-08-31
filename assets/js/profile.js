(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const publicContainer = document.getElementById('barangay-profile-content');
  const homepageAbout = document.getElementById('homepage-profile-about');

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

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
    const map = new Map(rows.map((row) => [row.slug, row]));
    const about = map.get('barangay-about')?.content || '';
    const history = map.get('barangay-history')?.content || '';
    const vision = map.get('barangay-vision')?.content || '';
    const mission = map.get('barangay-mission')?.content || '';
    const highlights = map.get('barangay-highlights')?.content || '';

    const highlightItems = highlights.split('\n').map((item) => item.trim()).filter(Boolean);

    publicContainer.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="content-panel h-100">
            <h2>About the Barangay</h2>
            ${about ? paragraphs(about) : '<p class="text-secondary">Profile information will be published here.</p>'}
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
            ${highlightItems.length ? `<ul class="mb-0 ps-3">${highlightItems.map((item) => `<li class="mb-2">${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="text-secondary mb-0">Community highlights will appear here.</p>'}
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

  async function load() {
    if (!client) return;
    const { data, error } = await client
      .from('pages')
      .select('slug,title,content,sort_order')
      .in('slug', ['barangay-about', 'barangay-history', 'barangay-vision', 'barangay-mission', 'barangay-highlights'])
      .order('sort_order', { ascending: true });
    if (error) throw error;
    renderPublic(data || []);
    renderHomepage(data || []);
  }

  document.addEventListener('DOMContentLoaded', () => {
    load().catch((error) => {
      console.warn('Unable to load public barangay profile:', error);
      if (publicContainer) publicContainer.innerHTML = '<div class="empty-state">Barangay profile is temporarily unavailable.</div>';
    });
  });
})();

(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('profile-form');
  const status = document.getElementById('profile-status');
  const signout = document.getElementById('profile-signout');
  const CACHE_KEY = 'brgyweb:admin-barangay-profile:v1';

  const sections = [
    { slug: 'barangay-about', title: 'About the Barangay', field: 'profile-about', order: 10 },
    { slug: 'barangay-history', title: 'History', field: 'profile-history', order: 20 },
    { slug: 'barangay-vision', title: 'Vision', field: 'profile-vision', order: 30 },
    { slug: 'barangay-mission', title: 'Mission', field: 'profile-mission', order: 40 },
    { slug: 'barangay-highlights', title: 'Profile Highlights', field: 'profile-highlights', order: 50 }
  ];

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-success', !isError && Boolean(message));
    status.classList.toggle('text-secondary', !message);
  }

  function readCache() {
    try {
      const value = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return Array.isArray(value) ? value : null;
    } catch { return null; }
  }

  function writeCache(rows) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(rows)); } catch {}
  }

  function applyRows(rows) {
    const data = Array.isArray(rows) ? rows : [];
    const bySlug = new Map(data.map((row) => [row.slug, row]));
    sections.forEach((section) => {
      const field = document.getElementById(section.field);
      if (field) field.value = bySlug.get(section.slug)?.content || '';
    });
    const publishedField = document.getElementById('profile-published');
    const published = data.length === 0 ? true : data.every((row) => row.is_published === true);
    if (publishedField) publishedField.checked = published;
  }

  async function requireStaff() {
    if (!client) return false;
    const { data, error } = await client.auth.getUser();
    const user = data?.user;
    if (error || !user) return false;
    const { data: profile, error: profileError } = await client.from('profiles').select('role,is_active').eq('user_id', user.id).maybeSingle();
    if (profileError || !profile || profile.is_active !== true || !['admin', 'editor'].includes(profile.role)) return false;
    return true;
  }

  async function loadProfile(showLoading = false) {
    if (showLoading) setStatus('Loading profile...');
    const slugs = sections.map((item) => item.slug);
    const { data, error } = await client.from('pages').select('slug,content,is_published').in('slug', slugs);
    if (error) throw error;
    const rows = data || [];
    writeCache(rows);
    applyRows(rows);
    setStatus('');
  }

  async function saveProfile() {
    const published = document.getElementById('profile-published')?.checked === true;
    const now = new Date().toISOString();
    const rows = sections.map((section) => ({
      slug: section.slug,
      title: section.title,
      summary: null,
      content: document.getElementById(section.field)?.value.trim() || null,
      is_published: published,
      sort_order: section.order,
      updated_at: now
    }));

    const { error } = await client.from('pages').upsert(rows, { onConflict: 'slug' });
    if (error) throw error;
    const cacheRows = rows.map(({ slug, content, is_published }) => ({ slug, content, is_published }));
    writeCache(cacheRows);
    applyRows(cacheRows);
  }

  const cachedProfile = readCache();
  if (cachedProfile) applyRows(cachedProfile);

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      setStatus('Saving profile...');
      try {
        await saveProfile();
        setStatus('Barangay profile saved successfully.');
      } catch (error) {
        console.error(error);
        setStatus(error?.message || 'Unable to save barangay profile.', true);
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  if (signout) {
    signout.addEventListener('click', async () => {
      await client?.auth.signOut();
      window.location.href = 'login.html';
    });
  }

  requireStaff().then((allowed) => {
    if (!allowed) {
      window.location.href = 'login.html';
      return;
    }
    loadProfile(!cachedProfile).catch((error) => {
      console.error(error);
      setStatus(error?.message || 'Unable to load barangay profile.', true);
    });
  });
})();

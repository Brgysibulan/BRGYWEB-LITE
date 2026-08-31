(() => {
  'use strict';
  const client = window.BRGY_SUPABASE;
  if (!client) return;
  let currentRole = null;

  const editorDashboard = '../editor/dashboard.html';
  const editorLogin = '../editor/login.html';
  const adminDashboard = 'dashboard.html';
  const adminLogin = 'login.html';

  function loadDesignTheme() {
    if (window.BRGY_THEME) return window.BRGY_THEME.load(client, 'admin');
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = '../assets/js/design-theme.js';
      script.onload = async () => resolve(await window.BRGY_THEME?.load(client, 'admin'));
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }

  async function detectRole() {
    try {
      const { data: userData } = await client.auth.getUser();
      const user = userData?.user;
      if (!user) return null;
      const { data } = await client.from('profiles').select('role,is_active').eq('user_id', user.id).maybeSingle();
      if (!data?.is_active || !['admin','editor'].includes(data.role)) return null;
      currentRole = data.role;
      document.documentElement.dataset.staffRole = currentRole;

      if (currentRole === 'editor') {
        document.querySelectorAll('a[href="dashboard.html"]').forEach((link) => { link.href = editorDashboard; });
        document.querySelectorAll('.sidebar-role').forEach((el) => { el.textContent = 'Content Editor'; });
      }
      return currentRole;
    } catch (error) {
      console.warn('Unable to resolve staff context:', error);
      return null;
    }
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('#admin-signout,#profile-signout,#directory-signout');
    if (!button || currentRole !== 'editor') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    await client.auth.signOut();
    window.location.href = editorLogin;
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    loadDesignTheme();
    detectRole();
  });
})();
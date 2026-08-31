(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('editor-login-form');
  const status = document.getElementById('editor-login-status');
  const signout = document.getElementById('editor-signout');
  const isDashboard = Boolean(signout);

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-secondary', !isError);
  }

  async function getRole(userId) {
    const { data, error } = await client
      .from('profiles')
      .select('role,is_active')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function requireEditor() {
    if (!client) {
      window.location.href = 'login.html';
      return;
    }

    const { data, error } = await client.auth.getUser();
    const user = data?.user;

    if (error || !user) {
      window.location.href = 'login.html';
      return;
    }

    try {
      const profile = await getRole(user.id);
      if (!profile || profile.role !== 'editor' || profile.is_active !== true) {
        await client.auth.signOut();
        window.location.href = 'login.html';
      }
    } catch (err) {
      console.error(err);
      await client.auth.signOut();
      window.location.href = 'login.html';
    }
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!client) {
        setStatus('Supabase connection is unavailable.', true);
        return;
      }

      const email = document.getElementById('editor-email')?.value.trim();
      const password = document.getElementById('editor-password')?.value || '';
      const button = form.querySelector('button[type="submit"]');

      if (!email || !password) {
        setStatus('Enter your email and password.', true);
        return;
      }

      if (button) button.disabled = true;
      setStatus('Signing in...');

      const { data, error } = await client.auth.signInWithPassword({ email, password });

      if (error || !data?.user) {
        setStatus(error?.message || 'Unable to sign in.', true);
        if (button) button.disabled = false;
        return;
      }

      try {
        const profile = await getRole(data.user.id);
        if (!profile || profile.role !== 'editor' || profile.is_active !== true) {
          await client.auth.signOut();
          setStatus('This account does not have active editor access.', true);
          if (button) button.disabled = false;
          return;
        }

        window.location.href = 'dashboard.html';
      } catch (err) {
        console.error(err);
        await client.auth.signOut();
        setStatus('Unable to verify editor access.', true);
        if (button) button.disabled = false;
      }
    });
  }

  if (isDashboard) requireEditor();

  if (signout) {
    signout.addEventListener('click', async () => {
      if (client) await client.auth.signOut();
      window.location.href = 'login.html';
    });
  }
})();

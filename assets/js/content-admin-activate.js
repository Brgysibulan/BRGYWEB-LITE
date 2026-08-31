(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('content-admin-activation-form');
  const password = document.getElementById('activation-password');
  const confirmPassword = document.getElementById('activation-confirm');
  const submit = document.getElementById('activation-submit');
  const status = document.getElementById('activation-status');
  if (!client || !form || !password || !confirmPassword || !submit || !status) return;

  let accessReady = false;

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-success', !isError && Boolean(message));
    status.classList.toggle('text-secondary', !isError && !message);
  }

  function enableForm(enabled) {
    password.disabled = !enabled;
    confirmPassword.disabled = !enabled;
    submit.disabled = !enabled;
  }

  async function verifyInvitationSession() {
    if (accessReady) return true;
    const { data, error } = await client.auth.getUser();
    const user = data?.user;
    if (error || !user) {
      enableForm(false);
      setStatus('This activation link is invalid or has expired. Ask the System Admin to review your access again.', true);
      return false;
    }

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('role,is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      enableForm(false);
      setStatus('Unable to verify your approved access.', true);
      return false;
    }

    if (profile?.role === 'admin' && profile?.is_active === true) {
      try { localStorage.setItem('brgyweb:staff-role:v1', 'admin'); } catch {}
      window.location.replace('../admin/dashboard.html');
      return false;
    }

    if (profile?.role !== 'editor' || profile?.is_active !== true) {
      await client.auth.signOut();
      enableForm(false);
      setStatus('This account has not been approved as an active Content Admin.', true);
      return false;
    }

    accessReady = true;
    enableForm(true);
    setStatus('Invitation verified. Set your password to activate the account.');
    password.focus();
    return true;
  }

  client.auth.onAuthStateChange((_event, session) => {
    if (session?.user && !accessReady) window.setTimeout(verifyInvitationSession, 0);
  });

  client.auth.getSession().then(() => verifyInvitationSession()).catch((error) => {
    console.error(error);
    enableForm(false);
    setStatus('Unable to verify the activation link.', true);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!accessReady && !(await verifyInvitationSession())) return;
    const nextPassword = password.value;
    const confirmation = confirmPassword.value;
    if (nextPassword.length < 8) return setStatus('Use a password with at least 8 characters.', true);
    if (nextPassword !== confirmation) return setStatus('Passwords do not match.', true);

    submit.disabled = true;
    setStatus('Activating account...');
    const { error } = await client.auth.updateUser({ password: nextPassword });
    if (error) {
      console.error(error);
      submit.disabled = false;
      return setStatus(error.message || 'Unable to set the password.', true);
    }

    try { localStorage.setItem('brgyweb:staff-role:v1', 'editor'); } catch {}
    setStatus('Account activated. Opening Content Admin dashboard...');
    window.setTimeout(() => { window.location.replace('dashboard.html'); }, 500);
  });
})();

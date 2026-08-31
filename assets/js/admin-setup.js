(() => {
  'use strict';

  const SUPABASE_URL = 'https://pkvorwvkqjnbgktkgjhr.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RbaENAflMzLgXpemymGApA_TkVAhMoU';

  const form = document.getElementById('admin-setup-form');
  const status = document.getElementById('admin-setup-status');

  function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', isError);
    status.classList.toggle('text-success', !isError && Boolean(message));
    status.classList.toggle('text-secondary', !message);
  }

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('setup-name')?.value.trim() || '';
    const email = document.getElementById('setup-email')?.value.trim() || '';
    const password = document.getElementById('setup-password')?.value || '';
    const confirmPassword = document.getElementById('setup-password-confirm')?.value || '';
    const button = form.querySelector('button[type="submit"]');

    if (!email || !email.includes('@')) {
      setStatus('Enter a valid admin email.', true);
      return;
    }

    if (password.length < 10) {
      setStatus('Password must be at least 10 characters.', true);
      return;
    }

    if (password !== confirmPassword) {
      setStatus('Passwords do not match.', true);
      return;
    }

    if (button) button.disabled = true;
    setStatus('Creating administrator account...');

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/bootstrap-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          email,
          password,
          display_name: name
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || `Setup failed (HTTP ${response.status}).`);
      }

      form.reset();
      setStatus('Admin account created. Redirecting to login...');
      window.setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    } catch (error) {
      console.error('Admin bootstrap failed:', error);
      setStatus(error instanceof Error ? error.message : 'Unable to complete setup.', true);
      if (button) button.disabled = false;
    }
  });
})();

(() => {
  'use strict';

  const form = document.getElementById('admin-setup-form');
  const status = document.getElementById('admin-setup-status');
  const config = window.BRGY_SUPABASE_CONFIG;

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

    if (!config?.url || !config?.publishableKey) {
      setStatus('Supabase configuration is unavailable.', true);
      return;
    }

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
      const response = await fetch(`${config.url}/functions/v1/bootstrap-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.publishableKey,
        },
        body: JSON.stringify({
          email,
          password,
          display_name: name,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || 'Unable to create administrator account.');

      form.reset();
      setStatus('Admin account created. Redirecting to login...');
      window.setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to complete setup.', true);
      if (button) button.disabled = false;
    }
  });
})();

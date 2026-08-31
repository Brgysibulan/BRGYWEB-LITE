(() => {
  'use strict';
  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('content-admin-application-form');
  const status = document.getElementById('content-admin-application-status');
  if (!form) return;

  const setStatus = (message, error = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('text-danger', error);
    status.classList.toggle('text-success', !error && Boolean(message));
    status.classList.toggle('text-secondary', !error && !message);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) return setStatus('Connection is unavailable. Please try again later.', true);

    const displayName = document.getElementById('application-name')?.value.trim() || '';
    const email = document.getElementById('application-email')?.value.trim().toLowerCase() || '';
    const role = document.getElementById('application-role')?.value.trim() || '';
    const reason = document.getElementById('application-reason')?.value.trim() || '';
    const button = form.querySelector('button[type="submit"]');

    if (displayName.length < 2) return setStatus('Enter your full name.', true);
    if (!email || !email.includes('@')) return setStatus('Enter a valid email address.', true);

    const reasonParts = [];
    if (role) reasonParts.push(`Role / Position: ${role}`);
    if (reason) reasonParts.push(`Purpose: ${reason}`);

    if (button) button.disabled = true;
    setStatus('Sending your request...');

    const { error } = await client.from('content_admin_applications').insert({
      display_name: displayName,
      email,
      reason: reasonParts.join('\n') || null,
    });

    if (error) {
      console.error(error);
      const duplicate = error.code === '23505';
      setStatus(duplicate ? 'A pending application already exists for this email.' : (error.message || 'Unable to submit your request.'), true);
      if (button) button.disabled = false;
      return;
    }

    form.reset();
    setStatus('Request sent successfully. Wait for System Admin review and an activation email if approved.');
    if (button) button.disabled = false;
  });
})();

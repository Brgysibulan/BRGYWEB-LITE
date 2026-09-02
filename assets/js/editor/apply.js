/**
 * BRGYWEB-LITE — Content Admin Application
 * Purpose: Validate barangay identity and submit an editor access request.
 * Depends on: core/supabase-config.js
 * Used by: editor/apply.html
 */

(() => {
  'use strict';
  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('content-admin-application-form');
  const status = document.getElementById('content-admin-application-status');
  if (!form) return;
  const setStatus = (message, error = false) => { if (!status) return; status.textContent = message; status.classList.toggle('text-danger', error); status.classList.toggle('text-success', !error && Boolean(message)); status.classList.toggle('text-secondary', !error && !message); };
  async function safelySignOut() { try { await client?.auth?.signOut(); } catch {} }
  async function nameExistsInBarangayDatabase(displayName) { const { data, error } = await client.rpc('can_apply_content_admin', { candidate_name: displayName }); if (error) throw error; return data === true; }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) return setStatus('Connection is unavailable. Please try again later.', true);
    const displayName = document.getElementById('application-name')?.value.trim() || '';
    const email = document.getElementById('application-email')?.value.trim().toLowerCase() || '';
    const role = document.getElementById('application-role')?.value.trim() || '';
    const password = document.getElementById('application-password')?.value || '';
    const passwordConfirm = document.getElementById('application-password-confirm')?.value || '';
    const reason = document.getElementById('application-reason')?.value.trim() || '';
    const button = form.querySelector('button[type="submit"]');
    if (displayName.length < 2) return setStatus('Enter your full name.', true);
    if (!email || !email.includes('@')) return setStatus('Enter a valid email address.', true);
    if (password.length < 8) return setStatus('Use a password with at least 8 characters.', true);
    if (password !== passwordConfirm) return setStatus('Passwords do not match.', true);
    const reasonParts = []; if (role) reasonParts.push(`Role / Position: ${role}`); if (reason) reasonParts.push(`Purpose: ${reason}`);
    if (button) button.disabled = true;
    try { setStatus('Checking your name in the barangay database...'); if (!(await nameExistsInBarangayDatabase(displayName))) { setStatus('Signup denied. Your name was not found in the barangay database. Enter your name exactly as recorded in the ID database or contact the Barangay Office.', true); if (button) button.disabled = false; return; } }
    catch (error) { console.error(error); setStatus('Unable to verify your name in the barangay database. Please try again.', true); if (button) button.disabled = false; return; }
    setStatus('Name verified. Creating your account...');
    const { data: signupData, error: signupError } = await client.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
    if (signupError) { console.error(signupError); const message = String(signupError.message || ''); setStatus(/already|registered|exists/i.test(message) ? 'This email already has a login account. Use Content Admin Login or another email.' : (message || 'Unable to create your login account.'), true); if (button) button.disabled = false; return; }
    if (Array.isArray(signupData?.user?.identities) && signupData.user.identities.length === 0) { await safelySignOut(); setStatus('This email already has a login account. Use Content Admin Login or another email.', true); if (button) button.disabled = false; return; }
    setStatus('Account created. Sending your access request...');
    const { error: applicationError } = await client.from('content_admin_applications').insert({ display_name: displayName, email, reason: reasonParts.join('\n') || null });
    if (applicationError) { console.error(applicationError); await safelySignOut(); setStatus(applicationError.code === '23505' ? 'A pending application already exists for this email.' : (applicationError.message || 'Your login was created, but the access request could not be submitted. Contact the System Admin.'), true); if (button) button.disabled = false; return; }
    await safelySignOut(); form.reset();
    setStatus(signupData?.session ? 'Account and request created successfully. Wait for System Admin approval, then sign in using the same email and password.' : 'Account and request created successfully. Check your email if confirmation is required, then wait for System Admin approval. After approval, sign in using this email and password.');
    if (button) button.disabled = false;
  });
})();

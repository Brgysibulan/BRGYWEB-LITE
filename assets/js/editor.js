(() => {
  'use strict';

  const form = document.getElementById('editor-login-form');
  const status = document.getElementById('editor-login-status');
  const signout = document.getElementById('editor-signout');

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (status) status.textContent = 'Supabase authentication will be connected in the next setup step.';
    });
  }

  if (signout) {
    signout.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }
})();

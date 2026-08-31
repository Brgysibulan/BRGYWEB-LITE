(() => {
  'use strict';

  const path = window.location.pathname;
  const inAdmin = /\/admin\//.test(path);
  const inEditor = /\/editor\//.test(path);
  if (!inAdmin && !inEditor) return;
  if (/\/(?:login|apply|activate)\.html$/.test(path)) return;

  const formsHref = inAdmin ? 'forms.html' : '../admin/forms.html';

  function addSidebarLink() {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav || nav.querySelector('a[href$="forms.html"]')) return;
    const link = document.createElement('a');
    link.href = formsHref;
    link.textContent = 'Downloadable Forms';
    if (/\/admin\/forms\.html$/.test(path)) {
      link.classList.add('active');
      link.setAttribute('aria-current','page');
    }
    const services = [...nav.querySelectorAll('a')].find((item) => /services\.html(?:$|[?#])/.test(item.getAttribute('href') || ''));
    if (services) services.insertAdjacentElement('afterend', link);
    else nav.appendChild(link);
  }

  function addEditorDashboardCards() {
    if (!/\/editor\/dashboard\.html$/.test(path)) return;

    const quick = document.querySelector('.quick-action-grid');
    if (quick && !quick.querySelector('a[href$="forms.html"]')) {
      const link = document.createElement('a');
      link.href = '../admin/forms.html';
      link.innerHTML = '<strong>Downloadable Forms</strong><span>Upload and publish public forms</span>';
      quick.appendChild(link);
    }

    const workspace = document.querySelector('#workspace .row');
    if (workspace && !workspace.querySelector('a[href$="forms.html"]')) {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-xl-4';
      col.innerHTML = '<a class="manage-card" href="../admin/forms.html"><strong>Downloadable Forms</strong><span>Upload forms, set categories, and control publication</span></a>';
      workspace.appendChild(col);
    }
  }

  function apply() {
    addSidebarLink();
    addEditorDashboardCards();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once:true });
  else apply();

  const observer = new MutationObserver(() => apply());
  observer.observe(document.documentElement, { childList:true, subtree:true });
  window.setTimeout(() => observer.disconnect(), 6000);
})();

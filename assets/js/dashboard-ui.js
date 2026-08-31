(() => {
  'use strict';
  const search = document.getElementById('dashboard-search');
  if (!search) return;
  const cards = [...document.querySelectorAll('.manage-card,.quick-action-grid a')];
  const empty = document.getElementById('dashboard-search-empty');
  function apply() {
    const q = search.value.trim().toLowerCase();
    let matches = 0;
    cards.forEach((card) => {
      const hit = !q || card.textContent.toLowerCase().includes(q);
      const wrap = card.closest('[class*="col-"]') || card;
      wrap.style.display = hit ? '' : 'none';
      if (hit && q) matches += 1;
    });
    if (empty) empty.style.display = q && !matches ? 'block' : 'none';
  }
  search.addEventListener('input', apply);
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      search.value = '';
      apply();
      search.blur();
    }
  });
})();
(() => {
  'use strict';
  const db = window.BRGY_SUPABASE;
  const form = document.getElementById('verification-form');
  const list = document.getElementById('verification-list');
  if (!db || !form || !list) return;

  const fields = {
    id: document.getElementById('verification-id'),
    control: document.getElementById('verification-control'),
    first: document.getElementById('verification-first'),
    middle: document.getElementById('verification-middle'),
    last: document.getElementById('verification-last'),
    designation: document.getElementById('verification-designation'),
    acquired: document.getElementById('verification-acquired'),
    expiration: document.getElementById('verification-expiration'),
    status: document.getElementById('verification-status')
  };
  const statusText = document.getElementById('verification-status-text');
  const search = document.getElementById('verification-search');
  const resultCount = document.getElementById('verification-result-count');
  let records = [];

  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const normalize = (v) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const nameOf = (r) => [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ').trim();
  const searchText = (r) => normalize([
    r.control_number,
    r.first_name,
    r.middle_name,
    r.last_name,
    nameOf(r),
    r.designation,
    r.status,
    r.date_acquired,
    r.expiration_date
  ].filter(Boolean).join(' '));

  const clear = () => {
    Object.values(fields).forEach((el) => {
      if (!el) return;
      if (el === fields.status) el.value = 'ACTIVE';
      else el.value = '';
    });
    statusText.textContent = '';
  };

  async function ensureAdmin() {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return false;
    const { data } = await db.from('profiles').select('role,is_active').eq('user_id', user.id).maybeSingle();
    return data?.role === 'admin' && data?.is_active === true;
  }

  function render() {
    const q = normalize(search?.value || '');
    const terms = q ? q.split(' ').filter(Boolean) : [];
    const shown = records.filter((r) => {
      if (!terms.length) return true;
      const haystack = searchText(r);
      return terms.every((term) => haystack.includes(term));
    });

    if (resultCount) {
      resultCount.textContent = q
        ? `${shown.length} of ${records.length} records`
        : `${records.length} records`;
    }

    list.innerHTML = shown.length
      ? shown.map((r) => `<tr><td><strong>${esc(r.control_number)}</strong></td><td>${esc(nameOf(r) || '—')}</td><td>${esc(r.designation || '—')}</td><td><span class="badge ${r.status === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}">${esc(r.status)}</span></td><td class="text-end"><button class="btn btn-sm btn-outline-dark" data-edit="${r.id}">Edit</button> <button class="btn btn-sm btn-outline-danger" data-delete="${r.id}">Delete</button></td></tr>`).join('')
      : '<tr><td colspan="5" class="text-secondary">No matching records.</td></tr>';
  }

  async function load() {
    const { data, error } = await db.from('verification_records').select('*').order('control_number');
    if (error) {
      list.innerHTML = `<tr><td colspan="5" class="text-danger">${esc(error.message)}</td></tr>`;
      return;
    }
    records = data || [];
    render();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      control_number: fields.control.value.trim(),
      first_name: fields.first.value.trim() || null,
      middle_name: fields.middle.value.trim() || null,
      last_name: fields.last.value.trim() || null,
      designation: fields.designation.value.trim() || null,
      date_acquired: fields.acquired.value || null,
      expiration_date: fields.expiration.value || null,
      status: fields.status.value,
      updated_at: new Date().toISOString()
    };
    if (!payload.control_number) return;
    statusText.textContent = 'Saving…';
    const id = fields.id.value;
    const op = id
      ? db.from('verification_records').update(payload).eq('id', id)
      : db.from('verification_records').insert(payload);
    const { error } = await op;
    statusText.textContent = error ? error.message : 'Saved.';
    if (!error) {
      clear();
      await load();
    }
  });

  list.addEventListener('click', async (e) => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (edit) {
      const r = records.find((x) => String(x.id) === edit.dataset.edit);
      if (!r) return;
      fields.id.value = r.id;
      fields.control.value = r.control_number || '';
      fields.first.value = r.first_name || '';
      fields.middle.value = r.middle_name || '';
      fields.last.value = r.last_name || '';
      fields.designation.value = r.designation || '';
      fields.acquired.value = r.date_acquired || '';
      fields.expiration.value = r.expiration_date || '';
      fields.status.value = r.status || 'ACTIVE';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (del && confirm('Delete this verification record?')) {
      const { error } = await db.from('verification_records').delete().eq('id', del.dataset.delete);
      if (error) alert(error.message);
      else await load();
    }
  });

  document.getElementById('verification-clear')?.addEventListener('click', clear);
  search?.addEventListener('input', render);
  search?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      search.value = '';
      render();
    }
  });

  (async () => {
    if (!(await ensureAdmin())) {
      window.location.href = 'login.html';
      return;
    }
    await load();
    search?.focus();
  })();
})();

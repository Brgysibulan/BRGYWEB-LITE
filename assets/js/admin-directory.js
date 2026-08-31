(() => {
  'use strict';
  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('directory-form');
  const list = document.getElementById('directory-list');
  const status = document.getElementById('directory-status');
  const cancel = document.getElementById('directory-cancel');
  const signout = document.getElementById('directory-signout');
  let rows = [];

  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const val = (id) => document.getElementById(id)?.value.trim() || '';
  const setStatus = (msg, err=false) => { if (!status) return; status.textContent=msg; status.className=`small ${err?'text-danger':msg?'text-success':'text-secondary'}`; };

  async function requireAdmin() {
    if (!client) return false;
    const { data } = await client.auth.getUser();
    if (!data?.user) return false;
    const { data: profile, error } = await client.from('profiles').select('role,is_active').eq('user_id', data.user.id).maybeSingle();
    return !error && profile?.role === 'admin' && profile?.is_active === true;
  }

  function resetForm() {
    form?.reset();
    document.getElementById('directory-id').value='';
    document.getElementById('directory-order').value='0';
    document.getElementById('directory-active').checked=true;
    document.getElementById('directory-form-title').textContent='Add Directory Entry';
    cancel?.classList.add('d-none');
  }

  function render() {
    if (!list) return;
    if (!rows.length) { list.innerHTML='<tr><td colspan="7" class="text-secondary">No directory entries yet.</td></tr>'; return; }
    list.innerHTML = rows.map(r => `<tr><td>${esc(r.category)}</td><td><strong>${esc(r.name)}</strong>${r.role_title?`<div class="small text-secondary">${esc(r.role_title)}</div>`:''}</td><td>${esc(r.contact || '—')}</td><td>${esc(r.location || '—')}</td><td>${r.sort_order}</td><td><span class="badge ${r.is_active?'text-bg-success':'text-bg-secondary'}">${r.is_active?'Published':'Hidden'}</span></td><td class="text-end"><button class="btn btn-sm btn-outline-dark me-1" data-edit="${r.id}">Edit</button><button class="btn btn-sm btn-outline-danger" data-delete="${r.id}">Delete</button></td></tr>`).join('');
  }

  async function loadRows() {
    const { data, error } = await client.from('directory_entries').select('id,category,name,role_title,contact,location,photo_url,sort_order,is_active,updated_at').order('category').order('sort_order').order('name');
    if (error) throw error;
    rows = data || [];
    render();
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = val('directory-id');
    const payload = { category: val('directory-category'), name: val('directory-name'), role_title: val('directory-role') || null, contact: val('directory-contact') || null, location: val('directory-location') || null, photo_url: val('directory-photo') || null, sort_order: Number(document.getElementById('directory-order')?.value || 0), is_active: document.getElementById('directory-active')?.checked === true, updated_at: new Date().toISOString() };
    if (!payload.category || !payload.name) return setStatus('Category and Name are required.', true);
    const button=form.querySelector('button[type="submit"]'); if(button) button.disabled=true; setStatus(id?'Updating entry...':'Saving entry...');
    try {
      const q = id ? client.from('directory_entries').update(payload).eq('id', id) : client.from('directory_entries').insert(payload);
      const { error } = await q; if (error) throw error;
      setStatus(id?'Entry updated.':'Entry added.'); resetForm(); await loadRows();
    } catch(err) { console.error(err); setStatus(err?.message || 'Unable to save entry.', true); }
    finally { if(button) button.disabled=false; }
  });

  list?.addEventListener('click', async (e) => {
    const edit=e.target.closest('[data-edit]'); const del=e.target.closest('[data-delete]');
    if(edit){ const r=rows.find(x=>String(x.id)===edit.dataset.edit); if(!r) return; document.getElementById('directory-id').value=r.id; document.getElementById('directory-category').value=r.category||''; document.getElementById('directory-name').value=r.name||''; document.getElementById('directory-role').value=r.role_title||''; document.getElementById('directory-contact').value=r.contact||''; document.getElementById('directory-location').value=r.location||''; document.getElementById('directory-photo').value=r.photo_url||''; document.getElementById('directory-order').value=r.sort_order??0; document.getElementById('directory-active').checked=r.is_active===true; document.getElementById('directory-form-title').textContent='Edit Directory Entry'; cancel?.classList.remove('d-none'); form.scrollIntoView({behavior:'smooth'}); }
    if(del){ if(!confirm('Delete this directory entry?')) return; del.disabled=true; setStatus('Deleting entry...'); const { error }=await client.from('directory_entries').delete().eq('id', del.dataset.delete); if(error){ setStatus(error.message,true); del.disabled=false; return; } setStatus('Entry deleted.'); await loadRows(); }
  });

  cancel?.addEventListener('click', resetForm);
  signout?.addEventListener('click', async()=>{ if(client) await client.auth.signOut(); location.href='login.html'; });

  (async()=>{ const allowed=await requireAdmin(); if(!allowed){ location.href='login.html'; return; } try{ await loadRows(); }catch(err){ console.error(err); setStatus(err?.message||'Unable to load directory.',true); } })();
})();
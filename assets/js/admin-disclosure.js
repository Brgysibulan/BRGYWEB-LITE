(() => {
  'use strict';
  const client = window.BRGY_SUPABASE;
  const BUCKET = 'disclosure-documents';
  const form = document.getElementById('disclosure-form');
  const list = document.getElementById('disclosure-list');
  const status = document.getElementById('disclosure-status');
  const cancel = document.getElementById('disclosure-cancel');
  const signout = document.getElementById('admin-signout');

  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const val = (id) => document.getElementById(id)?.value.trim() || '';
  const setVal = (id,v='') => { const e=document.getElementById(id); if(e)e.value=v ?? ''; };
  function setStatus(msg, error=false){ if(!status)return; status.textContent=msg; status.className=`small ${error?'text-danger':'text-success'}`; }
  function storagePath(url){ const marker=`/storage/v1/object/public/${BUCKET}/`; return url?.includes(marker) ? decodeURIComponent(url.split(marker)[1]) : null; }
  function publicUrl(path){ return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; }
  function reset(){ form.reset(); setVal('disclosure-id'); setVal('disclosure-existing-url'); document.getElementById('disclosure-published').checked=true; setVal('disclosure-order','0'); cancel.classList.add('d-none'); document.getElementById('disclosure-form-title').textContent='Add Disclosure'; }

  async function requireStaff(){
    if(!client){ location.href='login.html'; return false; }
    const {data,error}=await client.auth.getUser(); const user=data?.user;
    if(error||!user){ location.href='login.html'; return false; }
    const {data:profile,error:pErr}=await client.from('profiles').select('role,is_active').eq('user_id',user.id).maybeSingle();
    if(pErr||!profile||profile.is_active!==true||!['admin','editor'].includes(profile.role)){ await client.auth.signOut(); location.href='login.html'; return false; }
    return true;
  }

  async function removeStored(url){
    const path=storagePath(url);
    if(!path) return true;
    const {error}=await client.storage.from(BUCKET).remove([path]);
    if(error){ console.warn('Unable to remove disclosure file:',error); return false; }
    return true;
  }

  async function load(){
    list.innerHTML='<div class="empty-state">Loading disclosure records...</div>';
    const {data,error}=await client.from('disclosures').select('*').order('sort_order').order('document_date',{ascending:false,nullsFirst:false}).order('id',{ascending:false});
    if(error) throw error;
    if(!data?.length){ list.innerHTML='<div class="empty-state">No disclosure records yet.</div>'; return; }
    list.innerHTML=data.map(r=>`<div class="border rounded-3 p-3 mb-3"><div class="d-flex flex-wrap justify-content-between gap-3"><div><div class="d-flex gap-2 align-items-center flex-wrap"><strong>${esc(r.title)}</strong><span class="badge ${r.is_published?'text-bg-success':'text-bg-secondary'}">${r.is_published?'Published':'Hidden'}</span></div><div class="small text-secondary mt-1">${esc(r.category||'Uncategorized')}${r.document_date?` • ${esc(r.document_date)}`:''} • Order ${Number(r.sort_order)||0}</div>${r.description?`<p class="mb-1 mt-2">${esc(r.description)}</p>`:''}${r.file_url?`<a class="small" href="${esc(r.file_url)}" target="_blank" rel="noopener noreferrer">Open document</a>`:'<span class="small text-secondary">No file uploaded</span>'}</div><div class="d-flex gap-2 align-self-start"><button class="btn btn-sm btn-outline-dark" type="button" data-edit="${r.id}">Edit</button><button class="btn btn-sm btn-outline-danger" type="button" data-delete="${r.id}">Delete</button></div></div></div>`).join('');
  }

  async function upload(file){
    if(file.size>10*1024*1024) throw new Error('File must be 10 MB or smaller.');
    const ok=['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if(!ok.includes(file.type)) throw new Error('Only PDF, Word, and Excel files are allowed.');
    const ext=(file.name.split('.').pop()||'file').toLowerCase().replace(/[^a-z0-9]/g,'');
    const path=`${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const {error}=await client.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
    if(error) throw error;
    return {path,url:publicUrl(path)};
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); const btn=form.querySelector('button[type="submit"]'); if(btn)btn.disabled=true; setStatus('Saving...');
    let newPath=null;
    try{
      const id=val('disclosure-id'); const oldUrl=val('disclosure-existing-url'); const file=document.getElementById('disclosure-file').files[0];
      let fileUrl=oldUrl||null;
      if(file){ const uploaded=await upload(file); newPath=uploaded.path; fileUrl=uploaded.url; }
      const payload={title:val('disclosure-title'),category:val('disclosure-category')||null,description:val('disclosure-description')||null,file_url:fileUrl,document_date:val('disclosure-date')||null,is_published:document.getElementById('disclosure-published').checked,sort_order:Math.max(0,Number.parseInt(val('disclosure-order')||'0',10)||0),updated_at:new Date().toISOString()};
      if(!payload.title) throw new Error('Title is required.');
      const q=id?client.from('disclosures').update(payload).eq('id',id):client.from('disclosures').insert(payload); const {error}=await q; if(error) throw error;
      let cleanupOkay=true;
      if(file&&oldUrl) cleanupOkay=await removeStored(oldUrl);
      reset(); setStatus(cleanupOkay?'Disclosure saved.':'Disclosure saved, but the old uploaded file could not be removed.',!cleanupOkay); await load();
    }catch(err){ console.error(err); if(newPath){ const cleanup=await client.storage.from(BUCKET).remove([newPath]); if(cleanup.error) console.warn('Unable to roll back new disclosure upload:',cleanup.error); } setStatus(err.message||'Unable to save disclosure.',true); }
    finally{ if(btn)btn.disabled=false; }
  });

  list.addEventListener('click', async (e)=>{
    const edit=e.target.closest('[data-edit]'); const del=e.target.closest('[data-delete]');
    if(edit){ const {data,error}=await client.from('disclosures').select('*').eq('id',edit.dataset.edit).single(); if(error)return setStatus(error.message,true); setVal('disclosure-id',data.id);setVal('disclosure-existing-url',data.file_url||'');setVal('disclosure-title',data.title);setVal('disclosure-category',data.category||'');setVal('disclosure-date',data.document_date||'');setVal('disclosure-description',data.description||'');setVal('disclosure-order',data.sort_order);document.getElementById('disclosure-published').checked=data.is_published===true;cancel.classList.remove('d-none');document.getElementById('disclosure-form-title').textContent='Edit Disclosure';window.scrollTo({top:0,behavior:'smooth'}); }
    if(del){
      if(!confirm('Delete this disclosure record and its uploaded document?')) return;
      del.disabled=true;
      try{
        const {data,error}=await client.from('disclosures').select('file_url').eq('id',del.dataset.delete).single(); if(error)throw error;
        const {error:dErr}=await client.from('disclosures').delete().eq('id',del.dataset.delete); if(dErr)throw dErr;
        const cleanupOkay=await removeStored(data.file_url);
        setStatus(cleanupOkay?'Disclosure deleted.':'Disclosure record deleted, but its uploaded file could not be removed from Storage.',!cleanupOkay);
        await load();
      }catch(err){ console.error(err); setStatus(err.message||'Unable to delete disclosure.',true); del.disabled=false; }
    }
  });
  cancel.addEventListener('click',reset);
  if(signout)signout.addEventListener('click',async()=>{await client.auth.signOut();location.href='login.html';});
  requireStaff().then(ok=>{if(ok)load().catch(err=>setStatus(err.message,true));});
})();
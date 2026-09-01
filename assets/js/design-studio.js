(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('design-studio-form');
  const grid = document.getElementById('design-pack-grid');
  const saveButton = document.getElementById('design-save');
  const resetButton = document.getElementById('design-reset');
  const saveBar = document.getElementById('design-savebar');
  const changeState = document.getElementById('design-change-state');
  const status = document.getElementById('design-studio-status');
  const paletteHealth = document.getElementById('palette-health');
  const previewThemeName = document.getElementById('preview-theme-name');
  const publicPreview = document.getElementById('public-design-preview');
  const adminPreview = document.getElementById('admin-design-preview');
  const loginPreview = document.getElementById('login-design-preview');
  const signupPreview = document.getElementById('signup-design-preview');
  const publicLabel = document.getElementById('public-preview-label');
  const adminLabel = document.getElementById('admin-preview-label');
  const loginLabel = document.getElementById('login-preview-label');
  const signupLabel = document.getElementById('signup-preview-label');

  const COPY = {
    'national-authority': { number:'01', headline:'National Authority', short:'Formal national-agency hierarchy', summary:'Masthead-led, restrained and official-information first.' },
    'executive-civic': { number:'02', headline:'Executive Civic', short:'Executive office presentation', summary:'Polished spacing, decisive typography and operational surfaces.' },
    'public-service': { number:'03', headline:'Public Service', short:'Resident and service first', summary:'Quick actions and public transactions move to the front.' },
    'institutional': { number:'04', headline:'Institutional', short:'Dense and transparency-led', summary:'Low decoration, strong document hierarchy and compact geometry.' },
    'modern-lgu': { number:'05', headline:'Modern LGU', short:'Flagship local-government portal', summary:'Balanced civic storytelling with modern mobile-first surfaces.' }
  };

  let theme = null;
  let catalog = null;
  let selected = 'modern-lgu';
  let saved = null;
  let dirty = false;
  let loadingSaved = false;
  let activePreview = 'public';

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function setStatus(message, kind='normal') {
    if (!status) return;
    status.textContent = message || '';
    status.dataset.state = kind;
    saveBar?.classList.toggle('has-error', kind === 'error');
    saveBar?.classList.toggle('has-success', kind === 'success');
  }

  function hexToRgb(hex) {
    const value = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(value)) return null;
    return {
      r: parseInt(value.slice(0,2), 16),
      g: parseInt(value.slice(2,4), 16),
      b: parseInt(value.slice(4,6), 16)
    };
  }

  function luminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
  }

  function contrast(a, b) {
    const l1 = luminance(a);
    const l2 = luminance(b);
    return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
  }

  function validatePalette(colors={}) {
    const required = ['primary','secondary','accent','signal'];
    if (required.some((key) => !/^#[0-9a-f]{6}$/i.test(String(colors[key] || '')))) {
      return { ok:false, message:'Palette contains an invalid color value.' };
    }
    const values = required.map((key) => colors[key].toLowerCase());
    if (new Set(values).size !== values.length) {
      return { ok:false, message:'Palette roles must use distinct colors.' };
    }
    if (contrast(colors.primary, '#ffffff') < 4.5) {
      return { ok:false, message:'Primary color does not have enough contrast for official headers.' };
    }
    if (contrast(colors.secondary, '#ffffff') < 3.6) {
      return { ok:false, message:'Secondary color is too light for action controls.' };
    }
    if (contrast(colors.accent, colors.primary) < 2.2) {
      return { ok:false, message:'Accent is too close to the primary color.' };
    }
    return { ok:true, message:'Palette roles pass the Design Studio guardrails.' };
  }

  async function waitForRuntime() {
    const started = Date.now();
    while ((!window.BRGY_THEME || !window.BRGY_GOV_THEMES || !window.BRGY_GOV_THEME_RUNTIME) && Date.now() - started < 5000) {
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    theme = window.BRGY_THEME;
    catalog = window.BRGY_GOV_THEMES;
    if (!theme || !catalog) throw new Error('Government theme system failed to load.');
  }

  async function requireAdmin() {
    if (!client) { location.href='login.html'; return false; }
    const {data,error}=await client.auth.getUser();
    if (error || !data?.user) { location.href='login.html'; return false; }
    const {data:profile,error:profileError}=await client.from('profiles').select('role,is_active').eq('user_id',data.user.id).maybeSingle();
    if (profileError || profile?.role!=='admin' || profile?.is_active!==true) {
      await client.auth.signOut();
      location.href='login.html';
      return false;
    }
    return true;
  }

  function renderCatalog() {
    if (!grid) return;
    grid.innerHTML = Object.entries(catalog).map(([id,meta]) => {
      const copy = COPY[id];
      const c = meta.colors;
      return `<button class="gov-pack" type="button" data-gov-pack="${id}" aria-pressed="false">
        <span class="gov-pack-visual" style="--g1:${c.primary};--g2:${c.secondary};--ga:${c.accent}">
          <i class="gov-mini-nav"></i><i class="gov-mini-hero"></i><span class="gov-mini-row"><b></b><b></b><b></b></span>
        </span>
        <span class="gov-pack-copy"><span class="gov-pack-top"><span class="gov-pack-number">${copy.number}</span><span class="gov-pack-tag">${meta.tag}</span></span><strong>${copy.headline}</strong><small>${copy.short}</small></span>
        <span class="gov-pack-colors" aria-hidden="true"><i style="background:${c.primary}"></i><i style="background:${c.secondary}"></i><i style="background:${c.accent}"></i><i style="background:${c.signal}"></i></span>
      </button>`;
    }).join('');
    grid.addEventListener('click',(event)=>{
      const button=event.target.closest('[data-gov-pack]');
      if (button) selectTheme(button.dataset.govPack);
    });
  }

  function compose(id) {
    const meta = catalog[id] || catalog['modern-lgu'];
    const composed = theme.composePack(meta.basePack, 'custom', meta.colors);
    const normalized = theme.normalizeConfig({
      version: theme.THEME_SCHEMA_VERSION,
      pack: meta.basePack,
      palette: 'custom',
      public: composed.public,
      admin: composed.admin
    });
    normalized.experience = id;
    normalized.public.colors = theme.normalizeColors(meta.colors);
    normalized.admin.colors = theme.normalizeAdminColors(meta.colors);
    return normalized;
  }

  function previewSurface(node, id) {
    if (!node) return;
    const meta = catalog[id];
    node.dataset.govPreview = id;
    node.style.setProperty('--p1', meta.colors.primary);
    node.style.setProperty('--p2', meta.colors.secondary);
    node.style.setProperty('--pa', meta.colors.accent);
    node.style.setProperty('--ps', meta.colors.signal);
  }

  function setPreviewTab(name) {
    activePreview = name;
    document.querySelectorAll('[data-preview-target]').forEach((button) => {
      const active = button.dataset.previewTarget === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-preview-panel]').forEach((panel) => {
      const active = panel.dataset.previewPanel === name;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  }

  function refreshPreview() {
    document.querySelectorAll('[data-gov-pack]').forEach((button)=>{
      const active=button.dataset.govPack===selected;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
    [publicPreview,adminPreview,loginPreview,signupPreview].forEach((node)=>previewSurface(node,selected));

    const meta = catalog[selected];
    const name = meta?.name || 'Modern LGU';
    if (previewThemeName) previewThemeName.textContent = name;
    if (publicLabel) publicLabel.textContent = `${name} · Public website`;
    if (adminLabel) adminLabel.textContent = `${name} · System + Content Admin`;
    if (loginLabel) loginLabel.textContent = `${name} · Access portal`;
    if (signupLabel) signupLabel.textContent = `${name} · Content Admin signup`;

    const health = validatePalette(meta?.colors || {});
    if (paletteHealth) {
      paletteHealth.textContent = health.ok ? 'Palette verified' : 'Palette needs review';
      paletteHealth.dataset.state = health.ok ? 'ok' : 'error';
      paletteHealth.title = health.message;
    }
    return health;
  }

  function syncDirty(message='', kind='normal') {
    dirty = selected !== saved;
    const health = validatePalette(catalog?.[selected]?.colors || {});
    if (changeState) changeState.textContent = dirty ? 'Theme ready to publish' : 'Published theme is active';
    saveBar?.classList.toggle('is-clean', !dirty);
    if (saveButton) saveButton.disabled = !dirty || !health.ok;
    if (message) setStatus(message, health.ok ? kind : 'error');
    else if (!health.ok) setStatus(health.message, 'error');
  }

  function selectTheme(id) {
    if (!catalog[id]) return;
    selected=id;
    refreshPreview();
    syncDirty(`${catalog[id].name} selected. Review the preview, then publish when ready.`);
  }

  function sameColors(actual={}, expected={}) {
    return ['primary','secondary','accent','signal'].every((key)=>String(actual?.[key]||'').toLowerCase()===String(expected?.[key]||'').toLowerCase());
  }

  function verifyPayload(actual, expected, expectedId) {
    const actualId = window.BRGY_GOV_THEME_RUNTIME.normalize(actual?.experience, actual?.pack);
    if (actualId !== expectedId) throw new Error(`Theme verification failed: expected ${expectedId}, received ${actualId}.`);
    if (actual?.pack !== expected.pack) throw new Error('Theme verification failed: base design package did not match.');
    if (!sameColors(actual?.public?.colors, expected.public.colors)) throw new Error('Theme verification failed: public colors did not match.');
    if (!sameColors(actual?.admin?.colors, expected.admin.colors)) throw new Error('Theme verification failed: admin colors did not match.');
  }

  async function readSavedRecord() {
    const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
    if (error) throw error;
    return clone(data?.design_theme||{});
  }

  async function loadSaved(message='') {
    if (loadingSaved) return;
    loadingSaved=true;
    try {
      if (!message) setStatus('Loading published government design…');
      const raw=await readSavedRecord();
      const live=window.BRGY_GOV_THEME_RUNTIME.normalize(raw.experience, raw.pack);
      if (!catalog[live]) throw new Error('Published theme is not part of the five-theme catalog.');
      saved=live;
      if (!dirty || !selected) selected=live;
      else if (selected===saved) dirty=false;
      window.BRGY_GOV_THEME_RUNTIME.apply(live,raw);
      theme.writeCache(theme.normalizeConfig(raw));
      theme.applyAdmin(raw.admin||{});
      refreshPreview();
      syncDirty();
      setStatus(message || `${catalog[live].name} is the verified published theme.`, 'success');
    } finally {
      loadingSaved=false;
    }
  }

  async function publish() {
    if (!dirty) return;
    const expectedId=selected;
    const health=validatePalette(catalog[expectedId]?.colors || {});
    if (!health.ok) {
      setStatus(health.message,'error');
      return;
    }

    const payload=compose(expectedId);
    saveButton.disabled=true;
    resetButton.disabled=true;
    setStatus(`Publishing ${catalog[expectedId].name}…`);
    try {
      const {data,error}=await client.from('site_settings').update({
        design_theme:payload,
        primary_color:payload.public.colors.primary,
        secondary_color:payload.public.colors.secondary,
        accent_color:payload.public.colors.accent,
        updated_at:new Date().toISOString()
      }).eq('id',1).select('design_theme').single();
      if (error) throw error;
      verifyPayload(data?.design_theme||{},payload,expectedId);

      const reread=await readSavedRecord();
      verifyPayload(reread,payload,expectedId);
      saved=expectedId;
      selected=expectedId;
      dirty=false;
      theme.writeCache(theme.normalizeConfig(reread));
      theme.applyAdmin(reread.admin||{});
      window.BRGY_GOV_THEME_RUNTIME.apply(expectedId,reread);
      refreshPreview();
      syncDirty();
      setStatus(`${catalog[expectedId].name} published and re-verified from Supabase.`, 'success');
    } catch (error) {
      console.error(error);
      setStatus(error.message||'Unable to publish the government design.','error');
      saveButton.disabled=false;
    } finally {
      resetButton.disabled=false;
    }
  }

  document.querySelector('.gov-preview-tabs')?.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-preview-target]');
    if (button) setPreviewTab(button.dataset.previewTarget);
  });

  resetButton?.addEventListener('click',async()=>{
    if (!saved) return;
    dirty=false;
    selected=saved;
    refreshPreview();
    syncDirty('Restored the verified published theme in preview.');
    try { await loadSaved('Published theme rechecked from Supabase.'); }
    catch(error){ console.error(error); setStatus('Unable to recheck the published theme.','error'); }
  });

  form?.addEventListener('submit',(event)=>{event.preventDefault();publish();});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&!dirty)loadSaved().catch((error)=>console.warn('Theme status refresh failed:',error));
  });

  async function init() {
    if (!await requireAdmin()) return;
    await waitForRuntime();
    renderCatalog();
    setPreviewTab(activePreview);
    await loadSaved();
  }

  init().catch((error)=>{
    console.error(error);
    setStatus(error.message||'Unable to load Design Studio.','error');
  });
})();

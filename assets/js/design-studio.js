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
  const publicPreview = document.getElementById('public-design-preview');
  const adminPreview = document.getElementById('admin-design-preview');
  const loginPreview = document.getElementById('login-design-preview');
  const signupPreview = document.getElementById('signup-design-preview');
  const publicLabel = document.getElementById('public-preview-label');
  const adminLabel = document.getElementById('admin-preview-label');
  const loginLabel = document.getElementById('login-preview-label');
  const signupLabel = document.getElementById('signup-preview-label');

  const COPY = {
    'national-authority': { number:'01', headline:'National Authority', summary:'Formal national-agency hierarchy. Strong masthead, restrained geometry, prominent public notices and official information first.' },
    'executive-civic': { number:'02', headline:'Executive Civic', summary:'Executive-office character. Premium spacing, decisive typography, controlled elevation and high-trust operational surfaces.' },
    'public-service': { number:'03', headline:'Public Service', summary:'Resident-first government portal. Services and quick actions rise to the top, with transaction guidance and utility-forward presentation.' },
    'institutional': { number:'04', headline:'Institutional', summary:'Serious and information-dense. Minimal decoration, strong document hierarchy and a formal transparency-oriented presentation.' },
    'modern-lgu': { number:'05', headline:'Modern LGU', summary:'Flagship local-government experience. Premium civic branding, polished cards, confident whitespace and strong mobile presentation.' }
  };

  let theme = null;
  let catalog = null;
  let selected = 'modern-lgu';
  let saved = null;
  let dirty = false;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const setStatus = (message, error=false) => {
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('text-danger', error);
  };

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
    if (profileError || profile?.role!=='admin' || profile?.is_active!==true) { await client.auth.signOut(); location.href='login.html'; return false; }
    return true;
  }

  function renderCatalog() {
    if (!grid) return;
    grid.innerHTML = Object.entries(catalog).map(([id,meta]) => {
      const copy = COPY[id];
      const c = meta.colors;
      return `<button class="gov-pack" type="button" data-gov-pack="${id}" aria-pressed="false">
        <span class="gov-pack-top"><span class="gov-pack-number">${copy.number}</span><span class="gov-pack-tag">${meta.tag}</span></span>
        <span class="gov-pack-visual" style="--g1:${c.primary};--g2:${c.secondary};--ga:${c.accent}"><i class="gov-mini-nav"></i><i class="gov-mini-hero"></i><span class="gov-mini-row"><b></b><b></b><b></b></span></span>
        <span class="gov-pack-copy"><strong>${copy.headline}</strong><small>${copy.summary}</small></span>
        <span class="gov-pack-colors"><i style="background:${c.primary}"></i><i style="background:${c.secondary}"></i><i style="background:${c.accent}"></i><i style="background:${c.signal}"></i></span>
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
  }

  function refreshPreview() {
    document.querySelectorAll('[data-gov-pack]').forEach((button)=>{
      const active=button.dataset.govPack===selected;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
    [publicPreview,adminPreview,loginPreview,signupPreview].forEach((node)=>previewSurface(node,selected));
    const name = catalog[selected]?.name || 'Modern LGU';
    if (publicLabel) publicLabel.textContent = `${name} · Public website`;
    if (adminLabel) adminLabel.textContent = `${name} · System + Content Admin`;
    if (loginLabel) loginLabel.textContent = `${name} · Access portal`;
    if (signupLabel) signupLabel.textContent = `${name} · Content Admin signup`;
  }

  function syncDirty(message='') {
    dirty = selected !== saved;
    if (changeState) changeState.textContent = dirty ? 'Theme ready to publish' : 'Published theme is active';
    saveBar?.classList.toggle('is-clean', !dirty);
    if (saveButton) saveButton.disabled = !dirty;
    if (message) setStatus(message);
  }

  function selectTheme(id) {
    if (!catalog[id]) return;
    selected=id;
    refreshPreview();
    syncDirty(`${catalog[id].name} selected. All four surfaces will switch together when published.`);
  }

  async function loadSaved() {
    setStatus('Loading published government design…');
    const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
    if (error) throw error;
    const raw=clone(data?.design_theme||{});
    selected=window.BRGY_GOV_THEME_RUNTIME.normalize(raw.experience, raw.pack);
    saved=selected;
    refreshPreview();
    syncDirty();
    setStatus(`${catalog[selected].name} is currently published across public, dashboard and access pages.`);
  }

  async function publish() {
    if (!dirty) return;
    const payload=compose(selected);
    saveButton.disabled=true;
    resetButton.disabled=true;
    setStatus(`Publishing ${catalog[selected].name} across all website surfaces…`);
    try {
      const {data,error}=await client.from('site_settings').update({
        design_theme:payload,
        primary_color:payload.public.colors.primary,
        secondary_color:payload.public.colors.secondary,
        accent_color:payload.public.colors.accent,
        updated_at:new Date().toISOString()
      }).eq('id',1).select('design_theme').single();
      if (error) throw error;
      const verified=data?.design_theme||{};
      if (verified.experience!==selected) throw new Error('Theme verification failed.');
      saved=selected;
      dirty=false;
      theme.writeCache(verified);
      theme.applyAdmin(verified.admin);
      window.BRGY_GOV_THEME_RUNTIME.apply(selected, verified);
      refreshPreview();
      syncDirty();
      setStatus(`${catalog[selected].name} published and verified. Public website, dashboards, login, signup and activation now use one design system.`);
    } catch (error) {
      console.error(error);
      setStatus(error.message||'Unable to publish the government design.',true);
      saveButton.disabled=false;
    } finally {
      resetButton.disabled=false;
    }
  }

  resetButton?.addEventListener('click',()=>{
    if (!saved) return;
    selected=saved;
    refreshPreview();
    syncDirty('Restored the currently published theme in preview.');
  });
  form?.addEventListener('submit',(event)=>{event.preventDefault();publish();});

  async function init() {
    if (!await requireAdmin()) return;
    await waitForRuntime();
    renderCatalog();
    await loadSaved();
  }

  init().catch((error)=>{console.error(error);setStatus(error.message||'Unable to load Design Studio.',true);});
})();

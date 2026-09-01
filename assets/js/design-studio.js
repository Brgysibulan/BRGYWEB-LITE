(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('design-studio-form');
  const paletteGrid = document.getElementById('design-pack-grid');
  const layoutGrid = document.getElementById('web-layout-grid');
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

  const PALETTE_COPY = {
    'national-authority': { short:'Navy + restrained gold' },
    'executive-civic': { short:'Executive green + brass' },
    'public-service': { short:'Civic blue + service teal' },
    'institutional': { short:'Slate + institutional gold' },
    'modern-lgu': { short:'Emerald + flagship gold' }
  };

  const WEB_LAYOUTS = Object.freeze({
    'two-column': { number:'01', name:'Two-column', tag:'Columns', description:'Primary content with a supporting side column.' },
    'split-screen': { number:'02', name:'Split Screen', tag:'Split', description:'Two strong panels share the first view.' },
    'asymmetrical': { number:'03', name:'Asymmetrical', tag:'Dynamic', description:'Uneven content blocks create controlled emphasis.' },
    'f-shape': { number:'04', name:'F-shape', tag:'Scan', description:'Information follows a familiar left-led reading pattern.' },
    'z-shape': { number:'05', name:'Z-shape', tag:'Flow', description:'Alternating emphasis guides the eye across the page.' },
    'card-block': { number:'06', name:'Card / Block', tag:'Modular', description:'Services and information are grouped into clear blocks.' },
    'featured-media': { number:'07', name:'Featured Media', tag:'Feature', description:'A large hero or civic feature leads the page.' },
    'masonry': { number:'08', name:'Masonry', tag:'Grid', description:'Mixed-height information blocks form a flexible grid.' },
    'magazine': { number:'09', name:'Magazine', tag:'Editorial', description:'Lead stories and supporting information use editorial hierarchy.' },
    'fixed-navigation': { number:'10', name:'Fixed Navigation', tag:'Persistent', description:'Navigation stays available while residents scroll.' },
    'hidden-navigation': { number:'11', name:'Hidden Navigation', tag:'Minimal', description:'A cleaner canvas keeps navigation visually compact.' },
    'interactive': { number:'12', name:'Interactive', tag:'Explore', description:'Featured content uses controls and progressive disclosure.' }
  });

  const DEFAULT_LAYOUT = 'card-block';
  let theme = null;
  let catalog = null;
  let selectedPalette = 'modern-lgu';
  let selectedLayout = DEFAULT_LAYOUT;
  let savedPalette = null;
  let savedLayout = DEFAULT_LAYOUT;
  let dirty = false;
  let loadingSaved = false;
  let activePreview = 'public';

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const validLayout = (id) => WEB_LAYOUTS[id] ? id : DEFAULT_LAYOUT;

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
    return { r:parseInt(value.slice(0,2),16), g:parseInt(value.slice(2,4),16), b:parseInt(value.slice(4,6),16) };
  }

  function luminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const channels = [rgb.r,rgb.g,rgb.b].map((value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
  }

  function contrast(a,b) {
    const l1=luminance(a), l2=luminance(b);
    return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
  }

  function validatePalette(colors={}) {
    const required=['primary','secondary','accent','signal'];
    if(required.some((key)=>!/^#[0-9a-f]{6}$/i.test(String(colors[key]||'')))) return {ok:false,message:'Palette contains an invalid color value.'};
    const values=required.map((key)=>colors[key].toLowerCase());
    if(new Set(values).size!==values.length) return {ok:false,message:'Palette roles must use distinct colors.'};
    if(contrast(colors.primary,'#ffffff')<4.5) return {ok:false,message:'Primary color does not have enough contrast for official headers.'};
    if(contrast(colors.secondary,'#ffffff')<3.6) return {ok:false,message:'Secondary color is too light for action controls.'};
    if(contrast(colors.accent,colors.primary)<2.2) return {ok:false,message:'Accent is too close to the primary color.'};
    return {ok:true,message:'Palette roles pass the Design Studio guardrails.'};
  }

  async function waitForRuntime() {
    const started=Date.now();
    while((!window.BRGY_THEME||!window.BRGY_GOV_THEMES||!window.BRGY_GOV_THEME_RUNTIME)&&Date.now()-started<5000){
      await new Promise((resolve)=>setTimeout(resolve,40));
    }
    theme=window.BRGY_THEME;
    catalog=window.BRGY_GOV_THEMES;
    if(!theme||!catalog) throw new Error('Government design system failed to load.');
  }

  async function requireAdmin() {
    if(!client){location.href='login.html';return false;}
    const {data,error}=await client.auth.getUser();
    if(error||!data?.user){location.href='login.html';return false;}
    const {data:profile,error:profileError}=await client.from('profiles').select('role,is_active').eq('user_id',data.user.id).maybeSingle();
    if(profileError||profile?.role!=='admin'||profile?.is_active!==true){
      await client.auth.signOut();
      location.href='login.html';
      return false;
    }
    return true;
  }

  function renderLayouts() {
    if(!layoutGrid) return;
    layoutGrid.innerHTML=Object.entries(WEB_LAYOUTS).map(([id,meta])=>`
      <button class="web-layout-card" type="button" data-web-layout="${id}" aria-pressed="false">
        <span class="web-layout-mini" data-layout-mini="${id}" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i><i></i>
        </span>
        <span class="web-layout-copy">
          <span><b>${meta.number}</b><em>${meta.tag}</em></span>
          <strong>${meta.name}</strong>
          <small>${meta.description}</small>
        </span>
      </button>`).join('');
    layoutGrid.addEventListener('click',(event)=>{
      const button=event.target.closest('[data-web-layout]');
      if(button) selectLayout(button.dataset.webLayout);
    });
  }

  function renderPalettes() {
    if(!paletteGrid) return;
    paletteGrid.innerHTML=Object.entries(catalog).map(([id,meta])=>{
      const c=meta.colors;
      return `<button class="palette-choice" type="button" data-gov-pack="${id}" aria-pressed="false">
        <span class="palette-swatches" aria-hidden="true">
          <i style="background:${c.primary}"></i><i style="background:${c.secondary}"></i><i style="background:${c.accent}"></i><i style="background:${c.signal}"></i>
        </span>
        <span><strong>${meta.name}</strong><small>${PALETTE_COPY[id]?.short||'Government palette'}</small></span>
      </button>`;
    }).join('');
    paletteGrid.addEventListener('click',(event)=>{
      const button=event.target.closest('[data-gov-pack]');
      if(button) selectPalette(button.dataset.govPack);
    });
  }

  function compose(paletteId,layoutId) {
    const meta=catalog[paletteId]||catalog['modern-lgu'];
    const composed=theme.composePack(meta.basePack,'custom',meta.colors);
    const normalized=theme.normalizeConfig({
      version:theme.THEME_SCHEMA_VERSION,
      pack:meta.basePack,
      palette:'custom',
      public:composed.public,
      admin:composed.admin
    });
    normalized.experience=paletteId;
    normalized.webLayout=validLayout(layoutId);
    normalized.public.colors=theme.normalizeColors(meta.colors);
    normalized.admin.colors=theme.normalizeAdminColors(meta.colors);
    return normalized;
  }

  function previewSurface(node,paletteId) {
    if(!node) return;
    const meta=catalog[paletteId];
    node.dataset.govPreview=paletteId;
    node.style.setProperty('--p1',meta.colors.primary);
    node.style.setProperty('--p2',meta.colors.secondary);
    node.style.setProperty('--pa',meta.colors.accent);
    node.style.setProperty('--ps',meta.colors.signal);
  }

  function setPreviewTab(name) {
    activePreview=name;
    document.querySelectorAll('[data-preview-target]').forEach((button)=>{
      const active=button.dataset.previewTarget===name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',active?'true':'false');
    });
    document.querySelectorAll('[data-preview-panel]').forEach((panel)=>{
      const active=panel.dataset.previewPanel===name;
      panel.classList.toggle('active',active);
      panel.hidden=!active;
    });
  }

  function refreshPreview() {
    document.querySelectorAll('[data-gov-pack]').forEach((button)=>{
      const active=button.dataset.govPack===selectedPalette;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
    document.querySelectorAll('[data-web-layout]').forEach((button)=>{
      const active=button.dataset.webLayout===selectedLayout;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });

    [publicPreview,adminPreview,loginPreview,signupPreview].forEach((node)=>previewSurface(node,selectedPalette));
    if(publicPreview) publicPreview.dataset.webLayoutPreview=selectedLayout;

    const paletteMeta=catalog[selectedPalette];
    const layoutMeta=WEB_LAYOUTS[selectedLayout];
    const paletteName=paletteMeta?.name||'Modern LGU';
    const layoutName=layoutMeta?.name||'Card / Block';
    if(previewThemeName) previewThemeName.textContent=`${layoutName} · ${paletteName}`;
    if(publicLabel) publicLabel.textContent=`${layoutName} · ${paletteName}`;
    if(adminLabel) adminLabel.textContent=`${paletteName} · System + Content Admin`;
    if(loginLabel) loginLabel.textContent=`${paletteName} · Access portal`;
    if(signupLabel) signupLabel.textContent=`${paletteName} · Content Admin signup`;

    const health=validatePalette(paletteMeta?.colors||{});
    if(paletteHealth){
      paletteHealth.textContent=health.ok?'Palette verified':'Palette needs review';
      paletteHealth.dataset.state=health.ok?'ok':'error';
      paletteHealth.title=health.message;
    }
    return health;
  }

  function syncDirty(message='',kind='normal') {
    dirty=selectedPalette!==savedPalette||selectedLayout!==savedLayout;
    const health=validatePalette(catalog?.[selectedPalette]?.colors||{});
    if(changeState) changeState.textContent=dirty?'Design ready to publish':'Published design is active';
    saveBar?.classList.toggle('is-clean',!dirty);
    if(saveButton) saveButton.disabled=!dirty||!health.ok;
    if(message) setStatus(message,health.ok?kind:'error');
    else if(!health.ok) setStatus(health.message,'error');
  }

  function selectPalette(id) {
    if(!catalog[id]) return;
    selectedPalette=id;
    refreshPreview();
    syncDirty(`${catalog[id].name} palette selected.`);
  }

  function selectLayout(id) {
    if(!WEB_LAYOUTS[id]) return;
    selectedLayout=id;
    refreshPreview();
    syncDirty(`${WEB_LAYOUTS[id].name} layout selected. Review the preview, then publish.`);
  }

  function sameColors(actual={},expected={}) {
    return ['primary','secondary','accent','signal'].every((key)=>String(actual?.[key]||'').toLowerCase()===String(expected?.[key]||'').toLowerCase());
  }

  function verifyPayload(actual,expected,expectedPalette,expectedLayout) {
    const actualPalette=window.BRGY_GOV_THEME_RUNTIME.normalize(actual?.experience,actual?.pack);
    if(actualPalette!==expectedPalette) throw new Error(`Palette verification failed: expected ${expectedPalette}, received ${actualPalette}.`);
    if(validLayout(actual?.webLayout)!==expectedLayout) throw new Error(`Layout verification failed: expected ${expectedLayout}.`);
    if(actual?.pack!==expected.pack) throw new Error('Design verification failed: base design package did not match.');
    if(!sameColors(actual?.public?.colors,expected.public.colors)) throw new Error('Design verification failed: public colors did not match.');
    if(!sameColors(actual?.admin?.colors,expected.admin.colors)) throw new Error('Design verification failed: admin colors did not match.');
  }

  async function readSavedRecord() {
    const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
    if(error) throw error;
    return clone(data?.design_theme||{});
  }

  async function loadSaved(message='') {
    if(loadingSaved) return;
    loadingSaved=true;
    try{
      if(!message) setStatus('Loading published design…');
      const raw=await readSavedRecord();
      const livePalette=window.BRGY_GOV_THEME_RUNTIME.normalize(raw.experience,raw.pack);
      const liveLayout=validLayout(raw.webLayout);
      if(!catalog[livePalette]) throw new Error('Published palette is not available in Design Studio.');
      savedPalette=livePalette;
      savedLayout=liveLayout;
      if(!dirty){
        selectedPalette=livePalette;
        selectedLayout=liveLayout;
      }
      window.BRGY_GOV_THEME_RUNTIME.apply(livePalette,raw);
      theme.writeCache(theme.normalizeConfig(raw));
      theme.applyAdmin(raw.admin||{});
      refreshPreview();
      syncDirty();
      setStatus(message||`${WEB_LAYOUTS[liveLayout].name} with ${catalog[livePalette].name} is the published design.`,'success');
    }finally{
      loadingSaved=false;
    }
  }

  async function publish() {
    if(!dirty) return;
    const expectedPalette=selectedPalette;
    const expectedLayout=selectedLayout;
    const health=validatePalette(catalog[expectedPalette]?.colors||{});
    if(!health.ok){setStatus(health.message,'error');return;}

    const payload=compose(expectedPalette,expectedLayout);
    saveButton.disabled=true;
    resetButton.disabled=true;
    setStatus(`Publishing ${WEB_LAYOUTS[expectedLayout].name} layout…`);
    try{
      const {data,error}=await client.from('site_settings').update({
        design_theme:payload,
        primary_color:payload.public.colors.primary,
        secondary_color:payload.public.colors.secondary,
        accent_color:payload.public.colors.accent,
        updated_at:new Date().toISOString()
      }).eq('id',1).select('design_theme').single();
      if(error) throw error;
      verifyPayload(data?.design_theme||{},payload,expectedPalette,expectedLayout);

      const reread=await readSavedRecord();
      verifyPayload(reread,payload,expectedPalette,expectedLayout);
      savedPalette=expectedPalette;
      savedLayout=expectedLayout;
      selectedPalette=expectedPalette;
      selectedLayout=expectedLayout;
      dirty=false;
      theme.writeCache(theme.normalizeConfig(reread));
      theme.applyAdmin(reread.admin||{});
      window.BRGY_GOV_THEME_RUNTIME.apply(expectedPalette,reread);
      refreshPreview();
      syncDirty();
      setStatus(`${WEB_LAYOUTS[expectedLayout].name} + ${catalog[expectedPalette].name} published and re-verified.`,'success');
    }catch(error){
      console.error(error);
      setStatus(error.message||'Unable to publish the design.','error');
      saveButton.disabled=false;
    }finally{
      resetButton.disabled=false;
    }
  }

  document.querySelector('.gov-preview-tabs')?.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-preview-target]');
    if(button) setPreviewTab(button.dataset.previewTarget);
  });

  resetButton?.addEventListener('click',async()=>{
    if(!savedPalette) return;
    dirty=false;
    selectedPalette=savedPalette;
    selectedLayout=savedLayout;
    refreshPreview();
    syncDirty('Restored the published design in preview.');
    try{await loadSaved('Published design rechecked from Supabase.');}
    catch(error){console.error(error);setStatus('Unable to recheck the published design.','error');}
  });

  form?.addEventListener('submit',(event)=>{event.preventDefault();publish();});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&!dirty) loadSaved().catch((error)=>console.warn('Design status refresh failed:',error));
  });

  async function init() {
    if(!await requireAdmin()) return;
    await waitForRuntime();
    renderLayouts();
    renderPalettes();
    setPreviewTab(activePreview);
    await loadSaved();
  }

  init().catch((error)=>{
    console.error(error);
    setStatus(error.message||'Unable to load Design Studio.','error');
  });
})();

(() => {
  'use strict';

  const client=window.BRGY_SUPABASE;
  const theme=window.BRGY_THEME;
  const form=document.getElementById('design-studio-form');
  const packGrid=document.getElementById('design-pack-grid');
  const paletteGrid=document.getElementById('palette-grid');
  const packCount=document.getElementById('design-pack-count');
  const paletteCount=document.getElementById('palette-count');
  const saveButton=document.getElementById('design-save');
  const resetButton=document.getElementById('design-reset');
  const saveBar=document.getElementById('design-savebar');
  const changeState=document.getElementById('design-change-state');
  const status=document.getElementById('design-studio-status');
  const publicPreview=document.getElementById('public-design-preview');
  const adminPreview=document.getElementById('admin-design-preview');
  const publicPreviewLabel=document.getElementById('public-preview-label');
  const adminPreviewLabel=document.getElementById('admin-preview-label');
  const customState=document.getElementById('custom-palette-state');
  const SITE_CACHE_KEY='brgyweb:site-settings:v3';
  const colorKeys=['primary','secondary','accent','signal'];

  let selectedPack='';
  let selectedPalette='custom';
  let publicTheme=null;
  let adminTheme=null;
  let savedConfig=null;
  let dirty=false;

  const field=(id)=>document.getElementById(id);
  const clone=(value)=>JSON.parse(JSON.stringify(value));

  function setStatus(message,error=false){
    if(!status)return;
    status.textContent=message||'';
    status.style.color=error?'#ffb9b9':'';
  }

  async function requireAdmin(){
    if(!client){location.href='login.html';return false;}
    const {data,error}=await client.auth.getUser();
    if(error||!data?.user){location.href='login.html';return false;}
    const {data:profile,error:profileError}=await client.from('profiles').select('role,is_active').eq('user_id',data.user.id).maybeSingle();
    if(profileError||profile?.role!=='admin'||profile?.is_active!==true){await client.auth.signOut();location.href='login.html';return false;}
    return true;
  }

  function validateCatalog(){
    if(!theme||!theme.DESIGN_PACKS||!theme.PALETTES)throw new Error('Design catalog failed to load.');
    const packs=Object.entries(theme.DESIGN_PACKS),palettes=Object.entries(theme.PALETTES);
    if(packs.length!==20)throw new Error(`Design catalog expected 20 designs but found ${packs.length}.`);
    if(palettes.length<8)throw new Error('Color palette catalog is incomplete.');
    packs.forEach(([id,pack])=>{
      if(!pack?.name||!pack?.public||!pack?.admin)throw new Error(`Design ${id} is incomplete.`);
      const p=theme.normalizePublic({...pack.public,preset:id}),a=theme.normalizeAdmin({...pack.admin,preset:id});
      if(p.navMode!=='links')throw new Error(`Design ${id} uses an unsupported navigation mode.`);
      if(!['top','floating'].includes(p.navPosition))throw new Error(`Design ${id} uses an unsafe public navigation position.`);
      if(!a.sidebarWidth||!a.topbar||!a.buttons||!a.tables)throw new Error(`Admin design ${id} is incomplete.`);
    });
    if(packCount)packCount.textContent=`${packs.length} designs`;
    if(paletteCount)paletteCount.textContent=`${palettes.length} palettes`;
  }

  function renderCatalog(){
    packGrid.innerHTML=Object.entries(theme.DESIGN_PACKS).map(([id,pack])=>`
      <button class="pro-pack" type="button" data-pack="${id}" data-nav="${pack.public.navPosition}" data-hero="${pack.public.hero}" aria-pressed="false">
        <span class="pro-pack-thumb"><span class="pro-pack-thumb-nav"></span><span class="pro-pack-thumb-hero"></span><span class="pro-pack-thumb-cards"><i></i><i></i><i></i></span></span>
        <span class="pro-pack-copy"><span class="pro-pack-title"><strong>${pack.name}</strong><em>${pack.tag||'Pro'}</em></span><small>${pack.description||''}</small></span>
      </button>`).join('');

    paletteGrid.innerHTML=Object.entries(theme.PALETTES).map(([id,palette])=>{
      const c=palette.colors;
      return `<button class="pro-palette" type="button" data-palette="${id}" aria-pressed="false"><span class="pro-swatches"><i style="background:${c.primary}"></i><i style="background:${c.secondary}"></i><i style="background:${c.accent}"></i><i style="background:${c.signal}"></i></span><strong>${palette.name}</strong></button>`;
    }).join('');

    packGrid.addEventListener('click',(event)=>{const button=event.target.closest('[data-pack]');if(button)selectPack(button.dataset.pack);});
    paletteGrid.addEventListener('click',(event)=>{const button=event.target.closest('[data-palette]');if(button)selectPalette(button.dataset.palette);});
  }

  function customColors(){
    return theme.normalizeColors({primary:field('custom-primary')?.value,secondary:field('custom-secondary')?.value,accent:field('custom-accent')?.value,signal:field('custom-signal')?.value});
  }

  function writeCustomColors(colors){
    const c=theme.normalizeColors(colors||{});
    colorKeys.forEach((key)=>{
      const input=field(`custom-${key}`),code=field(`custom-${key}-code`);
      if(input)input.value=c[key];
      if(code)code.textContent=c[key];
    });
  }

  function activeColors(){
    if(selectedPalette==='custom')return customColors();
    return theme.normalizeColors(theme.PALETTES[selectedPalette]?.colors||theme.COLOR_DEFAULTS);
  }

  function withColors(publicInput,adminInput,colors){
    return {
      public:theme.normalizePublic({...publicInput,colors}),
      admin:theme.normalizeAdmin({...adminInput,colors:theme.normalizeAdminColors(colors)})
    };
  }

  function selectPack(id){
    if(!theme.DESIGN_PACKS[id])return;
    selectedPack=id;
    const composed=theme.composePack(id,selectedPalette,selectedPalette==='custom'?customColors():null);
    publicTheme=composed.public;
    adminTheme=composed.admin;
    refreshUi();
    syncDirty(`Loaded ${theme.DESIGN_PACKS[id].name}. Preview updated for public and admin.`);
  }

  function selectPalette(id){
    if(!theme.PALETTES[id])return;
    selectedPalette=id;
    const colors=theme.normalizeColors(theme.PALETTES[id].colors);
    writeCustomColors(colors);
    const updated=withColors(publicTheme||theme.PUBLIC_DEFAULT,adminTheme||theme.ADMIN_DEFAULT,colors);
    publicTheme=updated.public;adminTheme=updated.admin;
    refreshUi();
    syncDirty(`${theme.PALETTES[id].name} palette applied to both previews.`);
  }

  function selectCustomPalette(message='Custom palette selected.'){
    selectedPalette='custom';
    const colors=customColors();
    const updated=withColors(publicTheme||theme.PUBLIC_DEFAULT,adminTheme||theme.ADMIN_DEFAULT,colors);
    publicTheme=updated.public;adminTheme=updated.admin;
    refreshUi();
    syncDirty(message);
  }

  function syncSelections(){
    document.querySelectorAll('[data-pack]').forEach((button)=>{const active=button.dataset.pack===selectedPack;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active?'true':'false');});
    document.querySelectorAll('[data-palette]').forEach((button)=>{const active=button.dataset.palette===selectedPalette;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active?'true':'false');});
    if(customState)customState.textContent=selectedPalette==='custom'?'Selected':'Not selected';
  }

  function syncPackThumbColors(){
    const c=activeColors();
    document.querySelectorAll('.pro-pack').forEach((button)=>{button.style.setProperty('--thumb-primary',c.primary);button.style.setProperty('--thumb-secondary',c.secondary);button.style.setProperty('--thumb-accent',c.accent);});
  }

  function radiusValue(kind){return {square:'3px',soft:'8px',rounded:'13px',pill:'20px'}[kind]||'13px';}
  function fontValue(kind){return kind==='serif'?'Georgia, serif':kind==='rounded'?'Trebuchet MS, sans-serif':'Inter, system-ui, sans-serif';}

  function renderPublicPreview(config){
    if(!publicPreview||!config)return;
    const c=config.colors;
    publicPreview.dataset.navPosition=config.navPosition;
    publicPreview.dataset.navSkin=config.navSkin;
    publicPreview.dataset.hero=config.hero;
    publicPreview.dataset.radius=config.radius;
    publicPreview.dataset.cards=config.cards;
    publicPreview.style.fontFamily=fontValue(config.font);
    publicPreview.style.setProperty('--p1',c.primary);publicPreview.style.setProperty('--p2',c.secondary);publicPreview.style.setProperty('--pa',c.accent);
    const shell=publicPreview.querySelector('.pro-public-shell');
    if(shell){shell.style.maxWidth=config.contentWidth==='boxed'?'88%':'100%';shell.style.margin=config.contentWidth==='boxed'?'0 auto':'0';}
    const cards=[...publicPreview.querySelectorAll('.pro-public-cards i')];
    cards.forEach((card)=>{card.style.borderRadius=radiusValue(config.radius);});
  }

  function renderAdminPreview(config){
    if(!adminPreview||!config)return;
    const c=config.colors;
    adminPreview.dataset.sidebar=config.sidebar;adminPreview.dataset.topbar=config.topbar;adminPreview.dataset.cards=config.cards;
    adminPreview.style.fontFamily=fontValue(config.font);
    adminPreview.style.setProperty('--a1',c.primary);adminPreview.style.setProperty('--a2',c.secondary);adminPreview.style.setProperty('--aa',c.accent);
    adminPreview.style.gridTemplateColumns=config.sidebarWidth==='compact'?'78px 1fr':config.sidebarWidth==='wide'?'112px 1fr':'94px 1fr';
    const radius=radiusValue(config.radius);
    adminPreview.querySelectorAll('.pro-admin-top,.pro-admin-metrics i,.pro-admin-panel').forEach((node)=>{node.style.borderRadius=radius;});
  }

  function refreshUi(){
    syncSelections();syncPackThumbColors();renderPublicPreview(publicTheme);renderAdminPreview(adminTheme);
    const pack=theme.DESIGN_PACKS[selectedPack];
    const palette=selectedPalette==='custom'?'Custom colors':theme.PALETTES[selectedPalette]?.name;
    if(publicPreviewLabel)publicPreviewLabel.textContent=pack?`${pack.name} · ${palette}`:'Current saved custom design';
    if(adminPreviewLabel)adminPreviewLabel.textContent=pack?`${pack.name} · ${palette}`:'System Admin + Content Admin';
  }

  function canonicalConfig(config){
    const normalized=theme.normalizeConfig(config||{});
    return JSON.stringify({pack:normalized.pack,palette:normalized.palette,public:normalized.public,admin:normalized.admin});
  }

  function buildConfig(){
    return theme.normalizeConfig({version:theme.THEME_SCHEMA_VERSION,pack:selectedPack,palette:selectedPalette,public:publicTheme||theme.PUBLIC_DEFAULT,admin:adminTheme||theme.ADMIN_DEFAULT});
  }

  function syncDirty(message=''){
    const current=buildConfig();
    dirty=savedConfig?canonicalConfig(current)!==canonicalConfig(savedConfig):true;
    if(changeState)changeState.textContent=dirty?'Unsaved design changes':'No unsaved changes';
    saveBar?.classList.toggle('is-clean',!dirty);
    if(saveButton)saveButton.disabled=!dirty||!selectedPack;
    if(message)setStatus(!selectedPack&&dirty?`${message} Choose one of the 20 designs before publishing.`:message);
  }

  function applyConfigState(config){
    const normalized=theme.normalizeConfig(config||{});
    selectedPack=normalized.pack||theme.matchPack(normalized.public,normalized.admin);
    selectedPalette=normalized.palette||theme.matchPalette(normalized.public.colors);
    publicTheme=theme.normalizePublic(normalized.public);
    adminTheme=theme.normalizeAdmin(normalized.admin);
    if(selectedPalette==='custom')writeCustomColors(publicTheme.colors);
    else if(theme.PALETTES[selectedPalette])writeCustomColors(theme.PALETTES[selectedPalette].colors);
    refreshUi();
  }

  function syncSiteCache(payload){
    try{
      const raw=localStorage.getItem(SITE_CACHE_KEY);if(!raw)return;
      const parsed=JSON.parse(raw);if(parsed?.version!==3||!parsed?.data)return;
      parsed.savedAt=Date.now();parsed.data.designTheme=payload;
      parsed.data.theme={...(parsed.data.theme||{}),primary:payload.public.colors.primary,secondary:payload.public.colors.secondary,accent:payload.public.colors.accent,signal:payload.public.colors.signal,surface:payload.public.colors.surface};
      localStorage.setItem(SITE_CACHE_KEY,JSON.stringify(parsed));
    }catch{}
  }

  function sameColors(a,b){return colorKeys.every((key)=>a?.[key]===b?.[key]);}
  function samePublic(a,b){return ['font','radius','density','navSkin','navPosition','navAlign','navMode','hero','cards','contentWidth'].every((key)=>a?.[key]===b?.[key])&&sameColors(a?.colors,b?.colors);}
  function sameAdmin(a,b){return ['font','radius','density','sidebar','sidebarWidth','topbar','contentWidth','buttons','tables','cards'].every((key)=>a?.[key]===b?.[key])&&sameColors(a?.colors,b?.colors);}

  async function loadSaved(){
    setStatus('Loading saved design…');
    const {data,error}=await client.from('site_settings').select('design_theme,primary_color,secondary_color,accent_color').eq('id',1).single();
    if(error)throw error;
    const raw=clone(data?.design_theme||{});
    if(!raw.public){
      raw.public={...theme.PUBLIC_DEFAULT,colors:{primary:data?.primary_color||theme.COLOR_DEFAULTS.primary,secondary:data?.secondary_color||theme.COLOR_DEFAULTS.secondary,accent:data?.accent_color||theme.COLOR_DEFAULTS.accent,signal:theme.COLOR_DEFAULTS.signal}};
    }
    if(!raw.admin)raw.admin=theme.ADMIN_DEFAULT;
    const normalized=theme.normalizeConfig(raw);
    if(!normalized.pack)normalized.pack=theme.matchPack(normalized.public,normalized.admin);
    if(!normalized.palette)normalized.palette=theme.matchPalette(normalized.public.colors);
    savedConfig=normalized;
    applyConfigState(normalized);
    dirty=false;
    if(changeState)changeState.textContent='No unsaved changes';
    saveBar?.classList.add('is-clean');
    if(saveButton)saveButton.disabled=true;
    setStatus(selectedPack?'Saved design loaded. Choose another design or palette to preview it.':'Legacy custom design loaded. Choose one of the 20 designs to move to the new safe Design Studio.');
  }

  async function publish(){
    if(!dirty)return;
    if(!selectedPack){setStatus('Choose one of the 20 premade designs before publishing.',true);return;}
    const payload=buildConfig();
    saveButton.disabled=true;resetButton.disabled=true;setStatus('Publishing and verifying both public and admin design…');
    try{
      const {data,error}=await client.from('site_settings').update({design_theme:payload,primary_color:payload.public.colors.primary,secondary_color:payload.public.colors.secondary,accent_color:payload.public.colors.accent,updated_at:new Date().toISOString()}).eq('id',1).select('design_theme').single();
      if(error)throw error;
      const verified=theme.normalizeConfig(data?.design_theme||{});
      if(verified.pack!==payload.pack||verified.palette!==payload.palette||!samePublic(verified.public,payload.public)||!sameAdmin(verified.admin,payload.admin))throw new Error('Saved design verification failed. Nothing was accepted as complete.');
      savedConfig=verified;
      theme.writeCache(verified);syncSiteCache(verified);theme.applyAdmin(verified.admin);applyConfigState(verified);
      dirty=false;if(changeState)changeState.textContent='No unsaved changes';saveBar?.classList.add('is-clean');saveButton.disabled=true;
      setStatus('Published and verified. Public Website, System Admin and Content Admin now use the same selected design package and palette.');
    }catch(error){console.error(error);setStatus(error.message||'Unable to publish design.',true);saveButton.disabled=false;}
    finally{resetButton.disabled=false;}
  }

  colorKeys.forEach((key)=>{
    field(`custom-${key}`)?.addEventListener('input',()=>{
      const code=field(`custom-${key}-code`);if(code)code.textContent=field(`custom-${key}`).value;
      selectCustomPalette('Custom palette updated in both previews.');
    });
  });

  form?.addEventListener('submit',(event)=>{event.preventDefault();publish();});
  resetButton?.addEventListener('click',()=>{if(!savedConfig)return;applyConfigState(savedConfig);dirty=false;if(changeState)changeState.textContent='No unsaved changes';saveBar?.classList.add('is-clean');saveButton.disabled=true;setStatus('Restored the last published design.');});

  async function init(){
    try{
      validateCatalog();renderCatalog();writeCustomColors(theme.COLOR_DEFAULTS);refreshUi();
      const allowed=await requireAdmin();if(!allowed)return;
      await loadSaved();
    }catch(error){console.error(error);setStatus(error.message||'Design Studio could not start.',true);if(saveButton)saveButton.disabled=true;}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

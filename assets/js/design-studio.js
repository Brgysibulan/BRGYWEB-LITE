(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const theme = window.BRGY_THEME;
  const form = document.getElementById('design-studio-form');
  const status = document.getElementById('design-studio-status');
  const changeState = document.getElementById('design-change-state');
  const saveButton = document.getElementById('design-save');
  const resetButton = document.getElementById('design-reset');
  const field = (id) => document.getElementById(id);
  const value = (id) => field(id)?.value || '';
  const setValue = (id,val) => { const el = field(id); if (el) el.value = val; };

  let activeScope = 'public';
  let dirty = false;

  function setStatus(message,error=false){
    if(!status)return;
    status.textContent=message;
    status.classList.toggle('text-danger',error);
    status.classList.toggle('text-success',!error&&Boolean(message));
  }

  function syncDirtyState(isDirty,message=''){
    dirty=Boolean(isDirty);
    if(changeState)changeState.textContent=dirty?'Unsaved design changes':'No unsaved changes';
    if(saveButton)saveButton.disabled=!dirty;
    if(message)setStatus(message);
  }

  async function requireAdmin(){
    if(!client){location.href='login.html';return false;}
    const {data,error}=await client.auth.getUser();
    if(error||!data?.user){location.href='login.html';return false;}
    const {data:profile,error:profileError}=await client.from('profiles').select('role,is_active').eq('user_id',data.user.id).maybeSingle();
    if(profileError||profile?.role!=='admin'||profile?.is_active!==true){await client.auth.signOut();location.href='login.html';return false;}
    return true;
  }

  function readPublic(){
    return theme.normalizePublic({
      preset:value('public-preset')||'custom',font:value('public-font'),radius:value('public-radius'),density:value('public-density'),
      navSkin:value('public-nav-skin'),navPosition:value('public-nav-position'),navAlign:value('public-nav-align'),navMode:value('public-nav-mode'),
      hero:value('public-hero'),cards:value('public-cards'),contentWidth:value('public-content-width')
    });
  }

  function readAdmin(){
    return theme.normalizeAdmin({preset:value('admin-preset')||'custom',font:value('admin-font'),radius:value('admin-radius'),density:value('admin-density'),sidebar:value('admin-sidebar'),cards:value('admin-cards')});
  }

  function writePublic(config){
    const t=theme.normalizePublic(config);
    setValue('public-preset',t.preset);setValue('public-font',t.font);setValue('public-radius',t.radius);setValue('public-density',t.density);
    setValue('public-nav-skin',t.navSkin);setValue('public-nav-position',t.navPosition);setValue('public-nav-align',t.navAlign);setValue('public-nav-mode',t.navMode);
    setValue('public-hero',t.hero);setValue('public-cards',t.cards);setValue('public-content-width',t.contentWidth);
  }

  function writeAdmin(config){
    const t=theme.normalizeAdmin(config);
    setValue('admin-preset',t.preset);setValue('admin-font',t.font);setValue('admin-radius',t.radius);setValue('admin-density',t.density);setValue('admin-sidebar',t.sidebar);setValue('admin-cards',t.cards);
  }

  function radiusValue(kind){return {square:'3px',soft:'8px',rounded:'12px',pill:'22px'}[kind]||'12px';}
  function fontValue(kind){return kind==='serif'?'Georgia, serif':kind==='rounded'?'Trebuchet MS, sans-serif':'Inter, system-ui, sans-serif';}

  function renderPublicPreview(config){
    const preview=field('public-design-preview');if(!preview)return;
    const nav=preview.querySelector('.studio3-web-nav');
    const hero=preview.querySelector('.studio3-web-hero');
    const body=preview.querySelector('.studio3-web-body');
    const cards=[...preview.querySelectorAll('.studio3-web-body>div')];
    preview.dataset.previewPosition=config.navPosition;
    preview.dataset.previewMode=config.navMode;
    preview.dataset.previewAlign=config.navAlign;
    preview.style.fontFamily=fontValue(config.font);

    if(nav){
      nav.style.background=config.navSkin==='solid'?'#0d4d2b':config.navSkin==='glass'?'rgba(13,77,43,.80)':'linear-gradient(90deg,#0d4d2b,#1f8b4b)';
      nav.style.backdropFilter=config.navSkin==='glass'?'blur(14px)':'none';
    }

    if(hero){
      const heroMap={
        minimal:['linear-gradient(180deg,#f3f7f4,#fff)','#17201a'],
        soft:['linear-gradient(135deg,#3b9a64,#0d4d2b)','#fff'],
        split:['linear-gradient(90deg,#0d4d2b 0 58%,#55aa73 58% 100%)','#fff'],
        banner:['linear-gradient(110deg,#173a28,#176f3d)','#fff'],
        clean:['linear-gradient(135deg,#0d4d2b,#176f3d)','#fff'],
        bold:['linear-gradient(135deg,#0a3f23,#178246)','#fff']
      };
      const [background,color]=heroMap[config.hero]||heroMap.bold;
      hero.style.background=background;
      hero.style.color=color;
      hero.style.minHeight=config.hero==='banner'?'112px':config.hero==='minimal'?'120px':config.density==='compact'?'132px':'150px';
      hero.style.padding=config.contentWidth==='boxed'?'1.25rem 2rem':config.density==='compact'?'1rem':'1.4rem';
    }

    if(body){
      body.style.padding=config.contentWidth==='boxed'?'1rem 1.7rem':config.density==='compact'?'.6rem':'.8rem';
      body.style.gap=config.density==='compact'?'.38rem':'.55rem';
    }

    cards.forEach((card)=>{
      card.style.borderRadius=radiusValue(config.radius);
      card.style.boxShadow=config.cards==='elevated'?'0 7px 18px rgba(17,33,24,.09)':'none';
      card.style.borderWidth=config.cards==='bordered'?'2px':'1px';
      card.style.minHeight=config.density==='compact'?'48px':'62px';
      card.style.padding=config.density==='compact'?'.42rem':'.6rem';
    });
  }

  function renderAdminPreview(config){
    const preview=field('admin-design-preview');if(!preview)return;
    const side=preview.querySelector('.studio3-admin-side');
    const main=preview.querySelector('.studio3-admin-main');
    const panel=preview.querySelector('.studio3-admin-panel');
    const cards=[...preview.querySelectorAll('.studio3-admin-cards>div')];
    preview.style.fontFamily=fontValue(config.font);
    if(side){
      side.style.background=config.sidebar==='dark'?'linear-gradient(180deg,#20262b,#11161a)':config.sidebar==='light'?'#fff':'linear-gradient(180deg,#14713c,#0e4d2b)';
      side.style.color=config.sidebar==='light'?'#17201a':'#fff';
      side.style.borderRight=config.sidebar==='light'?'1px solid #dfe5df':'0';
      side.style.padding=config.density==='compact'?'.62rem .52rem':'.85rem .65rem';
    }
    if(main)main.style.padding=config.density==='compact'?'.65rem':'.9rem';
    cards.forEach((card)=>{
      card.style.borderRadius=radiusValue(config.radius);
      card.style.boxShadow=config.cards==='elevated'?'0 7px 18px rgba(17,33,24,.09)':'none';
      card.style.borderWidth=config.cards==='bordered'?'2px':'1px';
      card.style.minHeight=config.density==='compact'?'56px':'72px';
    });
    if(panel){
      panel.style.borderRadius=radiusValue(config.radius);
      panel.style.boxShadow=config.cards==='elevated'?'0 7px 18px rgba(17,33,24,.07)':'none';
      panel.style.borderWidth=config.cards==='bordered'?'2px':'1px';
    }
  }

  function syncPresetButtons(){
    const publicPreset=value('public-preset'),adminPreset=value('admin-preset');
    document.querySelectorAll('[data-design-preset]').forEach((button)=>{
      const active=button.dataset.scope==='public'?button.dataset.designPreset===publicPreset:button.dataset.designPreset===adminPreset;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
  }

  function refreshPreview(scope='all'){
    if(scope==='all'||scope==='public')renderPublicPreview(readPublic());
    if(scope==='all'||scope==='admin')renderAdminPreview(readAdmin());
    syncPresetButtons();
  }

  function showWorkspace(scope){
    activeScope=scope==='admin'?'admin':'public';
    document.querySelectorAll('[data-studio-tab]').forEach((button)=>{
      const active=button.dataset.studioTab===activeScope;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',active?'true':'false');
    });
    document.querySelectorAll('[data-studio-panel]').forEach((panel)=>{
      const active=panel.dataset.studioPanel===activeScope;
      panel.hidden=!active;
      panel.classList.toggle('active',active);
    });
  }

  function applyPreset(scope,name){
    if(scope==='public'){
      const preset=theme.publicPresets[name];if(!preset)return;writePublic(preset);
    }else{
      const preset=theme.adminPresets[name];if(!preset)return;writeAdmin(preset);
    }
    showWorkspace(scope);
    refreshPreview(scope);
    syncDirtyState(true,`${scope==='public'?'Public website':'Admin interface'} preset loaded. Preview updated — save when ready.`);
  }

  async function loadTheme(){
    setStatus('Loading saved design…');
    if(saveButton)saveButton.disabled=true;
    const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
    if(error)throw error;
    const config=data?.design_theme||{};
    theme.writeCache?.(config);
    writePublic(config.public||theme.PUBLIC_DEFAULT);
    writeAdmin(config.admin||theme.ADMIN_DEFAULT);
    refreshPreview('all');
    syncDirtyState(false,'Saved design loaded. Choose a preset or change an option to preview it instantly.');
  }

  async function saveTheme(){
    if(!dirty)return;
    const payload={version:3,public:readPublic(),admin:readAdmin()};
    saveButton.disabled=true;
    resetButton.disabled=true;
    setStatus('Saving design…');
    try{
      const {data,error}=await client.from('site_settings').update({design_theme:payload,updated_at:new Date().toISOString()}).eq('id',1).select('design_theme').single();
      if(error)throw error;
      const saved=data?.design_theme||payload;
      theme.writeCache?.(saved);
      writePublic(saved.public||payload.public);
      writeAdmin(saved.admin||payload.admin);
      refreshPreview('all');
      syncDirtyState(false,'Saved and applied. Open the full Public Site or Admin Dashboard to verify the live page.');
    }catch(error){
      console.error(error);
      syncDirtyState(true,error.message||'Unable to save design.');
      status?.classList.add('text-danger');
    }finally{
      resetButton.disabled=false;
      if(dirty)saveButton.disabled=false;
    }
  }

  document.querySelectorAll('[data-studio-tab]').forEach((button)=>button.addEventListener('click',()=>showWorkspace(button.dataset.studioTab)));

  form?.addEventListener('change',(event)=>{
    if(!event.target.matches('select'))return;
    const scope=event.target.id.startsWith('public-')?'public':'admin';
    setValue(`${scope}-preset`,'custom');
    refreshPreview(scope);
    syncDirtyState(true,`${scope==='public'?'Public website':'Admin interface'} preview updated. Changes are not published yet.`);
  });

  form?.addEventListener('submit',(event)=>{event.preventDefault();saveTheme();});

  document.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-design-preset]');
    if(button)applyPreset(button.dataset.scope,button.dataset.designPreset);
  });

  resetButton?.addEventListener('click',()=>{
    if(activeScope==='public')writePublic(theme.PUBLIC_DEFAULT);else writeAdmin(theme.ADMIN_DEFAULT);
    refreshPreview(activeScope);
    syncDirtyState(true,`${activeScope==='public'?'Public website':'Admin interface'} defaults loaded in preview. Save to apply them.`);
  });

  async function init(){
    if(!theme){setStatus('Theme engine failed to load.',true);return;}
    showWorkspace('public');
    const allowed=await requireAdmin();if(!allowed)return;
    try{await loadTheme();}catch(error){console.error(error);setStatus(error.message||'Unable to load Design Studio.',true);}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const theme = window.BRGY_THEME;
  const form = document.getElementById('design-studio-form');
  const status = document.getElementById('design-studio-status');
  const saveButton = document.getElementById('design-save');
  const resetButton = document.getElementById('design-reset');

  const field = (id) => document.getElementById(id);
  const value = (id) => field(id)?.value || '';
  const setValue = (id,val) => { const el=field(id); if(el) el.value=val; };
  const setStatus = (message,error=false) => {
    if(!status) return;
    status.textContent=message;
    status.classList.toggle('text-danger',error);
    status.classList.toggle('text-success',!error&&Boolean(message));
  };

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
      preset:value('public-preset')||'custom',
      font:value('public-font'),radius:value('public-radius'),density:value('public-density'),
      navSkin:value('public-nav-skin'),navPosition:value('public-nav-position'),navAlign:value('public-nav-align'),navMode:value('public-nav-mode'),
      hero:value('public-hero'),cards:value('public-cards'),contentWidth:value('public-content-width')
    });
  }

  function readAdmin(){
    return theme.normalizeAdmin({
      preset:value('admin-preset')||'custom',font:value('admin-font'),radius:value('admin-radius'),density:value('admin-density'),sidebar:value('admin-sidebar'),cards:value('admin-cards')
    });
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

  function radiusValue(kind){return {square:'3px',soft:'8px',rounded:'12px',pill:'20px'}[kind]||'12px';}
  function fontValue(kind){return kind==='serif'?'Georgia, serif':kind==='rounded'?'Trebuchet MS, sans-serif':'Inter, system-ui, sans-serif';}

  function renderPublicPreview(config){
    const preview=field('public-design-preview');if(!preview)return;
    const nav=preview.querySelector('.studio2-web-nav');
    const hero=preview.querySelector('.studio2-web-hero');
    const cards=[...preview.querySelectorAll('.studio2-web-body div')];
    preview.dataset.previewPosition=config.navPosition;
    preview.dataset.previewMode=config.navMode;
    preview.dataset.previewAlign=config.navAlign;
    preview.style.fontFamily=fontValue(config.font);

    if(nav){
      nav.style.background=config.navSkin==='solid'?'#0d4d2b':config.navSkin==='glass'?'rgba(13,77,43,.82)':'linear-gradient(90deg,#0d4d2b,#1f8b4b)';
      nav.style.backdropFilter=config.navSkin==='glass'?'blur(12px)':'none';
    }
    if(hero){
      const heroMap={
        minimal:['linear-gradient(180deg,#f3f7f4,#fff)','#17201a'],
        soft:['linear-gradient(135deg,#379460,#0d4d2b)','#fff'],
        split:['linear-gradient(90deg,#0d4d2b 0 58%,#55aa73 58% 100%)','#fff'],
        banner:['linear-gradient(110deg,#173a28,#176f3d)','#fff'],
        clean:['linear-gradient(135deg,#0d4d2b,#176f3d)','#fff'],
        bold:['linear-gradient(135deg,#0a3f23,#178246)','#fff']
      };
      const [background,color]=heroMap[config.hero]||heroMap.bold;
      hero.style.background=background;hero.style.color=color;
      hero.style.minHeight=config.hero==='banner'?'105px':config.hero==='minimal'?'112px':'125px';
    }
    cards.forEach((card)=>{
      card.style.borderRadius=radiusValue(config.radius);
      card.style.boxShadow=config.cards==='elevated'?'0 7px 18px rgba(17,33,24,.08)':'none';
      card.style.borderWidth=config.cards==='bordered'?'2px':'1px';
    });
  }

  function renderAdminPreview(config){
    const preview=field('admin-design-preview');if(!preview)return;
    const side=preview.querySelector('.studio2-admin-side');
    const cards=[...preview.querySelectorAll('.studio2-admin-cards div')];
    preview.style.fontFamily=fontValue(config.font);
    if(side){
      side.style.background=config.sidebar==='dark'?'linear-gradient(180deg,#20262b,#11161a)':config.sidebar==='light'?'#fff':'linear-gradient(180deg,#14713c,#0e4d2b)';
      side.style.color=config.sidebar==='light'?'#17201a':'#fff';
      side.style.borderRight=config.sidebar==='light'?'1px solid #dfe5df':'0';
    }
    cards.forEach((card)=>{
      card.style.borderRadius=radiusValue(config.radius);
      card.style.boxShadow=config.cards==='elevated'?'0 7px 18px rgba(17,33,24,.08)':'none';
      card.style.borderWidth=config.cards==='bordered'?'2px':'1px';
    });
  }

  function syncPresetButtons(){
    const publicPreset=value('public-preset');
    const adminPreset=value('admin-preset');
    document.querySelectorAll('[data-design-preset]').forEach((button)=>{
      const active=button.dataset.scope==='public'?button.dataset.designPreset===publicPreset:button.dataset.designPreset===adminPreset;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
  }

  function refreshPreview(){
    const pub=readPublic(),admin=readAdmin();
    theme.applyAdmin(admin);
    renderPublicPreview(pub);renderAdminPreview(admin);syncPresetButtons();
  }

  function applyPreset(scope,name){
    if(scope==='public'){
      const preset=theme.publicPresets[name];
      if(preset)writePublic(preset);
    }else{
      const preset=theme.adminPresets[name];
      if(preset)writeAdmin(preset);
    }
    refreshPreview();
    setStatus(`${scope==='public'?'Website':'Admin'} preset loaded in preview. Save to apply.`);
  }

  async function loadTheme(){
    setStatus('Loading Design Studio…');
    const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
    if(error)throw error;
    const config=data?.design_theme||{};
    theme.writeCache?.(config);
    writePublic(config.public||theme.PUBLIC_DEFAULT);
    writeAdmin(config.admin||theme.ADMIN_DEFAULT);
    refreshPreview();
    setStatus('Design loaded. Choose a preset or customize the controls.');
  }

  async function saveTheme(){
    const payload={version:2,public:readPublic(),admin:readAdmin()};
    saveButton.disabled=true;
    setStatus('Saving and applying design…');
    try{
      const {data,error}=await client.from('site_settings').update({design_theme:payload,updated_at:new Date().toISOString()}).eq('id',1).select('design_theme').single();
      if(error)throw error;
      const saved=data.design_theme||payload;
      theme.writeCache?.(saved);
      writePublic(saved.public||payload.public);writeAdmin(saved.admin||payload.admin);refreshPreview();
      setStatus('Design saved. Public pages and admin UI will use this design on reload.');
    }catch(error){
      console.error(error);setStatus(error.message||'Unable to save design.',true);
    }finally{saveButton.disabled=false;}
  }

  form?.addEventListener('change',(event)=>{
    if(!event.target.matches('select'))return;
    const scope=event.target.id.startsWith('public-')?'public':'admin';
    setValue(`${scope}-preset`,'custom');
    refreshPreview();
  });
  form?.addEventListener('submit',(event)=>{event.preventDefault();saveTheme();});
  document.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-design-preset]');
    if(!button)return;
    applyPreset(button.dataset.scope,button.dataset.designPreset);
  });
  resetButton?.addEventListener('click',()=>{
    writePublic(theme.PUBLIC_DEFAULT);writeAdmin(theme.ADMIN_DEFAULT);refreshPreview();setStatus('Defaults loaded in preview. Press Save & Apply Design to publish them.');
  });

  document.addEventListener('DOMContentLoaded',async()=>{
    if(!theme){setStatus('Theme engine failed to load.',true);return;}
    const allowed=await requireAdmin();if(!allowed)return;
    try{await loadTheme();}catch(error){console.error(error);setStatus(error.message||'Unable to load Design Studio.',true);}
  });
})();

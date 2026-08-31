(() => {
  'use strict';

  const client=window.BRGY_SUPABASE;
  const theme=window.BRGY_THEME;
  const form=document.getElementById('design-studio-form');
  const status=document.getElementById('design-studio-status');
  const saveButton=document.getElementById('design-save');
  const resetButton=document.getElementById('design-reset');
  const signout=document.getElementById('admin-signout');

  const field=(id)=>document.getElementById(id);
  const value=(id)=>field(id)?.value||'';
  const setValue=(id,val)=>{const el=field(id);if(el)el.value=val;};
  const setStatus=(message,error=false)=>{if(!status)return;status.textContent=message;status.classList.toggle('text-danger',error);status.classList.toggle('text-success',!error&&Boolean(message));};

  async function requireAdmin(){
    if(!client){location.href='login.html';return false;}
    const {data,error}=await client.auth.getUser();
    if(error||!data?.user){location.href='login.html';return false;}
    const {data:profile,error:profileError}=await client.from('profiles').select('role,is_active').eq('user_id',data.user.id).maybeSingle();
    if(profileError||profile?.role!=='admin'||profile?.is_active!==true){await client.auth.signOut();location.href='login.html';return false;}
    return true;
  }

  function readPublic(){return theme.normalizePublic({preset:value('public-preset')||'custom',font:value('public-font'),radius:value('public-radius'),density:value('public-density'),nav:value('public-nav'),hero:value('public-hero'),cards:value('public-cards')});}
  function readAdmin(){return theme.normalizeAdmin({preset:value('admin-preset')||'custom',font:value('admin-font'),radius:value('admin-radius'),density:value('admin-density'),sidebar:value('admin-sidebar'),cards:value('admin-cards')});}

  function writePublic(config){const t=theme.normalizePublic(config);setValue('public-preset',t.preset);setValue('public-font',t.font);setValue('public-radius',t.radius);setValue('public-density',t.density);setValue('public-nav',t.nav);setValue('public-hero',t.hero);setValue('public-cards',t.cards);}
  function writeAdmin(config){const t=theme.normalizeAdmin(config);setValue('admin-preset',t.preset);setValue('admin-font',t.font);setValue('admin-radius',t.radius);setValue('admin-density',t.density);setValue('admin-sidebar',t.sidebar);setValue('admin-cards',t.cards);}

  function radiusValue(kind){return {square:'4px',soft:'10px',rounded:'18px',pill:'28px'}[kind]||'18px';}
  function fontValue(kind){return kind==='serif'?'Georgia, serif':kind==='rounded'?'Trebuchet MS, sans-serif':'Inter, system-ui, sans-serif';}

  function renderPublicPreview(config){
    const preview=document.getElementById('public-design-preview');if(!preview)return;
    const nav=preview.querySelector('.design-preview-nav'),hero=preview.querySelector('.design-preview-hero'),card=preview.querySelector('.design-preview-card');
    preview.style.fontFamily=fontValue(config.font);
    if(nav){nav.style.background=config.nav==='solid'?'#0d4d2b':config.nav==='glass'?'rgba(13,77,43,.82)':'linear-gradient(100deg,#0d4d2b,#136b3a)';nav.style.backdropFilter=config.nav==='glass'?'blur(12px)':'none';}
    if(hero){hero.style.minHeight=config.hero==='minimal'?'130px':'170px';hero.style.background=config.hero==='minimal'?'linear-gradient(180deg,#f2f7f3,#fff)':config.hero==='clean'?'linear-gradient(135deg,#0d4d2b,#136b3a)':config.hero==='soft'?'linear-gradient(135deg,#2f8a58,#0d4d2b)':'linear-gradient(135deg,#0d4d2b,#136b3a)';hero.style.color=config.hero==='minimal'?'#17201a':'#fff';}
    if(card){card.style.borderRadius=radiusValue(config.radius);card.style.boxShadow=config.cards==='elevated'?'0 12px 30px rgba(17,33,24,.10)':'none';card.style.borderWidth=config.cards==='bordered'?'2px':'1px';card.style.padding=config.density==='compact'?'.75rem':'1rem';}
  }

  function renderAdminPreview(config){
    const preview=document.getElementById('admin-design-preview');if(!preview)return;
    const bar=preview.querySelector('.design-preview-bar'),card=preview.querySelector('.design-preview-card');
    preview.style.fontFamily=fontValue(config.font);
    if(bar){bar.style.background=config.sidebar==='dark'?'#151a1e':config.sidebar==='light'?'#fff':'linear-gradient(90deg,#14713c,#0e4d2b)';bar.style.color=config.sidebar==='light'?'#17201a':'#fff';bar.style.borderBottom=config.sidebar==='light'?'1px solid #dfe5df':'0';}
    if(card){card.style.borderRadius=radiusValue(config.radius);card.style.boxShadow=config.cards==='elevated'?'0 12px 30px rgba(17,33,24,.10)':'none';card.style.borderWidth=config.cards==='bordered'?'2px':'1px';card.style.padding=config.density==='compact'?'.75rem':'1rem';}
  }

  function refreshPreview(){const pub=readPublic(),admin=readAdmin();theme.applyAdmin(admin);renderPublicPreview(pub);renderAdminPreview(admin);}

  function applyPreset(scope,name){
    if(scope==='public'){const preset=theme.publicPresets[name];if(preset)writePublic(preset);}
    else{const preset=theme.adminPresets[name];if(preset)writeAdmin(preset);}
    refreshPreview();
  }

  async function loadTheme(){
    setStatus('Loading Design Studio…');
    const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
    if(error)throw error;
    const config=data?.design_theme||{};
    writePublic(config.public||theme.PUBLIC_DEFAULT);
    writeAdmin(config.admin||theme.ADMIN_DEFAULT);
    refreshPreview();
    setStatus('Design loaded. Changes below are visual only until you save.');
  }

  async function saveTheme(){
    const payload={version:1,public:readPublic(),admin:readAdmin()};
    saveButton.disabled=true;
    setStatus('Saving design…');
    try{
      const {data,error}=await client.from('site_settings').update({design_theme:payload,updated_at:new Date().toISOString()}).eq('id',1).select('design_theme').single();
      if(error)throw error;
      writePublic(data.design_theme.public||payload.public);writeAdmin(data.design_theme.admin||payload.admin);refreshPreview();
      setStatus('Design saved. Public view and staff UI will use this theme on reload.');
    }catch(error){console.error(error);setStatus(error.message||'Unable to save design.',true);}finally{saveButton.disabled=false;}
  }

  form?.addEventListener('change',(event)=>{if(event.target.matches('select')){const scope=event.target.id.startsWith('public-')?'public':'admin';setValue(`${scope}-preset`,'custom');refreshPreview();}});
  form?.addEventListener('submit',(event)=>{event.preventDefault();saveTheme();});
  document.addEventListener('click',(event)=>{const button=event.target.closest('[data-design-preset]');if(!button)return;applyPreset(button.dataset.scope,button.dataset.designPreset);});
  resetButton?.addEventListener('click',()=>{writePublic(theme.PUBLIC_DEFAULT);writeAdmin(theme.ADMIN_DEFAULT);refreshPreview();setStatus('Default design loaded in preview. Press Save Design to apply it.');});
  signout?.addEventListener('click',async()=>{if(client)await client.auth.signOut();location.href='login.html';});

  document.addEventListener('DOMContentLoaded',async()=>{if(!theme){setStatus('Theme engine failed to load.',true);return;}const allowed=await requireAdmin();if(!allowed)return;try{await loadTheme();}catch(error){console.error(error);setStatus(error.message||'Unable to load Design Studio.',true);}});
})();

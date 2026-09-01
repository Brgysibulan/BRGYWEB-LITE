(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const theme = window.BRGY_THEME;
  const form = document.getElementById('design-studio-form');
  const status = document.getElementById('design-studio-status');
  const changeState = document.getElementById('design-change-state');
  const saveButton = document.getElementById('design-save');
  const resetButton = document.getElementById('design-reset');
  const saveBar = document.querySelector('.studio3-savebar');
  const studioMain = document.querySelector('.studio3-main');
  const field = (id) => document.getElementById(id);
  const value = (id) => field(id)?.value || '';
  const setValue = (id,val) => { const el=field(id); if(el) el.value=val; };
  const SITE_CACHE_KEY = 'brgyweb:site-settings:v3';

  let activeScope = 'public';
  let dirty = false;

  function setStatus(message,error=false){
    if(!status)return;
    status.textContent=message;
    status.classList.toggle('text-danger',error);
    status.classList.toggle('text-success',!error&&Boolean(message));
  }

  function syncSaveBarLayout(){
    if(saveBar){
      if(dirty)saveBar.style.removeProperty('display');else saveBar.style.display='none';
      saveBar.classList.toggle('is-visible',dirty);
      saveBar.setAttribute('aria-hidden',dirty?'false':'true');
    }
    if(studioMain){
      if(window.matchMedia('(max-width:720px)').matches&&!dirty)studioMain.style.paddingBottom='1rem';
      else studioMain.style.removeProperty('padding-bottom');
    }
    document.documentElement.classList.toggle('studio-design-dirty',dirty);
  }

  function syncDirtyState(isDirty,message=''){
    dirty=Boolean(isDirty);
    if(changeState)changeState.textContent=dirty?'Unsaved design changes':'No unsaved changes';
    if(saveButton)saveButton.disabled=!dirty;
    syncSaveBarLayout();
    if(message)setStatus(message);
  }

  async function requireAdmin(){
    if(!client){location.href='login.html';return false;}
    const {data,error}=await client.auth.getUser();
    if(error||!data?.user){location.href='login.html';return false;}
    const {data:profile,error:profileError}=await client.from('profiles').select('role,is_active').eq('user_id',data.user.id).maybeSingle();
    if(profileError||profile?.role!=='admin'||profile?.is_active!==true){
      await client.auth.signOut();location.href='login.html';return false;
    }
    return true;
  }

  function ensureAdminPalette(){
    if(field('admin-primary-color'))return;
    const controls=document.querySelector('[data-studio-panel="admin"] .studio3-controls');
    if(!controls)return;
    const details=[...controls.querySelectorAll('.studio3-section')].find((section)=>section.querySelector('#admin-font'));
    const section=document.createElement('section');
    section.className='studio3-section';
    section.innerHTML=`<div class="studio3-heading"><div><span class="eyebrow">Dashboard Palette</span><h2>Admin Colors</h2><p>Shared colors for System Admin and Content Admin dashboards.</p></div><span class="studio3-count">4 colors</span></div><div class="studio3-palette"><label class="studio3-color" for="admin-primary-color"><input id="admin-primary-color" type="color" value="#0b2f21"><span class="studio3-color-copy"><strong>Primary</strong><span>Sidebar and deep workspace areas</span><span class="studio3-color-code" id="admin-primary-code">#0b2f21</span></span></label><label class="studio3-color" for="admin-secondary-color"><input id="admin-secondary-color" type="color" value="#1b6b45"><span class="studio3-color-copy"><strong>Secondary</strong><span>Buttons, active states and charts</span><span class="studio3-color-code" id="admin-secondary-code">#1b6b45</span></span></label><label class="studio3-color" for="admin-accent-color"><input id="admin-accent-color" type="color" value="#d8b63e"><span class="studio3-color-copy"><strong>Accent</strong><span>Highlights and attention states</span><span class="studio3-color-code" id="admin-accent-code">#d8b63e</span></span></label><label class="studio3-color" for="admin-signal-color"><input id="admin-signal-color" type="color" value="#a63d40"><span class="studio3-color-copy"><strong>Signal</strong><span>Warnings and destructive actions</span><span class="studio3-color-code" id="admin-signal-code">#a63d40</span></span></label></div>`;
    if(details)controls.insertBefore(section,details);else controls.appendChild(section);
  }

  function readPublicColors(){
    return theme.normalizeColors({primary:value('public-primary-color'),secondary:value('public-secondary-color'),accent:value('public-accent-color'),signal:value('public-signal-color')});
  }

  function readAdminColors(){
    return theme.normalizeAdminColors({primary:value('admin-primary-color'),secondary:value('admin-secondary-color'),accent:value('admin-accent-color'),signal:value('admin-signal-color')});
  }

  function syncColorCodes(scope,colors){
    ['primary','secondary','accent','signal'].forEach((key)=>{const el=field(`${scope}-${key}-code`);if(el)el.textContent=colors[key];});
  }

  function writePublicColors(colors){
    const c=theme.normalizeColors(colors||{});
    setValue('public-primary-color',c.primary);setValue('public-secondary-color',c.secondary);setValue('public-accent-color',c.accent);setValue('public-signal-color',c.signal);syncColorCodes('public',c);
  }

  function writeAdminColors(colors){
    const c=theme.normalizeAdminColors(colors||{});
    setValue('admin-primary-color',c.primary);setValue('admin-secondary-color',c.secondary);setValue('admin-accent-color',c.accent);setValue('admin-signal-color',c.signal);syncColorCodes('admin',c);
  }

  function readPublic(){
    return theme.normalizePublic({
      preset:value('public-preset')||'custom',font:value('public-font'),radius:value('public-radius'),density:value('public-density'),
      navSkin:value('public-nav-skin'),navPosition:value('public-nav-position'),navAlign:value('public-nav-align'),navMode:value('public-nav-mode'),
      hero:value('public-hero'),cards:value('public-cards'),contentWidth:value('public-content-width'),colors:readPublicColors()
    });
  }

  function readAdmin(){
    return theme.normalizeAdmin({
      preset:value('admin-preset')||'custom',font:value('admin-font'),radius:value('admin-radius'),density:value('admin-density'),
      sidebar:value('admin-sidebar'),sidebarWidth:value('admin-sidebar-width'),topbar:value('admin-topbar'),contentWidth:value('admin-content-width'),
      buttons:value('admin-buttons'),tables:value('admin-tables'),cards:value('admin-cards'),colors:readAdminColors()
    });
  }

  function writePublic(config){
    const t=theme.normalizePublic(config);
    setValue('public-preset',t.preset);setValue('public-font',t.font);setValue('public-radius',t.radius);setValue('public-density',t.density);
    setValue('public-nav-skin',t.navSkin);setValue('public-nav-position',t.navPosition);setValue('public-nav-align',t.navAlign);setValue('public-nav-mode',t.navMode);
    setValue('public-hero',t.hero);setValue('public-cards',t.cards);setValue('public-content-width',t.contentWidth);writePublicColors(t.colors);
  }

  function writeAdmin(config){
    const t=theme.normalizeAdmin(config);
    setValue('admin-preset',t.preset);setValue('admin-font',t.font);setValue('admin-radius',t.radius);setValue('admin-density',t.density);
    setValue('admin-sidebar',t.sidebar);setValue('admin-sidebar-width',t.sidebarWidth);setValue('admin-topbar',t.topbar);setValue('admin-content-width',t.contentWidth);
    setValue('admin-buttons',t.buttons);setValue('admin-tables',t.tables);setValue('admin-cards',t.cards);writeAdminColors(t.colors);
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

  function radiusValue(kind){return {square:'3px',soft:'8px',rounded:'12px',pill:'22px'}[kind]||'12px';}
  function fontValue(kind){return kind==='serif'?'Georgia, serif':kind==='rounded'?'Trebuchet MS, sans-serif':'Inter, system-ui, sans-serif';}
  function navLabel(kind){return {top:'Top',left:'Left Sidebar',floating:'Floating Top'}[kind]||'Top';}

  function syncResponsiveNote(config){
    const previewCard=field('public-design-preview')?.closest('.studio3-preview-card');if(!previewCard)return;
    let note=field('public-responsive-note');
    if(!note){note=document.createElement('div');note.id='public-responsive-note';note.className='studio3-responsive-note';previewCard.querySelector('.studio3-preview-head')?.insertAdjacentElement('afterend',note);}
    const effective=typeof theme.effectiveNavPosition==='function'?theme.effectiveNavPosition(config.navPosition):config.navPosition;
    if(effective===config.navPosition){note.classList.remove('is-fallback');note.textContent=`This device supports the saved ${navLabel(config.navPosition)} navigation.`;}
    else{note.classList.add('is-fallback');note.textContent=`Desktop setting: ${navLabel(config.navPosition)}. This phone/tablet safely uses Top navigation.`;}
  }

  function renderPublicPreview(config){
    const preview=field('public-design-preview');if(!preview)return;
    const nav=preview.querySelector('.studio3-web-nav'),hero=preview.querySelector('.studio3-web-hero'),body=preview.querySelector('.studio3-web-body'),cards=[...preview.querySelectorAll('.studio3-web-body>div')],c=config.colors;
    preview.dataset.previewPosition=config.navPosition;preview.dataset.previewMode=config.navMode;preview.dataset.previewAlign=config.navAlign;preview.style.fontFamily=fontValue(config.font);
    preview.style.setProperty('--preview-primary',c.primary);preview.style.setProperty('--preview-secondary',c.secondary);preview.style.setProperty('--preview-accent',c.accent);preview.style.setProperty('--preview-signal',c.signal);preview.style.setProperty('--preview-surface',c.surface);
    if(nav){nav.style.background=config.navSkin==='solid'?c.primary:config.navSkin==='glass'?`color-mix(in srgb, ${c.primary} 84%, transparent)`:`linear-gradient(90deg,${c.primary},${c.secondary})`;nav.style.backdropFilter=config.navSkin==='glass'?'blur(14px)':'none';}
    if(hero){
      const heroMap={minimal:[`linear-gradient(180deg,${c.surface},#fff)`,'#17201a'],soft:[`linear-gradient(135deg,color-mix(in srgb, ${c.secondary} 14%, white),${c.surface})`,c.primary],split:[`linear-gradient(90deg,${c.primary} 0 58%,${c.secondary} 58% 100%)`,'#fff'],banner:[`linear-gradient(110deg,${c.primary},${c.secondary})`,'#fff'],clean:[c.surface,c.primary],bold:[`linear-gradient(135deg,${c.primary},${c.secondary})`,'#fff']};
      const [background,color]=heroMap[config.hero]||heroMap.bold;hero.style.background=background;hero.style.color=color;hero.style.borderBottom=config.hero==='banner'?`5px solid ${c.accent}`:'0';hero.style.minHeight=config.hero==='banner'?'112px':config.hero==='minimal'?'120px':config.density==='compact'?'132px':'150px';hero.style.padding=config.contentWidth==='boxed'?'1.25rem 2rem':config.density==='compact'?'1rem':'1.4rem';
    }
    if(body){body.style.background=c.surface;body.style.padding=config.contentWidth==='boxed'?'1rem 1.7rem':config.density==='compact'?'.6rem':'.8rem';body.style.gap=config.density==='compact'?'.38rem':'.55rem';}
    cards.forEach((card,index)=>{card.style.borderRadius=radiusValue(config.radius);card.style.boxShadow=config.cards==='elevated'?'0 7px 18px rgba(17,33,24,.09)':'none';card.style.borderWidth=config.cards==='bordered'?'2px':'1px';card.style.minHeight=config.density==='compact'?'48px':'62px';card.style.padding=config.density==='compact'?'.42rem':'.6rem';card.style.borderColor=config.cards==='bordered'?c.secondary:'#dfe5df';card.style.borderTopColor=index===0?c.accent:index===2?c.signal:card.style.borderColor;card.style.borderTopWidth=index===0?'3px':index===2?'2px':card.style.borderWidth;});
    syncColorCodes('public',c);syncResponsiveNote(config);
  }

  function renderAdminPreview(config){
    const preview=field('admin-design-preview');if(!preview)return;
    const side=preview.querySelector('.studio3-admin-side'),main=preview.querySelector('.studio3-admin-main'),topbar=preview.querySelector('.studio3-admin-top'),topMarker=preview.querySelector('.studio3-admin-top i'),panel=preview.querySelector('.studio3-admin-panel'),button=preview.querySelector('.studio3-admin-demo-button'),table=preview.querySelector('.studio3-admin-demo-table'),cards=[...preview.querySelectorAll('.studio3-admin-cards>div')],c=config.colors;
    preview.dataset.previewPreset=config.preset;preview.style.fontFamily=fontValue(config.font);
    preview.style.gridTemplateColumns=config.sidebarWidth==='compact'?'82px minmax(0,1fr)':config.sidebarWidth==='wide'?'132px minmax(0,1fr)':'112px minmax(0,1fr)';
    if(side){side.style.background=config.sidebar==='dark'?`linear-gradient(180deg,color-mix(in srgb, ${c.primary} 45%, #20262b),#11161a)`:config.sidebar==='light'?'#fff':`linear-gradient(180deg,${c.primary},${c.secondary})`;side.style.color=config.sidebar==='light'?'#17201a':'#fff';side.style.borderRight=config.sidebar==='light'?`3px solid ${c.accent}`:'0';side.style.padding=config.density==='compact'?'.62rem .52rem':'.85rem .65rem';}
    if(main){main.style.padding=config.density==='compact'?'.65rem':'.9rem';main.style.maxWidth=config.contentWidth==='boxed'?'330px':'none';main.style.margin=config.contentWidth==='boxed'?'0 auto':'0';main.style.width='100%';}
    if(topbar){topbar.style.padding=config.topbar==='clean'?'0 0 .4rem':'.48rem .55rem';topbar.style.border=config.topbar==='clean'?'0':`1px solid color-mix(in srgb, ${c.primary} 12%, #dfe5df)`;topbar.style.borderRadius=config.topbar==='clean'?'0':radiusValue(config.radius);topbar.style.background=config.topbar==='glass'?'rgba(255,255,255,.72)':config.topbar==='soft'?`color-mix(in srgb, ${c.secondary} 7%, #fff)`:'transparent';topbar.style.backdropFilter=config.topbar==='glass'?'blur(10px)':'none';}
    if(topMarker)topMarker.style.background=c.secondary;
    cards.forEach((card,index)=>{card.style.borderRadius=radiusValue(config.radius);card.style.boxShadow=config.cards==='elevated'?`0 7px 18px color-mix(in srgb, ${c.primary} 12%, transparent)`:'none';card.style.borderWidth=config.cards==='bordered'?'2px':'1px';card.style.minHeight=config.density==='compact'?'56px':'72px';card.style.borderColor=config.cards==='bordered'?c.secondary:'#dfe5df';card.style.borderTop=`3px solid ${index===1?c.accent:index===2?c.signal:c.secondary}`;});
    if(panel){panel.style.borderRadius=radiusValue(config.radius);panel.style.boxShadow=config.cards==='elevated'?`0 7px 18px color-mix(in srgb, ${c.primary} 10%, transparent)`:'none';panel.style.borderWidth=config.cards==='bordered'?'2px':'1px';panel.style.borderTop=`3px solid ${c.accent}`;}
    if(button){button.style.borderRadius=radiusValue(config.radius);button.style.border=`1px solid ${c.secondary}`;button.style.color=config.buttons==='solid'?'#fff':c.secondary;button.style.background=config.buttons==='solid'?c.secondary:config.buttons==='soft'?`color-mix(in srgb, ${c.secondary} 12%, #fff)`:'transparent';}
    if(table){table.dataset.previewTable=config.tables;table.style.setProperty('--admin-preview-secondary',c.secondary);}
    syncColorCodes('admin',c);
  }

  function syncPresetButtons(){
    const publicPreset=value('public-preset'),adminPreset=value('admin-preset');
    document.querySelectorAll('[data-design-preset]').forEach((button)=>{
      const active=button.dataset.scope==='public'?button.dataset.designPreset===publicPreset:button.dataset.designPreset===adminPreset;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',active?'true':'false');
    });
  }

  function refreshPreview(scope='all'){
    if(scope==='all'||scope==='public')renderPublicPreview(readPublic());
    if(scope==='all'||scope==='admin')renderAdminPreview(readAdmin());
    syncPresetButtons();
  }

  function showWorkspace(scope){
    activeScope=scope==='admin'?'admin':'public';
    document.querySelectorAll('[data-studio-tab]').forEach((button)=>{const active=button.dataset.studioTab===activeScope;button.classList.toggle('active',active);button.setAttribute('aria-selected',active?'true':'false');});
    document.querySelectorAll('[data-studio-panel]').forEach((panel)=>{const active=panel.dataset.studioPanel===activeScope;panel.hidden=!active;panel.classList.toggle('active',active);});
  }

  function applyPreset(scope,name){
    const source=scope==='public'?theme.publicPresets:theme.adminPresets;
    const preset=source?.[name];
    if(!preset){setStatus(`Preset “${name}” is unavailable. Reload the Design Studio.`,true);return;}
    if(scope==='public')writePublic(preset);else writeAdmin(preset);
    showWorkspace(scope);refreshPreview(scope);
    const selected=document.querySelector(`[data-scope="${scope}"][data-design-preset="${name}"]`);
    selected?.classList.add('preset-just-selected');window.setTimeout(()=>selected?.classList.remove('preset-just-selected'),320);
    syncDirtyState(true,`${scope==='public'?'Public website':'Admin interface'} preset loaded. Preview updated — tap Save & Apply Design to publish.`);
  }

  function bindPresetButtons(){
    theme.syncStudioPresetUi?.();
    let invalid=0;
    document.querySelectorAll('[data-design-preset]').forEach((button)=>{
      if(button.dataset.presetBound==='true')return;
      const scope=button.dataset.scope==='admin'?'admin':'public';
      const name=button.dataset.designPreset;
      const exists=Boolean((scope==='public'?theme.publicPresets:theme.adminPresets)?.[name]);
      button.dataset.presetBound='true';button.disabled=!exists;
      if(!exists){button.classList.add('is-invalid');button.title='Preset configuration is missing';invalid+=1;return;}
      button.addEventListener('click',(event)=>{event.preventDefault();applyPreset(scope,name);});
    });
    if(invalid)setStatus(`${invalid} preset configuration${invalid===1?' is':'s are'} unavailable. Reload after the latest update.`,true);
  }

  async function loadTheme(){
    setStatus('Loading saved design…');if(saveButton)saveButton.disabled=true;
    const {data,error}=await client.from('site_settings').select('design_theme,primary_color,secondary_color,accent_color').eq('id',1).single();if(error)throw error;
    const config=data?.design_theme||{};
    const publicConfig={...(config.public||theme.PUBLIC_DEFAULT),colors:{...(config.public?.colors||{}),primary:config.public?.colors?.primary||data.primary_color||theme.COLOR_DEFAULTS.primary,secondary:config.public?.colors?.secondary||data.secondary_color||theme.COLOR_DEFAULTS.secondary,accent:config.public?.colors?.accent||data.accent_color||theme.COLOR_DEFAULTS.accent,signal:config.public?.colors?.signal||theme.COLOR_DEFAULTS.signal}};
    const cached={version:theme.THEME_SCHEMA_VERSION,public:theme.normalizePublic(publicConfig),admin:theme.normalizeAdmin(config.admin||theme.ADMIN_DEFAULT)};
    theme.writeCache?.(cached);writePublic(cached.public);writeAdmin(cached.admin);refreshPreview('all');syncDirtyState(false,'Saved design loaded. Presets and selections are ready.');
  }

  function sameColors(a,b){return ['primary','secondary','accent','signal'].every((key)=>a?.[key]===b?.[key]);}

  function sameAdmin(a,b){
    return ['font','radius','density','sidebar','sidebarWidth','topbar','contentWidth','buttons','tables','cards'].every((key)=>a?.[key]===b?.[key])&&sameColors(a?.colors,b?.colors);
  }

  async function saveTheme(){
    if(!dirty)return;
    const publicTheme=readPublic(),adminTheme=readAdmin(),payload={version:theme.THEME_SCHEMA_VERSION,public:publicTheme,admin:adminTheme};
    saveButton.disabled=true;resetButton.disabled=true;setStatus('Saving and verifying design…');
    try{
      const {data,error}=await client.from('site_settings').update({design_theme:payload,primary_color:publicTheme.colors.primary,secondary_color:publicTheme.colors.secondary,accent_color:publicTheme.colors.accent,updated_at:new Date().toISOString()}).eq('id',1).select('design_theme,primary_color,secondary_color,accent_color').single();
      if(error)throw error;
      const saved=data?.design_theme;if(!saved?.public||!saved?.admin)throw new Error('Save completed but the saved design could not be verified.');
      const verifiedPublic=theme.normalizePublic(saved.public),verifiedAdmin=theme.normalizeAdmin(saved.admin);
      const publicMatches=verifiedPublic.font===publicTheme.font&&verifiedPublic.radius===publicTheme.radius&&verifiedPublic.density===publicTheme.density&&verifiedPublic.navSkin===publicTheme.navSkin&&verifiedPublic.navPosition===publicTheme.navPosition&&verifiedPublic.navAlign===publicTheme.navAlign&&verifiedPublic.navMode===publicTheme.navMode&&verifiedPublic.hero===publicTheme.hero&&verifiedPublic.cards===publicTheme.cards&&verifiedPublic.contentWidth===publicTheme.contentWidth&&sameColors(verifiedPublic.colors,publicTheme.colors);
      if(!publicMatches||!sameAdmin(verifiedAdmin,adminTheme))throw new Error('The server returned a design that does not match the selected settings.');
      const verified={version:theme.THEME_SCHEMA_VERSION,public:verifiedPublic,admin:verifiedAdmin};
      theme.writeCache?.(verified);syncSiteCache(verified);theme.applyAdmin?.(verified.admin);writePublic(verified.public);writeAdmin(verified.admin);refreshPreview('all');syncDirtyState(false,'Published and verified. Public website, System Admin and Content Admin are now using the saved design.');
    }catch(error){console.error(error);syncDirtyState(true,error.message||'Unable to save design.');status?.classList.add('text-danger');}
    finally{resetButton.disabled=false;if(dirty)saveButton.disabled=false;}
  }

  document.querySelectorAll('[data-studio-tab]').forEach((button)=>button.addEventListener('click',()=>showWorkspace(button.dataset.studioTab)));

  form?.addEventListener('change',(event)=>{
    if(event.target.matches('select')){
      const scope=event.target.id.startsWith('public-')?'public':'admin';setValue(`${scope}-preset`,'custom');refreshPreview(scope);syncDirtyState(true,`${scope==='public'?'Public website':'Admin interface'} preview updated. Changes are not published yet.`);
    }
    if(event.target.matches('input[type=color]')){
      const scope=event.target.id.startsWith('admin-')?'admin':'public';setValue(`${scope}-preset`,'custom');refreshPreview(scope);syncDirtyState(true,`${scope==='admin'?'Admin dashboard':'Public website'} palette updated in preview. Save to publish these colors.`);
    }
  });

  form?.addEventListener('input',(event)=>{
    if(!event.target.matches('input[type=color]'))return;
    const scope=event.target.id.startsWith('admin-')?'admin':'public';setValue(`${scope}-preset`,'custom');
    if(scope==='admin')renderAdminPreview(readAdmin());else renderPublicPreview(readPublic());
    syncPresetButtons();syncDirtyState(true,`${scope==='admin'?'Admin dashboard':'Public website'} palette updated in preview. Save to publish these colors.`);
  });

  form?.addEventListener('submit',(event)=>{event.preventDefault();saveTheme();});
  resetButton?.addEventListener('click',()=>{if(activeScope==='public')writePublic(theme.PUBLIC_DEFAULT);else writeAdmin(theme.ADMIN_DEFAULT);refreshPreview(activeScope);syncDirtyState(true,`${activeScope==='public'?'Public website':'Admin interface'} defaults loaded in preview. Save to apply them.`);});
  window.addEventListener('resize',()=>{if(activeScope==='public')syncResponsiveNote(readPublic());syncSaveBarLayout();},{passive:true});

  async function init(){
    syncDirtyState(false);
    if(!theme){setStatus('Theme engine failed to load.',true);return;}
    ensureAdminPalette();bindPresetButtons();showWorkspace('public');
    const allowed=await requireAdmin();if(!allowed)return;
    try{await loadTheme();}catch(error){console.error(error);setStatus(error.message||'Unable to load Design Studio.',true);}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

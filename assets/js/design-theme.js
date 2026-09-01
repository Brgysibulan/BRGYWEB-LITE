(() => {
  'use strict';

  const THEME_SCHEMA_VERSION = 8;
  const THEME_CACHE_KEY = 'brgyweb:design-theme:v8';
  const LEGACY_THEME_CACHE_KEYS = ['brgyweb:design-theme:v7','brgyweb:design-theme:v6','brgyweb:design-theme:v1'];
  const ASSET_VERSION = '20260901-studio11';
  const BREAKPOINT = 900;

  const COLOR_DEFAULTS = Object.freeze({
    primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:'#a63d40',surface:'#f5f8f5'
  });
  const ADMIN_COLOR_DEFAULTS = Object.freeze({
    primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:'#a63d40'
  });

  const PUBLIC_DEFAULT = Object.freeze({
    preset:'civic',font:'system',radius:'rounded',density:'comfortable',
    navSkin:'gradient',navPosition:'top',navAlign:'right',navMode:'links',
    hero:'bold',cards:'elevated',contentWidth:'wide',colors:{...COLOR_DEFAULTS}
  });

  const ADMIN_DEFAULT = Object.freeze({
    preset:'civic',font:'system',radius:'rounded',density:'comfortable',
    sidebar:'brand',sidebarWidth:'standard',topbar:'soft',contentWidth:'wide',
    buttons:'solid',tables:'clean',cards:'elevated',colors:{...ADMIN_COLOR_DEFAULTS}
  });

  const signalRed = COLOR_DEFAULTS.signal;

  const publicPresets = Object.freeze({
    premium:{preset:'premium',font:'system',radius:'rounded',density:'comfortable',navSkin:'glass',navPosition:'floating',navAlign:'right',navMode:'links',hero:'split',cards:'elevated',contentWidth:'wide',colors:{primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:signalRed}},
    civic:{...PUBLIC_DEFAULT,preset:'civic',colors:{primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:signalRed}},
    modern:{preset:'modern',font:'rounded',radius:'pill',density:'comfortable',navSkin:'glass',navPosition:'top',navAlign:'center',navMode:'links',hero:'soft',cards:'elevated',contentWidth:'boxed',colors:{primary:'#134e4a',secondary:'#0f766e',accent:'#d6a93a',signal:signalRed}},
    portal:{preset:'portal',font:'system',radius:'soft',density:'compact',navSkin:'solid',navPosition:'left',navAlign:'left',navMode:'links',hero:'clean',cards:'flat',contentWidth:'wide',colors:{primary:'#172554',secondary:'#1d4ed8',accent:'#d6a93a',signal:signalRed}},
    floating:{preset:'floating',font:'rounded',radius:'rounded',density:'comfortable',navSkin:'glass',navPosition:'floating',navAlign:'center',navMode:'links',hero:'split',cards:'elevated',contentWidth:'boxed',colors:{primary:'#14532d',secondary:'#15803d',accent:'#d8b63e',signal:signalRed}},
    minimal:{preset:'minimal',font:'system',radius:'square',density:'compact',navSkin:'solid',navPosition:'top',navAlign:'right',navMode:'menu',hero:'minimal',cards:'bordered',contentWidth:'boxed',colors:{primary:'#0f172a',secondary:'#334155',accent:'#caa43a',signal:signalRed}},
    classic:{preset:'classic',font:'serif',radius:'soft',density:'comfortable',navSkin:'solid',navPosition:'top',navAlign:'center',navMode:'links',hero:'banner',cards:'bordered',contentWidth:'boxed',colors:{primary:'#4c1d1d',secondary:'#7f1d1d',accent:'#c9a43b',signal:'#9f3438'}},
    compact:{preset:'compact',font:'system',radius:'soft',density:'compact',navSkin:'gradient',navPosition:'left',navAlign:'left',navMode:'menu',hero:'minimal',cards:'flat',contentWidth:'wide',colors:{primary:'#052e16',secondary:'#166534',accent:'#c7aa3a',signal:signalRed}},
    bold:{preset:'bold',font:'rounded',radius:'pill',density:'comfortable',navSkin:'gradient',navPosition:'floating',navAlign:'right',navMode:'menu',hero:'bold',cards:'elevated',contentWidth:'wide',colors:{primary:'#0c4a6e',secondary:'#0369a1',accent:'#d59b38',signal:signalRed}}
  });

  const adminPresets = Object.freeze({
    control:{preset:'control',font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',sidebarWidth:'standard',topbar:'soft',contentWidth:'boxed',buttons:'solid',tables:'clean',cards:'elevated',colors:{primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:'#a63d40'}},
    civic:{preset:'civic',font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',sidebarWidth:'standard',topbar:'clean',contentWidth:'wide',buttons:'solid',tables:'clean',cards:'elevated',colors:{primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:'#a63d40'}},
    executive:{preset:'executive',font:'system',radius:'soft',density:'compact',sidebar:'dark',sidebarWidth:'compact',topbar:'soft',contentWidth:'boxed',buttons:'solid',tables:'striped',cards:'elevated',colors:{primary:'#1f2937',secondary:'#475569',accent:'#d6aa3c',signal:'#b33f46'}},
    modern:{preset:'modern',font:'rounded',radius:'pill',density:'comfortable',sidebar:'brand',sidebarWidth:'wide',topbar:'glass',contentWidth:'wide',buttons:'soft',tables:'clean',cards:'flat',colors:{primary:'#0f4c5c',secondary:'#168aad',accent:'#f4b942',signal:'#b33f46'}},
    minimal:{preset:'minimal',font:'system',radius:'square',density:'compact',sidebar:'light',sidebarWidth:'compact',topbar:'clean',contentWidth:'boxed',buttons:'outline',tables:'bordered',cards:'bordered',colors:{primary:'#334155',secondary:'#64748b',accent:'#d4a72c',signal:'#b33f46'}},
    clean:{preset:'clean',font:'system',radius:'soft',density:'comfortable',sidebar:'light',sidebarWidth:'standard',topbar:'soft',contentWidth:'wide',buttons:'soft',tables:'clean',cards:'flat',colors:{primary:'#14532d',secondary:'#3f8f5d',accent:'#d8b63e',signal:'#a63d40'}},
    classic:{preset:'classic',font:'serif',radius:'soft',density:'comfortable',sidebar:'dark',sidebarWidth:'wide',topbar:'soft',contentWidth:'boxed',buttons:'outline',tables:'bordered',cards:'bordered',colors:{primary:'#4c1d1d',secondary:'#7f1d1d',accent:'#c9a43b',signal:'#9f3438'}}
  });

  const choices = {
    public:{
      font:['system','rounded','serif'],radius:['square','soft','rounded','pill'],density:['comfortable','compact'],
      navSkin:['gradient','solid','glass'],navPosition:['top','left','floating'],navAlign:['left','center','right'],
      navMode:['links','menu'],hero:['bold','clean','soft','minimal','split','banner'],cards:['elevated','flat','bordered'],contentWidth:['wide','boxed']
    },
    admin:{
      font:['system','rounded','serif'],radius:['square','soft','rounded','pill'],density:['comfortable','compact'],
      sidebar:['brand','dark','light'],sidebarWidth:['compact','standard','wide'],topbar:['clean','soft','glass'],
      contentWidth:['wide','boxed'],buttons:['solid','soft','outline'],tables:['clean','striped','bordered'],cards:['elevated','flat','bordered']
    }
  };

  let lastPublicTheme = null;
  let resizeTimer = 0;

  const isHex = (value) => /^#[0-9a-f]{6}$/i.test(String(value || ''));
  const color = (value,fallback) => isHex(value) ? String(value).toLowerCase() : fallback;
  const pick = (value,allowed,fallback) => allowed.includes(value) ? value : fallback;

  function normalizeColors(input={}){
    return {
      primary:color(input.primary,COLOR_DEFAULTS.primary),secondary:color(input.secondary,COLOR_DEFAULTS.secondary),
      accent:color(input.accent,COLOR_DEFAULTS.accent),signal:color(input.signal||input.danger,COLOR_DEFAULTS.signal),surface:COLOR_DEFAULTS.surface
    };
  }

  function normalizeAdminColors(input={}){
    return {
      primary:color(input.primary,ADMIN_COLOR_DEFAULTS.primary),secondary:color(input.secondary,ADMIN_COLOR_DEFAULTS.secondary),
      accent:color(input.accent,ADMIN_COLOR_DEFAULTS.accent),signal:color(input.signal||input.danger,ADMIN_COLOR_DEFAULTS.signal)
    };
  }

  function normalizePublic(input={}){
    const navSkin = pick(input.navSkin||input.nav,choices.public.navSkin,PUBLIC_DEFAULT.navSkin);
    return {
      preset:String(input.preset||PUBLIC_DEFAULT.preset),font:pick(input.font,choices.public.font,PUBLIC_DEFAULT.font),
      radius:pick(input.radius,choices.public.radius,PUBLIC_DEFAULT.radius),density:pick(input.density,choices.public.density,PUBLIC_DEFAULT.density),
      navSkin,nav:navSkin,navPosition:pick(input.navPosition,choices.public.navPosition,PUBLIC_DEFAULT.navPosition),
      navAlign:pick(input.navAlign,choices.public.navAlign,PUBLIC_DEFAULT.navAlign),navMode:pick(input.navMode,choices.public.navMode,PUBLIC_DEFAULT.navMode),
      hero:pick(input.hero,choices.public.hero,PUBLIC_DEFAULT.hero),cards:pick(input.cards,choices.public.cards,PUBLIC_DEFAULT.cards),
      contentWidth:pick(input.contentWidth,choices.public.contentWidth,PUBLIC_DEFAULT.contentWidth),colors:normalizeColors(input.colors||{})
    };
  }

  function normalizeAdmin(input={}){
    return {
      preset:String(input.preset||ADMIN_DEFAULT.preset),font:pick(input.font,choices.admin.font,ADMIN_DEFAULT.font),
      radius:pick(input.radius,choices.admin.radius,ADMIN_DEFAULT.radius),density:pick(input.density,choices.admin.density,ADMIN_DEFAULT.density),
      sidebar:pick(input.sidebar,choices.admin.sidebar,ADMIN_DEFAULT.sidebar),sidebarWidth:pick(input.sidebarWidth,choices.admin.sidebarWidth,ADMIN_DEFAULT.sidebarWidth),
      topbar:pick(input.topbar,choices.admin.topbar,ADMIN_DEFAULT.topbar),contentWidth:pick(input.contentWidth,choices.admin.contentWidth,ADMIN_DEFAULT.contentWidth),
      buttons:pick(input.buttons,choices.admin.buttons,ADMIN_DEFAULT.buttons),tables:pick(input.tables,choices.admin.tables,ADMIN_DEFAULT.tables),
      cards:pick(input.cards,choices.admin.cards,ADMIN_DEFAULT.cards),colors:normalizeAdminColors(input.colors||{})
    };
  }

  function syncUiReady(){
    const root=document.documentElement;
    if(root.dataset.adminShellReady==='true'&&root.dataset.adminThemeReady==='true')root.dataset.adminUiReady='true';
  }

  function readCache(){
    try{
      const raw=localStorage.getItem(THEME_CACHE_KEY);if(!raw)return null;
      const parsed=JSON.parse(raw);if(parsed?.version!==THEME_SCHEMA_VERSION)return null;
      return parsed?.config&&typeof parsed.config==='object'?parsed.config:null;
    }catch{return null;}
  }

  function writeCache(config){
    try{
      localStorage.setItem(THEME_CACHE_KEY,JSON.stringify({version:THEME_SCHEMA_VERSION,savedAt:Date.now(),config}));
      LEGACY_THEME_CACHE_KEYS.forEach((key)=>localStorage.removeItem(key));
    }catch{}
  }

  function supportsAdvancedDesktopNav(){return window.innerWidth>=1200;}
  function effectiveNavPosition(requested){return window.innerWidth<1200?'top':requested;}

  function ensureStyles(){
    const adminPage=/\/(admin|editor)\//.test(location.pathname);
    const base=adminPage?'../assets/css/':'assets/css/';
    const add=(selector,datasetKey,file)=>{
      if(document.querySelector(selector))return;
      const link=document.createElement('link');link.rel='stylesheet';link.dataset[datasetKey]='true';link.href=`${base}${file}?v=${ASSET_VERSION}`;document.head.appendChild(link);
    };
    add('link[data-brgy-design-themes]','brgyDesignThemes','design-themes.css');
    add('link[data-brgy-design-layouts]','brgyDesignLayouts','design-layouts.css');
    if(adminPage)add('link[data-brgy-admin-theme-colors]','brgyAdminThemeColors','admin-theme-colors.css');
  }

  function syncStudioPresetUi(){
    if(!/\/admin\/design-studio\.html$/.test(location.pathname))return;
    const publicCount=document.querySelector('[data-studio-panel="public"] [data-preset-count]');
    const adminCount=document.querySelector('[data-studio-panel="admin"] [data-preset-count]');
    if(publicCount)publicCount.textContent=`${Object.keys(publicPresets).length} presets`;
    if(adminCount)adminCount.textContent=`${Object.keys(adminPresets).length} presets`;
  }

  function applyPublic(input={}){
    ensureStyles();
    const theme=normalizePublic(input),root=document.documentElement,desktop=window.innerWidth>=1200;
    const effectivePosition=effectiveNavPosition(theme.navPosition),effectiveMode=desktop?theme.navMode:'links',effectiveAlign=desktop?theme.navAlign:'right';
    const structure=window.innerWidth<BREAKPOINT?'mobile-locked':'desktop-wide';lastPublicTheme=theme;
    Object.assign(root.dataset,{publicPreset:theme.preset,publicFont:theme.font,publicRadius:theme.radius,publicDensity:theme.density,
      publicNav:theme.navSkin,publicNavSkin:theme.navSkin,publicNavRequested:theme.navPosition,publicNavPosition:effectivePosition,
      publicNavRequestedAlign:theme.navAlign,publicNavAlign:effectiveAlign,publicNavRequestedMode:theme.navMode,publicNavMode:effectiveMode,
      publicStructure:structure,publicResponsiveMode:structure,publicHero:theme.hero,publicCards:theme.cards,publicContentWidth:theme.contentWidth,publicThemeReady:'true'});
    root.style.setProperty('--brand-primary',theme.colors.primary);root.style.setProperty('--brand-secondary',theme.colors.secondary);
    root.style.setProperty('--brand-primary-dark',theme.colors.primary);root.style.setProperty('--brand-accent',theme.colors.accent);
    root.style.setProperty('--brand-signal',theme.colors.signal);root.style.setProperty('--brand-danger',theme.colors.signal);root.style.setProperty('--soft-bg',theme.colors.surface);
    return {...theme,effectiveNavPosition:effectivePosition,effectiveNavMode:effectiveMode,effectiveNavAlign:effectiveAlign};
  }

  function applyAdmin(input={}){
    ensureStyles();
    const theme=normalizeAdmin(input),root=document.documentElement;
    Object.assign(root.dataset,{adminPreset:theme.preset,adminFont:theme.font,adminRadius:theme.radius,adminDensity:theme.density,
      adminSidebar:theme.sidebar,adminSidebarWidth:theme.sidebarWidth,adminTopbar:theme.topbar,adminContentWidth:theme.contentWidth,
      adminButtons:theme.buttons,adminTables:theme.tables,adminCards:theme.cards,adminThemeReady:'true'});
    root.style.setProperty('--admin-primary',theme.colors.primary);root.style.setProperty('--admin-secondary',theme.colors.secondary);
    root.style.setProperty('--admin-accent',theme.colors.accent);root.style.setProperty('--admin-signal',theme.colors.signal);
    root.style.setProperty('--green',theme.colors.secondary);root.style.setProperty('--yellow',theme.colors.accent);root.style.setProperty('--danger',theme.colors.signal);
    syncUiReady();return theme;
  }

  function applyForCurrentPage(config={}){
    return /\/(admin|editor)\//.test(location.pathname)?applyAdmin(config.admin||{}):applyPublic(config.public||{});
  }

  async function load(client,scope='admin'){
    const cached=readCache();if(cached)(scope==='public'?applyPublic(cached.public||{}):applyAdmin(cached.admin||{}));
    if(!client){
      if(cached)return scope==='public'?normalizePublic(cached.public||{}):normalizeAdmin(cached.admin||{});
      return scope==='public'?applyPublic():applyAdmin();
    }
    try{
      const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();if(error)throw error;
      const config=data?.design_theme||{};
      const normalized={version:THEME_SCHEMA_VERSION,public:normalizePublic(config.public||{}),admin:normalizeAdmin(config.admin||{})};
      writeCache(normalized);return scope==='public'?applyPublic(normalized.public):applyAdmin(normalized.admin);
    }catch(error){
      console.warn('Design theme refresh failed; using last known theme:',error);
      if(cached)return scope==='public'?normalizePublic(cached.public||{}):normalizeAdmin(cached.admin||{});
      return scope==='public'?applyPublic():applyAdmin();
    }
  }

  window.addEventListener('storage',(event)=>{
    if(event.key!==THEME_CACHE_KEY||!event.newValue)return;
    try{const parsed=JSON.parse(event.newValue);if(parsed?.version!==THEME_SCHEMA_VERSION||!parsed?.config)return;applyForCurrentPage(parsed.config);}catch{}
  });

  window.addEventListener('resize',()=>{
    if(!lastPublicTheme)return;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>applyPublic(lastPublicTheme),80);
  },{passive:true});

  window.BRGY_THEME=Object.freeze({
    THEME_SCHEMA_VERSION,THEME_CACHE_KEY,COLOR_DEFAULTS,ADMIN_COLOR_DEFAULTS,PUBLIC_DEFAULT,ADMIN_DEFAULT,publicPresets,adminPresets,
    normalizeColors,normalizeAdminColors,normalizePublic,normalizeAdmin,effectiveNavPosition,supportsAdvancedDesktopNav,
    applyPublic,applyAdmin,applyForCurrentPage,load,ensureStyles,readCache,writeCache,syncStudioPresetUi
  });

  ensureStyles();syncStudioPresetUi();
  const cachedAtBoot=readCache();if(cachedAtBoot)applyForCurrentPage(cachedAtBoot);
  if(/\/(admin|editor)\//.test(location.pathname)){
    const boot=()=>load(window.BRGY_SUPABASE,'admin');
    document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
  }
})();

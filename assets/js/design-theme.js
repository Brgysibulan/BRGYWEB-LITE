(() => {
  'use strict';

  const THEME_SCHEMA_VERSION = 9;
  const THEME_CACHE_KEY = 'brgyweb:design-theme:v9';
  const LEGACY_THEME_CACHE_KEYS = ['brgyweb:design-theme:v8','brgyweb:design-theme:v7','brgyweb:design-theme:v6','brgyweb:design-theme:v1'];
  const ASSET_VERSION = '20260901-studiopro1';
  const BREAKPOINT = 900;

  const COLOR_DEFAULTS = Object.freeze({primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:'#a63d40',surface:'#f5f8f5'});
  const ADMIN_COLOR_DEFAULTS = Object.freeze({primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:'#a63d40'});

  const PUBLIC_DEFAULT = Object.freeze({
    preset:'civic-premium',font:'system',radius:'rounded',density:'comfortable',navSkin:'gradient',navPosition:'top',navAlign:'right',navMode:'links',hero:'bold',cards:'elevated',contentWidth:'wide',colors:{...COLOR_DEFAULTS}
  });
  const ADMIN_DEFAULT = Object.freeze({
    preset:'civic-premium',font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',sidebarWidth:'standard',topbar:'soft',contentWidth:'wide',buttons:'solid',tables:'clean',cards:'elevated',colors:{...ADMIN_COLOR_DEFAULTS}
  });

  const PALETTES = Object.freeze({
    'emerald-gold':{name:'Emerald + Gold',colors:{primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:'#a63d40'}},
    'forest-cream':{name:'Forest + Cream',colors:{primary:'#123524',secondary:'#2f6b46',accent:'#d7c79a',signal:'#a13e43'}},
    'navy-gold':{name:'Navy + Gold',colors:{primary:'#14213d',secondary:'#244a7c',accent:'#d6ad4a',signal:'#a63d40'}},
    'teal-sand':{name:'Teal + Sand',colors:{primary:'#123f45',secondary:'#2b7a78',accent:'#d8b27a',signal:'#a63d40'}},
    'maroon-gold':{name:'Maroon + Gold',colors:{primary:'#4a1f28',secondary:'#7a2f3d',accent:'#c9a44c',signal:'#a63d40'}},
    'slate-amber':{name:'Slate + Amber',colors:{primary:'#1f2937',secondary:'#475569',accent:'#d6a23b',signal:'#b13f46'}},
    'royal-blue':{name:'Royal Blue',colors:{primary:'#172554',secondary:'#1d4ed8',accent:'#d9ad42',signal:'#b33f46'}},
    'charcoal-gold':{name:'Charcoal + Gold',colors:{primary:'#20262b',secondary:'#3c4650',accent:'#cba64b',signal:'#a9444b'}},
    'olive-brass':{name:'Olive + Brass',colors:{primary:'#303c24',secondary:'#607544',accent:'#c7a957',signal:'#a04a45'}},
    'civic-blue':{name:'Civic Blue',colors:{primary:'#103a5a',secondary:'#1f6f9b',accent:'#e0b64a',signal:'#a63d40'}},
    'plum-gold':{name:'Plum + Gold',colors:{primary:'#3f2746',secondary:'#76507d',accent:'#d2ad53',signal:'#a63d40'}},
    'fresh-green':{name:'Fresh Green',colors:{primary:'#14532d',secondary:'#2f855a',accent:'#d7b84d',signal:'#a63d40'}}
  });

  const DESIGN_PACKS = Object.freeze({
    'civic-premium':{name:'Civic Premium',tag:'Signature',description:'Floating glass header, split hero, polished elevated surfaces.',public:{font:'system',radius:'rounded',density:'comfortable',navSkin:'glass',navPosition:'floating',navAlign:'right',navMode:'links',hero:'split',cards:'elevated',contentWidth:'wide'},admin:{font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',sidebarWidth:'standard',topbar:'glass',contentWidth:'wide',buttons:'soft',tables:'clean',cards:'elevated'}},
    'civic-standard':{name:'Civic Standard',tag:'Official',description:'Clean government portal with a strong top navigation.',public:{font:'system',radius:'rounded',density:'comfortable',navSkin:'gradient',navPosition:'top',navAlign:'right',navMode:'links',hero:'bold',cards:'elevated',contentWidth:'wide'},admin:{font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',sidebarWidth:'standard',topbar:'soft',contentWidth:'wide',buttons:'solid',tables:'clean',cards:'elevated'}},
    'modern-center':{name:'Modern Center',tag:'Modern',description:'Centered glass navigation with soft premium geometry.',public:{font:'rounded',radius:'pill',density:'comfortable',navSkin:'glass',navPosition:'top',navAlign:'center',navMode:'links',hero:'soft',cards:'elevated',contentWidth:'boxed'},admin:{font:'rounded',radius:'pill',density:'comfortable',sidebar:'brand',sidebarWidth:'wide',topbar:'glass',contentWidth:'wide',buttons:'soft',tables:'clean',cards:'flat'}},
    'executive-portal':{name:'Executive Portal',tag:'Executive',description:'Formal top navigation with compact professional spacing.',public:{font:'system',radius:'soft',density:'compact',navSkin:'solid',navPosition:'top',navAlign:'left',navMode:'links',hero:'clean',cards:'flat',contentWidth:'wide'},admin:{font:'system',radius:'soft',density:'compact',sidebar:'dark',sidebarWidth:'compact',topbar:'soft',contentWidth:'boxed',buttons:'solid',tables:'striped',cards:'elevated'}},
    'floating-luxury':{name:'Floating Luxury',tag:'Premium',description:'Centered floating glass navigation with a split composition.',public:{font:'rounded',radius:'rounded',density:'comfortable',navSkin:'glass',navPosition:'floating',navAlign:'center',navMode:'links',hero:'split',cards:'elevated',contentWidth:'boxed'},admin:{font:'rounded',radius:'rounded',density:'comfortable',sidebar:'brand',sidebarWidth:'wide',topbar:'glass',contentWidth:'boxed',buttons:'soft',tables:'clean',cards:'elevated'}},
    'minimal-authority':{name:'Minimal Authority',tag:'Minimal',description:'Sharp, restrained and content-first for official information.',public:{font:'system',radius:'square',density:'compact',navSkin:'solid',navPosition:'top',navAlign:'right',navMode:'links',hero:'minimal',cards:'bordered',contentWidth:'boxed'},admin:{font:'system',radius:'square',density:'compact',sidebar:'light',sidebarWidth:'compact',topbar:'clean',contentWidth:'boxed',buttons:'outline',tables:'bordered',cards:'bordered'}},
    'heritage-classic':{name:'Heritage Classic',tag:'Classic',description:'Traditional serif identity with a formal banner treatment.',public:{font:'serif',radius:'soft',density:'comfortable',navSkin:'solid',navPosition:'top',navAlign:'center',navMode:'links',hero:'banner',cards:'bordered',contentWidth:'boxed'},admin:{font:'serif',radius:'soft',density:'comfortable',sidebar:'dark',sidebarWidth:'wide',topbar:'soft',contentWidth:'boxed',buttons:'outline',tables:'bordered',cards:'bordered'}},
    'forest-professional':{name:'Forest Professional',tag:'Professional',description:'Compact forest civic style with clear information hierarchy.',public:{font:'system',radius:'soft',density:'compact',navSkin:'gradient',navPosition:'top',navAlign:'left',navMode:'links',hero:'minimal',cards:'flat',contentWidth:'wide'},admin:{font:'system',radius:'soft',density:'compact',sidebar:'brand',sidebarWidth:'compact',topbar:'soft',contentWidth:'wide',buttons:'solid',tables:'clean',cards:'flat'}},
    'bold-civic':{name:'Bold Civic',tag:'Bold',description:'Strong floating header and high-impact hero presentation.',public:{font:'rounded',radius:'pill',density:'comfortable',navSkin:'gradient',navPosition:'floating',navAlign:'right',navMode:'links',hero:'bold',cards:'elevated',contentWidth:'wide'},admin:{font:'rounded',radius:'rounded',density:'comfortable',sidebar:'brand',sidebarWidth:'standard',topbar:'glass',contentWidth:'wide',buttons:'solid',tables:'clean',cards:'elevated'}},
    'clean-institutional':{name:'Clean Institutional',tag:'Clean',description:'Quiet top navigation with flat surfaces and clear spacing.',public:{font:'system',radius:'soft',density:'comfortable',navSkin:'solid',navPosition:'top',navAlign:'left',navMode:'links',hero:'clean',cards:'flat',contentWidth:'wide'},admin:{font:'system',radius:'soft',density:'comfortable',sidebar:'light',sidebarWidth:'standard',topbar:'clean',contentWidth:'wide',buttons:'soft',tables:'clean',cards:'flat'}},
    'editorial-civic':{name:'Editorial Civic',tag:'Editorial',description:'Serif-led public pages with an editorial government feel.',public:{font:'serif',radius:'soft',density:'comfortable',navSkin:'glass',navPosition:'top',navAlign:'left',navMode:'links',hero:'soft',cards:'bordered',contentWidth:'boxed'},admin:{font:'serif',radius:'soft',density:'comfortable',sidebar:'light',sidebarWidth:'wide',topbar:'soft',contentWidth:'boxed',buttons:'outline',tables:'bordered',cards:'bordered'}},
    'navy-command':{name:'Navy Command',tag:'Command',description:'Formal navy-style structure with compact operational dashboard.',public:{font:'system',radius:'rounded',density:'compact',navSkin:'solid',navPosition:'top',navAlign:'left',navMode:'links',hero:'bold',cards:'elevated',contentWidth:'wide'},admin:{font:'system',radius:'rounded',density:'compact',sidebar:'dark',sidebarWidth:'standard',topbar:'soft',contentWidth:'wide',buttons:'solid',tables:'striped',cards:'elevated'}},
    'teal-horizon':{name:'Teal Horizon',tag:'Fresh',description:'Airy floating glass interface with soft modern sections.',public:{font:'rounded',radius:'rounded',density:'comfortable',navSkin:'glass',navPosition:'floating',navAlign:'center',navMode:'links',hero:'soft',cards:'elevated',contentWidth:'wide'},admin:{font:'rounded',radius:'rounded',density:'comfortable',sidebar:'brand',sidebarWidth:'wide',topbar:'glass',contentWidth:'wide',buttons:'soft',tables:'clean',cards:'elevated'}},
    'formal-gold':{name:'Formal Gold',tag:'Formal',description:'Centered formal navigation and banner-style authority.',public:{font:'serif',radius:'rounded',density:'comfortable',navSkin:'gradient',navPosition:'top',navAlign:'center',navMode:'links',hero:'banner',cards:'elevated',contentWidth:'boxed'},admin:{font:'serif',radius:'rounded',density:'comfortable',sidebar:'dark',sidebarWidth:'wide',topbar:'soft',contentWidth:'boxed',buttons:'outline',tables:'clean',cards:'elevated'}},
    'airy-modern':{name:'Airy Modern',tag:'Airy',description:'Light glass navigation and generous modern whitespace.',public:{font:'rounded',radius:'pill',density:'comfortable',navSkin:'glass',navPosition:'top',navAlign:'center',navMode:'links',hero:'clean',cards:'flat',contentWidth:'boxed'},admin:{font:'rounded',radius:'pill',density:'comfortable',sidebar:'light',sidebarWidth:'wide',topbar:'glass',contentWidth:'wide',buttons:'soft',tables:'clean',cards:'flat'}},
    'compact-professional':{name:'Compact Professional',tag:'Compact',description:'Dense official workspace for fast scanning and operations.',public:{font:'system',radius:'square',density:'compact',navSkin:'solid',navPosition:'top',navAlign:'left',navMode:'links',hero:'clean',cards:'flat',contentWidth:'boxed'},admin:{font:'system',radius:'square',density:'compact',sidebar:'brand',sidebarWidth:'compact',topbar:'clean',contentWidth:'boxed',buttons:'solid',tables:'bordered',cards:'flat'}},
    'wide-portal':{name:'Wide Portal',tag:'Wide',description:'Wide civic layout designed for information-rich home pages.',public:{font:'system',radius:'rounded',density:'comfortable',navSkin:'gradient',navPosition:'top',navAlign:'left',navMode:'links',hero:'split',cards:'elevated',contentWidth:'wide'},admin:{font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',sidebarWidth:'wide',topbar:'soft',contentWidth:'wide',buttons:'solid',tables:'striped',cards:'elevated'}},
    'glass-government':{name:'Glass Government',tag:'Glass',description:'Floating translucent navigation with clean official surfaces.',public:{font:'system',radius:'pill',density:'comfortable',navSkin:'glass',navPosition:'floating',navAlign:'right',navMode:'links',hero:'clean',cards:'flat',contentWidth:'wide'},admin:{font:'system',radius:'pill',density:'comfortable',sidebar:'brand',sidebarWidth:'standard',topbar:'glass',contentWidth:'wide',buttons:'soft',tables:'clean',cards:'flat'}},
    'premium-minimal':{name:'Premium Minimal',tag:'Premium',description:'Minimal structure refined with premium spacing and elevation.',public:{font:'system',radius:'soft',density:'comfortable',navSkin:'solid',navPosition:'top',navAlign:'center',navMode:'links',hero:'minimal',cards:'elevated',contentWidth:'boxed'},admin:{font:'system',radius:'soft',density:'comfortable',sidebar:'light',sidebarWidth:'standard',topbar:'soft',contentWidth:'boxed',buttons:'outline',tables:'clean',cards:'elevated'}},
    'civic-signature':{name:'Civic Signature',tag:'Signature',description:'Balanced floating civic design for a polished flagship portal.',public:{font:'system',radius:'rounded',density:'comfortable',navSkin:'gradient',navPosition:'floating',navAlign:'center',navMode:'links',hero:'bold',cards:'elevated',contentWidth:'boxed'},admin:{font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',sidebarWidth:'standard',topbar:'soft',contentWidth:'boxed',buttons:'solid',tables:'clean',cards:'elevated'}}
  });

  const choices={
    public:{font:['system','rounded','serif'],radius:['square','soft','rounded','pill'],density:['comfortable','compact'],navSkin:['gradient','solid','glass'],navPosition:['top','left','floating'],navAlign:['left','center','right'],navMode:['links','menu'],hero:['bold','clean','soft','minimal','split','banner'],cards:['elevated','flat','bordered'],contentWidth:['wide','boxed']},
    admin:{font:['system','rounded','serif'],radius:['square','soft','rounded','pill'],density:['comfortable','compact'],sidebar:['brand','dark','light'],sidebarWidth:['compact','standard','wide'],topbar:['clean','soft','glass'],contentWidth:['wide','boxed'],buttons:['solid','soft','outline'],tables:['clean','striped','bordered'],cards:['elevated','flat','bordered']}
  };

  const isHex=(value)=>/^#[0-9a-f]{6}$/i.test(String(value||''));
  const color=(value,fallback)=>isHex(value)?String(value).toLowerCase():fallback;
  const pick=(value,allowed,fallback)=>allowed.includes(value)?value:fallback;
  let lastPublicTheme=null;
  let resizeTimer=0;

  function normalizeColors(input={}){return {primary:color(input.primary,COLOR_DEFAULTS.primary),secondary:color(input.secondary,COLOR_DEFAULTS.secondary),accent:color(input.accent,COLOR_DEFAULTS.accent),signal:color(input.signal||input.danger,COLOR_DEFAULTS.signal),surface:COLOR_DEFAULTS.surface};}
  function normalizeAdminColors(input={}){return {primary:color(input.primary,ADMIN_COLOR_DEFAULTS.primary),secondary:color(input.secondary,ADMIN_COLOR_DEFAULTS.secondary),accent:color(input.accent,ADMIN_COLOR_DEFAULTS.accent),signal:color(input.signal||input.danger,ADMIN_COLOR_DEFAULTS.signal)};}

  function normalizePublic(input={}){
    const navSkin=pick(input.navSkin||input.nav,choices.public.navSkin,PUBLIC_DEFAULT.navSkin);
    return {preset:String(input.preset||PUBLIC_DEFAULT.preset),font:pick(input.font,choices.public.font,PUBLIC_DEFAULT.font),radius:pick(input.radius,choices.public.radius,PUBLIC_DEFAULT.radius),density:pick(input.density,choices.public.density,PUBLIC_DEFAULT.density),navSkin,nav:navSkin,navPosition:pick(input.navPosition,choices.public.navPosition,PUBLIC_DEFAULT.navPosition),navAlign:pick(input.navAlign,choices.public.navAlign,PUBLIC_DEFAULT.navAlign),navMode:pick(input.navMode,choices.public.navMode,PUBLIC_DEFAULT.navMode),hero:pick(input.hero,choices.public.hero,PUBLIC_DEFAULT.hero),cards:pick(input.cards,choices.public.cards,PUBLIC_DEFAULT.cards),contentWidth:pick(input.contentWidth,choices.public.contentWidth,PUBLIC_DEFAULT.contentWidth),colors:normalizeColors(input.colors||{})};
  }

  function normalizeAdmin(input={}){
    return {preset:String(input.preset||ADMIN_DEFAULT.preset),font:pick(input.font,choices.admin.font,ADMIN_DEFAULT.font),radius:pick(input.radius,choices.admin.radius,ADMIN_DEFAULT.radius),density:pick(input.density,choices.admin.density,ADMIN_DEFAULT.density),sidebar:pick(input.sidebar,choices.admin.sidebar,ADMIN_DEFAULT.sidebar),sidebarWidth:pick(input.sidebarWidth,choices.admin.sidebarWidth,ADMIN_DEFAULT.sidebarWidth),topbar:pick(input.topbar,choices.admin.topbar,ADMIN_DEFAULT.topbar),contentWidth:pick(input.contentWidth,choices.admin.contentWidth,ADMIN_DEFAULT.contentWidth),buttons:pick(input.buttons,choices.admin.buttons,ADMIN_DEFAULT.buttons),tables:pick(input.tables,choices.admin.tables,ADMIN_DEFAULT.tables),cards:pick(input.cards,choices.admin.cards,ADMIN_DEFAULT.cards),colors:normalizeAdminColors(input.colors||{})};
  }

  function normalizeConfig(input={}){
    return {version:THEME_SCHEMA_VERSION,pack:DESIGN_PACKS[input.pack]?input.pack:'',palette:PALETTES[input.palette]?input.palette:(input.palette==='custom'?'custom':''),public:normalizePublic(input.public||{}),admin:normalizeAdmin(input.admin||{})};
  }

  function composePack(packId='civic-premium',paletteId='emerald-gold',customColors=null){
    const pack=DESIGN_PACKS[packId]||DESIGN_PACKS['civic-premium'];
    const colors=paletteId==='custom'&&customColors?normalizeColors(customColors):normalizeColors((PALETTES[paletteId]||PALETTES['emerald-gold']).colors);
    const adminColors=normalizeAdminColors(colors);
    return {version:THEME_SCHEMA_VERSION,pack:DESIGN_PACKS[packId]?packId:'civic-premium',palette:paletteId==='custom'?'custom':(PALETTES[paletteId]?paletteId:'emerald-gold'),public:normalizePublic({...pack.public,preset:DESIGN_PACKS[packId]?packId:'civic-premium',colors}),admin:normalizeAdmin({...pack.admin,preset:DESIGN_PACKS[packId]?packId:'civic-premium',colors:adminColors})};
  }

  function structureOnlyPublic(input={}){const t=normalizePublic(input);return [t.font,t.radius,t.density,t.navSkin,t.navPosition,t.navAlign,t.navMode,t.hero,t.cards,t.contentWidth].join('|');}
  function structureOnlyAdmin(input={}){const t=normalizeAdmin(input);return [t.font,t.radius,t.density,t.sidebar,t.sidebarWidth,t.topbar,t.contentWidth,t.buttons,t.tables,t.cards].join('|');}
  function matchPack(publicTheme,adminTheme){
    const p=structureOnlyPublic(publicTheme),a=structureOnlyAdmin(adminTheme);
    for(const [id,pack] of Object.entries(DESIGN_PACKS)){
      if(structureOnlyPublic({...pack.public,preset:id})===p&&structureOnlyAdmin({...pack.admin,preset:id})===a)return id;
    }
    return '';
  }
  function matchPalette(colors={}){
    const c=normalizeColors(colors);
    for(const [id,p] of Object.entries(PALETTES)){
      const pc=normalizeColors(p.colors);
      if(['primary','secondary','accent','signal'].every((key)=>c[key]===pc[key]))return id;
    }
    return 'custom';
  }

  function readCache(){try{const raw=localStorage.getItem(THEME_CACHE_KEY);if(!raw)return null;const parsed=JSON.parse(raw);if(parsed?.version!==THEME_SCHEMA_VERSION)return null;return parsed?.config&&typeof parsed.config==='object'?normalizeConfig(parsed.config):null;}catch{return null;}}
  function writeCache(config){try{const normalized=normalizeConfig(config);localStorage.setItem(THEME_CACHE_KEY,JSON.stringify({version:THEME_SCHEMA_VERSION,savedAt:Date.now(),config:normalized}));LEGACY_THEME_CACHE_KEYS.forEach((key)=>localStorage.removeItem(key));}catch{}}
  function supportsAdvancedDesktopNav(){return window.innerWidth>=BREAKPOINT;}
  function effectiveNavPosition(requested){return window.innerWidth<BREAKPOINT?'top':requested;}

  function ensureStyles(){
    const adminPage=/\/(admin|editor)\//.test(location.pathname);const base=adminPage?'../assets/css/':'assets/css/';
    const add=(selector,datasetKey,file)=>{let link=document.querySelector(selector);const href=`${base}${file}?v=${ASSET_VERSION}`;if(!link){link=document.createElement('link');link.rel='stylesheet';link.dataset[datasetKey]='true';document.head.appendChild(link);}if(!link.href.includes(ASSET_VERSION))link.href=href;};
    add('link[data-brgy-design-themes]','brgyDesignThemes','design-themes.css');
    add('link[data-brgy-design-layouts]','brgyDesignLayouts','design-layouts.css');
    if(adminPage)add('link[data-brgy-admin-theme-colors]','brgyAdminThemeColors','admin-theme-colors.css');
  }

  function syncUiReady(){const root=document.documentElement;if(root.dataset.adminShellReady==='true'&&root.dataset.adminThemeReady==='true')root.dataset.adminUiReady='true';}

  function applyPublic(input={}){
    ensureStyles();const theme=normalizePublic(input),root=document.documentElement,desktop=window.innerWidth>=BREAKPOINT;
    const effectivePosition=effectiveNavPosition(theme.navPosition),effectiveMode=desktop?theme.navMode:'links',effectiveAlign=desktop?theme.navAlign:'right';
    const structure=window.innerWidth<BREAKPOINT?'mobile-locked':'desktop-wide';lastPublicTheme=theme;
    Object.assign(root.dataset,{publicPreset:theme.preset,publicFont:theme.font,publicRadius:theme.radius,publicDensity:theme.density,publicNav:theme.navSkin,publicNavSkin:theme.navSkin,publicNavRequested:theme.navPosition,publicNavPosition:effectivePosition,publicNavRequestedAlign:theme.navAlign,publicNavAlign:effectiveAlign,publicNavRequestedMode:theme.navMode,publicNavMode:effectiveMode,publicStructure:structure,publicResponsiveMode:structure,publicHero:theme.hero,publicCards:theme.cards,publicContentWidth:theme.contentWidth,publicThemeReady:'true'});
    root.style.setProperty('--brand-primary',theme.colors.primary);root.style.setProperty('--brand-secondary',theme.colors.secondary);root.style.setProperty('--brand-primary-dark',theme.colors.primary);root.style.setProperty('--brand-accent',theme.colors.accent);root.style.setProperty('--brand-signal',theme.colors.signal);root.style.setProperty('--brand-danger',theme.colors.signal);root.style.setProperty('--soft-bg',theme.colors.surface);
    return {...theme,effectiveNavPosition:effectivePosition,effectiveNavMode:effectiveMode,effectiveNavAlign:effectiveAlign};
  }

  function applyAdmin(input={}){
    ensureStyles();const theme=normalizeAdmin(input),root=document.documentElement;
    Object.assign(root.dataset,{adminPreset:theme.preset,adminFont:theme.font,adminRadius:theme.radius,adminDensity:theme.density,adminSidebar:theme.sidebar,adminSidebarWidth:theme.sidebarWidth,adminTopbar:theme.topbar,adminContentWidth:theme.contentWidth,adminButtons:theme.buttons,adminTables:theme.tables,adminCards:theme.cards,adminThemeReady:'true'});
    root.style.setProperty('--admin-primary',theme.colors.primary);root.style.setProperty('--admin-secondary',theme.colors.secondary);root.style.setProperty('--admin-accent',theme.colors.accent);root.style.setProperty('--admin-signal',theme.colors.signal);root.style.setProperty('--green',theme.colors.secondary);root.style.setProperty('--yellow',theme.colors.accent);root.style.setProperty('--danger',theme.colors.signal);syncUiReady();return theme;
  }

  function applyForCurrentPage(config={}){const normalized=normalizeConfig(config);return /\/(admin|editor)\//.test(location.pathname)?applyAdmin(normalized.admin):applyPublic(normalized.public);}

  async function load(client,scope='admin'){
    const cached=readCache();if(cached)(scope==='public'?applyPublic(cached.public):applyAdmin(cached.admin));
    if(!client){if(cached)return scope==='public'?cached.public:cached.admin;return scope==='public'?applyPublic():applyAdmin();}
    try{
      const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();if(error)throw error;
      const normalized=normalizeConfig(data?.design_theme||{});writeCache(normalized);return scope==='public'?applyPublic(normalized.public):applyAdmin(normalized.admin);
    }catch(error){console.warn('Design theme refresh failed; using last known theme:',error);if(cached)return scope==='public'?cached.public:cached.admin;return scope==='public'?applyPublic():applyAdmin();}
  }

  window.addEventListener('storage',(event)=>{if(event.key!==THEME_CACHE_KEY||!event.newValue)return;try{const parsed=JSON.parse(event.newValue);if(parsed?.version!==THEME_SCHEMA_VERSION||!parsed?.config)return;applyForCurrentPage(parsed.config);}catch{}});
  window.addEventListener('resize',()=>{if(!lastPublicTheme)return;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>applyPublic(lastPublicTheme),80);},{passive:true});

  const publicPresets=Object.freeze(Object.fromEntries(Object.entries(DESIGN_PACKS).map(([id,pack])=>[id,normalizePublic({...pack.public,preset:id})])));
  const adminPresets=Object.freeze(Object.fromEntries(Object.entries(DESIGN_PACKS).map(([id,pack])=>[id,normalizeAdmin({...pack.admin,preset:id})])));

  window.BRGY_THEME=Object.freeze({THEME_SCHEMA_VERSION,THEME_CACHE_KEY,COLOR_DEFAULTS,ADMIN_COLOR_DEFAULTS,PUBLIC_DEFAULT,ADMIN_DEFAULT,PALETTES,DESIGN_PACKS,publicPresets,adminPresets,normalizeColors,normalizeAdminColors,normalizePublic,normalizeAdmin,normalizeConfig,composePack,matchPack,matchPalette,effectiveNavPosition,supportsAdvancedDesktopNav,applyPublic,applyAdmin,applyForCurrentPage,load,ensureStyles,readCache,writeCache});

  ensureStyles();
  const cachedAtBoot=readCache();if(cachedAtBoot)applyForCurrentPage(cachedAtBoot);
  if(/\/(admin|editor)\//.test(location.pathname)){
    const boot=()=>load(window.BRGY_SUPABASE,'admin');
    document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
  }
})();
(() => {
  'use strict';

  const THEME_CACHE_KEY = 'brgyweb:design-theme:v1';
  const ASSET_VERSION = '20260901-studio5';
  const COLOR_DEFAULTS = Object.freeze({
    primary:'#0b2f21',
    secondary:'#1b6b45',
    accent:'#d8b63e',
    signal:'#a63d40',
    surface:'#f5f8f5'
  });
  let lastPublicTheme = null;
  let resizeTimer = 0;

  const PUBLIC_DEFAULT = Object.freeze({
    preset:'civic',font:'system',radius:'rounded',density:'comfortable',
    navSkin:'gradient',navPosition:'top',navAlign:'right',navMode:'links',
    hero:'bold',cards:'elevated',contentWidth:'wide',colors:{...COLOR_DEFAULTS}
  });
  const ADMIN_DEFAULT = Object.freeze({preset:'civic',font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',cards:'elevated'});

  const signalRed = COLOR_DEFAULTS.signal;
  const publicPresets = Object.freeze({
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
    civic:{preset:'civic',font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',cards:'elevated'},
    executive:{preset:'executive',font:'system',radius:'soft',density:'compact',sidebar:'dark',cards:'elevated'},
    modern:{preset:'modern',font:'rounded',radius:'pill',density:'comfortable',sidebar:'brand',cards:'flat'},
    minimal:{preset:'minimal',font:'system',radius:'square',density:'compact',sidebar:'light',cards:'bordered'},
    clean:{preset:'clean',font:'system',radius:'soft',density:'comfortable',sidebar:'light',cards:'flat'},
    classic:{preset:'classic',font:'serif',radius:'soft',density:'comfortable',sidebar:'dark',cards:'bordered'}
  });

  const choices={
    public:{font:['system','rounded','serif'],radius:['square','soft','rounded','pill'],density:['comfortable','compact'],navSkin:['gradient','solid','glass'],navPosition:['top','left','floating'],navAlign:['left','center','right'],navMode:['links','menu'],hero:['bold','clean','soft','minimal','split','banner'],cards:['elevated','flat','bordered'],contentWidth:['wide','boxed']},
    admin:{font:['system','rounded','serif'],radius:['square','soft','rounded','pill'],density:['comfortable','compact'],sidebar:['brand','dark','light'],cards:['elevated','flat','bordered']}
  };

  const isHex=(v)=>/^#[0-9a-f]{6}$/i.test(String(v||''));
  const color=(v,fallback)=>isHex(v)?String(v).toLowerCase():fallback;
  const pick=(value,allowed,fallback)=>allowed.includes(value)?value:fallback;

  function syncUiReady(){const root=document.documentElement;if(root.dataset.adminShellReady==='true'&&root.dataset.adminThemeReady==='true')root.dataset.adminUiReady='true';}
  function readCache(){try{const raw=localStorage.getItem(THEME_CACHE_KEY);if(!raw)return null;const parsed=JSON.parse(raw);const config=parsed?.config||parsed;return config&&typeof config==='object'?config:null;}catch{return null;}}
  function writeCache(config){try{localStorage.setItem(THEME_CACHE_KEY,JSON.stringify({version:5,savedAt:Date.now(),config}));}catch{}}
  function normalizeColors(input={}){
    return {
      primary:color(input.primary,COLOR_DEFAULTS.primary),
      secondary:color(input.secondary,COLOR_DEFAULTS.secondary),
      accent:color(input.accent,COLOR_DEFAULTS.accent),
      signal:color(input.signal||input.danger,COLOR_DEFAULTS.signal),
      surface:COLOR_DEFAULTS.surface
    };
  }

  function normalizePublic(input={}){
    const navSkin=pick(input.navSkin||input.nav,choices.public.navSkin,PUBLIC_DEFAULT.navSkin);
    return {preset:String(input.preset||PUBLIC_DEFAULT.preset),font:pick(input.font,choices.public.font,PUBLIC_DEFAULT.font),radius:pick(input.radius,choices.public.radius,PUBLIC_DEFAULT.radius),density:pick(input.density,choices.public.density,PUBLIC_DEFAULT.density),navSkin,nav:navSkin,navPosition:pick(input.navPosition,choices.public.navPosition,PUBLIC_DEFAULT.navPosition),navAlign:pick(input.navAlign,choices.public.navAlign,PUBLIC_DEFAULT.navAlign),navMode:pick(input.navMode,choices.public.navMode,PUBLIC_DEFAULT.navMode),hero:pick(input.hero,choices.public.hero,PUBLIC_DEFAULT.hero),cards:pick(input.cards,choices.public.cards,PUBLIC_DEFAULT.cards),contentWidth:pick(input.contentWidth,choices.public.contentWidth,PUBLIC_DEFAULT.contentWidth),colors:normalizeColors(input.colors||{})};
  }
  function normalizeAdmin(input={}){return {preset:String(input.preset||ADMIN_DEFAULT.preset),font:pick(input.font,choices.admin.font,ADMIN_DEFAULT.font),radius:pick(input.radius,choices.admin.radius,ADMIN_DEFAULT.radius),density:pick(input.density,choices.admin.density,ADMIN_DEFAULT.density),sidebar:pick(input.sidebar,choices.admin.sidebar,ADMIN_DEFAULT.sidebar),cards:pick(input.cards,choices.admin.cards,ADMIN_DEFAULT.cards)};}

  function isTouchLike(){return navigator.maxTouchPoints>0||window.matchMedia('(hover:none), (pointer:coarse)').matches;}
  function supportsAdvancedDesktopNav(){return !isTouchLike()&&window.matchMedia('(min-width:1366px) and (hover:hover) and (pointer:fine)').matches;}
  function effectiveNavPosition(requested){if(requested==='top')return 'top';return supportsAdvancedDesktopNav()?requested:'top';}

  function ensureStyles(){
    if(!document.querySelector('link[data-brgy-design-themes]')){const link=document.createElement('link');link.rel='stylesheet';link.dataset.brgyDesignThemes='true';link.href=/\/(admin|editor)\//.test(location.pathname)?`../assets/css/design-themes.css?v=${ASSET_VERSION}`:`assets/css/design-themes.css?v=${ASSET_VERSION}`;document.head.appendChild(link);}
    if(!document.querySelector('link[data-brgy-design-layouts]')){const link=document.createElement('link');link.rel='stylesheet';link.dataset.brgyDesignLayouts='true';link.href=/\/(admin|editor)\//.test(location.pathname)?`../assets/css/design-layouts.css?v=${ASSET_VERSION}`:`assets/css/design-layouts.css?v=${ASSET_VERSION}`;document.head.appendChild(link);}
  }

  function applyPublic(input={}){
    ensureStyles();
    const theme=normalizePublic(input),root=document.documentElement,effectivePosition=effectiveNavPosition(theme.navPosition);
    lastPublicTheme=theme;
    root.dataset.publicFont=theme.font;root.dataset.publicRadius=theme.radius;root.dataset.publicDensity=theme.density;root.dataset.publicNav=theme.navSkin;root.dataset.publicNavSkin=theme.navSkin;root.dataset.publicNavRequested=theme.navPosition;root.dataset.publicNavPosition=effectivePosition;root.dataset.publicNavAlign=theme.navAlign;root.dataset.publicNavMode=theme.navMode;root.dataset.publicResponsiveMode=effectivePosition===theme.navPosition?'desktop-capable':'safe-top';root.dataset.publicHero=theme.hero;root.dataset.publicCards=theme.cards;root.dataset.publicContentWidth=theme.contentWidth;
    root.style.setProperty('--brand-primary',theme.colors.primary);
    root.style.setProperty('--brand-secondary',theme.colors.secondary);
    root.style.setProperty('--brand-primary-dark',theme.colors.primary);
    root.style.setProperty('--brand-accent',theme.colors.accent);
    root.style.setProperty('--brand-signal',theme.colors.signal);
    root.style.setProperty('--brand-danger',theme.colors.signal);
    root.style.setProperty('--soft-bg',theme.colors.surface);
    return theme;
  }

  function applyAdmin(input={}){ensureStyles();const theme=normalizeAdmin(input),root=document.documentElement;root.dataset.adminFont=theme.font;root.dataset.adminRadius=theme.radius;root.dataset.adminDensity=theme.density;root.dataset.adminSidebar=theme.sidebar;root.dataset.adminCards=theme.cards;root.dataset.adminThemeReady='true';syncUiReady();return theme;}

  async function load(client,scope='admin'){
    const cached=readCache();if(cached){if(scope==='public')applyPublic(cached.public||{});else applyAdmin(cached.admin||{});}
    if(!client){if(cached)return scope==='public'?normalizePublic(cached.public||{}):normalizeAdmin(cached.admin||{});return scope==='public'?applyPublic():applyAdmin();}
    try{const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();if(error)throw error;const config=data?.design_theme||{};writeCache(config);return scope==='public'?applyPublic(config.public||{}):applyAdmin(config.admin||{});}catch(error){console.warn('Design theme refresh failed; using last known theme:',error);if(cached)return scope==='public'?normalizePublic(cached.public||{}):normalizeAdmin(cached.admin||{});return scope==='public'?applyPublic():applyAdmin();}
  }

  window.addEventListener('resize',()=>{if(!lastPublicTheme)return;window.clearTimeout(resizeTimer);resizeTimer=window.setTimeout(()=>applyPublic(lastPublicTheme),80);},{passive:true});
  window.BRGY_THEME=Object.freeze({COLOR_DEFAULTS,PUBLIC_DEFAULT,ADMIN_DEFAULT,publicPresets,adminPresets,normalizeColors,normalizePublic,normalizeAdmin,applyPublic,applyAdmin,load,ensureStyles,readCache,writeCache});
  ensureStyles();
  const cachedAtBoot=readCache();if(cachedAtBoot){if(/\/(admin|editor)\//.test(location.pathname))applyAdmin(cachedAtBoot.admin||{});else applyPublic(cachedAtBoot.public||{});}
  if(/\/(admin|editor)\//.test(location.pathname)){const boot=()=>load(window.BRGY_SUPABASE,'admin');if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})();

(() => {
  'use strict';

  const THEME_CACHE_KEY = 'brgyweb:design-theme:v1';
  const ASSET_VERSION = '20260901-studio2';

  const PUBLIC_DEFAULT = Object.freeze({
    preset:'civic',font:'system',radius:'rounded',density:'comfortable',
    navSkin:'gradient',navPosition:'top',navAlign:'right',navMode:'links',
    hero:'bold',cards:'elevated',contentWidth:'wide'
  });
  const ADMIN_DEFAULT = Object.freeze({preset:'civic',font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',cards:'elevated'});

  const publicPresets = Object.freeze({
    civic:{preset:'civic',font:'system',radius:'rounded',density:'comfortable',navSkin:'gradient',navPosition:'top',navAlign:'right',navMode:'links',hero:'bold',cards:'elevated',contentWidth:'wide'},
    modern:{preset:'modern',font:'rounded',radius:'pill',density:'comfortable',navSkin:'glass',navPosition:'top',navAlign:'center',navMode:'links',hero:'soft',cards:'elevated',contentWidth:'boxed'},
    portal:{preset:'portal',font:'system',radius:'soft',density:'compact',navSkin:'solid',navPosition:'left',navAlign:'left',navMode:'links',hero:'clean',cards:'flat',contentWidth:'wide'},
    floating:{preset:'floating',font:'rounded',radius:'rounded',density:'comfortable',navSkin:'glass',navPosition:'floating',navAlign:'center',navMode:'links',hero:'split',cards:'elevated',contentWidth:'boxed'},
    minimal:{preset:'minimal',font:'system',radius:'square',density:'compact',navSkin:'solid',navPosition:'top',navAlign:'right',navMode:'menu',hero:'minimal',cards:'bordered',contentWidth:'boxed'},
    classic:{preset:'classic',font:'serif',radius:'soft',density:'comfortable',navSkin:'solid',navPosition:'top',navAlign:'center',navMode:'links',hero:'banner',cards:'bordered',contentWidth:'boxed'},
    compact:{preset:'compact',font:'system',radius:'soft',density:'compact',navSkin:'gradient',navPosition:'left',navAlign:'left',navMode:'menu',hero:'minimal',cards:'flat',contentWidth:'wide'},
    bold:{preset:'bold',font:'rounded',radius:'pill',density:'comfortable',navSkin:'gradient',navPosition:'floating',navAlign:'right',navMode:'menu',hero:'bold',cards:'elevated',contentWidth:'wide'}
  });

  const adminPresets = Object.freeze({
    civic:{preset:'civic',font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',cards:'elevated'},
    executive:{preset:'executive',font:'system',radius:'soft',density:'compact',sidebar:'dark',cards:'elevated'},
    modern:{preset:'modern',font:'rounded',radius:'pill',density:'comfortable',sidebar:'brand',cards:'flat'},
    minimal:{preset:'minimal',font:'system',radius:'square',density:'compact',sidebar:'light',cards:'bordered'},
    clean:{preset:'clean',font:'system',radius:'soft',density:'comfortable',sidebar:'light',cards:'flat'},
    classic:{preset:'classic',font:'serif',radius:'soft',density:'comfortable',sidebar:'dark',cards:'bordered'}
  });

  const choices = {
    public:{
      font:['system','rounded','serif'],radius:['square','soft','rounded','pill'],density:['comfortable','compact'],
      navSkin:['gradient','solid','glass'],navPosition:['top','left','floating'],navAlign:['left','center','right'],navMode:['links','menu'],
      hero:['bold','clean','soft','minimal','split','banner'],cards:['elevated','flat','bordered'],contentWidth:['wide','boxed']
    },
    admin:{font:['system','rounded','serif'],radius:['square','soft','rounded','pill'],density:['comfortable','compact'],sidebar:['brand','dark','light'],cards:['elevated','flat','bordered']}
  };

  function syncUiReady(){
    const root=document.documentElement;
    if(root.dataset.adminShellReady==='true'&&root.dataset.adminThemeReady==='true')root.dataset.adminUiReady='true';
  }

  function readCache(){
    try{
      const raw=localStorage.getItem(THEME_CACHE_KEY);
      if(!raw)return null;
      const parsed=JSON.parse(raw);
      const config=parsed?.config||parsed;
      return config&&typeof config==='object'?config:null;
    }catch{return null;}
  }

  function writeCache(config){
    try{localStorage.setItem(THEME_CACHE_KEY,JSON.stringify({version:2,savedAt:Date.now(),config}));}catch{}
  }

  function pick(value,allowed,fallback){return allowed.includes(value)?value:fallback;}

  function normalizePublic(input={}){
    const navSkin=pick(input.navSkin||input.nav,choices.public.navSkin,PUBLIC_DEFAULT.navSkin);
    return {
      preset:String(input.preset||PUBLIC_DEFAULT.preset),
      font:pick(input.font,choices.public.font,PUBLIC_DEFAULT.font),
      radius:pick(input.radius,choices.public.radius,PUBLIC_DEFAULT.radius),
      density:pick(input.density,choices.public.density,PUBLIC_DEFAULT.density),
      navSkin,
      nav:navSkin,
      navPosition:pick(input.navPosition,choices.public.navPosition,PUBLIC_DEFAULT.navPosition),
      navAlign:pick(input.navAlign,choices.public.navAlign,PUBLIC_DEFAULT.navAlign),
      navMode:pick(input.navMode,choices.public.navMode,PUBLIC_DEFAULT.navMode),
      hero:pick(input.hero,choices.public.hero,PUBLIC_DEFAULT.hero),
      cards:pick(input.cards,choices.public.cards,PUBLIC_DEFAULT.cards),
      contentWidth:pick(input.contentWidth,choices.public.contentWidth,PUBLIC_DEFAULT.contentWidth)
    };
  }

  function normalizeAdmin(input={}){
    return {
      preset:String(input.preset||ADMIN_DEFAULT.preset),
      font:pick(input.font,choices.admin.font,ADMIN_DEFAULT.font),
      radius:pick(input.radius,choices.admin.radius,ADMIN_DEFAULT.radius),
      density:pick(input.density,choices.admin.density,ADMIN_DEFAULT.density),
      sidebar:pick(input.sidebar,choices.admin.sidebar,ADMIN_DEFAULT.sidebar),
      cards:pick(input.cards,choices.admin.cards,ADMIN_DEFAULT.cards)
    };
  }

  function addStyle(key,file){
    if(document.querySelector(`link[data-brgy-${key}]`))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.dataset[`brgy${key.replace(/(^|-)([a-z])/g,(_,a,b)=>b.toUpperCase())}`]='true';
    const prefix=/\/(admin|editor)\//.test(location.pathname)?'../assets/css/':'assets/css/';
    link.href=`${prefix}${file}?v=${ASSET_VERSION}`;
    document.head.appendChild(link);
  }

  function ensureStyles(){
    if(!document.querySelector('link[data-brgy-design-themes]')){
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.dataset.brgyDesignThemes='true';
      link.href=/\/(admin|editor)\//.test(location.pathname)?`../assets/css/design-themes.css?v=${ASSET_VERSION}`:`assets/css/design-themes.css?v=${ASSET_VERSION}`;
      document.head.appendChild(link);
    }
    if(!document.querySelector('link[data-brgy-design-layouts]')){
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.dataset.brgyDesignLayouts='true';
      link.href=/\/(admin|editor)\//.test(location.pathname)?`../assets/css/design-layouts.css?v=${ASSET_VERSION}`:`assets/css/design-layouts.css?v=${ASSET_VERSION}`;
      document.head.appendChild(link);
    }
  }

  function applyPublic(input={}){
    ensureStyles();
    const theme=normalizePublic(input),root=document.documentElement;
    root.dataset.publicFont=theme.font;
    root.dataset.publicRadius=theme.radius;
    root.dataset.publicDensity=theme.density;
    root.dataset.publicNav=theme.navSkin;
    root.dataset.publicNavSkin=theme.navSkin;
    root.dataset.publicNavPosition=theme.navPosition;
    root.dataset.publicNavAlign=theme.navAlign;
    root.dataset.publicNavMode=theme.navMode;
    root.dataset.publicHero=theme.hero;
    root.dataset.publicCards=theme.cards;
    root.dataset.publicContentWidth=theme.contentWidth;
    return theme;
  }

  function applyAdmin(input={}){
    ensureStyles();
    const theme=normalizeAdmin(input),root=document.documentElement;
    root.dataset.adminFont=theme.font;
    root.dataset.adminRadius=theme.radius;
    root.dataset.adminDensity=theme.density;
    root.dataset.adminSidebar=theme.sidebar;
    root.dataset.adminCards=theme.cards;
    root.dataset.adminThemeReady='true';
    syncUiReady();
    return theme;
  }

  async function load(client,scope='admin'){
    const cached=readCache();
    if(cached){
      if(scope==='public')applyPublic(cached.public||{});
      else applyAdmin(cached.admin||{});
    }
    if(!client){
      if(cached)return scope==='public'?normalizePublic(cached.public||{}):normalizeAdmin(cached.admin||{});
      return scope==='public'?applyPublic():applyAdmin();
    }
    try{
      const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
      if(error)throw error;
      const config=data?.design_theme||{};
      writeCache(config);
      return scope==='public'?applyPublic(config.public||{}):applyAdmin(config.admin||{});
    }catch(error){
      console.warn('Design theme refresh failed; using last known theme:',error);
      if(cached)return scope==='public'?normalizePublic(cached.public||{}):normalizeAdmin(cached.admin||{});
      return scope==='public'?applyPublic():applyAdmin();
    }
  }

  window.BRGY_THEME=Object.freeze({PUBLIC_DEFAULT,ADMIN_DEFAULT,publicPresets,adminPresets,normalizePublic,normalizeAdmin,applyPublic,applyAdmin,load,ensureStyles,readCache,writeCache});
  ensureStyles();

  const cachedAtBoot=readCache();
  if(cachedAtBoot){
    if(/\/(admin|editor)\//.test(location.pathname))applyAdmin(cachedAtBoot.admin||{});
    else applyPublic(cachedAtBoot.public||{});
  }

  if(/\/(admin|editor)\//.test(location.pathname)){
    const boot=()=>load(window.BRGY_SUPABASE,'admin');
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
    else boot();
  }
})();

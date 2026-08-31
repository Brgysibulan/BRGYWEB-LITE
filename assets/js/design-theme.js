(() => {
  'use strict';

  const PUBLIC_DEFAULT = Object.freeze({preset:'civic',font:'system',radius:'rounded',density:'comfortable',nav:'gradient',hero:'bold',cards:'elevated'});
  const ADMIN_DEFAULT = Object.freeze({preset:'civic',font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',cards:'elevated'});

  const publicPresets = Object.freeze({
    civic:{preset:'civic',font:'system',radius:'rounded',density:'comfortable',nav:'gradient',hero:'bold',cards:'elevated'},
    clean:{preset:'clean',font:'system',radius:'soft',density:'comfortable',nav:'solid',hero:'clean',cards:'flat'},
    modern:{preset:'modern',font:'rounded',radius:'pill',density:'comfortable',nav:'glass',hero:'soft',cards:'elevated'},
    minimal:{preset:'minimal',font:'system',radius:'square',density:'compact',nav:'solid',hero:'minimal',cards:'bordered'}
  });

  const adminPresets = Object.freeze({
    civic:{preset:'civic',font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',cards:'elevated'},
    executive:{preset:'executive',font:'system',radius:'soft',density:'compact',sidebar:'dark',cards:'elevated'},
    modern:{preset:'modern',font:'rounded',radius:'pill',density:'comfortable',sidebar:'brand',cards:'flat'},
    minimal:{preset:'minimal',font:'system',radius:'square',density:'compact',sidebar:'light',cards:'bordered'}
  });

  const choices = {
    public:{font:['system','rounded','serif'],radius:['square','soft','rounded','pill'],density:['comfortable','compact'],nav:['gradient','solid','glass'],hero:['bold','clean','soft','minimal'],cards:['elevated','flat','bordered']},
    admin:{font:['system','rounded','serif'],radius:['square','soft','rounded','pill'],density:['comfortable','compact'],sidebar:['brand','dark','light'],cards:['elevated','flat','bordered']}
  };

  function pick(value, allowed, fallback){return allowed.includes(value)?value:fallback;}
  function normalizePublic(input={}){return {preset:String(input.preset||PUBLIC_DEFAULT.preset),font:pick(input.font,choices.public.font,PUBLIC_DEFAULT.font),radius:pick(input.radius,choices.public.radius,PUBLIC_DEFAULT.radius),density:pick(input.density,choices.public.density,PUBLIC_DEFAULT.density),nav:pick(input.nav,choices.public.nav,PUBLIC_DEFAULT.nav),hero:pick(input.hero,choices.public.hero,PUBLIC_DEFAULT.hero),cards:pick(input.cards,choices.public.cards,PUBLIC_DEFAULT.cards)};}
  function normalizeAdmin(input={}){return {preset:String(input.preset||ADMIN_DEFAULT.preset),font:pick(input.font,choices.admin.font,ADMIN_DEFAULT.font),radius:pick(input.radius,choices.admin.radius,ADMIN_DEFAULT.radius),density:pick(input.density,choices.admin.density,ADMIN_DEFAULT.density),sidebar:pick(input.sidebar,choices.admin.sidebar,ADMIN_DEFAULT.sidebar),cards:pick(input.cards,choices.admin.cards,ADMIN_DEFAULT.cards)};}

  function ensureStyles(){
    if(document.querySelector('link[data-brgy-design-themes]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.dataset.brgyDesignThemes='true';
    link.href=/\/(admin|editor)\//.test(location.pathname)?'../assets/css/design-themes.css':'assets/css/design-themes.css';
    document.head.appendChild(link);
  }

  function applyPublic(input={}){
    ensureStyles();
    const theme=normalizePublic(input),root=document.documentElement;
    root.dataset.publicFont=theme.font;
    root.dataset.publicRadius=theme.radius;
    root.dataset.publicDensity=theme.density;
    root.dataset.publicNav=theme.nav;
    root.dataset.publicHero=theme.hero;
    root.dataset.publicCards=theme.cards;
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
    return theme;
  }

  async function load(client,scope='admin'){
    if(!client)return scope==='public'?applyPublic():applyAdmin();
    try{
      const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
      if(error)throw error;
      const config=data?.design_theme||{};
      return scope==='public'?applyPublic(config.public||{}):applyAdmin(config.admin||{});
    }catch(error){
      console.warn('Design theme fallback in use:',error);
      return scope==='public'?applyPublic():applyAdmin();
    }
  }

  window.BRGY_THEME=Object.freeze({PUBLIC_DEFAULT,ADMIN_DEFAULT,publicPresets,adminPresets,normalizePublic,normalizeAdmin,applyPublic,applyAdmin,load,ensureStyles});
  ensureStyles();
})();

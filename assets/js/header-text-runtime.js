(() => {
  'use strict';

  if(window.BRGY_HEADER_TEXT_RUNTIME) return;

  const root=document.documentElement;
  const LIGHT='#ffffff';
  const DARK='#17201a';
  let applied=false;
  let refreshPromise=null;

  const isHex=(value)=>/^#[0-9a-f]{6}$/i.test(String(value||''));
  const normalize=(value,fallback='')=>isHex(value)?String(value).toLowerCase():fallback;

  function luminance(hex){
    const value=normalize(hex).replace('#','');
    if(!value)return 0;
    const channels=[0,2,4].map((offset)=>{
      const channel=parseInt(value.slice(offset,offset+2),16)/255;
      return channel<=0.03928?channel/12.92:((channel+0.055)/1.055)**2.4;
    });
    return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
  }

  function automatic(primary){
    return luminance(primary)>.46?DARK:LIGHT;
  }

  function resolve(config={}){
    const primary=normalize(config?.public?.colors?.primary)||normalize(getComputedStyle(root).getPropertyValue('--gov-primary'))||'#27313b';
    return normalize(config?.public?.headerTextColor,automatic(primary));
  }

  function apply(color,config={}){
    const value=normalize(color,resolve(config));
    root.style.setProperty('--theme-header-text',value);
    root.style.setProperty('--gov-header-text',value);
    root.dataset.headerTextReady='true';
    applied=true;
    return value;
  }

  function applyConfig(config={}){
    return apply(config?.public?.headerTextColor,config);
  }

  async function refresh(){
    if(refreshPromise)return refreshPromise;
    const client=window.BRGY_SUPABASE;
    if(!client){
      if(!applied)apply();
      return null;
    }
    refreshPromise=(async()=>{
      try{
        const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
        if(error)throw error;
        return applyConfig(data?.design_theme||{});
      }catch(error){
        console.warn('Header text color refresh failed:',error);
        if(!applied)apply();
        return null;
      }finally{
        refreshPromise=null;
      }
    })();
    return refreshPromise;
  }

  window.addEventListener('brgy:government-theme-applied',(event)=>applyConfig(event.detail?.config||{}));
  window.addEventListener('brgy:header-text-color-updated',(event)=>apply(event.detail?.color));
  window.addEventListener('pageshow',()=>refresh());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});

  window.BRGY_HEADER_TEXT_RUNTIME=Object.freeze({apply,applyConfig,refresh});
  setTimeout(()=>{if(!applied)refresh();},500);
})();

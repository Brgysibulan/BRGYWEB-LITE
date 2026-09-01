(() => {
  'use strict';

  if(!/\/admin\/design-studio\.html$/i.test(location.pathname))return;

  const client=window.BRGY_SUPABASE;
  const colorGrid=document.getElementById('custom-color-grid');
  const section=colorGrid?.closest('.custom-color-section');
  const publicPreview=document.getElementById('public-design-preview');
  const designStatus=document.getElementById('design-studio-status');
  const publishButton=document.getElementById('design-save');
  const resetButton=document.getElementById('design-reset');
  if(!client||!colorGrid||!section)return;

  const LIGHT='#ffffff';
  const DARK='#17201a';
  let selected=LIGHT;
  let saved=LIGHT;
  let saveAfterPublish=false;
  let saving=false;

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

  function automatic(primary){return luminance(primary)>.46?DARK:LIGHT;}

  const control=document.createElement('div');
  control.className='header-font-control';
  control.innerHTML=`
    <div class="header-font-control-head">
      <div><span class="gov-studio-kicker gov-accent-copy">Header Font</span><strong>Header / navigation text color</strong><small>One separate color for the public header brand name and desktop navigation text.</small></div>
      <span class="header-font-auto-note">1 picker</span>
    </div>
    <div class="header-font-row">
      <label class="header-font-picker-wrap" aria-label="Header font color"><input id="header-font-color" type="color" value="#ffffff"></label>
      <div class="header-font-copy"><strong>Header Font Color</strong><small>You choose this color directly.</small></div>
      <input id="header-font-hex" class="custom-color-hex" type="text" value="#ffffff" maxlength="7" spellcheck="false" aria-label="Header font color hex value">
    </div>
    <div class="header-font-preview" id="header-font-preview"><b>Aa</b><span>Barangay Header / Navigation</span></div>
    <small class="header-font-status" id="header-font-status" aria-live="polite">Loading published header color…</small>`;
  colorGrid.insertAdjacentElement('afterend',control);

  const picker=control.querySelector('#header-font-color');
  const hex=control.querySelector('#header-font-hex');
  const preview=control.querySelector('#header-font-preview');
  const localStatus=control.querySelector('#header-font-status');

  function currentPrimary(){
    return normalize(publicPreview?.style.getPropertyValue('--p1'))||normalize(getComputedStyle(document.documentElement).getPropertyValue('--gov-primary'))||'#27313b';
  }

  function setLocalStatus(message,state='normal'){
    if(!localStatus)return;
    localStatus.textContent=message;
    localStatus.dataset.state=state;
  }

  function applyPreview(){
    picker.value=selected;
    hex.value=selected;
    hex.removeAttribute('aria-invalid');
    control.style.setProperty('--header-font-choice',selected);
    control.style.setProperty('--header-preview-bg',currentPrimary());
    publicPreview?.style.setProperty('--ptext',selected);
    document.documentElement.style.setProperty('--theme-header-text',selected);
  }

  async function readPublished(message=''){
    const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
    if(error)throw error;
    const raw=data?.design_theme||{};
    const value=normalize(raw?.public?.headerTextColor,automatic(raw?.public?.colors?.primary||currentPrimary()));
    selected=value;
    saved=value;
    applyPreview();
    setLocalStatus(message||`Published header font color: ${value}`,'success');
    return value;
  }

  async function persist(message='Header font color saved.'){
    if(saving)return;
    saving=true;
    setLocalStatus('Saving header font color…');
    try{
      const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
      if(error)throw error;
      const design=JSON.parse(JSON.stringify(data?.design_theme||{}));
      design.public={...(design.public||{}),headerTextColor:selected};
      const {error:updateError}=await client.from('site_settings').update({design_theme:design,updated_at:new Date().toISOString()}).eq('id',1);
      if(updateError)throw updateError;
      saved=selected;
      window.dispatchEvent(new CustomEvent('brgy:header-text-color-updated',{detail:{color:selected}}));
      setLocalStatus(`${message} ${selected}`,'success');
    }catch(error){
      console.error(error);
      setLocalStatus(error.message||'Unable to save header font color.','error');
    }finally{
      saving=false;
    }
  }

  picker.addEventListener('input',()=>{
    selected=normalize(picker.value,selected);
    applyPreview();
    setLocalStatus('Previewing header font color.');
  });
  picker.addEventListener('change',()=>persist());

  hex.addEventListener('change',()=>{
    const value=normalize(hex.value);
    if(!value){
      hex.setAttribute('aria-invalid','true');
      setLocalStatus('Use a 6-digit hex value such as #ffffff.','error');
      return;
    }
    selected=value;
    applyPreview();
    persist();
  });

  colorGrid.addEventListener('input',()=>setTimeout(()=>{
    control.style.setProperty('--header-preview-bg',currentPrimary());
  },0));

  publishButton?.addEventListener('click',()=>{saveAfterPublish=true;});
  resetButton?.addEventListener('click',()=>setTimeout(()=>readPublished('Restored the published header font color.').catch((error)=>setLocalStatus(error.message||'Unable to restore header font color.','error')),500));

  if(designStatus){
    const observer=new MutationObserver(()=>{
      const text=String(designStatus.textContent||'');
      if(saveAfterPublish&&/published and re-verified/i.test(text)){
        saveAfterPublish=false;
        persist('Header font color kept with the newly published design.');
      }
    });
    observer.observe(designStatus,{childList:true,subtree:true,characterData:true});
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&selected===saved)readPublished().catch(()=>{});
  });

  client.auth.getUser().then(({data})=>{
    if(data?.user)readPublished().catch((error)=>setLocalStatus(error.message||'Unable to load header font color.','error'));
  });
})();

(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const form = document.getElementById('design-studio-form');
  const layoutGrid = document.getElementById('web-layout-grid');
  const colorControls = document.getElementById('custom-color-grid');
  const saveButton = document.getElementById('design-save');
  const resetButton = document.getElementById('design-reset');
  const saveBar = document.getElementById('design-savebar');
  const changeState = document.getElementById('design-change-state');
  const status = document.getElementById('design-studio-status');
  const paletteHealth = document.getElementById('palette-health');
  const previewThemeName = document.getElementById('preview-theme-name');
  const publicPreview = document.getElementById('public-design-preview');
  const adminPreview = document.getElementById('admin-design-preview');
  const loginPreview = document.getElementById('login-design-preview');
  const signupPreview = document.getElementById('signup-design-preview');
  const publicLabel = document.getElementById('public-preview-label');
  const adminLabel = document.getElementById('admin-preview-label');
  const loginLabel = document.getElementById('login-preview-label');
  const signupLabel = document.getElementById('signup-preview-label');

  const WEB_LAYOUTS = Object.freeze({
    'two-column': { number:'01', name:'Two-column', tag:'Columns', description:'Primary content with a supporting side column.' },
    'split-screen': { number:'02', name:'Split Screen', tag:'Split', description:'Two strong panels share the first view.' },
    'asymmetrical': { number:'03', name:'Asymmetrical', tag:'Dynamic', description:'Uneven content blocks create controlled emphasis.' },
    'f-shape': { number:'04', name:'F-shape', tag:'Scan', description:'Information follows a familiar left-led reading pattern.' },
    'z-shape': { number:'05', name:'Z-shape', tag:'Flow', description:'Alternating emphasis guides the eye across the page.' },
    'card-block': { number:'06', name:'Card / Block', tag:'Modular', description:'Services and information are grouped into clear blocks.' },
    'featured-media': { number:'07', name:'Featured Media', tag:'Feature', description:'A large hero or civic feature leads the page.' },
    'masonry': { number:'08', name:'Masonry', tag:'Grid', description:'Mixed-height information blocks form a flexible grid.' },
    'magazine': { number:'09', name:'Magazine', tag:'Editorial', description:'Lead stories and supporting information use editorial hierarchy.' },
    'fixed-navigation': { number:'10', name:'Fixed Navigation', tag:'Persistent', description:'Navigation stays available while residents scroll.' },
    'hidden-navigation': { number:'11', name:'Hidden Navigation', tag:'Minimal', description:'A cleaner canvas keeps navigation visually compact.' },
    'interactive': { number:'12', name:'Interactive', tag:'Explore', description:'Featured content uses controls and progressive disclosure.' }
  });

  const COLOR_ROLES = Object.freeze([
    { key:'primary', label:'Main Color', help:'Header, main identity and strongest surfaces.' },
    { key:'secondary', label:'Second Color', help:'Buttons, active states and secondary brand surfaces.' },
    { key:'accent', label:'Third Color', help:'Highlights, dividers and emphasis.' },
    { key:'signal', label:'Fourth Color', help:'Signal and important status emphasis.' }
  ]);

  const DEFAULT_LAYOUT = 'card-block';
  const DEFAULT_EXPERIENCE = 'modern-lgu';
  const DEFAULT_COLORS = Object.freeze({primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:'#a63d40'});

  let theme = null;
  let catalog = null;
  let selectedLayout = DEFAULT_LAYOUT;
  let savedLayout = DEFAULT_LAYOUT;
  let selectedColors = {...DEFAULT_COLORS};
  let savedColors = {...DEFAULT_COLORS};
  let baseExperience = DEFAULT_EXPERIENCE;
  let basePack = null;
  let dirty = false;
  let loadingSaved = false;
  let activePreview = 'public';

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const validLayout = (id) => WEB_LAYOUTS[id] ? id : DEFAULT_LAYOUT;
  const normalizeHex = (value, fallback='') => /^#[0-9a-f]{6}$/i.test(String(value||'')) ? String(value).toLowerCase() : fallback;

  function sameColors(a={},b={}) {
    return COLOR_ROLES.every(({key}) => String(a?.[key]||'').toLowerCase() === String(b?.[key]||'').toLowerCase());
  }

  function setStatus(message, kind='normal') {
    if(!status) return;
    status.textContent = message || '';
    status.dataset.state = kind;
    saveBar?.classList.toggle('has-error',kind==='error');
    saveBar?.classList.toggle('has-success',kind==='success');
  }

  function hexToRgb(hex) {
    const value=String(hex||'').replace('#','');
    if(!/^[0-9a-f]{6}$/i.test(value)) return null;
    return {r:parseInt(value.slice(0,2),16),g:parseInt(value.slice(2,4),16),b:parseInt(value.slice(4,6),16)};
  }

  function luminance(hex) {
    const rgb=hexToRgb(hex);
    if(!rgb) return 0;
    const channels=[rgb.r,rgb.g,rgb.b].map((value)=>{
      const channel=value/255;
      return channel<=0.03928?channel/12.92:((channel+0.055)/1.055)**2.4;
    });
    return (0.2126*channels[0])+(0.7152*channels[1])+(0.0722*channels[2]);
  }

  function contrast(a,b) {
    const l1=luminance(a),l2=luminance(b);
    return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
  }

  function evaluateColors(colors={}) {
    const invalid=COLOR_ROLES.some(({key})=>!/^#[0-9a-f]{6}$/i.test(String(colors[key]||'')));
    if(invalid) return {ok:false,warning:false,message:'Enter a valid 6-digit hex color for all four colors.'};
    const mainContrast=contrast(colors.primary,'#ffffff');
    const secondContrast=contrast(colors.secondary,'#ffffff');
    if(mainContrast<4.5||secondContrast<3.2) return {ok:true,warning:true,message:'Colors are usable, but Main or Second may have low contrast with white text.'};
    return {ok:true,warning:false,message:'Four custom colors are ready to publish.'};
  }

  async function waitForRuntime() {
    const started=Date.now();
    while((!window.BRGY_THEME||!window.BRGY_GOV_THEMES||!window.BRGY_GOV_THEME_RUNTIME)&&Date.now()-started<5000){
      await new Promise((resolve)=>setTimeout(resolve,40));
    }
    theme=window.BRGY_THEME;
    catalog=window.BRGY_GOV_THEMES;
    if(!theme||!catalog) throw new Error('Government design system failed to load.');
  }

  async function requireAdmin() {
    if(!client){location.href='login.html';return false;}
    const {data,error}=await client.auth.getUser();
    if(error||!data?.user){location.href='login.html';return false;}
    const {data:profile,error:profileError}=await client.from('profiles').select('role,is_active').eq('user_id',data.user.id).maybeSingle();
    if(profileError||profile?.role!=='admin'||profile?.is_active!==true){
      await client.auth.signOut();
      location.href='login.html';
      return false;
    }
    return true;
  }

  function renderLayouts() {
    if(!layoutGrid) return;
    layoutGrid.innerHTML=Object.entries(WEB_LAYOUTS).map(([id,meta])=>`
      <button class="web-layout-card" type="button" data-web-layout="${id}" aria-pressed="false">
        <span class="web-layout-mini" data-layout-mini="${id}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
        <span class="web-layout-copy"><span><b>${meta.number}</b><em>${meta.tag}</em></span><strong>${meta.name}</strong><small>${meta.description}</small></span>
      </button>`).join('');
    layoutGrid.addEventListener('click',(event)=>{
      const button=event.target.closest('[data-web-layout]');
      if(button) selectLayout(button.dataset.webLayout);
    });
  }

  function renderColorControls() {
    if(!colorControls) return;
    colorControls.innerHTML=COLOR_ROLES.map(({key,label,help},index)=>`
      <label class="custom-color-card" data-color-role="${key}">
        <span class="custom-color-order">0${index+1}</span>
        <span class="custom-color-picker-wrap"><input class="custom-color-picker" type="color" data-color-picker="${key}" value="${selectedColors[key]}" aria-label="${label}"></span>
        <span class="custom-color-copy"><strong>${label}</strong><small>${help}</small></span>
        <input class="custom-color-hex" type="text" data-color-hex="${key}" value="${selectedColors[key]}" inputmode="text" maxlength="7" spellcheck="false" aria-label="${label} hex value">
      </label>`).join('');

    colorControls.addEventListener('input',(event)=>{
      const picker=event.target.closest('[data-color-picker]');
      if(!picker) return;
      updateColor(picker.dataset.colorPicker,picker.value,'picker');
    });
    colorControls.addEventListener('change',(event)=>{
      const input=event.target.closest('[data-color-hex]');
      if(!input) return;
      const key=input.dataset.colorHex;
      const value=normalizeHex(input.value);
      if(!value){
        input.setAttribute('aria-invalid','true');
        setStatus(`${COLOR_ROLES.find((role)=>role.key===key)?.label||'Color'} needs a valid value like #123456.`,'error');
        syncDirty();
        return;
      }
      input.removeAttribute('aria-invalid');
      updateColor(key,value,'hex');
    });
  }

  function syncColorInputs() {
    COLOR_ROLES.forEach(({key})=>{
      const picker=document.querySelector(`[data-color-picker="${key}"]`);
      const hex=document.querySelector(`[data-color-hex="${key}"]`);
      if(picker) picker.value=selectedColors[key];
      if(hex){hex.value=selectedColors[key];hex.removeAttribute('aria-invalid');}
    });
  }

  function updateColor(key,value,source='picker') {
    if(!COLOR_ROLES.some((role)=>role.key===key)) return;
    const normalized=normalizeHex(value);
    if(!normalized) return;
    selectedColors={...selectedColors,[key]:normalized};
    const picker=document.querySelector(`[data-color-picker="${key}"]`);
    const hex=document.querySelector(`[data-color-hex="${key}"]`);
    if(source!=='picker'&&picker) picker.value=normalized;
    if(source!=='hex'&&hex) hex.value=normalized;
    refreshPreview();
    syncDirty(`${COLOR_ROLES.find((role)=>role.key===key)?.label||'Color'} updated.`);
  }

  function compose(layoutId) {
    const experience=catalog[baseExperience]?baseExperience:DEFAULT_EXPERIENCE;
    const meta=catalog[experience]||catalog[DEFAULT_EXPERIENCE];
    const pack=basePack||meta.basePack;
    const composed=theme.composePack(pack,'custom',selectedColors);
    const normalized=theme.normalizeConfig({
      version:theme.THEME_SCHEMA_VERSION,
      pack,
      palette:'custom',
      public:composed.public,
      admin:composed.admin
    });
    normalized.experience=experience;
    normalized.webLayout=validLayout(layoutId);
    normalized.public.colors=theme.normalizeColors(selectedColors);
    normalized.admin.colors=theme.normalizeAdminColors(selectedColors);
    return normalized;
  }

  function previewSurface(node) {
    if(!node) return;
    node.dataset.govPreview=baseExperience;
    node.style.setProperty('--p1',selectedColors.primary);
    node.style.setProperty('--p2',selectedColors.secondary);
    node.style.setProperty('--pa',selectedColors.accent);
    node.style.setProperty('--ps',selectedColors.signal);
  }

  function setPreviewTab(name) {
    activePreview=name;
    document.querySelectorAll('[data-preview-target]').forEach((button)=>{
      const active=button.dataset.previewTarget===name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',active?'true':'false');
    });
    document.querySelectorAll('[data-preview-panel]').forEach((panel)=>{
      const active=panel.dataset.previewPanel===name;
      panel.classList.toggle('active',active);
      panel.hidden=!active;
    });
  }

  function refreshPreview() {
    document.querySelectorAll('[data-web-layout]').forEach((button)=>{
      const active=button.dataset.webLayout===selectedLayout;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
    [publicPreview,adminPreview,loginPreview,signupPreview].forEach(previewSurface);
    if(publicPreview) publicPreview.dataset.webLayoutPreview=selectedLayout;

    const layoutName=WEB_LAYOUTS[selectedLayout]?.name||'Card / Block';
    if(previewThemeName) previewThemeName.textContent=`${layoutName} · Custom colors`;
    if(publicLabel) publicLabel.textContent=`${layoutName} · Custom colors`;
    if(adminLabel) adminLabel.textContent='Custom colors · System + Content Admin';
    if(loginLabel) loginLabel.textContent='Custom colors · Access portal';
    if(signupLabel) signupLabel.textContent='Custom colors · Content Admin signup';

    const health=evaluateColors(selectedColors);
    if(paletteHealth){
      paletteHealth.textContent=health.ok?(health.warning?'Check contrast':'Colors ready'):'Fix color value';
      paletteHealth.dataset.state=health.ok?(health.warning?'warning':'ok'):'error';
      paletteHealth.title=health.message;
    }
    return health;
  }

  function syncDirty(message='',kind='normal') {
    dirty=selectedLayout!==savedLayout||!sameColors(selectedColors,savedColors);
    const health=evaluateColors(selectedColors);
    if(changeState) changeState.textContent=dirty?'Design ready to publish':'Published design is active';
    saveBar?.classList.toggle('is-clean',!dirty);
    if(saveButton) saveButton.disabled=!dirty||!health.ok;
    if(message) setStatus(message,health.ok?(health.warning?'warning':kind):'error');
    else if(!health.ok) setStatus(health.message,'error');
  }

  function selectLayout(id) {
    if(!WEB_LAYOUTS[id]) return;
    selectedLayout=id;
    refreshPreview();
    syncDirty(`${WEB_LAYOUTS[id].name} layout selected. Review the preview, then publish.`);
  }

  function verifyPayload(actual,expected,expectedLayout,expectedColors) {
    if(validLayout(actual?.webLayout)!==expectedLayout) throw new Error(`Layout verification failed: expected ${expectedLayout}.`);
    if(!sameColors(actual?.public?.colors,expectedColors)) throw new Error('Design verification failed: public colors did not match.');
    if(!sameColors(actual?.admin?.colors,expectedColors)) throw new Error('Design verification failed: admin colors did not match.');
    if(actual?.pack!==expected.pack) throw new Error('Design verification failed: base design package did not match.');
  }

  async function readSavedRecord() {
    const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
    if(error) throw error;
    return clone(data?.design_theme||{});
  }

  async function loadSaved(message='') {
    if(loadingSaved) return;
    loadingSaved=true;
    try{
      if(!message) setStatus('Loading published design…');
      const raw=await readSavedRecord();
      const liveExperience=window.BRGY_GOV_THEME_RUNTIME.normalize(raw.experience,raw.pack);
      const liveLayout=validLayout(raw.webLayout);
      const fallbackColors=catalog[liveExperience]?.colors||DEFAULT_COLORS;
      const liveColors={
        primary:normalizeHex(raw.public?.colors?.primary,fallbackColors.primary),
        secondary:normalizeHex(raw.public?.colors?.secondary,fallbackColors.secondary),
        accent:normalizeHex(raw.public?.colors?.accent,fallbackColors.accent),
        signal:normalizeHex(raw.public?.colors?.signal||raw.public?.colors?.danger,fallbackColors.signal)
      };

      baseExperience=catalog[liveExperience]?liveExperience:DEFAULT_EXPERIENCE;
      basePack=raw.pack||catalog[baseExperience]?.basePack||catalog[DEFAULT_EXPERIENCE]?.basePack;
      savedLayout=liveLayout;
      savedColors={...liveColors};
      if(!dirty){
        selectedLayout=liveLayout;
        selectedColors={...liveColors};
      }
      syncColorInputs();
      window.BRGY_GOV_THEME_RUNTIME.apply(baseExperience,raw);
      theme.writeCache(theme.normalizeConfig(raw));
      theme.applyAdmin(raw.admin||{});
      refreshPreview();
      syncDirty();
      setStatus(message||`${WEB_LAYOUTS[liveLayout].name} with your four published colors is active.`,'success');
    }finally{
      loadingSaved=false;
    }
  }

  async function publish() {
    if(!dirty) return;
    const expectedLayout=selectedLayout;
    const expectedColors={...selectedColors};
    const health=evaluateColors(expectedColors);
    if(!health.ok){setStatus(health.message,'error');return;}

    const payload=compose(expectedLayout);
    saveButton.disabled=true;
    resetButton.disabled=true;
    setStatus(`Publishing ${WEB_LAYOUTS[expectedLayout].name} with your custom colors…`,health.warning?'warning':'normal');
    try{
      const {data,error}=await client.from('site_settings').update({
        design_theme:payload,
        primary_color:expectedColors.primary,
        secondary_color:expectedColors.secondary,
        accent_color:expectedColors.accent,
        updated_at:new Date().toISOString()
      }).eq('id',1).select('design_theme').single();
      if(error) throw error;
      verifyPayload(data?.design_theme||{},payload,expectedLayout,expectedColors);

      const reread=await readSavedRecord();
      verifyPayload(reread,payload,expectedLayout,expectedColors);
      savedLayout=expectedLayout;
      savedColors={...expectedColors};
      dirty=false;
      theme.writeCache(theme.normalizeConfig(reread));
      theme.applyAdmin(reread.admin||{});
      window.BRGY_GOV_THEME_RUNTIME.apply(baseExperience,reread);
      refreshPreview();
      syncDirty();
      setStatus(`${WEB_LAYOUTS[expectedLayout].name} + your four colors published and re-verified.`,'success');
    }catch(error){
      console.error(error);
      setStatus(error.message||'Unable to publish the design.','error');
      saveButton.disabled=false;
    }finally{
      resetButton.disabled=false;
    }
  }

  document.querySelector('.gov-preview-tabs')?.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-preview-target]');
    if(button) setPreviewTab(button.dataset.previewTarget);
  });

  resetButton?.addEventListener('click',async()=>{
    dirty=false;
    selectedLayout=savedLayout;
    selectedColors={...savedColors};
    syncColorInputs();
    refreshPreview();
    syncDirty('Restored the published layout and colors in preview.');
    try{await loadSaved('Published design rechecked from Supabase.');}
    catch(error){console.error(error);setStatus('Unable to recheck the published design.','error');}
  });

  form?.addEventListener('submit',(event)=>{event.preventDefault();publish();});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&!dirty) loadSaved().catch((error)=>console.warn('Design status refresh failed:',error));
  });

  async function init() {
    if(!await requireAdmin()) return;
    await waitForRuntime();
    renderLayouts();
    renderColorControls();
    setPreviewTab(activePreview);
    await loadSaved();
  }

  init().catch((error)=>{
    console.error(error);
    setStatus(error.message||'Unable to load Design Studio.','error');
  });
})();

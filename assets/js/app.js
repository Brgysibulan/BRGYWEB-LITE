(() => {
  'use strict';

  const SITE_CACHE_VERSION = 4;
  const SITE_CACHE_KEY = 'brgyweb:site-settings:v4';
  const LEGACY_SITE_CACHE_KEYS = ['brgyweb:site-settings:v3','brgyweb:site-settings:v2'];
  const INITIAL_TITLE = document.title;
  const DEFAULT_SITE = Object.freeze({
    siteName: 'Barangay Website', shortName: 'Barangay', municipality: 'Municipality', province: 'Province',
    tagline: 'Official Community Website', heroTitle: 'Welcome to Our Barangay',
    heroText: 'A simple, accessible, and transparent digital home for barangay information, services, programs, and community updates.',
    address: 'Barangay Office Address', phone: '', email: '', logoUrl: '', designTheme: null,
    theme: { primary: '#0b2f21', secondary: '#1b6b45', accent: '#d8b63e', signal:'#a63d40', surface: '#f5f8f5', text: '#1f2937' }
  });

  function setText(id, value, fallback = '') { const element=document.getElementById(id); if(!element)return; const text=typeof value==='string'?value.trim():''; element.textContent=text||fallback; }
  function isHttpsUrl(value) { try { return new URL(value).protocol === 'https:'; } catch { return false; } }
  function readCachedSettings() { try { const raw=localStorage.getItem(SITE_CACHE_KEY); if(!raw)return null; const parsed=JSON.parse(raw); if(parsed?.version!==SITE_CACHE_VERSION)return null; const data=parsed?.data; return data&&typeof data==='object'?data:null; } catch { return null; } }
  function writeCachedSettings(site) { try { localStorage.setItem(SITE_CACHE_KEY,JSON.stringify({version:SITE_CACHE_VERSION,savedAt:Date.now(),data:site})); LEGACY_SITE_CACHE_KEYS.forEach((key)=>localStorage.removeItem(key)); } catch {} }
  function mergeSite(base={},next={}) { return {...base,...next,theme:{...(base.theme||{}),...(next.theme||{})}}; }
  function hasPublishedDesignTheme(value) { return Boolean(value && typeof value==='object' && (value.experience || value.pack || value.public || value.admin)); }

  function ensureDesignTheme() {
    if (window.BRGY_THEME) return Promise.resolve(window.BRGY_THEME);
    return new Promise((resolve) => {
      const existing=document.querySelector('script[data-brgy-design-theme]');
      if(existing){ if(window.BRGY_THEME){resolve(window.BRGY_THEME);return;} existing.addEventListener('load',()=>resolve(window.BRGY_THEME),{once:true}); existing.addEventListener('error',()=>resolve(null),{once:true}); return; }
      const script=document.createElement('script');
      script.src='assets/js/design-theme.js?v=20260901-stability1';
      script.dataset.brgyDesignTheme='true';
      script.onload=()=>resolve(window.BRGY_THEME);
      script.onerror=()=>resolve(null);
      document.head.appendChild(script);
    });
  }

  function applyLogo(site) {
    const logo=document.getElementById('brand-logo'),mark=document.getElementById('brand-mark');
    const logoUrl=isHttpsUrl(site.logoUrl)?site.logoUrl:'';
    const markText=String(site.shortName||site.siteName||'B').trim().charAt(0).toUpperCase()||'B';
    if(mark)mark.textContent=markText;
    if(logo&&mark){ if(logoUrl){ logo.src=logoUrl;logo.alt=`${site.siteName} logo`;logo.classList.remove('d-none');mark.classList.add('d-none');logo.addEventListener('error',()=>{logo.classList.add('d-none');mark.classList.remove('d-none');},{once:true}); } else { logo.removeAttribute('src');logo.classList.add('d-none');mark.classList.remove('d-none'); } }
    let favicon=document.querySelector('link[rel="icon"][data-dynamic-brand]');
    if(logoUrl){if(!favicon){favicon=document.createElement('link');favicon.rel='icon';favicon.dataset.dynamicBrand='true';document.head.appendChild(favicon);}favicon.href=logoUrl;}else if(favicon)favicon.remove();
  }

  function applyTheme(theme={}) {
    const root=document.documentElement,merged={...DEFAULT_SITE.theme,...theme};
    root.style.setProperty('--brand-primary',merged.primary);root.style.setProperty('--brand-secondary',merged.secondary);root.style.setProperty('--brand-primary-dark',merged.primary);root.style.setProperty('--brand-accent',merged.accent);root.style.setProperty('--brand-signal',merged.signal);root.style.setProperty('--brand-danger',merged.signal);root.style.setProperty('--soft-bg',merged.surface);root.style.setProperty('--text-main',merged.text);
  }

  function applyPublishedDesignTheme(designTheme={}) {
    if(!hasPublishedDesignTheme(designTheme)) return false;
    const runtime=window.BRGY_GOV_THEME_RUNTIME;
    if(runtime?.apply){ runtime.apply(designTheme.experience,designTheme); return true; }
    if(window.BRGY_THEME?.applyPublic){ window.BRGY_THEME.applyPublic(designTheme.public||{}); return true; }
    const colors=designTheme.public?.colors;
    if(colors){ applyTheme({...DEFAULT_SITE.theme,...colors}); return true; }
    return false;
  }

  function applyDocumentTitle(siteName) {
    const raw=INITIAL_TITLE.trim();
    const isHome=/^(Barangay Website|Home)$/i.test(raw)||/(?:^|\/)index\.html$/i.test(window.location.pathname)||window.location.pathname.endsWith('/');
    if(isHome){document.title=siteName;return;}
    const pageTitle=raw.replace(/\s*\|\s*Barangay Website\s*$/i,'').replace(/^Barangay\s+/i,'').trim();
    document.title=`${pageTitle||'Official Website'} | ${siteName}`;
  }

  function applySiteSettings(settings={},options={}) {
    const site={...DEFAULT_SITE,...settings,theme:{...DEFAULT_SITE.theme,...(settings.theme||{})}};
    const applyDesign=options.applyDesign!==false;
    setText('site-name',site.siteName,'');setText('hero-title',site.heroTitle,DEFAULT_SITE.heroTitle);setText('hero-text',site.heroText,DEFAULT_SITE.heroText);setText('footer-name',site.siteName,'');setText('footer-address',site.address,'');setText('footer-contact',[site.phone,site.email].filter(Boolean).join(' • '),'');setText('copyright-name',site.siteName,'');
    const eyebrow=document.querySelector('.hero-section .eyebrow');if(eyebrow)eyebrow.textContent=site.tagline||DEFAULT_SITE.tagline;
    if(applyDesign){
      if(!applyPublishedDesignTheme(site.designTheme)) applyTheme(site.theme);
    }
    applyLogo(site);applyDocumentTitle(site.siteName||DEFAULT_SITE.siteName);document.documentElement.dataset.siteSettingsReady='true';return site;
  }

  function mapSupabaseSettings(row) {
    if(!row)return null;
    const locationParts=[row.municipality_city,row.province].filter(Boolean),designColors=row.design_theme?.public?.colors||{};
    return {siteName:row.barangay_name||DEFAULT_SITE.siteName,shortName:row.barangay_name||DEFAULT_SITE.shortName,municipality:row.municipality_city||'',province:row.province||'',tagline:locationParts.length?`Official Website • ${locationParts.join(', ')}`:DEFAULT_SITE.tagline,heroTitle:row.hero_title||DEFAULT_SITE.heroTitle,heroText:row.hero_text||DEFAULT_SITE.heroText,address:row.address||DEFAULT_SITE.address,phone:row.contact_number||'',email:row.email||'',logoUrl:row.logo_url||'',designTheme:row.design_theme||null,theme:{primary:row.primary_color||DEFAULT_SITE.theme.primary,secondary:row.secondary_color||DEFAULT_SITE.theme.secondary,accent:row.accent_color||DEFAULT_SITE.theme.accent,signal:designColors.signal||DEFAULT_SITE.theme.signal,surface:DEFAULT_SITE.theme.surface}};
  }

  async function loadRemoteSettings() {
    const config=window.BRGY_SUPABASE_CONFIG;if(!config?.url||!config?.publishableKey)return null;
    const endpoint=`${config.url}/rest/v1/site_settings?id=eq.1&select=barangay_name,municipality_city,province,address,contact_number,email,logo_url,hero_title,hero_text,primary_color,secondary_color,accent_color,design_theme`;
    const response=await fetch(endpoint,{cache:'no-store',headers:{apikey:config.publishableKey,Authorization:`Bearer ${config.publishableKey}`,Accept:'application/json'}});
    if(!response.ok)throw new Error(`Site settings request failed (${response.status}).`);
    const rows=await response.json();return mapSupabaseSettings(Array.isArray(rows)?rows[0]:null);
  }

  function initYear(){setText('current-year',String(new Date().getFullYear()));}
  const fallback=window.BRGYWEB_CONFIG||{};
  const earlyCache=readCachedSettings();
  if(earlyCache){applySiteSettings(mergeSite(fallback,earlyCache),{applyDesign:false});initYear();}

  async function boot(){
    const cached=readCachedSettings();initYear();await ensureDesignTheme();if(cached)applySiteSettings(mergeSite(fallback,cached),{applyDesign:false});
    try{const remote=await loadRemoteSettings();if(remote){const merged=mergeSite(fallback,remote);applySiteSettings(merged,{applyDesign:true});writeCachedSettings(merged);}else if(!cached){applySiteSettings(fallback,{applyDesign:true});}}catch(error){console.warn('Unable to refresh site settings; using last known settings:',error);if(!cached)applySiteSettings(fallback,{applyDesign:true});}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.BRGYWEB=Object.freeze({applySiteSettings,applyPublishedDesignTheme,loadRemoteSettings,readCachedSettings});
})();
(() => {
  'use strict';
  if (window.BRGY_GOV_THEME_RUNTIME?.version >= 6) return;

  const VERSION = 6;
  const GOV_CACHE_KEY = 'brgyweb:gov-theme:v6';
  const DESIGN_CACHE_KEY = 'brgyweb:design-theme:v9';
  const LIGHT = '#ffffff';
  const DARK = '#17201a';
  const THEMES = {
    'national-authority': { name:'National Authority', tag:'Formal', basePack:'civic-standard', colors:{primary:'#10233f',secondary:'#1f4f7a',accent:'#d3ad4a',signal:'#9f363d'} },
    'executive-civic': { name:'Executive Civic', tag:'Executive', basePack:'executive-portal', colors:{primary:'#15342a',secondary:'#246447',accent:'#c9a64a',signal:'#a13d43'} },
    'public-service': { name:'Public Service', tag:'Service First', basePack:'forest-professional', colors:{primary:'#123b5d',secondary:'#1d6f8e',accent:'#e0b448',signal:'#a63d40'} },
    'institutional': { name:'Institutional', tag:'Authority', basePack:'minimal-authority', colors:{primary:'#27313b',secondary:'#536473',accent:'#c4a150',signal:'#9e3f45'} },
    'modern-lgu': { name:'Modern LGU', tag:'Flagship', basePack:'civic-premium', colors:{primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:'#a63d40'} }
  };

  const PACK_MAP = {
    'civic-standard':'national-authority',
    'executive-portal':'executive-civic',
    'forest-professional':'public-service',
    'minimal-authority':'institutional',
    'civic-premium':'modern-lgu',
    'civic-signature':'modern-lgu'
  };

  const normalize = (id, pack) => THEMES[id] ? id : (PACK_MAP[pack] || 'modern-lgu');
  const root = document.documentElement;
  const isStaffSurface = /\/(admin|editor)\//.test(window.location.pathname);
  let refreshPromise = null;
  let lastRefresh = 0;
  let lastApplied = null;

  const isHex = (value) => /^#[0-9a-f]{6}$/i.test(String(value || ''));
  const safeHex = (value, fallback) => isHex(value) ? String(value).toLowerCase() : fallback;

  function luminance(hex) {
    const value = safeHex(hex, '#000000').slice(1);
    const channels = [0,2,4].map((offset) => {
      const channel = parseInt(value.slice(offset,offset+2),16) / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
  }

  function contrast(a,b) {
    const l1 = luminance(a), l2 = luminance(b);
    return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
  }

  function readableOn(background) {
    return contrast(background, DARK) >= contrast(background, LIGHT) ? DARK : LIGHT;
  }

  function safeColors(raw, fallback) {
    const value = raw || {};
    return {
      primary: safeHex(value.primary, fallback.primary),
      secondary: safeHex(value.secondary, fallback.secondary),
      accent: safeHex(value.accent, fallback.accent),
      signal: safeHex(value.signal || value.danger, fallback.signal)
    };
  }

  function ensureAuthorityLast() {
    const link = document.querySelector('link[data-brgy-government-theme-authority]');
    if (link && link.parentNode === document.head) document.head.appendChild(link);
  }

  function setCanonicalVariables(publicColors, adminColors) {
    const publicOnPrimary = readableOn(publicColors.primary);
    const publicOnSecondary = readableOn(publicColors.secondary);
    const adminOnPrimary = readableOn(adminColors.primary);
    const adminOnSecondary = readableOn(adminColors.secondary);

    root.style.setProperty('--gov-primary', publicColors.primary);
    root.style.setProperty('--gov-secondary', publicColors.secondary);
    root.style.setProperty('--gov-accent', publicColors.accent);
    root.style.setProperty('--gov-signal', publicColors.signal);
    root.style.setProperty('--gov-on-primary', publicOnPrimary);
    root.style.setProperty('--gov-on-secondary', publicOnSecondary);
    root.style.setProperty('--gov-admin-primary', adminColors.primary);
    root.style.setProperty('--gov-admin-secondary', adminColors.secondary);
    root.style.setProperty('--gov-admin-accent', adminColors.accent);
    root.style.setProperty('--gov-admin-signal', adminColors.signal);
    root.style.setProperty('--gov-admin-on-primary', adminOnPrimary);
    root.style.setProperty('--gov-admin-on-secondary', adminOnSecondary);

    const surfaceColors = isStaffSurface ? adminColors : publicColors;
    const surfaceOnPrimary = isStaffSurface ? adminOnPrimary : publicOnPrimary;
    const surfaceOnSecondary = isStaffSurface ? adminOnSecondary : publicOnSecondary;
    root.style.setProperty('--theme-primary', surfaceColors.primary);
    root.style.setProperty('--theme-secondary', surfaceColors.secondary);
    root.style.setProperty('--theme-accent', surfaceColors.accent);
    root.style.setProperty('--theme-danger', surfaceColors.signal);
    root.style.setProperty('--theme-on-primary', surfaceOnPrimary);
    root.style.setProperty('--theme-on-secondary', surfaceOnSecondary);
    root.style.setProperty('--theme-admin-primary', adminColors.primary);
    root.style.setProperty('--theme-admin-secondary', adminColors.secondary);
    root.style.setProperty('--theme-admin-accent', adminColors.accent);
    root.style.setProperty('--theme-admin-on-primary', adminOnPrimary);
    root.style.setProperty('--theme-admin-on-secondary', adminOnSecondary);
  }

  function setLegacyVariables(publicColors, adminColors) {
    root.style.setProperty('--brand-primary', publicColors.primary);
    root.style.setProperty('--brand-primary-dark', publicColors.primary);
    root.style.setProperty('--brand-secondary', publicColors.secondary);
    root.style.setProperty('--brand-accent', publicColors.accent);
    root.style.setProperty('--brand-signal', publicColors.signal);
    root.style.setProperty('--brand-danger', publicColors.signal);
    root.style.setProperty('--brand-on-primary', readableOn(publicColors.primary));
    root.style.setProperty('--brand-on-secondary', readableOn(publicColors.secondary));

    root.style.setProperty('--admin-primary', adminColors.primary);
    root.style.setProperty('--admin-secondary', adminColors.secondary);
    root.style.setProperty('--admin-accent', adminColors.accent);
    root.style.setProperty('--admin-signal', adminColors.signal);
    root.style.setProperty('--admin-on-primary', readableOn(adminColors.primary));
    root.style.setProperty('--admin-on-secondary', readableOn(adminColors.secondary));
    root.style.setProperty('--green', adminColors.secondary);
    root.style.setProperty('--yellow', adminColors.accent);
    root.style.setProperty('--danger', adminColors.signal);
  }

  function setCompatibilityDatasets(config, themeId) {
    const p = config.public || {};
    const a = config.admin || {};
    const mobile = window.innerWidth < 900;
    Object.assign(root.dataset, {
      govTheme: themeId,
      themeColorAuthority: 'true',
      publicPreset: p.preset || config.pack || THEMES[themeId].basePack,
      publicFont: p.font || 'system',
      publicRadius: p.radius || 'rounded',
      publicDensity: p.density || 'comfortable',
      publicNav: p.navSkin || p.nav || 'gradient',
      publicNavSkin: p.navSkin || p.nav || 'gradient',
      publicNavRequested: p.navPosition || 'top',
      publicNavPosition: mobile ? 'top' : (p.navPosition || 'top'),
      publicNavAlign: mobile ? 'right' : (p.navAlign || 'right'),
      publicNavMode: mobile ? 'links' : (p.navMode || 'links'),
      publicHero: p.hero || 'bold',
      publicCards: p.cards || 'elevated',
      publicContentWidth: p.contentWidth || 'wide',
      publicThemeReady: 'true',
      adminPreset: a.preset || config.pack || THEMES[themeId].basePack,
      adminFont: a.font || 'system',
      adminRadius: a.radius || 'rounded',
      adminDensity: a.density || 'comfortable',
      adminSidebar: a.sidebar || 'brand',
      adminSidebarWidth: a.sidebarWidth || 'standard',
      adminTopbar: a.topbar || 'soft',
      adminContentWidth: a.contentWidth || 'wide',
      adminButtons: a.buttons || 'solid',
      adminTables: a.tables || 'clean',
      adminCards: a.cards || 'elevated',
      adminThemeReady: 'true',
      govThemeReady: 'true'
    });
    if (root.dataset.adminShellReady === 'true') root.dataset.adminUiReady = 'true';
  }

  function normalizeConfigForCache(config, themeId, publicColors, adminColors) {
    const meta = THEMES[themeId];
    return {
      ...config,
      version: config.version || 9,
      experience: themeId,
      pack: config.pack || meta.basePack,
      public: { ...(config.public || {}), colors: publicColors },
      admin: { ...(config.admin || {}), colors: adminColors }
    };
  }

  function writeCaches(themeId, config) {
    try {
      localStorage.setItem(GOV_CACHE_KEY, JSON.stringify({ version:VERSION, id:themeId, config, savedAt:Date.now() }));
      localStorage.setItem(DESIGN_CACHE_KEY, JSON.stringify({ version:9, savedAt:Date.now(), config }));
      [
        'brgyweb:gov-theme:v1','brgyweb:gov-theme:v2','brgyweb:gov-theme:v3','brgyweb:gov-theme:v4','brgyweb:gov-theme:v5',
        'brgyweb:design-theme:v8','brgyweb:design-theme:v7','brgyweb:design-theme:v6','brgyweb:design-theme:v1'
      ].forEach((key)=>localStorage.removeItem(key));
    } catch {}
  }

  function apply(id, input={}) {
    const themeId = normalize(id, input.pack);
    const meta = THEMES[themeId];
    const publicColors = safeColors(input.public?.colors, meta.colors);
    const adminColors = safeColors(input.admin?.colors || input.public?.colors, publicColors);
    const config = normalizeConfigForCache(input, themeId, publicColors, adminColors);

    setCanonicalVariables(publicColors, adminColors);
    setLegacyVariables(publicColors, adminColors);
    setCompatibilityDatasets(config, themeId);
    lastApplied = { id:themeId, config };
    writeCaches(themeId, config);
    ensureAuthorityLast();
    requestAnimationFrame(ensureAuthorityLast);
    setTimeout(ensureAuthorityLast, 100);
    window.dispatchEvent(new CustomEvent('brgy:government-theme-applied', { detail:{ id:themeId, config } }));
    return themeId;
  }

  function cached() {
    try {
      for (const key of [GOV_CACHE_KEY,'brgyweb:gov-theme:v5','brgyweb:gov-theme:v4','brgyweb:gov-theme:v3','brgyweb:gov-theme:v2']) {
        const value = JSON.parse(localStorage.getItem(key) || 'null');
        if (value?.id && THEMES[value.id] && value?.config) return value;
      }
    } catch {}
    return null;
  }

  async function load(force=false) {
    if (refreshPromise) return refreshPromise;

    const client = window.BRGY_SUPABASE;
    if (!client) {
      const fallback = cached();
      if (fallback) return apply(fallback.id, fallback.config);
      return apply('modern-lgu');
    }

    refreshPromise = (async () => {
      try {
        const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
        if (error) throw error;
        const config=data?.design_theme||{};
        lastRefresh=Date.now();
        return apply(config.experience, config);
      } catch (error) {
        console.warn('Government theme refresh failed; using offline fallback:', error);
        const fallback = cached();
        if (fallback) return apply(fallback.id, fallback.config);
        return apply('modern-lgu');
      } finally {
        refreshPromise=null;
      }
    })();
    return refreshPromise;
  }

  window.addEventListener('pageshow',()=>{
    if(Date.now()-lastRefresh>1500) load(true);
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&Date.now()-lastRefresh>1500) load(true);
  });
  window.addEventListener('resize',()=>{
    if(lastApplied) setCompatibilityDatasets(lastApplied.config,lastApplied.id);
  },{passive:true});

  window.BRGY_GOV_THEMES = THEMES;
  window.BRGY_GOV_THEME_RUNTIME = {version:VERSION,THEMES,PACK_MAP,normalize,apply,load,cached};
  load();
})();

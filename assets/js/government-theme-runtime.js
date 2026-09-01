(() => {
  'use strict';
  if (window.BRGY_GOV_THEME_RUNTIME) return;

  const THEMES = {
    'national-authority': { name:'National Authority', tag:'Formal', basePack:'civic-standard', colors:{primary:'#10233f',secondary:'#1f4f7a',accent:'#d3ad4a',signal:'#9f363d'} },
    'executive-civic': { name:'Executive Civic', tag:'Executive', basePack:'executive-portal', colors:{primary:'#15342a',secondary:'#246447',accent:'#c9a64a',signal:'#a13d43'} },
    'public-service': { name:'Public Service', tag:'Service First', basePack:'forest-professional', colors:{primary:'#123b5d',secondary:'#1d6f8e',accent:'#e0b448',signal:'#a63d40'} },
    'institutional': { name:'Institutional', tag:'Authority', basePack:'minimal-authority', colors:{primary:'#27313b',secondary:'#536473',accent:'#c4a150',signal:'#9e3f45'} },
    'modern-lgu': { name:'Modern LGU', tag:'Flagship', basePack:'civic-premium', colors:{primary:'#0b2f21',secondary:'#1b6b45',accent:'#d8b63e',signal:'#a63d40'} }
  };

  const PACK_MAP = {'civic-standard':'national-authority','executive-portal':'executive-civic','forest-professional':'public-service','minimal-authority':'institutional','civic-premium':'modern-lgu','civic-signature':'modern-lgu'};
  const normalize = (id, pack) => THEMES[id] ? id : (PACK_MAP[pack] || 'modern-lgu');

  function apply(id, config={}) {
    const themeId = normalize(id, config.pack);
    const meta = THEMES[themeId];
    const pc = config.public?.colors || meta.colors;
    const ac = config.admin?.colors || pc;
    const root = document.documentElement;
    root.dataset.govTheme = themeId;
    root.style.setProperty('--gov-primary', pc.primary || meta.colors.primary);
    root.style.setProperty('--gov-secondary', pc.secondary || meta.colors.secondary);
    root.style.setProperty('--gov-accent', pc.accent || meta.colors.accent);
    root.style.setProperty('--gov-signal', pc.signal || meta.colors.signal);
    root.style.setProperty('--gov-admin-primary', ac.primary || meta.colors.primary);
    root.style.setProperty('--gov-admin-secondary', ac.secondary || meta.colors.secondary);
    root.style.setProperty('--gov-admin-accent', ac.accent || meta.colors.accent);
    root.dataset.govThemeReady = 'true';
    try { localStorage.setItem('brgyweb:gov-theme:v1', JSON.stringify({id:themeId,config,savedAt:Date.now()})); } catch {}
    return themeId;
  }

  function cached() {
    try { const v=JSON.parse(localStorage.getItem('brgyweb:gov-theme:v1')||'null'); return v?.id&&THEMES[v.id]?v:null; } catch { return null; }
  }

  async function load() {
    const old = cached();
    if (old) apply(old.id, old.config || {});
    const client = window.BRGY_SUPABASE;
    if (!client) { if (!old) apply('modern-lgu'); return; }
    try {
      const {data,error}=await client.from('site_settings').select('design_theme').eq('id',1).single();
      if (error) throw error;
      const config=data?.design_theme||{};
      apply(config.experience, config);
    } catch (error) {
      console.warn('Government theme unavailable:', error);
      if (!old) apply('modern-lgu');
    }
  }

  window.BRGY_GOV_THEMES = THEMES;
  window.BRGY_GOV_THEME_RUNTIME = {THEMES,PACK_MAP,normalize,apply,load};
  load();
})();

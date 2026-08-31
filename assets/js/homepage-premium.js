(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const defs = [
    ['premium-stat-announcements','announcements','is_published'],
    ['premium-stat-services','services','is_active'],
    ['premium-stat-forms','forms','is_published'],
    ['premium-stat-disclosures','disclosures','is_published']
  ];

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  };

  async function countPublished(table, flag) {
    if (!client) return null;
    const { count, error } = await client.from(table).select('id', { count:'exact', head:true }).eq(flag, true);
    if (error) throw error;
    return count ?? 0;
  }

  async function boot() {
    if (!defs.some(([id]) => document.getElementById(id))) return;
    await Promise.all(defs.map(async ([id,table,flag]) => {
      try {
        const count = await countPublished(table, flag);
        set(id, count === null ? '—' : count);
      } catch (error) {
        console.warn(`Unable to load ${table} count:`, error);
        set(id, '—');
      }
    }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();

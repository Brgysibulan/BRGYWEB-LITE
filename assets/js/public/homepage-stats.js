/**
 * BRGYWEB-LITE — Homepage Statistics
 * Purpose: Show counts of published public records in the homepage portal summary.
 * Depends on: core/supabase-config.js
 * Used by: index.html
 */
(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const definitions = [
    ['premium-stat-announcements','announcements','is_published'],
    ['premium-stat-services','services','is_active'],
    ['premium-stat-forms','forms','is_published'],
    ['premium-stat-disclosures','disclosures','is_published']
  ];

  function setCount(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  }

  async function countPublished(table, flag) {
    if (!client) return null;
    const { count, error } = await client.from(table).select('id', { count:'exact', head:true }).eq(flag, true);
    if (error) throw error;
    return count ?? 0;
  }

  async function boot() {
    if (!definitions.some(([id]) => document.getElementById(id))) return;
    await Promise.all(definitions.map(async ([id, table, flag]) => {
      try {
        const count = await countPublished(table, flag);
        setCount(id, count === null ? '—' : count);
      } catch (error) {
        console.warn(`Unable to load ${table} count:`, error);
        setCount(id, '—');
      }
    }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
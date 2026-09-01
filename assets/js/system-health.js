(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const refreshButton = document.getElementById('system-health-refresh');
  const dashboardRefresh = document.getElementById('dashboard-refresh');
  if (!client || !document.getElementById('system-health-panel')) return;

  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => { const el = byId(id); if (el) el.textContent = String(value ?? '—'); };

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (!Number.isFinite(value) || value < 0) return '—';
    if (value < 1024) return `${value.toFixed(0)} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let size = value / 1024;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; }
    return `${size >= 100 ? size.toFixed(0) : size >= 10 ? size.toFixed(1) : size.toFixed(2)} ${units[index]}`;
  }

  function percentage(used, limit) {
    const u = Number(used || 0);
    const l = Number(limit || 0);
    if (!Number.isFinite(u) || !Number.isFinite(l) || l <= 0) return 0;
    return Math.max(0, Math.min(100, (u / l) * 100));
  }

  function healthTone(percent) {
    if (percent >= 90) return 'danger';
    if (percent >= 75) return 'warning';
    return 'success';
  }

  function setBadge(id, label, tone = 'secondary') {
    const el = byId(id);
    if (!el) return;
    el.textContent = label;
    el.className = `badge rounded-pill text-bg-${tone}`;
  }

  function setProgress(id, percent) {
    const el = byId(id);
    if (!el) return;
    const safe = Math.max(0, Math.min(100, Number(percent || 0)));
    const tone = healthTone(safe);
    el.style.width = `${safe}%`;
    el.setAttribute('aria-valuenow', safe.toFixed(1));
    el.className = `progress-bar bg-${tone}`;
  }

  function renderSupabase(data = {}) {
    const dbPercent = percentage(data.database_bytes, data.database_limit_bytes);
    const storagePercent = percentage(data.storage_bytes, data.storage_limit_bytes);
    const worst = Math.max(dbPercent, storagePercent);
    setBadge('supabase-health-state', data.status === 'healthy' ? 'Healthy' : 'Attention', data.status === 'healthy' ? healthTone(worst) : 'danger');
    setText('supabase-health-plan', String(data.plan || 'unknown').toUpperCase());
    setText('supabase-db-usage', `${formatBytes(data.database_bytes)} / ${formatBytes(data.database_limit_bytes)}`);
    setText('supabase-db-remaining', `${formatBytes(data.database_remaining_bytes)} remaining`);
    setText('supabase-db-percent', `${dbPercent.toFixed(1)}% used`);
    setProgress('supabase-db-progress', dbPercent);
    setText('supabase-storage-usage', `${formatBytes(data.storage_bytes)} / ${formatBytes(data.storage_limit_bytes)}`);
    setText('supabase-storage-remaining', `${formatBytes(data.storage_remaining_bytes)} remaining`);
    setText('supabase-storage-percent', `${storagePercent.toFixed(1)}% used`);
    setProgress('supabase-storage-progress', storagePercent);
    setText('supabase-storage-objects', `${Number(data.storage_objects || 0).toLocaleString()} stored object${Number(data.storage_objects || 0) === 1 ? '' : 's'}`);
  }

  function renderGitHub(data = {}) {
    const status = String(data.status || 'unavailable');
    const tone = status === 'healthy' ? 'success' : status === 'deploying' ? 'warning' : 'danger';
    setBadge('github-health-state', status === 'healthy' ? 'Healthy' : status === 'deploying' ? 'Deploying' : status === 'attention' ? 'Attention' : 'Unavailable', tone);
    const runNumber = data.latest_run_number ? `#${data.latest_run_number}` : '—';
    const conclusion = data.latest_run_conclusion || data.latest_run_status || 'unknown';
    setText('github-latest-deploy', `${runNumber} · ${conclusion}`);
    const sha = String(data.latest_run_sha || '');
    setText('github-latest-sha', sha ? sha.slice(0, 10) : '—');
    const repoPercent = percentage(data.repository_bytes, data.repository_recommended_limit_bytes);
    setText('github-repo-usage', `${formatBytes(data.repository_bytes)} / ${formatBytes(data.repository_recommended_limit_bytes)}`);
    setText('github-repo-remaining', `${formatBytes(data.repository_remaining_bytes)} recommended headroom`);
    setText('github-repo-percent', `${repoPercent.toFixed(1)}% used`);
    setProgress('github-repo-progress', repoPercent);
    setText('github-actions-minutes', data.actions_minutes || '—');
    setText('github-pages-bandwidth', data.pages_bandwidth_limit_gb ? `${data.pages_bandwidth_limit_gb} GB/month soft limit` : '—');
    setText('github-pages-bandwidth-note', data.pages_bandwidth_note || '');
  }

  async function loadHealth() {
    if (refreshButton) refreshButton.disabled = true;
    setText('system-health-status', 'Checking GitHub and Supabase…');
    try {
      const { data, error } = await client.functions.invoke('system-health', { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      renderSupabase(data?.supabase || {});
      renderGitHub(data?.github || {});
      const checked = data?.checked_at ? new Date(data.checked_at) : new Date();
      setText('system-health-status', 'Live health check completed.');
      setText('system-health-checked', `Checked ${checked.toLocaleString()}`);
    } catch (error) {
      console.error('System health error:', error);
      setBadge('supabase-health-state', 'Unavailable', 'danger');
      setBadge('github-health-state', 'Unavailable', 'danger');
      setText('system-health-status', error?.message || 'Unable to load system health.');
    } finally {
      if (refreshButton) refreshButton.disabled = false;
    }
  }

  refreshButton?.addEventListener('click', loadHealth);
  dashboardRefresh?.addEventListener('click', loadHealth);
  loadHealth();
})();

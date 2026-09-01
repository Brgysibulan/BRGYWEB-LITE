(() => {
  'use strict';

  const client = window.BRGY_SUPABASE;
  const refreshButton = document.getElementById('system-health-refresh');
  const dashboardRefresh = document.getElementById('dashboard-refresh');
  if (!client || !document.getElementById('system-health-panel')) return;

  const AUTO_REFRESH_MS = 5 * 60 * 1000;
  const STORAGE_SIGNAL_KEY = 'brgyweb:storage-change:v1';
  let autoTimer = null;
  let lastCheckedAt = 0;
  let loading = false;

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
    if (percent > 85) return 'danger';
    if (percent >= 70) return 'warning';
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
    el.style.width = `${safe}%`;
    el.setAttribute('aria-valuenow', safe.toFixed(1));
    el.className = `progress-bar bg-${healthTone(safe)}`;
  }

  function renderSupabase(data = {}) {
    const dbPercent = percentage(data.database_bytes, data.database_limit_bytes);
    const storagePercent = percentage(data.storage_bytes, data.storage_limit_bytes);
    const worst = Math.max(dbPercent, storagePercent);
    setBadge('supabase-health-state', data.status === 'healthy' ? 'Healthy' : 'Attention', data.status === 'healthy' ? healthTone(worst) : 'danger');
    setText('supabase-health-plan', String(data.plan || 'unknown').toUpperCase());

    const slots = data.project_slots || {};
    const activeSlots = Number(slots.active);
    const slotLimit = Number(slots.limit);
    const slotRemaining = Number(slots.remaining);
    setText('supabase-project-slots', Number.isFinite(activeSlots) && Number.isFinite(slotLimit) ? `${activeSlots}/${slotLimit} active` : '—');
    setText('supabase-project-remaining', Number.isFinite(slotRemaining) ? `${slotRemaining} remaining` : '—');
    setText('supabase-project-note', slots.note || 'Project-slot count is an account snapshot, not a live project-runtime metric.');

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

  function clearAutoTimer() {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
  }

  function scheduleAutoRefresh() {
    clearAutoTimer();
    if (document.visibilityState !== 'visible') {
      setText('system-health-auto', 'Auto-refresh paused while this tab is in the background.');
      return;
    }
    const elapsed = lastCheckedAt ? Date.now() - lastCheckedAt : 0;
    const wait = lastCheckedAt ? Math.max(1000, AUTO_REFRESH_MS - elapsed) : AUTO_REFRESH_MS;
    const mins = Math.max(1, Math.ceil(wait / 60000));
    setText('system-health-auto', `Auto-refresh in about ${mins} min · pauses in background tabs.`);
    autoTimer = setTimeout(() => loadHealth('auto'), wait);
  }

  async function loadHealth(reason = 'manual') {
    if (loading) return;
    loading = true;
    clearAutoTimer();
    if (refreshButton) refreshButton.disabled = true;
    setText('system-health-status', reason === 'storage-change' ? 'Storage changed — refreshing health…' : 'Checking GitHub and Supabase…');
    try {
      const { data, error } = await client.functions.invoke('system-health', { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      renderSupabase(data?.supabase || {});
      renderGitHub(data?.github || {});
      const checked = data?.checked_at ? new Date(data.checked_at) : new Date();
      lastCheckedAt = Number.isFinite(checked.getTime()) ? checked.getTime() : Date.now();
      const message = reason === 'auto' ? 'Automatic health check completed.' : reason === 'storage-change' ? 'Health refreshed after a Storage change.' : 'Live health check completed.';
      setText('system-health-status', message);
      setText('system-health-checked', `Checked ${checked.toLocaleString()}`);
    } catch (error) {
      console.error('System health error:', error);
      setBadge('supabase-health-state', 'Unavailable', 'danger');
      setBadge('github-health-state', 'Unavailable', 'danger');
      setText('system-health-status', error?.message || 'Unable to load system health.');
      if (!lastCheckedAt) lastCheckedAt = Date.now();
    } finally {
      loading = false;
      if (refreshButton) refreshButton.disabled = false;
      scheduleAutoRefresh();
    }
  }

  refreshButton?.addEventListener('click', () => loadHealth('manual'));
  dashboardRefresh?.addEventListener('click', () => loadHealth('dashboard-refresh'));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      clearAutoTimer();
      setText('system-health-auto', 'Auto-refresh paused while this tab is in the background.');
      return;
    }
    if (!lastCheckedAt || Date.now() - lastCheckedAt >= AUTO_REFRESH_MS) loadHealth('resume');
    else scheduleAutoRefresh();
  });

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_SIGNAL_KEY && document.visibilityState === 'visible') loadHealth('storage-change');
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted && (!lastCheckedAt || Date.now() - lastCheckedAt >= AUTO_REFRESH_MS)) loadHealth('resume');
  });
  window.addEventListener('beforeunload', clearAutoTimer);

  loadHealth('initial');
})();
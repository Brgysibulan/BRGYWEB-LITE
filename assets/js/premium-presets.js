(() => {
  'use strict';

  let attempts = 0;

  function boot() {
    const base = window.BRGY_THEME;
    if (!base) {
      if (attempts++ < 40) window.setTimeout(boot, 50);
      return;
    }

    if (!base.publicPresets?.premium || !base.adminPresets?.control) {
      const publicPremium = {
        preset:'premium',font:'system',radius:'rounded',density:'comfortable',
        navSkin:'glass',nav:'glass',navPosition:'floating',navAlign:'right',navMode:'links',
        hero:'split',cards:'elevated',contentWidth:'wide'
      };
      const adminControl = {
        preset:'control',font:'system',radius:'rounded',density:'comfortable',sidebar:'brand',cards:'elevated'
      };

      window.BRGY_THEME = Object.freeze({
        ...base,
        publicPresets:Object.freeze({...base.publicPresets,premium:publicPremium}),
        adminPresets:Object.freeze({...base.adminPresets,control:adminControl})
      });
    }

    injectButtons();
  }

  function injectButtons() {
    const publicGrid = document.querySelector('[data-studio-panel="public"] .studio3-presets');
    if (publicGrid && !publicGrid.querySelector('[data-design-preset="premium"]')) {
      const button = document.createElement('button');
      button.className = 'studio3-preset';
      button.type = 'button';
      button.dataset.scope = 'public';
      button.dataset.designPreset = 'premium';
      button.innerHTML = '<div class="studio3-thumb float"></div><strong>Civic Premium</strong><small>Floating glass · split hero · elevated cards</small>';
      publicGrid.prepend(button);
      const count = document.querySelector('[data-studio-panel="public"] .studio3-count');
      if (count) count.textContent = '9 presets';
    }

    const adminGrid = document.querySelector('[data-studio-panel="admin"] .studio3-presets');
    if (adminGrid && !adminGrid.querySelector('[data-design-preset="control"]')) {
      const button = document.createElement('button');
      button.className = 'studio3-preset';
      button.type = 'button';
      button.dataset.scope = 'admin';
      button.dataset.designPreset = 'control';
      button.innerHTML = '<div class="studio3-thumb left"></div><strong>Control Center</strong><small>Premium green workspace · elevated panels</small>';
      adminGrid.prepend(button);
      const count = document.querySelector('[data-studio-panel="admin"] .studio3-count');
      if (count) count.textContent = '7 presets';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();

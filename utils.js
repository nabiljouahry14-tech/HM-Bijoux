/* utils.js — lightweight shared helpers (safe to load before app.js)
   This file only defines helpers if they don't already exist to avoid clobbering app.js.
*/
(function(){
  if (!window.$) window.$ = (s, r = document) => r.querySelector(s);
  if (!window.$$) window.$$ = (s, r = document) => Array.from((r || document).querySelectorAll(s));

  if (!window._INLINE_SVG_FALLBACK) {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='%23ededed'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='20'>Image unavailable</text></svg>";
    window._INLINE_SVG_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  if (!window._parseCardImages) {
    window._parseCardImages = function(card){
      if (!card) return [];
      if (card.dataset && card.dataset.images) return card.dataset.images.split(',').map(s=>s.trim()).filter(Boolean);
      if (card.dataset && card.dataset.img) return [card.dataset.img];
      const i = card.querySelector && card.querySelector('img');
      if (i && i.src) return [i.src];
      return [];
    };
  }

  // non-invasive image error handler (lightweight) — defer to app.js full handler if present
  if (!window._handleImgError) {
    window._handleImgError = function(img){
      try {
        if (!img) return;
        if (img.dataset && img.dataset._fallbackApplied === '1') return;
        img.dataset._fallbackApplied = '1';
        img.src = window._INLINE_SVG_FALLBACK;
      } catch(e) {}
    };
  }
})();

// THEME SYSTEM (global, persistent)
(function () {
  const THEME_KEY = "luxetech_theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY);
  }

  function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    const saved = getStoredTheme();
    const theme = saved ? saved : "light";
    applyTheme(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
  }

  // expose globally
  window._luxetech_theme = {
    init: initTheme,
    toggle: toggleTheme,
  };
})();

// Initialize theme and connect button on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme from storage
  if (window._luxetech_theme) {
    window._luxetech_theme.init();
  }

  // Connect theme toggle button
  const btn = document.getElementById("themeToggle");
  if (btn && window._luxetech_theme) {
    btn.addEventListener("click", () => {
      window._luxetech_theme.toggle();
    });
  }
});

// NOTIFICATION SYSTEM (premium toast notifications)
(function () {
  if (!window._luxetech_notify) {
    let notificationContainer = null;

    function createContainer() {
      if (notificationContainer) return notificationContainer;
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'luxetech-notifications';
      notificationContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
        max-width: 400px;
      `;
      document.body.appendChild(notificationContainer);
      return notificationContainer;
    }

    function show(message, type = 'info', duration = 4000) {
      const container = createContainer();
      const toast = document.createElement('div');
      toast.style.cssText = `
        background: var(--card, #fff);
        color: var(--text, #000);
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        pointer-events: auto;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        font-weight: 500;
        font-size: 14px;
        line-height: 1.4;
        position: relative;
        overflow: hidden;
      `;

      // Dark theme adjustments
      if (document.documentElement.getAttribute('data-theme') === 'dark') {
        toast.style.borderColor = 'rgba(255,255,255,0.1)';
        toast.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
      }

      // Type-specific styling
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (type === 'success') {
        toast.style.borderColor = '#10b981';
        toast.style.background = isDark 
          ? 'linear-gradient(135deg, #064e3b, #065f46)' 
          : 'linear-gradient(135deg, #f0fdf4, #dcfce7)';
        toast.style.color = isDark ? '#d1fae5' : '#166534';
      } else if (type === 'error') {
        toast.style.borderColor = '#ef4444';
        toast.style.background = isDark 
          ? 'linear-gradient(135deg, #7f1d1d, #991b1b)' 
          : 'linear-gradient(135deg, #fef2f2, #fee2e2)';
        toast.style.color = isDark ? '#fecaca' : '#991b1b';
      } else if (type === 'warning') {
        toast.style.borderColor = '#f59e0b';
        toast.style.background = isDark 
          ? 'linear-gradient(135deg, #78350f, #92400e)' 
          : 'linear-gradient(135deg, #fffbeb, #fef3c7)';
        toast.style.color = isDark ? '#fed7aa' : '#92400e';
      }

      toast.textContent = message;

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 12px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
        line-height: 1;
        transition: opacity 0.2s ease;
      `;
      closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
      closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.7');
      closeBtn.addEventListener('click', () => removeToast(toast));
      toast.appendChild(closeBtn);

      container.appendChild(toast);

      // Animate in
      setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
      }, 10);

      // Auto remove
      if (duration > 0) {
        setTimeout(() => removeToast(toast), duration);
      }

      function removeToast(toast) {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }

    window._luxetech_notify = {
      show: show,
      success: (msg, duration) => show(msg, 'success', duration),
      error: (msg, duration) => show(msg, 'error', duration),
      warning: (msg, duration) => show(msg, 'warning', duration),
      info: (msg, duration) => show(msg, 'info', duration)
    };
  }
})();

/* cart.js — lightweight cart bridge so pages can interact with cart before app.js loads
   It loads cart from localStorage into window.cart and provides save/load helpers and a safe
   `_luxetech_refreshCart` stub that app.js will replace when available.
*/
(function(){
  try {
    if (!window.cart) {
      try { window.cart = JSON.parse(localStorage.getItem('luxe_cart_v1')) || []; } catch(e) { window.cart = []; }
    }
  } catch(e) { window.cart = window.cart || []; }

  window.saveCartToStorage = window.saveCartToStorage || function(){ try { localStorage.setItem('luxe_cart_v1', JSON.stringify(window.cart || [])); } catch(e){} };
  window.loadCartFromStorage = window.loadCartFromStorage || function(){ try { window.cart = JSON.parse(localStorage.getItem('luxe_cart_v1')) || []; } catch(e){ window.cart = window.cart || []; } };

  // provide a safe refresh function that updates any header counters if present
  if (!window._luxetech_refreshCart) {
    window._luxetech_refreshCart = function(){
      try {
        const cart = window.cart || [];
        const itemCount = cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
        const cc = document.getElementById('cartCount'); if (cc) cc.textContent = cart.length;
        const cs = document.getElementById('cartCountSummary'); if (cs) cs.textContent = `${cart.length} item${cart.length!==1?'s':''}`;
        const ct = document.getElementById('cartTotal'); if (ct) {
          const total = cart.reduce((s,it)=> s + (Number(it.price||0) * (it.qty||1)), 0);
          ct.textContent = formatCurrency(total);
        }
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
        const summaryCount = document.getElementById('cartSummaryItemCount');
        if (summaryCount) summaryCount.textContent = `${itemCount} item${itemCount!==1?'s':''}`;
      } catch(e){}
    };
  }

  window.addEventListener('storage', (e) => {
    try {
      if (e.key === 'luxe_cart_v1') {
        try { window.cart = JSON.parse(e.newValue) || []; } catch(e) { window.cart = []; }
        if (window._luxetech_refreshCart) window._luxetech_refreshCart();
      }
    } catch(e){}
  });

  // Cart UI rendering and handlers (migrated from app.js)
  (function cartUI(){
    const cartBtn = document.getElementById('cartBtn');
    const cartPanel = document.getElementById('cartPanel');
    const closeCart = document.getElementById('closeCart');
    const cartItemsDiv = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');
    const cartCountSummary = document.getElementById('cartCountSummary');
    const cartLive = document.getElementById('cartLive') || null;

    function refreshCartUI(){
      try {
        const hasItemsDiv = !!cartItemsDiv;
        let total = 0;
        (window.cart || []).forEach((item) => { const qty = item.qty || 1; total += (Number(item.price || 0) * qty); });

        if (hasItemsDiv) {
          cartItemsDiv.innerHTML = '';
          (window.cart || []).forEach((item, index) => {
            if (!item.qty) item.qty = 1;
            const itemTotal = Number(item.price || 0) * item.qty;
            const row = document.createElement('div');
            row.className = 'cart-item enter';
            row.innerHTML = `\n      <img src="${item.img}" alt="">\n\n      <div class="ci-details">\n        <strong>${item.name}</strong>\n        <small>${formatCurrency(item.price)}</small>\n      </div>\n\n      <div class="ci-actions">\n        <div class="qty-control">\n          <button class="qty-minus" data-i="${index}">-</button>\n          <input type="text" value="${item.qty}" readonly>\n          <button class="qty-plus" data-i="${index}">+</button>\n        </div>\n\n        <div class="ci-price">${formatCurrency(itemTotal)}</div>\n\n        <button class="remove-btn" data-i="${index}" style="color:var(--primary);background:none;border:0;cursor:pointer;">\n          Remove\n        </button>\n      </div>\n    `;
            cartItemsDiv.appendChild(row);
            try { const imgEl = row.querySelector('img'); if (imgEl) imgEl.addEventListener('error', () => { if (window._handleImgError) window._handleImgError(imgEl); else imgEl.src = window._INLINE_SVG_FALLBACK; }); } catch(e){}
          });
        }

        if (cartTotal) cartTotal.textContent = formatCurrency(total);
        if (cartCount) { cartCount.textContent = (window.cart||[]).length; cartCount.setAttribute('aria-label', `${(window.cart||[]).length} items in cart`); }
        if (cartCountSummary) cartCountSummary.textContent = `${(window.cart||[]).length} item${(window.cart||[]).length !== 1 ? 's' : ''}`;

        try { window.saveCartToStorage && window.saveCartToStorage(); } catch(e){}

        if (hasItemsDiv) {
          // remove
          Array.from(cartItemsDiv.querySelectorAll('.remove-btn')).forEach(btn => btn.addEventListener('click', () => {
            const i = Number(btn.dataset.i);
            window.cart.splice(i,1);
            refreshCartUI();
            if (cartLive) cartLive.textContent = `Item removed. You have ${window.cart.length} item${window.cart.length>1?'s':''} in your cart.`;
          }));
          // qty plus
          Array.from(cartItemsDiv.querySelectorAll('.qty-plus')).forEach(btn => btn.addEventListener('click', () => {
            const i = Number(btn.dataset.i); window.cart[i].qty = (window.cart[i].qty||1)+1; refreshCartUI(); if (cartLive) cartLive.textContent = `Updated quantity. You have ${window.cart.length} item${window.cart.length>1?'s':''} in your cart.`;
          }));
          // qty minus
          Array.from(cartItemsDiv.querySelectorAll('.qty-minus')).forEach(btn => btn.addEventListener('click', () => {
            const i = Number(btn.dataset.i); if ((window.cart[i].qty||1) > 1) window.cart[i].qty--; refreshCartUI(); if (cartLive) cartLive.textContent = `Updated quantity. You have ${window.cart.length} item${window.cart.length>1?'s':''} in your cart.`;
          }));
        }
      } catch(e) { console.debug('[CartUI] refresh failed', e); }
    }

    // expose concrete implementation
    window._luxetech_refreshCart = refreshCartUI;
    window.refreshCartUI = refreshCartUI;

    // open/close handlers
    if (cartBtn && cartPanel) {
      cartBtn.addEventListener('click', () => {
        cartPanel.classList.add('open'); cartPanel.setAttribute('aria-hidden','false'); cartBtn.setAttribute('aria-expanded','true');
        if (closeCart) closeCart.focus();
        try { if (typeof trapFocus === 'function') trapFocus(cartPanel); } catch(e) {}
      });
    }
    if (closeCart && cartPanel) {
      closeCart.addEventListener('click', () => {
        cartPanel.classList.remove('open'); cartPanel.setAttribute('aria-hidden','true'); if (cartBtn) cartBtn.setAttribute('aria-expanded','false'); if (cartBtn) cartBtn.focus(); try{ if (typeof releaseFocus==='function') releaseFocus(cartPanel); }catch(e){}
      });
    }

    // clear cart
    const clearCartBtn = document.querySelector('.clear-cart-btn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        window.cart.length = 0; try { window.saveCartToStorage && window.saveCartToStorage(); } catch(e) {}
        refreshCartUI();
      });
    }

    // initial render
    try { window.loadCartFromStorage && window.loadCartFromStorage(); } catch(e){}
    refreshCartUI();
  })();
  
// Listen for language changes to update currency symbols
window.addEventListener('languageChanged', () => {
  if (typeof window.refreshCartUI === 'function') {
    window.refreshCartUI();
  }
});

})();


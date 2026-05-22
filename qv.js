/* qv.js — extracted Quick View module
   Safe to load before app.js. Uses bridge helpers defined in `utils.js` and interacts with `cart.js` via window.cart and window._luxetech_refreshCart.
*/
(function(){
  function $$(s,r=document){return Array.from((r||document).querySelectorAll(s));}
  function $(s,r=document){return (r||document).querySelector(s);} 

  const modal = $('#quickViewModal');
  if (!modal) return;
  const overlay = modal.querySelector('.qv-overlay');
  const closeBtn = modal.querySelector('#qvClose');
  const qvImage = modal.querySelector('#qvImage');
  const qvTitle = modal.querySelector('#qvTitle');
  const qvDesc = modal.querySelector('#qvDesc');
  const qvPrice = modal.querySelector('#qvPrice');
  const qvAddBtn = modal.querySelector('#qvAddBtn');
  if (qvAddBtn) qvAddBtn.type = 'button';

  const _parse = window._parseCardImages || (typeof _parseCardImages !== 'undefined' && _parseCardImages) || function(c){ return []; };
  const _handleImg = window._handleImgError || (typeof _handleImgError !== 'undefined' && _handleImgError) || function(i){ if(i) i.src = window._INLINE_SVG_FALLBACK || ''; };

  function openQuickView(card){
    if (!card || !modal) return;
    const imgs = _parse(card);
    const name = card.querySelector('h3')?.textContent || card.dataset.name || '';
    const desc = card.querySelector('p')?.textContent || '';
    const price = card.dataset.price || '0';

    modal._qvImgs = imgs.length ? imgs : [card.dataset.img || card.querySelector('img')?.src || ''];
    modal._qvIndex = 0;
    function showQv(i){ modal._qvIndex = (typeof i === 'number') ? ((i % modal._qvImgs.length + modal._qvImgs.length) % modal._qvImgs.length) : modal._qvIndex; qvImage.src = modal._qvImgs[modal._qvIndex]; qvImage.alt = `${name} — image ${modal._qvIndex+1}`; }
    try { modal._qvImgs.forEach(src=>{ const im=new Image(); im.src = src; }); } catch(e){}
    showQv(0);
    qvTitle.textContent = name; qvDesc.textContent = desc; qvPrice.textContent = `$${price}`;
    // remember numeric price on modal so other handlers (View Product) can reuse it
    try { modal._qvPrice = Number(String(price).replace(/[^0-9.\-]/g,'')) || 0; } catch(e){ modal._qvPrice = 0; }

    if (!modal.querySelector('.qv-prev')){
      const prev = document.createElement('button'); prev.type='button'; prev.className='qv-prev'; prev.setAttribute('aria-label','Previous image'); prev.innerHTML='‹';
      const next = document.createElement('button'); next.type='button'; next.className='qv-next'; next.setAttribute('aria-label','Next image'); next.innerHTML='›';
      const content = modal.querySelector('.qv-content') || modal; content.appendChild(prev); content.appendChild(next);
      prev.addEventListener('click', ()=> showQv(modal._qvIndex-1)); next.addEventListener('click', ()=> showQv(modal._qvIndex+1));
    }

    function startQvAutoplay(){ if (modal._qvInterval) clearInterval(modal._qvInterval); modal._qvInterval = setInterval(()=> showQv(modal._qvIndex+1), 3200); }
    function stopQvAutoplay(){ if (modal._qvInterval) clearInterval(modal._qvInterval); }
    const contentEl = modal.querySelector('.qv-content'); if (contentEl){ contentEl.addEventListener('mouseenter', stopQvAutoplay); contentEl.addEventListener('mouseleave', startQvAutoplay); }

    (function addSwipe(){ let startX=null,moved=false; const minDist=40; const onTouchStart=(ev)=>{ startX = ev.touches ? ev.touches[0].clientX : ev.clientX; moved=false; }; const onTouchMove=(ev)=>{ if(!startX) return; const x = ev.touches ? ev.touches[0].clientX : ev.clientX; if (Math.abs(x-startX)>8) moved=true; }; const onTouchEnd=(ev)=>{ if(!startX||!moved){ startX=null; return;} const endX = (ev.changedTouches?ev.changedTouches[0].clientX:ev.clientX); const dx = endX - startX; if (dx>minDist) showQv(modal._qvIndex-1); else if (dx<-minDist) showQv(modal._qvIndex+1); startX=null; }; if (contentEl){ contentEl.addEventListener('touchstart', onTouchStart, {passive:true}); contentEl.addEventListener('touchmove', onTouchMove, {passive:true}); contentEl.addEventListener('touchend', onTouchEnd); contentEl.addEventListener('pointerdown', onTouchStart); contentEl.addEventListener('pointerup', onTouchEnd); } })();

    if (qvAddBtn){
      qvAddBtn.onclick = ()=>{
        const imgUrl = (modal._qvImgs && modal._qvImgs[modal._qvIndex]) || qvImage.src;
        let finalImg = imgUrl || qvImage.src || window._INLINE_SVG_FALLBACK || '';
        try { if (qvImage && qvImage.complete && qvImage.naturalWidth===0) finalImg = window._INLINE_SVG_FALLBACK || ''; } catch(e){}
        const existing = (window.cart||[]).find(i=>i.name===name);
        if (existing) existing.qty = (existing.qty||1) + 1; else (window.cart = window.cart||[]).push({ name, price:Number(price), img: finalImg });
        if (window._luxetech_refreshCart) window._luxetech_refreshCart();
        const cartLive = document.getElementById('cartLive'); if (cartLive) cartLive.textContent = `${name} added to cart. You have ${ (window.cart||[]).length } item${(window.cart||[]).length>1?'s':''} in your cart.`;
        modal.style.display = 'none'; modal.setAttribute('aria-hidden','true'); try { if (typeof releaseFocus === 'function') releaseFocus(modal); } catch(e){}
        stopQvAutoplay(); if (typeof gsap !== 'undefined' && document.getElementById('cartBtn')) gsap.fromTo(document.getElementById('cartBtn'), { scale:0.96 }, { scale:1.08, duration:0.18, yoyo:true, repeat:1 });
      };

      if (!modal.querySelector('#qvViewBtn')){
        const qvView = document.createElement('button'); qvView.id='qvViewBtn'; qvView.type='button'; qvView.className='btn btn-primary'; qvView.style.marginLeft='8px'; qvView.textContent='View Product';
        try { qvAddBtn.parentElement && qvAddBtn.parentElement.appendChild(qvView); } catch(e){}
        qvView.addEventListener('click', ()=>{
          // try to reuse last-opened card context if present on modal
          try {
            const card = document.querySelector('.product-card.search-focus') || null;
            const nameVal = card ? (card.querySelector('h3')?.textContent||card.dataset.name||'') : '';
            // fallback: read qvTitle
            const finalName = nameVal || qvTitle.textContent || '';
            const priceVal = (typeof modal._qvPrice === 'number' ? modal._qvPrice : 0);
            const product = { name: finalName, price: priceVal, desc: qvDesc.textContent || '', imgs: modal._qvImgs || [], thumb: qvImage.src || '', source: window.location.pathname || '' };
            const slugBase = (finalName||'product').toString().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
            const slug = slugBase + '-' + Date.now(); const sku = 'LX-'+(slugBase.slice(0,6).toUpperCase())+'-'+Math.floor(1000+Math.random()*9000);
            product.sku = sku; product.slug = slug; product.richDesc = product.desc + '\n\nBuilt with thoughtful details.';
            try { localStorage.setItem('luxe_product_' + slug, JSON.stringify(product)); localStorage.setItem('luxe_selected_product', JSON.stringify(product)); } catch(e){}
            const productLink = (location.pathname.indexOf('/collections/')!==-1 ? '../product.html' : 'product.html') + '?slug=' + encodeURIComponent(slug);
            window.location.href = productLink;
          } catch(e){ console.debug('[QV] view product failed', e); }
        });
      }
    }

    try { modal.style.display='flex'; modal.setAttribute('aria-hidden','false'); try{ if (typeof trapFocus==='function') trapFocus(modal); }catch(e){}; startQvAutoplay(); } catch(e){ console.error('[Qv] open error', e); }
  }

  // attach quick view buttons to cards
  $$('.product-card').forEach(card=>{
    const btn = document.createElement('button'); btn.type='button'; btn.textContent='Quick View'; btn.className='btn btn-ghost'; btn.style.marginTop='8px'; btn.dataset.qv='1'; const pcBody = card.querySelector('.pc-body'); if (pcBody) pcBody.appendChild(btn);
    const viewBtn = document.createElement('button'); viewBtn.type='button'; viewBtn.textContent='View Product'; viewBtn.className='btn btn-primary'; viewBtn.style.marginTop='8px'; viewBtn.style.marginLeft='8px'; if (pcBody) pcBody.appendChild(viewBtn);
    function gotoProductPage(forCard){ try { const name=(forCard.dataset && forCard.dataset.name) || (forCard.querySelector('h3') && forCard.querySelector('h3').textContent)||''; const price=Number(forCard.dataset.price||0); const desc=forCard.querySelector('p')?forCard.querySelector('p').textContent:''; const imgs=_parse(forCard); const thumb=(forCard.querySelector('img')&&forCard.querySelector('img').src)||(forCard.dataset&&forCard.dataset.img)||''; const slugBase=(name||'product').toString().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); const slug = slugBase + '-' + String(price).replace(/[^0-9]/g,'') || Date.now(); const sku='LX-'+(slugBase.slice(0,6).toUpperCase())+'-'+Math.floor(1000+Math.random()*9000); const richDesc=(desc||'')+'\n\nBuilt with thoughtful details and quality materials.'; const product={ name, price, desc, richDesc, imgs, thumb, badge: forCard.dataset.badge||'', sku, slug, variants:{ colors:['Black','White','Olive','Blue'], sizes:['S','M','L','XL'] }, availability: 'In stock', source: window.location.pathname || '' }; try{ localStorage.setItem('luxe_product_'+slug, JSON.stringify(product)); localStorage.setItem('luxe_selected_product', JSON.stringify(product)); }catch(e){} const productLink = (location.pathname.indexOf('/collections/')!==-1 ? '../product.html' : 'product.html') + '?slug=' + encodeURIComponent(slug); window.location.href=productLink; } catch(e){ console.debug('[QV] goto failed', e); } }
    btn.addEventListener('click', (ev)=>{ ev.preventDefault(); ev.stopPropagation(); openQuickView(card); });
    viewBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); gotoProductPage(card); });
  });

  // delegated handler
  document.addEventListener('click', function quickViewDelegate(e){ const trigger = e.target.closest('[data-qv]'); if (!trigger) return; const card = trigger.closest('.product-card'); if (!card) return; e.preventDefault(); e.stopPropagation(); openQuickView(card); });

  const closeModal = ()=>{ modal.style.display='none'; modal.setAttribute('aria-hidden','true'); try{ if (typeof releaseFocus==='function') releaseFocus(modal); }catch(e){} };
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);

})();

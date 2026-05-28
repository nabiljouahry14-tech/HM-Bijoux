  import { supabase } from "./supabase.js";
  import { checkUserSuspension } from "./auth-guard.js";


  async function bootstrap() {
    const suspension = await checkUserSuspension();

    if (suspension.suspended) {
      showSuspensionModal(suspension.reason);
      return;
    }

    initApp(); // start the rest of your website
  }

  bootstrap();

  function showSuspensionModal(reason) {
    const existing = document.getElementById("suspensionOverlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "suspensionOverlay";

    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(10, 10, 10, 0.85);
      backdrop-filter: blur(14px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: Inter, system-ui, sans-serif;
      padding: 20px;
    `;

    const safeReason = String(reason || "No reason provided")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  overlay.innerHTML = `
    <div style="
      width: 100%;
      max-width: 520px;
      background: linear-gradient(180deg, #121212 0%, #0b0b0b 100%);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 20px;
      padding: 34px 30px;
      box-shadow: 0 30px 90px rgba(0,0,0,0.75);
      color: #fff;
      text-align: center;
      font-family: Inter, system-ui, sans-serif;
    ">

      <!-- ICON -->
      <div style="
        width: 64px;
        height: 64px;
        margin: 0 auto 20px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius: 16px;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.35);
      ">
        <!-- Lucide Shield Alert -->
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"
          style="color:#ef4444">
          <path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"/>
          <path d="M12 8v4"/>
          <path d="M12 16h.01"/>
        </svg>
      </div>

      <!-- TITLE -->
      <h2 style="
        margin: 0 0 12px;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.02em;
      ">
        Account Suspended
      </h2>

      <!-- MESSAGE -->
      <p style="
        margin: 0 0 18px;
        font-size: 14px;
        line-height: 1.7;
        color: rgba(255,255,255,0.75);
      ">
        Your account has been restricted by an administrator.
          Access to this platform is currently unavailable.
      </p>

      <!-- REASON BOX -->
      <div style="
        text-align:left;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        border-left: 3px solid #ef4444;
        padding: 14px 16px;
        border-radius: 12px;
        margin-bottom: 22px;
      ">
        <div style="
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin-bottom: 6px;
        ">
          Suspension reason
        </div>

        <div style="
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255,255,255,0.9);
          word-break: break-word;
        ">
          ${safeReason}
        </div>
      </div>

      <!-- FOOTER TEXT -->
      <p style="
        font-size: 12px;
        color: rgba(255,255,255,0.45);
        margin-bottom: 22px;
        line-height: 1.5;
      ">
        If you believe this was a mistake, contact support for further assistance.
      </p>

      <!-- BUTTON -->
      <button id="closeSuspension" style="
        width: 100%;
        padding: 12px 16px;
        border-radius: 12px;
        border: none;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        color: white;
        background: linear-gradient(135deg, #ef4444, #b91c1c);
        box-shadow: 0 10px 25px rgba(239,68,68,0.25);
      ">
        Continue
      </button>

    </div>
  `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    document.getElementById("closeSuspension").onclick = async () => {

    localStorage.setItem(
      "suspensionData",
      JSON.stringify({
        reason: reason || "No reason provided",
        date: new Date().toISOString()
      })
    );

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }

    document.body.style.overflow = "";
    window.location.href = "error.html";
  };
  }

  // expose globally so admin.js can use it
  window.showSuspensionModal = showSuspensionModal;

  function initApp() {

  let heroSwiper = null;
  let allProducts = [];
  let currentUser = null;

  function updateGoogleButton() {
    const googleLoginBtns = document.querySelectorAll(".google-login-btn");
    const userMenu = document.getElementById("userMenu");
    const userAvatar = document.getElementById("userAvatar");
    const userAvatarLarge = document.getElementById("userAvatarLarge");
    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");
    const mobileUserSection = document.getElementById('mobileUserSection') || document.querySelector('.mobile-user-section');

    if (currentUser) {
      document.body.classList.add('logged-in');
      document.body.classList.remove('logged-out');

      // DESKTOP/MOBILE
      googleLoginBtns.forEach(btn => btn.style.display = "none");
      if (userMenu) userMenu.style.display = "flex";
      if (mobileUserSection) mobileUserSection.style.display = 'block';

      const meta = currentUser.user_metadata || {};

      const avatar =
        meta.avatar_url ||
        meta.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          meta.full_name || meta.name || "User"
        )}`;

      if (userAvatar) userAvatar.src = avatar;
      if (userAvatarLarge) userAvatarLarge.src = avatar;

      if (userName) {
        userName.textContent = meta.full_name || meta.name || "User";
      }

      if (userEmail) {
        userEmail.textContent = currentUser.email || "";
      }

    } else {
      document.body.classList.remove('logged-in');
      document.body.classList.add('logged-out');

      if (userMenu) userMenu.style.display = "none";
      if (mobileUserSection) mobileUserSection.style.display = "none";
      googleLoginBtns.forEach(btn => btn.style.display = "inline-flex");
    }
  }

  // Ensure update runs after DOM content is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateGoogleButton);
  } else {
    updateGoogleButton();
  }

  supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user ?? null;
    updateGoogleButton();
  });

  (async () => {
    const { data: { session } } = await supabase.auth.getSession();

    currentUser = session?.user ?? null;

    if (currentUser) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: currentUser.id,
        email: currentUser.email,

        username:
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split("@")[0] ||
          "User",

        avatar_url:
          currentUser.user_metadata?.avatar_url ||
          currentUser.user_metadata?.picture ||
          null
      });

    if (error) {
      console.error("PROFILE UPSERT ERROR:", error);
    } else {
      console.log("PROFILE SAVED:", data);
    }
  }

    updateGoogleButton();
  })();


  const userAvatar = document.getElementById("userAvatar");
  const userDropdown = document.getElementById("userDropdown");


  // toggle dropdown
  if (userAvatar && userDropdown) {
    userAvatar.addEventListener("click", () => {
      userDropdown.classList.toggle("open");
    });
  }

  document.addEventListener("click", (e) => {
    if (!userDropdown || !userAvatar) return;

    if (
      !userDropdown.contains(e.target) &&
      !userAvatar.contains(e.target)
    ) {
      userDropdown.classList.remove("open");
    }
  });

  // logout
  const logoutBtn = document.getElementById("logoutBtn");
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  const ordersBtn = document.getElementById("ordersBtn");
  const mobileOrdersBtn = document.getElementById("mobileOrdersBtn");
  const profileBtn = document.getElementById("profileBtn");
  const mobileProfileBtn = document.getElementById("mobileProfileBtn");

  if (ordersBtn) {
    ordersBtn.addEventListener("click", () => {
      window.location.href = '../orders.html';
    });
  }

  if (mobileOrdersBtn) {
    mobileOrdersBtn.addEventListener("click", () => {
      window.location.href = '../orders.html';
    });
  }

  const settingsRedirect = () => {
    const path = window.location.pathname;
    if (path.includes("/collections/")) return "../settings.html";
    return "../settings.html";
  };

  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      window.location.href = settingsRedirect();
    });
  }

  if (mobileProfileBtn) {
    mobileProfileBtn.addEventListener("click", () => {
      window.location.href = settingsRedirect();
    });
  }

  const signOutUser = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (logoutBtn) {
    logoutBtn.addEventListener("click", signOutUser);
  }

  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", signOutUser);
  }

  // Mobile Search Modal Handler
  const mobileSearchBtn = document.getElementById("mobileSearchBtn");
  const mobileSearchModal = document.getElementById("mobileSearchModal");
  const closeMobileSearch = document.getElementById("closeMobileSearch");
  const mobileHeaderSearch = document.getElementById("mobileHeaderSearch");

  function openMobileSearch() {
    mobileSearchModal.setAttribute("aria-hidden", "false");
    mobileHeaderSearch.focus();
  }

  function closeMobileSearchModal() {
    mobileSearchModal.setAttribute("aria-hidden", "true");
    mobileHeaderSearch.value = "";
    const suggestions = mobileSearchModal.querySelector(".search-suggestions");
    if (suggestions) suggestions.hidden = true;
    const noResults = mobileSearchModal.querySelector(".search-noresults");
    if (noResults) noResults.hidden = true;
  }

  if (mobileSearchBtn) {
    mobileSearchBtn.addEventListener("click", openMobileSearch);
  }

  if (closeMobileSearch) {
    closeMobileSearch.addEventListener("click", closeMobileSearchModal);
  }

  if (mobileSearchModal) {
    mobileSearchModal.addEventListener("click", (e) => {
      if (e.target === mobileSearchModal || e.target.classList.contains("mobile-search-backdrop")) {
        closeMobileSearchModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileSearchModal.getAttribute("aria-hidden") === "false") {
      closeMobileSearchModal();
    }
  });

  const googleLoginBtns = document.querySelectorAll(".google-login-btn");

  googleLoginBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!currentUser) {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/index.html`,
            flowType: "pkce",
            queryParams: {
              access_type: "offline",
              prompt: "consent"
            }
          }
        });
      }
    });
  });

  function addToCart(product) {
    if (!window.cart) window.cart = [];

    // 🔥 MUST have variant if product has variants
    if ((product.product_variants || []).length > 0) {
      if (!product.selectedColor && !product.selectedSize) {
        alert("Please select product options");
        return;
      }
    }

    // 🔥 find exact variant
    let variant = null;

    if ((product.product_variants || []).length > 0) {
      variant = product.product_variants.find(v =>
        (product.selectedColor ? v.color === product.selectedColor : true) &&
        (product.selectedSize ? v.size === product.selectedSize : true)
      );

      if (!variant) {
        alert("Invalid variant");
        return;
      }

      if (variant.stock <= 0) {
        alert("This option is out of stock");
        return;
      }
    }

    const existing = window.cart.find(p =>
      p.id === product.id &&
      p.selectedColor === product.selectedColor &&
      p.selectedSize === product.selectedSize
    );

    const currentQty = existing?.qty || 0;
    const maxStock = variant ? variant.stock : 9999;

    if (currentQty + 1 > maxStock) {
      alert("Maximum stock reached");
      return;
    }

    if (existing) {
      existing.qty += 1;
    } else {
      window.cart.push({
        ...product,
        qty: 1
      });
    }

    if (window.saveCartToStorage) window.saveCartToStorage();
    if (window._luxetech_refreshCart) window._luxetech_refreshCart();
  }
  window.addToCart = addToCart;
  const container = document.getElementById("productsGrid");
  const path = window.location.pathname;

  if (!localStorage.getItem("language")) {
    localStorage.setItem("language", "ar"); 
  }

  window.currentLanguage = localStorage.getItem("language") || 'en';

  document.addEventListener("DOMContentLoaded", () => {
    if (window.setLanguage) {
      setLanguage(window.currentLanguage);
    }
  });

  // Listen for language changes to update currency symbols
  window.addEventListener('languageChanged', () => {
    // Re-render products to update currency symbols
    if (window.allProducts) {
      renderProducts(window.allProducts.filter(p => {
        const path = window.location.pathname;
        if (path.includes("accessories")) return p.category === "accessories";
        if (path.includes("fragrances")) return p.category === "fragrances";
        if (path.includes("urban")) return p.category === "urban";
        return p.is_featured;
      }).slice(0, path.includes("index") || path === "/" ? 3 : undefined));
      attachCartEvents();
      attachViewEvents();
    }

    // Re-init hero swiper if on index page
    if (document.querySelector(".hero-swiper")) {
      initHeroSwiper();
    }
  });

  async function loadProducts() {
    if (!container) return;

    // 🔥 1. LOAD EVERYTHING (for search)
    const { data: allData, error: allError } = await supabase
      .from("products")
      .select(`
        *,
        product_images!product_images_product_id_fkey(*),
        product_variants!product_variants_product_id_fkey(*)
      `);

    if (allError) {
      console.error(allError);
      return;
    }

    allProducts = allData || [];
    window.allProducts = allProducts;

    // 🔥 2. DECIDE WHAT TO DISPLAY INITIALLY
    let displayProducts = [...allProducts];

    if (path.includes("accessories")) {
      displayProducts = allProducts.filter(p => p.category === "accessories");
    } else if (path.includes("fragrances")) {
      displayProducts = allProducts.filter(p => p.category === "fragrances");
    } else if (path.includes("urban")) {
      displayProducts = allProducts.filter(p => p.category === "urban");
    } else {
      // homepage → featured only (visual only)
      displayProducts = allProducts
        .filter(p => p.is_featured)
        .slice(0, 3);
    }

    renderProducts(displayProducts);
    attachCartEvents();
    attachViewEvents();
    initFiltersAndSearch();

    if (currentUser) {

      setTimeout(() => {
        initPromoNotification();
      }, 2500);

    }
  }

  function renderProducts(products) {
    if (!container) return;
    
    container.innerHTML = "";

    products.forEach(p => {
      const card = document.createElement("article");
      card.className = "product-card";
      card.dataset.id = p.id;
      const mainImg =
        p.product_images?.find(i => i.is_main)?.image_url ||
        p.product_images?.[0]?.image_url ||
        "";

      const prices = (p.product_variants || []).map(v => Number(v.price || 0));
      const minPrice = prices.length ? Math.min(...prices) : 0;

      const hasVariants = (p.product_variants || []).length > 0;

      const totalStock = (p.product_variants || [])
        .reduce((sum, v) => sum + Number(v.stock || 0), 0);

      const isOut = hasVariants
        ? totalStock <= 0
        : Number(p.stock || 0) <= 0;

      card.innerHTML = `
        ${p.badge ? `
          <div class="badge ${p.badge === 'sale' ? 'badge-sale' : ''}">
            ${p.badge === 'sale' ? '-SALE' : 'NEW'}
          </div>
        ` : ''}

        <img src="${mainImg}" alt="${p.name}">
        <div class="pc-body">
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <div class="pc-row">
            <span class="price">${formatCurrency(minPrice)}</span>
            <div style="display:flex; gap:8px;">
              <button class="view-btn" data-i18n="btn.viewDetails">
                ${t('btn.viewDetails')}
              </button>

              <button class="add-btn" ${isOut ? 'disabled' : ''} data-i18n="${isOut ? 'product.outOfStock' : hasVariants ? 'product.chooseOptions' : 'btn.addToCart'}">
                ${isOut ? t('product.outOfStock') : hasVariants ? t('product.chooseOptions') : t('btn.addToCart')}
              </button>
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  }

  function initFiltersAndSearch() {
    const searchInput = document.getElementById("collectionSearch");
    const filterBtns = document.querySelectorAll(".filter-btn");

    let currentFilter = "all";
      function applyFilters() {
    const term = searchInput?.value?.toLowerCase() || "";

    let result = [...allProducts];

    // ✅ IF USER IS SEARCHING → IGNORE CATEGORY
    if (term) {
      result = result.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    } else {
      // ✅ ONLY apply category when NOT searching
      if (path.includes("accessories")) {
        result = result.filter(p => p.category === "accessories");
      } else if (path.includes("fragrances")) {
        result = result.filter(p => p.category === "fragrances");
      } else if (path.includes("urban")) {
        result = result.filter(p => p.category === "urban");
      }
    }

    // filters still apply
    if (currentFilter === "new") {
      result = result.filter(p => p.badge === "new");
    } else if (currentFilter === "sale") {
      result = result.filter(p => p.badge === "sale");
    } else if (currentFilter === "under50") {
      result = result.filter(p => {
        const prices = (p.product_variants || []).map(v => Number(v.price || 0));
        const min = prices.length ? Math.min(...prices) : 0;
        return min < 50;
      });
    }

    renderProducts(result);
    attachCartEvents();
  }
    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }

    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        currentFilter = btn.dataset.filter;
        applyFilters();
      });
    });
  }

  function flyToCart(img) {
    const cartBtn = document.getElementById("cartBtn");
    if (!cartBtn || !img) return;

    const imgRect = img.getBoundingClientRect();
    const cartRect = cartBtn.getBoundingClientRect();

    const clone = img.cloneNode(true);

    clone.style.position = "fixed";
    clone.style.left = imgRect.left + "px";
    clone.style.top = imgRect.top + "px";
    clone.style.width = imgRect.width + "px";
    clone.style.height = imgRect.height + "px";
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";

    document.body.appendChild(clone);

    const targetX = cartRect.left + cartRect.width / 2 - imgRect.left - imgRect.width / 2;
    const targetY = cartRect.top + cartRect.height / 2 - imgRect.top - imgRect.height / 2;

    gsap.to(clone, {
      duration: 0.8,
      x: targetX,
      y: targetY,
      scale: 0.1,
      opacity: 0.3,
      onComplete: () => clone.remove()
    });
  }

  function attachCartEvents() {
    document.querySelectorAll(".add-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        if (btn.disabled) return;

        const card = e.target.closest(".product-card");
        const productName = card.querySelector("h3").textContent;

        const id = card.dataset.id;
        const fullProduct = allProducts.find(p => p.id == id);
        if (!fullProduct) return;

        const img = card.querySelector("img");

        if ((fullProduct.product_variants || []).length > 0) {
          window.location.href = `../product.html?id=${fullProduct.id}`;
          return;
        }

        flyToCart(img);
        addToCart({
          ...fullProduct,
          img: img.src
        });
      });
    });
  }

  function attachViewEvents() {
    document.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".product-card");
        const id = card.dataset.id;

        window.location.href = `../product.html?id=${id}`;
      });
    });
  }

  const checkoutBtn = document.getElementById("checkoutBtn");
  let isCheckingOut = false;
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      if (isCheckingOut) return; // 🚫 block spam clicks
      isCheckingOut = true;

      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "Redirecting...";

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          window._luxetech_notify.error("You must be logged in to checkout");
          return;
        }

        if (!window.cart || window.cart.length === 0) {
          window._luxetech_notify.warning("Your cart is empty");
          return;
        }

        if (window.saveCartToStorage) {
          window.saveCartToStorage();
        } else {
          localStorage.setItem("luxe_cart_v1", JSON.stringify(window.cart || []));
        }

        window.location.href = "checkout.html";
      } catch (err) {
        console.error("Checkout redirect failed:", err);
        window._luxetech_notify.error("Unable to go to checkout. Please try again.");
      } finally {
        isCheckingOut = false;
        if (!window.location.href.includes("checkout.html")) {
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = "Checkout";
        }
      }
    });
  }


  async function loadHeroProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("hero", true);

    if (error) {
      console.error("Hero error:", error);
      return;
    }

    const wrapper = document.querySelector(".hero-swiper .swiper-wrapper");
    if (!wrapper) return;

    wrapper.innerHTML = "";

    data.forEach(p => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide hero-slide";

      slide.innerHTML = `
        <img src="${p.image_url}" alt="${p.name}">
      `;

      slide.onclick = () => {
    console.log("HERO CLICK PRODUCT:", p);
    console.log("PRODUCT ID:", p.id);

    window.location.href = `../product.html?id=${p.id}`;
  };

      wrapper.appendChild(slide);
    });

    // 🔥 IMPORTANT: re-init swiper AFTER injecting slides
    initHeroSwiper();
  }

  function initHeroSwiper() {
    if (heroSwiper) heroSwiper.destroy(true, true);

    heroSwiper = new Swiper(".hero-swiper", {
      loop: true,
      rtl: document.documentElement.dir === 'rtl',
      autoplay: {
        delay: 3000,
        disableOnInteraction: false
      },
      navigation: {
        nextEl: ".hero-next",
        prevEl: ".hero-prev"
      },
      speed: 800
    });
  }

  document.querySelectorAll(".dropdown-item").forEach(btn => {
    btn.addEventListener("click", function (e) {
      const circle = document.createElement("span");
      circle.classList.add("ripple");

      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);

      circle.style.width = circle.style.height = size + "px";
      circle.style.left = e.clientX - rect.left - size / 2 + "px";
      circle.style.top = e.clientY - rect.top - size / 2 + "px";

      this.appendChild(circle);

      setTimeout(() => circle.remove(), 500);
    });
  });


  const dropdown = document.getElementById("userDropdown");

  document.addEventListener("keydown", (e) => {
    if (!dropdown) return; // ✅ prevent crash
    if (!dropdown.classList.contains("open")) return;

    const items = Array.from(dropdown.querySelectorAll(".dropdown-item"));
    let index = items.findIndex(el => el === document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      index = (index + 1) % items.length;
      items[index].focus();
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      index = (index - 1 + items.length) % items.length;
      items[index].focus();
    }

    if (e.key === "Enter" && document.activeElement) {
      document.activeElement.click();
    }
  });
  const contactBtn = document.getElementById("contactBtn");
  const contactModal = document.getElementById("contactModal");
  const closeContact = document.getElementById("closeContact");

  if (contactBtn && contactModal && closeContact) {
    contactBtn.onclick = () => contactModal.style.display = "flex";
    closeContact.onclick = () => contactModal.style.display = "none";

    window.addEventListener("click", (e) => {
      if (e.target === contactModal) {
        contactModal.style.display = "none";
      }
    });
  }

  const emailBtn = document.getElementById("emailBtn");

  if (emailBtn) {
    emailBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const email = "nabiljouahry14@gmail.com";
      const subject = "Support Request - LuxeTech";

      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    });
  }

  // 🌐 DESKTOP LANGUAGE SELECTOR (FIX)
  const desktopLangOptions = document.querySelectorAll('#userDropdown .language-option');

  desktopLangOptions.forEach(option => {
    option.addEventListener('click', () => {
      const lang = option.getAttribute('data-lang');
      localStorage.setItem('language', lang);
      window.currentLanguage = lang;

      if (window.setLanguage) {
        setLanguage(lang);
      } else {
        console.error('setLanguage not found');
      }
    });
  });
function initPromoNotification() {

  if (!currentUser) return;

  const existing = document.getElementById("promoNotificationOverlay");
  if (existing) existing.remove();

  const lastSeen = localStorage.getItem("promoNotificationLastSeen");

  // 12h cooldown
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;

  if (lastSeen && Date.now() - Number(lastSeen) < TWELVE_HOURS) {
    return;
  }

  const promoProducts = allProducts.filter(
    p => p.badge === "sale" || p.badge === "new"
  );

  if (!promoProducts.length) return;

  const product =
    promoProducts[Math.floor(Math.random() * promoProducts.length)];

  const lang = window.currentLanguage || "en";
  const isArabic = lang === "ar";

  const mainImg =
    product.product_images?.find(i => i.is_main)?.image_url ||
    product.product_images?.[0]?.image_url ||
    "";

  const translations = {
    en: {
      saleTitle: "Limited Time Offer",
      newTitle: "New Arrival",
      saleMessage: "Don't miss this exclusive product now available on sale.",
      newMessage: "Freshly added to the collection and available now.",
      button: "View Product",
      close: "Maybe Later"
    },

    ar: {
      saleTitle: "عرض لفترة محدودة",
      newTitle: "وصل حديثاً",
      saleMessage: "لا تفوت هذا المنتج المميز المتوفر الآن ضمن التخفيضات.",
      newMessage: "تمت إضافته حديثاً إلى المجموعة وهو متوفر الآن.",
      button: "عرض المنتج",
      close: "لاحقاً"
    }
  };

  const t = translations[lang] || translations.en;

  const overlay = document.createElement("div");
  overlay.id = "promoNotificationOverlay";

  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999998;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    background: rgba(0,0,0,0.58);
    backdrop-filter: blur(10px);
    animation: promoFadeIn 0.25s ease;
  `;

  overlay.innerHTML = `
    <div id="promoNotificationModal" style="
      width: 100%;
      max-width: 420px;
      background: linear-gradient(180deg, #141414 0%, #0c0c0c 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 30px 90px rgba(0,0,0,0.65);
      position: relative;
      direction: ${isArabic ? "rtl" : "ltr"};
      animation: promoSlideUp 0.35s cubic-bezier(.2,.9,.2,1);
      font-family: Inter, system-ui, sans-serif;
    ">

      <!-- CLOSE -->
      <button id="closePromoNotification" style="
        position:absolute;
        top:14px;
        ${isArabic ? "left:14px;" : "right:14px;"}
        width:38px;
        height:38px;
        border:none;
        border-radius:12px;
        background: rgba(255,255,255,0.06);
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
        z-index:10;
        transition:0.2s ease;
      ">
        <i data-lucide="x" style="width:18px;height:18px;"></i>
      </button>

      <!-- IMAGE -->
      <div style="
        position:relative;
        width:100%;
        aspect-ratio: 1 / 0.82;
        overflow:hidden;
      ">
        <img
          src="${mainImg}"
          alt="${product.name}"
          style="
            width:100%;
            height:100%;
            object-fit:cover;
            display:block;
          "
        >

        <!-- BADGE -->
        <div style="
          position:absolute;
          top:16px;
          ${isArabic ? "right:16px;" : "left:16px;"}
          display:flex;
          align-items:center;
          gap:6px;
          background:${product.badge === "sale"
            ? "rgba(239,68,68,0.16)"
            : "rgba(255,255,255,0.10)"
          };
          border:1px solid ${product.badge === "sale"
            ? "rgba(239,68,68,0.28)"
            : "rgba(255,255,255,0.14)"
          };
          backdrop-filter: blur(8px);
          padding:8px 12px;
          border-radius:999px;
          color:white;
          font-size:12px;
          font-weight:600;
        ">
          <i data-lucide="${
            product.badge === "sale"
              ? "badge-percent"
              : "sparkles"
          }" style="width:14px;height:14px;"></i>

          ${product.badge === "sale"
            ? "SALE"
            : "NEW"
          }
        </div>
      </div>

      <!-- CONTENT -->
      <div style="
        padding:24px;
        color:white;
      ">

        <div style="
          display:flex;
          align-items:center;
          gap:10px;
          margin-bottom:14px;
        ">
          <div style="
            width:42px;
            height:42px;
            border-radius:14px;
            background: rgba(255,255,255,0.06);
            border:1px solid rgba(255,255,255,0.08);
            display:flex;
            align-items:center;
            justify-content:center;
            flex-shrink:0;
          ">
            <i data-lucide="${
              product.badge === "sale"
                ? "tag"
                : "shopping-bag"
            }" style="width:20px;height:20px;"></i>
          </div>

          <div>
            <div style="
              font-size:12px;
              color:rgba(255,255,255,0.5);
              margin-bottom:4px;
              font-weight:500;
            ">
              ${
                product.badge === "sale"
                  ? t.saleTitle
                  : t.newTitle
              }
            </div>

            <h3 style="
              margin:0;
              font-size:20px;
              line-height:1.25;
              font-weight:700;
              letter-spacing:-0.02em;
              word-break:break-word;
            ">
              ${product.name}
            </h3>
          </div>
        </div>

        <p style="
          margin:0 0 22px;
          font-size:14px;
          line-height:1.7;
          color:rgba(255,255,255,0.72);
        ">
          ${
            product.badge === "sale"
              ? t.saleMessage
              : t.newMessage
          }
        </p>

        <div style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        ">

          <button id="promoViewProduct" style="
            flex:1;
            min-width:140px;
            height:48px;
            border:none;
            border-radius:14px;
            cursor:pointer;
            font-weight:600;
            font-size:14px;
            color:white;
            background: linear-gradient(135deg, #ffffff, #d4d4d4);
            color:black;
          ">
            ${t.button}
          </button>

          <button id="promoDismiss" style="
            flex:1;
            min-width:140px;
            height:48px;
            border:none;
            border-radius:14px;
            cursor:pointer;
            font-weight:600;
            font-size:14px;
            color:white;
            background: rgba(255,255,255,0.06);
            border:1px solid rgba(255,255,255,0.08);
          ">
            ${t.close}
          </button>

        </div>
      </div>
    </div>
  `;

  // animations
  if (!document.getElementById("promoNotificationAnimations")) {

    const style = document.createElement("style");
    style.id = "promoNotificationAnimations";

    style.innerHTML = `
      @keyframes promoFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes promoSlideUp {
        from {
          opacity: 0;
          transform: translateY(18px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (max-width: 480px) {

        #promoNotificationModal {
          border-radius: 22px !important;
        }

        #promoNotificationModal h3 {
          font-size: 18px !important;
        }

      }
    `;

    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);

  lucide.createIcons();

  function closePromo() {

    overlay.style.opacity = "0";
    overlay.style.transition = "0.2s ease";

    setTimeout(() => {
      overlay.remove();
    }, 200);

    document.removeEventListener("keydown", escHandler);

    localStorage.setItem(
      "promoNotificationLastSeen",
      Date.now().toString()
    );
  }

  function escHandler(e) {
    if (e.key === "Escape") {
      closePromo();
    }
  }

  document.addEventListener("keydown", escHandler);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePromo();
    }
  });

  document
    .getElementById("closePromoNotification")
    .addEventListener("click", closePromo);

  document
    .getElementById("promoDismiss")
    .addEventListener("click", closePromo);

  document
    .getElementById("promoViewProduct")
    .addEventListener("click", () => {

      closePromo();

      window.location.href = `../product.html?id=${product.id}`;
    });
}
  loadProducts();
  loadHeroProducts();
  lucide.createIcons();

  }

import { supabase } from "./supabase.js";

    async function bootstrap() {

    let lastRequestId = 0;
    const logoutBtn = document.getElementById("logoutBtn");

        logoutBtn.onclick = async () => {
        logoutBtn.textContent = "Logging out...";
        logoutBtn.disabled = true;

        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error(error);
          toast("Logout failed");

          logoutBtn.textContent = "Logout";
          logoutBtn.disabled = false;
          return;
        }

        window.location.href = "login.html";
      };

      const modal = document.getElementById("orderModal");
      document.getElementById("confirmModal").classList.add("hidden");
      const modalBody = document.getElementById("modalBody");
      const closeModal = document.getElementById("closeModal");

      closeModal.onclick = () => modal.classList.add("hidden");



      async function checkAdminSession() {
  // Get currently logged-in user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  // Not logged in → send to login page
  if (userError || !user) {
    window.location.replace("login.html");
    return false;
  }

  // Check if account is suspended
  const { data: status, error: statusError } = await supabase
    .from("profiles")
    .select("suspended, reason")
    .eq("id", user.id)
    .maybeSingle();

  // If query fails, block access for safety
  if (statusError) {
    console.error("Failed to check user status:", statusError);
    await supabase.auth.signOut();
    window.location.replace("login.html");
    return false;
  }

  // ==========================================
  // SUSPENDED USER
  // ==========================================
  if (status?.suspended) {
    // Show your custom modal FIRST.
    // Do NOT sign out here.
    // The modal's Continue button already signs out
    // and redirects to login.html.
    showSuspensionModal(
      status.reason || "No reason provided"
    );

    return false;
  }

  // Check if user is an admin
  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_admin");

  // Not admin → log out and block access
  if (adminError || !isAdmin) {
    await supabase.auth.signOut();
    window.location.replace("login.html");
    return false;
  }

  // Access granted
  return true;
}

      await checkAdminSession();
      await loadAdminProfile();

        supabase.auth.onAuthStateChange(async (event) => {
          if (event === "SIGNED_OUT") {
            window.location.replace("login.html");
          }

          if (event === "SIGNED_IN") {
            await checkAdminSession();
          }
          const loadingScreen = document.getElementById("loadingScreen");
          if (loadingScreen) loadingScreen.style.display = "none";
        });

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          window.location.replace("login.html");
        } else {
          const { data, error } = await supabase.rpc("is_admin");

          if (error || !data) {
            await supabase.auth.signOut();
            window.location.replace("login.html");
          }
        }
        const loadingScreen = document.getElementById("loadingScreen");
        if (loadingScreen) loadingScreen.style.display = "none";

        const list = document.getElementById("adminList");
        const searchInput = document.getElementById("searchInput");
        const filterCategory = document.getElementById("filterCategory");


        let all = [];
        let editingProductId = null;
        let searchTimeout;
        let allUsers = [];
        let userSearchTimeout;

        function toast(msg){
          const t=document.createElement("div");
          t.className="toast";
          t.textContent=msg;
          document.body.appendChild(t);

          setTimeout(()=>t.classList.add("show"),50);
          setTimeout(()=>{
            t.classList.remove("show");
            setTimeout(()=>t.remove(),300);
          },2000);
        }

        function showSuspensionModal(reason) {
  // Remove any existing modal
  const existing = document.getElementById("suspensionOverlay");
  if (existing) existing.remove();

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "suspensionOverlay";

  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.88);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 999999;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  // Sanitize reason to prevent HTML injection
  const safeReason = String(
    reason || "No reason was provided by the administration team."
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Build modal
  overlay.innerHTML = `
    <div style="
      width: 100%;
      max-width: 520px;
      background: linear-gradient(180deg, #161616 0%, #0f0f0f 100%);
      border: 1px solid rgba(225, 29, 72, 0.35);
      border-radius: 24px;
      padding: 36px 32px;
      box-shadow:
        0 30px 80px rgba(0, 0, 0, 0.7),
        0 0 0 1px rgba(255, 255, 255, 0.03) inset;
      color: #ffffff;
      text-align: center;
    ">

      <!-- Icon -->
      <div style="
        width: 72px;
        height: 72px;
        margin: 0 auto 24px;
        border-radius: 50%;
        background: rgba(225, 29, 72, 0.12);
        border: 1px solid rgba(225, 29, 72, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 34px;
      ">
        🔒
      </div>

      <!-- Title -->
      <h2 style="
        margin: 0 0 14px;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.02em;
      ">
        Account Suspended
      </h2>

      <!-- Intro -->
      <p style="
        margin: 0 0 22px;
        font-size: 15px;
        line-height: 1.7;
        color: rgba(255, 255, 255, 0.78);
      ">
        Your account has been temporarily suspended by the HM Bijoux administration team.
        Click <strong style="color:#ffffff;">Continue</strong> to review the suspension details
        and return to the login page.
      </p>

      <!-- Reason -->
      <div style="
        text-align: left;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-left: 4px solid #e11d48;
        border-radius: 14px;
        padding: 16px 18px;
        margin-bottom: 28px;
      ">
        <div style="
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.55);
          margin-bottom: 8px;
        ">
          Suspension Details
        </div>

        <div style="
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.92);
          word-break: break-word;
        ">
          ${safeReason}
        </div>
      </div>

      <!-- Footer -->
      <p style="
        margin: 0 0 24px;
        font-size: 13px;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.55);
      ">
        If you believe this action was taken in error, please contact customer support.
      </p>

      <!-- Button -->
      <button id="closeSuspension" style="
        width: 100%;
        padding: 14px 18px;
        border: none;
        border-radius: 14px;
        background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
        color: #ffffff;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 10px 30px rgba(225, 29, 72, 0.35);
      ">
        Continue
      </button>
    </div>
  `;

  // Show modal
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  // Handle Continue
  const continueBtn = document.getElementById("closeSuspension");

  continueBtn.onclick = async () => {
    continueBtn.disabled = true;
    continueBtn.textContent = "Redirecting...";

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out failed:", err);
    }

    document.body.style.overflow = "";
    window.location.replace("login.html");
  };
}
        async function getTotalStock() {
        const { data, error } = await supabase
          .from("product_variants")
          .select("stock");
        if (error) {
          console.error(error);
          return 0;
        }

        return (data || []).reduce((sum, v) => sum + Number(v.stock || 0), 0);
      }

        async function refresh() {
          const requestId = ++lastRequestId;

          const s = searchInput.value.toLowerCase();
          const c = filterCategory.value;


          let data = all;


          if (!all.length) {
            const { data: dbData, error } = await supabase
              .from("products")
              .select(`
                *,
                product_variants!fk_product_variants_product (*),
                product_images!product_images_product_id_fkey (*)
              `);

            if (error) return console.error(error);

            all = Object.values(
              dbData.reduce((acc, p) => {
                acc[p.id] = p;
                return acc;
              }, {})
            );
            data = dbData;
          }

          if (requestId !== lastRequestId) return;

          let filtered = [...data];

          if (s) {
            filtered = filtered.filter(p =>
              p.name?.toLowerCase().includes(s)
            );
          }

          if (c !== "all") {
            filtered = filtered.filter(p => p.category === c);
          }

          if (requestId !== lastRequestId) return;

          await render(filtered, requestId);

          document.getElementById("kpiProducts").textContent = data.length;

          document.getElementById("kpiStock").textContent =
            await getTotalStock();

          const lowStockCount = data.filter(p => {
            const total = (p.product_variants || [])
              .reduce((s, v) => s + Number(v.stock || 0), 0);

            return total < 5;
          }).length;

          document.getElementById("kpiLowStock").textContent = lowStockCount;
        }
        const ordersList = document.getElementById("ordersList");

        const navProducts = document.getElementById("navProducts");
        const navOrders = document.getElementById("navOrders");
        const navReviews = document.getElementById("navReviews");
        const navUsers = document.getElementById("navUsers");

        const reviewsList = document.getElementById("reviewsList");
        const usersList = document.getElementById("usersList");

        let view = "products";

        navProducts.onclick = () => {
          view = "products";

          document.getElementById("productsPanel").style.display = "block";
          document.getElementById("ordersPanel").style.display = "none";
          document.getElementById("reviewsPanel").style.display = "none";

          refresh();
        };

        navOrders.onclick = () => {
          view = "orders";

          document.getElementById("productsPanel").style.display = "none";
          document.getElementById("ordersPanel").style.display = "block";
          document.getElementById("reviewsPanel").style.display = "none";

          loadOrders();
          updateOrderKPIs();
        };

        navReviews.onclick = () => {
          view = "reviews";

          document.getElementById("productsPanel").style.display = "none";
          document.getElementById("ordersPanel").style.display = "none";
          document.getElementById("reviewsPanel").style.display = "block";
          document.getElementById("usersPanel").style.display = "none";

          loadReviews();
        };

        navUsers.onclick = async () => {
          view = "users";

          document.getElementById("productsPanel").style.display = "none";
          document.getElementById("ordersPanel").style.display = "none";
          document.getElementById("reviewsPanel").style.display = "none";
          document.getElementById("usersPanel").style.display = "block";

          await loadUsers();
        };
        async function updateOrderKPIs() {
          const { data: orders, error } = await supabase
            .from("orders")
            .select("total, status");

          if (error || !orders) return;

          const totalOrders = orders.length;

          const revenue = orders.reduce(
            (sum, o) => sum + Number(o.total || 0),
            0
          );

          const pending = orders.filter(
            o => (o.status || "pending") === "pending"
          ).length;

          document.getElementById("kpiOrders").textContent = totalOrders;
          document.getElementById("kpiRevenue").textContent = formatCurrency(revenue);
          document.getElementById("kpiPending").textContent = pending;
        }

      async function loadOrders() {
        const { data: orders, error } = await supabase
          .from("orders")
          .select(`
            *,
            user_addresses!left (
              address_line1,
              address_line2,
              phone,
              postal_code,
              city,
              user_id
            )
          `)
          .order("created_at", { ascending: false });

          if (error) {
            console.error(error);
            return;
          }

          ordersList.innerHTML = "";

          if (!orders || orders.length === 0) {
            ordersList.innerHTML = "<p style='opacity:0.6'>No orders yet</p>";
            return;
          }

          for (const order of orders) {
            const div = document.createElement("div");
            div.className = "product";

            const fullAddress = `
              ${order.user_addresses?.address_line1 || ""}
              ${order.user_addresses?.address_line2 ? ", " + order.user_addresses.address_line2 : ""}
              ${order.user_addresses?.city || ""}
            `.trim();

            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

            div.innerHTML = `
              <h3>Order #${order.id.slice(0, 8)}</h3>

              <p><b>User:</b> ${order.user_name || "Unknown"}</p>
              <p><b>Email:</b> ${order.user_email || "Unknown"}</p>

              <p><b>Phone:</b> ${order.user_addresses?.phone || "—"}</p>

              <p><b>Address:</b> 
                ${fullAddress || "—"}
                ${fullAddress ? `<br><a href="${mapsUrl}" target="_blank">📍 Open in Google Maps</a>` : ""}
              </p>

              <p><b>Postal Code:</b> ${order.user_addresses?.postal_code || "—"}</p>

              <p><b>Created:</b> ${new Date(order.created_at).toLocaleString()}</p>

              <p><b>Total:</b> ${formatCurrency(order.total)}</p>

              <p><b>Status:</b>
                <select class="status">
                  <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
                  <option value="processing" ${order.status === "processing" ? "selected" : ""}>Processing</option>
                  <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>Shipped</option>
                  <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Delivered</option>
                </select>
              </p>

              <button class="viewItems">View Items</button>
              <button class="deleteOrder">Delete Order</button>
            `;

            // STATUS UPDATE
            div.querySelector(".status").onchange = async (e) => {
              const newStatus = e.target.value;

              const { error } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", order.id);

              if (error) {
                console.error("STATUS UPDATE ERROR:", error);
                alert("Status update failed (check RLS)");
                return;
              }

          toast("Status updated");
          await updateOrderKPIs();
        };

            // VIEW ITEMS
            div.querySelector(".viewItems").onclick = async () => {
              const { data: items, error } = await supabase
                .from("order_items")
                .select("*")
                .eq("order_id", order.id);

              if (error) {
                console.error(error);
                alert("Failed to fetch items (RLS or schema issue)");
                return;
              }

              console.log("ORDER ITEMS:", items);

              if (!items || items.length === 0) {
                alert("No items found for this order");
                return;
              }

              modalBody.innerHTML = `<h3>Order Items</h3>`;

              items.forEach(item => {
                const el = document.createElement("div");
                el.className = "orderItem";

                el.innerHTML = `
                  <div class="orderItemCard">

                    <div style="display:flex; gap:10px; align-items:center;">
                      ${item.image_url ? `
                        <img src="${item.image_url}" class="orderItemImg">
                      ` : ""}

                      <div style="flex:1;">
                        <div class="orderItemTop">${item.name}</div>

                        <div class="orderItemMeta">
                          <span>Qty: ${item.quantity}</span>
                          <span>${formatCurrency(item.price)}</span>
                        </div>

                        <div class="orderItemOptions">
                          ${item.color ? `<span class="chip">${item.color}</span>` : ""}
                          ${item.size ? `<span class="chip">${item.size}</span>` : ""}
                        </div>
                      </div>
                    </div>

                  </div>
                `;

                modalBody.appendChild(el);
            });

            modal.classList.remove("hidden");
            };

            // DELETE ORDER
            div.querySelector(".deleteOrder").onclick = async () => {
              const ok = await confirmModal("Delete this order?");
              if (!ok) return;

              const { error: itemError } = await supabase
                .from("order_items")
                .delete()
                .eq("order_id", order.id);

              if (itemError) {
                console.error(itemError);
                alert("Failed to delete order items (RLS issue)");
                return;
              }

              const { error: orderError } = await supabase
                .from("orders")
                .delete()
                .eq("id", order.id);

              if (orderError) {
                console.error(orderError);
                alert("Failed to delete order (RLS issue)");
                return;
              }

              toast("Order deleted");

              await loadOrders();
              await updateOrderKPIs();
            };

            ordersList.appendChild(div);
          }

          console.log("ORDERS:", orders);

          updateOrderKPIs();
        }


        /* RENDER */
        async function render(products, requestId) {
          list.innerHTML = "";

          // SORT: low stock first (based on variants)
          products = products.map((p) => {
            const variants = p.product_variants || [];

            const totalStock = variants.reduce(
              (sum, v) => sum + Number(v.stock || 0),
              0
            );

            return { ...p, totalStock };
          });

          products.sort((a, b) => a.totalStock - b.totalStock);

          for (const p of products) {

            if (requestId !== lastRequestId) return;

            const variants = p.product_variants || [];
            const images = p.product_images || [];


            if (requestId !== lastRequestId) return;

            // ⬇️ THIS WAS ALREADY THERE (DO NOT TOUCH)
            const div = document.createElement("div");
            div.className = "product";

            const stock = (variants || [])
              .reduce((sum, v) => sum + Number(v.stock || 0), 0);

            // BORDER STATES
            if (stock === 0) {
              div.style.border = "2px solid #991b1b";
            } else if (stock < 5) {
              div.style.border = "2px solid #ef4444";
            } else if (stock <= 10) {
              div.style.border = "2px solid #f59e0b";
            }
            const mainImg =
              images.find(i => i.is_main)?.image_url ||
              images[0]?.image_url ||
              p.image_url;
            div.innerHTML = `

              <img src="${mainImg}" />

              ${p.badge ? `
                <div class="badge ${p.badge}">
                  <i class="fa ${p.badge === "sale" ? "fa-tag" : "fa-star"}"></i>
                  ${p.badge.toUpperCase()}
                </div>
              ` : ""}

              ${stock === 0 ? `
                <div class="badge out">OUT OF STOCK</div>
              ` : stock < 5 ? `
                <div class="badge low">LOW STOCK</div>
              ` : stock <= 10 ? `
                <div class="badge mid">MEDIUM STOCK</div>
              ` : ""}

              <label class="field">
                <i class="fa-solid fa-tag"></i>
                <span>Name</span>
                <input class="name" value="${p.name}">
              </label>
              <label class="field">
                <i class="fa-solid fa-align-left"></i>
                <span>Description</span>
                <input class="description" value="${p.description || ""}">
              </label>
              <div class="section">
                <h4>Full Description</h4>
                <textarea class="full_description" style="
                  width:100%;
                  min-height:90px;
                  padding:10px;
                  border-radius:10px;
                  border:1px solid var(--border);
                  background: var(--card);
                  color: var(--text);
                  resize:vertical;
                ">${p.full_description || ""}</textarea>
              </div>
              <label class="field">
                <i class="fa-solid fa-layer-group"></i>
                <span>Category</span>
                <select class="category">
                  <option value="accessories" ${p.category==="accessories"?"selected":""}>Fancy Bracelets & Watches</option>
                  <option value="fragrances" ${p.category==="fragrances"?"selected":""}>Fancy Rings</option>
                  <option value="urban" ${p.category==="urban"?"selected":""}>Fancy Chaines</option>
                </select>
              </label>
              <label class="field">
                <i class="fa-solid fa-coins"></i>
                <span>
                  <input type="checkbox" class="is_featured" ${p.is_featured ? "checked" : ""}>
                  Featured
                </span>
              </label>

              <label class="field">
                <i class="fa-solid fa-crown"></i>
                <span>
                  <input type="checkbox" class="hero" ${p.hero ? "checked" : ""}>
                  Hero Product
                </span>
              </label>
              <label class="field">
                <i class="fa-solid fa-star"></i>
                <span>Badge</span>
                <select class="badgeSelect">
                  <option value="">None</option>
                  <option value="new" ${p.badge==="new"?"selected":""}>New</option>
                  <option value="sale" ${p.badge==="sale"?"selected":""}>Sale</option>
                </select>
              </label>
              <div class="section">
                <h4>Images</h4>

                <div class="imageList list"></div>

                <button type="button" class="addImage" style="
                  margin-top:8px;
                  padding:8px;
                  width:100%;
                  border-radius:10px;
                  background:#222;
                  color:white;
                  border:1px solid #333;
                ">+ Add Image</button>
              </div>

              <div class="section">
                <h4>Variants</h4>

                <div class="variantList list"></div>

                <button type="button" class="addVariant" style="
                  margin-top:8px;
                  padding:8px;
                  width:100%;
                  border-radius:10px;
                  background:#222;
                  color:white;
                  border:1px solid #333;
                ">+ Add Variant</button>
              </div>

              <div class="actions">
                <button class="save">Save</button>
                <button class="delete">Delete</button>
              </div>
            `;
            const fullDesc = div.querySelector(".full_description");
            const badgeHTML = p.badge
              ? `<div class="badge ${p.badge}">${p.badge.toUpperCase()}</div>`
              : "";

            const img = div.querySelector("img");
            const badgeSelect = div.querySelector(".badgeSelect");

            if (badgeSelect) {
              badgeSelect.onchange = () => {
                const val = badgeSelect.value;

                let badgeEl = div.querySelector(".badge");

                if (!val) {
                  if (badgeEl) badgeEl.remove();
                  return;
                }

                if (!badgeEl) {
                  badgeEl = document.createElement("div");
                  div.appendChild(badgeEl);
                }

                badgeEl.className = "badge " + val;
                badgeEl.innerHTML = `
                  <i class="fa ${val === "sale" ? "fa-tag" : "fa-star"}"></i>
                  ${val.toUpperCase()}
                `;
              };
            }
            // LOAD VARIANTS
            const variantList = div.querySelector(".variantList");
            const imageList = div.querySelector(".imageList");

      // 🔥 RENDER EXISTING IMAGES
      (images || []).forEach(imgData => {
        const row = document.createElement("div");
        row.className = "row";

        row.innerHTML = `
          <img src="${imgData?.image_url || ""}" style="height:40px">
        
          <input class="imgUrl" 
                value="${imgData?.image_url || ""}" 
                placeholder="Image URL">

          <input type="file" class="imgFile" hidden>

          <button type="button" class="uploadBtn">
            <i class="fa-solid fa-upload"></i>
          </button>

          <button type="button" class="setMain">
            <i class="fa-solid fa-star"></i>
          </button>

          <button type="button" class="deleteImg">x</button>
        `;

        const imgPreview = row.querySelector("img");
        if (!imgData?.image_url) {
          imgPreview.style.opacity = "0.3";
        }
        const input = row.querySelector(".imgUrl");
        const fileInput = row.querySelector(".imgFile");
        const uploadBtn = row.querySelector(".uploadBtn");
        const setMainBtn = row.querySelector(".setMain");

        // CLICK upload button → open file picker
      uploadBtn.onclick = () => fileInput.click();

      // HANDLE FILE UPLOAD
      fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const name = Date.now() + "-" + file.name;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(name, file);

        if (uploadError) {
          console.error(uploadError);
          toast("Upload failed");
          return;
        }

        const { data } = supabase.storage
          .from("products")
          .getPublicUrl(name);

        const imageUrl = data.publicUrl;

        // update preview instantly
        imgPreview.src = imageUrl;
        imgPreview.style.opacity = "1";
        input.value = imageUrl;

        // save in DB
        await supabase
          .from("product_images")
          .update({ image_url: imageUrl })
          .eq("id", imgData.id);

        toast("Image uploaded ✅");
      };

        setMainBtn.onclick = async () => {
        // remove main from all
        await supabase
          .from("product_images")
          .update({ is_main: false })
          .eq("product_id", p.id);

        // set this as main
        await supabase
          .from("product_images")
          .update({ is_main: true })
          .eq("id", imgData.id);

        // 🔥 instant UI update (no reload)
        const newMain =
          imgData.image_url;

        div.querySelector("img").src = newMain;

        toast("Main image set ⭐");
      };


        // DELETE
        row.querySelector(".deleteImg").onclick = async () => {
          await supabase
            .from("product_images")
            .delete()
            .eq("id", imgData.id);

          row.remove();
        };

        // UPDATE URL
        input.onchange = async () => {
          const url = input.value.trim();

          const { error } = await supabase
            .from("product_images")
            .update({ image_url: url })
            .eq("id", imgData.id);

          if (!error) {
            imgPreview.src = url;
            toast("Image updated");
          }
        };

        imageList.appendChild(row);
      });

            (variants || []).forEach(v => {
              const row = document.createElement("div");

              row.className = "row";

            row.innerHTML = `
              <input class="v-color" value="${v.color || ""}" placeholder="Color">
              <input class="v-size" value="${v.size || ""}" placeholder="Size">
              <input type="number" class="v-price" value="${v.price || 0}" placeholder="Price">
              <input type="number" class="v-stock" value="${v.stock || 0}">
              <button class="deleteVariant">x</button>
            `;

            // DELETE
            row.querySelector(".deleteVariant").onclick = async () => {
              await supabase.from("product_variants").delete().eq("id", v.id);
              row.remove();
            };

            // AUTO SAVE
            row.querySelectorAll("input").forEach(input => {
              input.onchange = async () => {
                await supabase
                  .from("product_variants")
                  .update({
                    color: row.querySelector(".v-color").value,
                    size: row.querySelector(".v-size").value,
                    price: +row.querySelector(".v-price").value,
                    stock: +row.querySelector(".v-stock").value
                  })
                  .eq("id", v.id);
              };
            });

            variantList.appendChild(row);
          });
          div.querySelector(".addImage").onclick = async (e) => {
        e.preventDefault();

        const { data, error } = await supabase
          .from("product_images")
          .insert({
            product_id: p.id,
            image_url: ""
          })
          .select()
          .single();

        if (error) {
          toast("Failed to add image");
          return;
        }

        const imageList = div.querySelector(".imageList");

        const row = document.createElement("div");
        row.className = "row";

        row.innerHTML = `
          <img src="" style="height:40px">

          <input class="imgUrl" placeholder="Image URL">

          <input type="file" class="imgFile" hidden>

          <button type="button" class="uploadBtn">
            <i class="fa-solid fa-upload"></i>
          </button>

          <button type="button" class="setMain">
            <i class="fa-solid fa-star"></i>
          </button>

          <button type="button" class="deleteImg">x</button>
        `;

        const img = row.querySelector("img");
        img.style.opacity = "0.3"; 
        const input = row.querySelector(".imgUrl");
        const setMainBtn = row.querySelector(".setMain");
        const fileInput = row.querySelector(".imgFile");
      const uploadBtn = row.querySelector(".uploadBtn");

      uploadBtn.onclick = () => fileInput.click();

      fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const name = Date.now() + "-" + file.name;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(name, file);

        if (uploadError) {
          console.error(uploadError);
          toast("Upload failed");
          return;
        }

        const { data: urlData } = supabase.storage
          .from("products")
          .getPublicUrl(name);

        const imageUrl = urlData.publicUrl;

        img.src = imageUrl;
        img.style.opacity = "1";
        input.value = imageUrl;

        await supabase
          .from("product_images")
          .update({ image_url: imageUrl })
          .eq("id", data.id);

        toast("Image uploaded ✅");
      };

      setMainBtn.onclick = async () => {
        await supabase
          .from("product_images")
          .update({ is_main: false })
          .eq("product_id", p.id);

        await supabase
          .from("product_images")
          .update({ is_main: true })
          .eq("id", data.id);

        div.querySelector("img").src = input.value;

        await supabase
          .from("products")
          .update({ image_url: input.value })
          .eq("id", p.id);

        toast("Main image set ⭐");
      };

        // DELETE
        row.querySelector(".deleteImg").onclick = async () => {
          await supabase
            .from("product_images")
            .delete()
            .eq("id", data.id);

          row.remove();
        };

        // ✅ URL SAVE (same logic as your Apply URL)
        input.onchange = async () => {
          const url = input.value.trim();

          const { error } = await supabase
            .from("product_images")
            .update({ image_url: url })
            .eq("id", data.id);

          if (!error) {
            img.src = url;
            toast("Image updated");
          }
        };

        imageList.appendChild(row);
      };

          div.querySelector(".addVariant").onclick = async (e) => {
        e.preventDefault();

        const { data, error } = await supabase
          .from("product_variants")
          .insert({
            product_id: p.id,
            color: "",
            size: "",
            price: 0,
            stock: 0
          })
          .select()
          .single();


        const row = document.createElement("div");
      row.className = "row";

      row.innerHTML = `
        <input class="v-color" placeholder="Color (e.g. Midnight Black)">
        <input class="v-size" placeholder="Size (e.g. XL)">
        <input type="number" class="v-price" placeholder="Price">
        <input type="number" class="v-stock" placeholder="Stock">
        <button class="deleteVariant">x</button>
      `;

      // DELETE
      row.querySelector(".deleteVariant").onclick = async () => {
        await supabase.from("product_variants").delete().eq("id", data.id);
        row.remove();
      };

      // AUTO SAVE (THIS WAS MISSING)
      row.querySelectorAll("input").forEach(input => {
        input.onchange = async () => {
          await supabase
            .from("product_variants")
            .update({
              color: row.querySelector(".v-color").value,
              size: row.querySelector(".v-size").value,
              price: +row.querySelector(".v-price").value,
              stock: +row.querySelector(".v-stock").value
            })
            .eq("id", data.id);
        };
      });

      div.querySelector(".variantList").appendChild(row);
      };

            

            /* SAVE */
            div.querySelector(".save").onclick = async () => {
        const btn = div.querySelector(".save");
        btn.disabled = true;
        btn.textContent = "Saving...";

        const { error } = await supabase
          .from("products")
          .update({
            name: div.querySelector(".name").value,
            description: div.querySelector(".description").value,
            full_description: div.querySelector(".full_description").value,
            category: div.querySelector(".category").value,
            badge: div.querySelector(".badgeSelect").value || null,
            is_featured: div.querySelector(".is_featured").checked,
            hero: div.querySelector(".hero").checked
          })
          .eq("id", p.id);

        btn.disabled = false;
        btn.textContent = "Save";

        if (error) {
          console.error(error);
          toast("Save failed");
          return;
        }

        toast("Saved");
      };
            /* DELETE */
            div.querySelector(".delete").onclick = async () => {

              const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", p.id);

              if (error) {
                console.error(error);
                toast("Delete failed");
                return;
              }

              toast("Deleted");
              div.remove();
            };

            list.appendChild(div);
            };
        }

        document.getElementById("addProduct").onclick = () => {
        const div = document.createElement("div");
        div.className = "product new";

        div.innerHTML = `
        <div class="imgWrap">
          <img class="preview" src="" />
          <div class="badge new"><i class="fa fa-star"></i> NEW</div>
        </div>

        <label class="field">
          <i class="fa-solid fa-tag"></i>
          <span>Name</span>
          <input class="name" placeholder="Product name">
        </label>

        <label class="field">
          <i class="fa-solid fa-align-left"></i>
          <span>Description</span>
          <input class="description" placeholder="Short description">
        </label>

        <div class="section">
          <h4>Full Description</h4>
          <textarea class="full_description"></textarea>
        </div>
        <label class="field">
          <i class="fa-solid fa-layer-group"></i>
          <span>Category</span>
          <select class="category">
            <option value="accessories">Accessories</option>
            <option value="fragrances">Fragrances</option>
            <option value="urban">Urban</option>
          </select>
        </label>
        <label class="field">
          <i class="fa-solid fa-star"></i>
          <span>
            <input type="checkbox" class="is_featured">
            Featured
          </span>
        </label>

        <label class="field">
          <i class="fa-solid fa-crown"></i>
          <span>
            <input type="checkbox" class="hero">
            Hero Product
          </span>
        </label>
        <label class="field">
          <i class="fa-solid fa-star"></i>
          <span>Badge</span>
          <select class="badgeSelect">
            <option value="">None</option>
            <option value="new">New</option>
            <option value="sale">Sale</option>
          </select>
        </label>

        <div class="section">
          <h4>Images</h4>
          <div class="imageList list"></div>
          <button class="addImage">+ Add Image</button>
        </div>

        <div class="section">
          <h4>Variants</h4>
          <div class="variantList list"></div>
          <button class="addVariant">+ Add Variant</button>
        </div>

        <div class="actions">
          <button class="saveNew">Create</button>
          <button class="cancelNew">Cancel</button>
        </div>
      `;
        div.querySelector(".addImage").onclick = () => {
        const row = document.createElement("div");
        row.className = "row";

        row.innerHTML = `
        <img src="" style="height:40px; opacity:0.3">

        <input class="imgUrl" placeholder="Image URL">

        <input type="file" class="imgFile" hidden>

        <button type="button" class="uploadBtn">
          <i class="fa-solid fa-upload"></i>
        </button>

        <button class="deleteImg">x</button>
      `;

      const img = row.querySelector("img");
      const input = row.querySelector(".imgUrl");
      const fileInput = row.querySelector(".imgFile");
      const uploadBtn = row.querySelector(".uploadBtn");

      // open file picker
      uploadBtn.onclick = () => fileInput.click();

      // upload to Supabase storage
      fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const name = Date.now() + "-" + file.name;

        const { error } = await supabase.storage
          .from("products")
          .upload(name, file);

        if (error) {
          console.error(error);
          toast("Upload failed");
          return;
        }

        const { data } = supabase.storage
          .from("products")
          .getPublicUrl(name);

        const url = data.publicUrl;

        img.src = url;
        img.style.opacity = "1";
        input.value = url;

        // update main preview
        div.querySelector(".preview").src = url;
      };

      // manual URL still works
      input.onchange = () => {
        img.src = input.value;
        img.style.opacity = "1";

        div.querySelector(".preview").src = input.value;
      };

      // delete
      row.querySelector(".deleteImg").onclick = () => row.remove();
        const badgeSelect = div.querySelector(".badgeSelect");
        let badgeEl = div.querySelector(".badge");

        badgeSelect.onchange = () => {
          const val = badgeSelect.value;

          if (!val) {
            if (badgeEl) badgeEl.remove();
            return;
          }

          if (!badgeEl) {
            const b = document.createElement("div");
            b.className = "badge " + val;
            b.innerHTML = `
              <i class="fa ${val === "sale" ? "fa-tag" : "fa-star"}"></i>
              ${val.toUpperCase()}
            `;
            div.appendChild(b);
          } else {
            badgeEl.className = "badge " + val;
            badgeEl.textContent = val.toUpperCase();
          }
        };

        div.querySelector(".imageList").appendChild(row);
      };

        // ADD VARIANT ROW (UI ONLY)
        div.querySelector(".addVariant").onclick = () => {
          const row = document.createElement("div");
          row.className = "row";

          row.innerHTML = `
            <input class="v-color" placeholder="Color">
            <input class="v-size" placeholder="Size">
            <input type="number" class="v-price" value="0">
            <input type="number" class="v-stock" value="0">
            <button class="deleteVariant">x</button>
          `;

          row.querySelector(".deleteVariant").onclick = () => row.remove();

          div.querySelector(".variantList").appendChild(row);
        };

        // CANCEL
        div.querySelector(".cancelNew").onclick = () => div.remove();

        // SAVE (THIS IS THE IMPORTANT PART)
        div.querySelector(".saveNew").onclick = async () => {
          const name = div.querySelector(".name").value;

          if (!name) {
            toast("Name required");
            return;
          }

          const { data, error } = await supabase
            .from("products")
            .insert({
              name,
              description: div.querySelector(".description").value,
              full_description: div.querySelector(".full_description").value,
              category: div.querySelector(".category").value,
              badge: div.querySelector(".badgeSelect").value || null,
              is_featured: div.querySelector(".is_featured").checked,
              hero: div.querySelector(".hero").checked
            })
            .select()
            .single();

          if (error) {
            console.error(error);
            toast("Create failed");
            return;
          }

          // SAVE IMAGES
          const imgInputs = div.querySelectorAll(".imgUrl");
          for (const input of imgInputs) {
            if (!input.value) continue;

            await supabase.from("product_images").insert({
              product_id: data.id,
              image_url: input.value
            });
          }

          // SAVE VARIANTS
          const rows = div.querySelectorAll(".variantList .row");
          for (const row of rows) {
            await supabase.from("product_variants").insert({
              product_id: data.id,
              color: row.querySelector(".v-color").value,
              size: row.querySelector(".v-size").value,
              price: Number(row.querySelector(".v-price").value),
              stock: Number(row.querySelector(".v-stock").value)
            });
          }

          toast("Product created ✅");

          div.remove();

          all = []; // 🔥 
          await refresh();
        };

        // 🔥 ADD CARD AT TOP (NO REFRESH)
        list.prepend(div);
      };

        filterCategory.addEventListener("change", refresh);

        const clearBtn = document.getElementById("clearSearch");

        const searchWrap = document.querySelector(".search-wrap");

        searchInput.addEventListener("input", () => {
          clearTimeout(searchTimeout);

          const hasValue = searchInput.value.trim().length > 0;

      // 🔥 toggle class (THIS is what you're missing)
          searchWrap.classList.toggle("active", hasValue);

          searchTimeout = setTimeout(() => {
            lastRequestId++;
            refresh();
          }, 300);
        });

        clearBtn.addEventListener("click", () => {
          searchInput.value = "";

          searchWrap.classList.remove("active");

          refresh();
        });

      function confirmModal(message) {
      return new Promise((resolve) => {
        const modal = document.getElementById("confirmModal");
        const text = document.getElementById("confirmText");
        const yes = document.getElementById("confirmYes");
        const no = document.getElementById("confirmNo");

        text.textContent = message;
        modal.classList.remove("hidden");

        const cleanup = () => {
          modal.classList.add("hidden");
          yes.onclick = null;
          no.onclick = null;
        };

        yes.onclick = () => {
          cleanup();
          resolve(true);
        };

        no.onclick = () => {
          cleanup();
          resolve(false);
        };
      });
    }

    function suspendModal(userLabel) {
      return new Promise((resolve) => {
        const modal = document.getElementById("suspendModal");
        const input = document.getElementById("suspendReasonInput");
        const info = document.getElementById("suspendUserInfo");
        const ok = document.getElementById("suspendConfirm");
        const cancel = document.getElementById("suspendCancel");

        input.value = "";
        info.textContent = `User: ${userLabel}`;

        modal.classList.remove("hidden");

        const cleanup = () => {
          modal.classList.add("hidden");
          ok.onclick = null;
          cancel.onclick = null;
        };

        ok.onclick = () => {
          const reason = input.value.trim();
          cleanup();
          resolve(reason);
        };

        cancel.onclick = () => {
          cleanup();
          resolve(null);
        };
      });
    }


    async function loadAdminProfile() {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) return;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      full_name,
      username,
      avatar_url,
      email
    `)
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Failed to load admin profile:", error);
    return;
  }

  // Elements
  const avatarEl = document.getElementById("adminAvatar");
  const nameEl = document.getElementById("adminName");
  const emailEl = document.getElementById("adminEmail");

  // Name fallback chain
  const displayName =
    profile.full_name ||
    profile.username ||
    profile.email ||
    "Admin";

  // Avatar
  if (avatarEl) {
    avatarEl.src =
      profile.avatar_url ||
      "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(displayName);

    avatarEl.alt = displayName;
  }

  // Name
  if (nameEl) {
    nameEl.textContent = displayName;
  }

  // Email
  if (emailEl) {
    emailEl.textContent = profile.email || "";
  }
}
    async function loadReviews() {
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select(`
          *,
          products (
            id,
            name,
            image_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast("Failed to load reviews");
        return;
      }

      reviewsList.innerHTML = "";

      if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML =
          "<p style='opacity:0.6'>No reviews found.</p>";

        document.getElementById("kpiReviewProducts").textContent = 0;
        document.getElementById("kpiReviews").textContent = 0;
        document.getElementById("kpiReviewAverage").textContent = "0.0";
        return;
      }

      // Group reviews by product
      const grouped = {};

      for (const review of reviews) {
        const productId = review.product_id;

        if (!grouped[productId]) {
          grouped[productId] = {
            product: review.products,
            reviews: []
          };
        }

        grouped[productId].reviews.push(review);
      }

      const groups = Object.values(grouped);

      // KPIs
      const totalReviews = reviews.length;
      const totalProducts = groups.length;

      const averageRating =
        reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
        totalReviews;

      document.getElementById("kpiReviewProducts").textContent =
        totalProducts;

      document.getElementById("kpiReviews").textContent =
        totalReviews;

      document.getElementById("kpiReviewAverage").textContent =
        averageRating.toFixed(1);

      // Render groups
      for (const group of groups) {
        const product = group.product || {};

        const card = document.createElement("div");
        card.className = "review-group";

        card.innerHTML = `
          <h3>${product.name || "Unknown Product"}</h3>
          <div class="review-meta">
            ${group.reviews.length} review(s)
          </div>
          <div class="review-items"></div>
        `;

        const container = card.querySelector(".review-items");

        for (const review of group.reviews) {
          const item = document.createElement("div");
          item.className = "review-item";

          const stars = "★".repeat(Number(review.rating || 0));

          item.innerHTML = `
            <div class="review-top">
              <div class="review-user">
                ${review.user_metadata?.full_name ||
                  review.user_metadata?.name ||
                  review.user_metadata?.username ||
                  review.user_metadata?.display_name ||
                  review.user_metadata?.email ||
                  review.user_id?.slice(0, 8) ||
                  "Anonymous"}
              </div>
              <div class="review-rating">
                ${stars} (${review.rating || 0}/5)
              </div>
            </div>

            <div class="review-comment">
              ${review.comment || ""}
            </div>

            <div class="review-date">
              ${new Date(review.created_at).toLocaleString()}
            </div>

            <button class="review-delete">
              Delete Review
            </button>
          `;

          item.querySelector(".review-delete").onclick =
            async () => {
              const ok = await confirmModal(
                "Delete this review?"
              );

              if (!ok) return;

              const { error } = await supabase
                .from("reviews")
                .delete()
                .eq("id", review.id);

              if (error) {
                console.error(error);
                toast("Delete failed");
                return;
              }

              toast("Review deleted");
              await loadReviews();
            };

          container.appendChild(item);
        }

        reviewsList.appendChild(card);
      }
    }

    async function loadUsers() {
      const { data: users, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast("Failed to load users");
        return;
      }

      usersList.innerHTML = "";

      if (!users || users.length === 0) {
        usersList.innerHTML =
          "<p style='opacity:0.6'>No users found.</p>";
        return;
      }

      // KPIs
      const kpiUsersEl = document.getElementById("kpiUsers");
    const kpiSuspendedEl = document.getElementById("kpiSuspended");

    if (kpiUsersEl) kpiUsersEl.textContent = users.length;

    if (kpiSuspendedEl)
      kpiSuspendedEl.textContent = users.filter(u => u.suspended).length;

      for (const user of users) {
        const suspended = user.suspended;

        const card = document.createElement("div");
        card.className = "review-group";

        card.innerHTML = `
          <div style="
  display:flex;
  align-items:center;
  gap:14px;
  margin-bottom:14px;
">
  <img
    src="${
      user.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.full_name ||
        user.username ||
        user.email ||
        "User"
      )}`
    }"
    alt="avatar"
    style="
      width:56px;
      height:56px;
      border-radius:50%;
      object-fit:cover;
      border:1px solid rgba(255,255,255,0.1);
      background:#111;
      flex-shrink:0;
    "
  >

  <div style="min-width:0;">
    <h3 style="
      margin:0;
      font-size:18px;
      line-height:1.2;
    ">
      ${
        user.full_name ||
        user.username ||
        user.email ||
        "Unknown User"
      }
    </h3>

    <div style="
      margin-top:4px;
      font-size:13px;
      opacity:0.75;
    ">
      @${user.username || "no_username"}
    </div>

    <div class="review-meta" style="margin-top:6px;">
      ${user.email || "No Email"}
    </div>
  </div>
</div>

          <div class="review-items">
            <div class="review-item">

              <div class="review-top">
                <div class="review-user">
                  User ID
                </div>

                <div class="review-rating">
                  ${user.id}
                </div>
              </div>

              <div class="review-comment">
                Created:
                ${new Date(user.created_at).toLocaleString()}
              </div>

              <div class="review-date">
  Status:
  <span style="
    display:inline-flex;
    align-items:center;
    gap:6px;
    padding:4px 10px;
    margin-left:6px;
    border-radius:999px;
    font-size:12px;
    font-weight:700;
    letter-spacing:0.03em;
    text-transform:uppercase;
    ${
      suspended
        ? `
          background: rgba(225, 29, 72, 0.12);
          color: #fb7185;
          border: 1px solid rgba(225, 29, 72, 0.25);
        `
        : `
          background: rgba(34, 197, 94, 0.12);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.25);
        `
    }
  ">
    ${suspended ? "● Suspended" : "● Active"}
  </span>
</div>

              ${
                suspended
                  ? `
                    <div class="review-comment">
                      Reason:
                      ${user.reason || "No reason"}
                    </div>
                  `
                  : ""
              }

              <div style="
                display:flex;
                gap:10px;
                margin-top:15px;
                flex-wrap:wrap;
              ">
                ${
                  suspended
                    ? `
                      <button class="unsuspendBtn">
                        Unsuspend
                      </button>
                    `
                    : `
                      <button class="suspendBtn">
                        Suspend
                      </button>
                    `
                }

                <button class="deleteUserBtn">
                  Delete User
                </button>
              </div>

            </div>
          </div>
        `;

        // SUSPEND
        const suspendBtn = card.querySelector(".suspendBtn");

        if (suspendBtn) {
          suspendBtn.onclick = async () => {
            const reason = await suspendModal(
              user.full_name || user.email || user.id
            );

            if (reason === null) return;

            const { error } = await supabase
              .from("profiles")
              .update({
                suspended: true,
                reason: reason || null,
                updated_at: new Date().toISOString()
              })
              .eq("id", user.id);

            if (error) {
              console.error(error);
              toast("Suspend failed");
              return;
            }

            toast("User suspended");
            await loadUsers();
          };
        }

        // UNSUSPEND
        const unsuspendBtn = card.querySelector(".unsuspendBtn");

        if (unsuspendBtn) {
          unsuspendBtn.onclick = async () => {
            const { error } = await supabase
              .from("profiles")
              .update({
                suspended: false,
                reason: null,
                updated_at: new Date().toISOString()
              })
              .eq("id", user.id);

            if (error) {
              console.error(error);
              toast("Unsuspend failed");
              return;
            }

            toast("User unsuspended");
            await loadUsers();
          };
        }

        // DELETE USER
        card.querySelector(".deleteUserBtn").onclick =
          async () => {
            const ok = await confirmModal(
              "Delete this user?"
            );

            if (!ok) return;

            // Delete related data
            await supabase.from("reviews").delete().eq("user_id", user.id);
            await supabase.from("user_addresses").delete().eq("user_id", user.id);
            await supabase.from("orders").delete().eq("user_id", user.id);

            // Delete profile
            const { error } = await supabase
              .from("profiles")
              .delete()
              .eq("id", user.id);

            if (error) {
              console.error(error);
              toast("Delete failed");
              return;
            }

            toast("User deleted");
            await loadUsers();
          };

        usersList.appendChild(card);
      }
    }

        /* INIT */
        refresh();

        // Listen for language changes to update currency symbols
        window.addEventListener('languageChanged', () => {
          loadKPIs();
          loadOrders();
        });
      }
      bootstrap();
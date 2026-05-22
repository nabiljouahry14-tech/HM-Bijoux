(function () {

  function highlight(text, q) {
    if (!q) return text;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    return text.replace(re, '<span class="search-mark">$1</span>');
  }

  function initFor(rootEl) {
    const input =
      rootEl.querySelector('.search-input') ||
      rootEl.querySelector('#collectionSearch');

    const suggestions =
      rootEl.querySelector('.search-suggestions') ||
      rootEl.querySelector('#collectionSearchList');

    const clearBtn = rootEl.querySelector('.search-clear');
    const noResults = rootEl.querySelector('.search-noresults');

    if (!input || !suggestions) return;

    suggestions.hidden = true;
    if (noResults) noResults.hidden = true;

    let active = -1;

    function renderItems(items, q) {
      suggestions.innerHTML = "";

      if (!items.length) {
        suggestions.hidden = true;
        if (noResults) noResults.hidden = false;
        return;
      }

      if (noResults) noResults.hidden = true;
      suggestions.hidden = false;

      items.slice(0, 8).forEach((it) => {
        const li = document.createElement("li");
        li.className = "sugg-item";
        li.tabIndex = 0;

        li.innerHTML = `
          <img class="sugg-thumb" src="${it.thumb}" />
          <div class="sugg-meta">
            <div class="sugg-name">${highlight(it.name, q)}</div>
            <div class="sugg-price">$${it.price}</div>
          </div>
        `;

        li.addEventListener("click", () => {
          window.location.href = `/product.html?id=${it.id}`;
        });

        suggestions.appendChild(li);
      });
    }

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();

      if (!q) {
        suggestions.innerHTML = "";
        suggestions.hidden = true;
        if (noResults) noResults.hidden = true;
        if (clearBtn) clearBtn.hidden = true;
        return;
      }

      if (clearBtn) clearBtn.hidden = false;

      const products = window.allProducts || [];

      const matches = products
        .filter((p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        )
        .map((p) => {
          const img =
            p.product_images?.find((i) => i.is_main)?.image_url ||
            p.product_images?.[0]?.image_url ||
            "";

          const prices = (p.product_variants || []).map((v) =>
            Number(v.price || 0)
          );

          const minPrice = prices.length ? Math.min(...prices) : 0;

          return {
            id: p.id,
            name: p.name,
            price: minPrice,
            thumb: img,
          };
        });

      renderItems(matches, q);
    });

    input.addEventListener("keydown", (e) => {
      const items = Array.from(suggestions.children);

      if (!items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        active = Math.min(active + 1, items.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        active = Math.max(active - 1, 0);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[active]) items[active].click();
      }

      items.forEach((el, i) =>
        el.classList.toggle("active", i === active)
      );
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        input.dispatchEvent(new Event("input"));
        input.focus();
        clearBtn.hidden = true;
      });
    }

    document.addEventListener("click", (e) => {
      if (
        !e.target.closest(".search-suggestions") &&
        !e.target.closest(".search-input")
      ) {
        suggestions.innerHTML = "";
        suggestions.hidden = true;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll(".collection-search")
      .forEach((el) => initFor(el));
  });

})();
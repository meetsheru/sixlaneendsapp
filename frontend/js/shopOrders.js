const ShopOrderModule = (() => {
  const SHOP_ORDERS_API = "http://localhost:3000/api/shop-orders";

  let currentOrder = [];
  let editingOrderId = null;

  // ---------- Payment method helpers ----------
  const getPaymentMethod = () => {
    const el = document.querySelector('input[name="shop-payment-method"]:checked');
    return el ? el.value : "cash";
  };

  const setPaymentMethod = (method) => {
    const radio = document.querySelector(
      `input[name="shop-payment-method"][value="${method}"]`
    );
    if (radio) radio.checked = true;
  };

    // ---------- Cash change calculator ----------
  const updateCashChange = () => {
    const total = getTotal();
    const tenderedEl = document.getElementById("shop-cash-tendered");
    const changeEl = document.getElementById("shop-cash-change");
    if (!tenderedEl || !changeEl) return;

    const tendered = parseFloat(tenderedEl.value);
    if (isNaN(tendered) || tendered <= 0) {
      changeEl.innerText = "£0.00";
      changeEl.classList.remove("negative");
      return;
    }

    const change = tendered - total;
    if (change < 0) {
      changeEl.innerText = `−£${Math.abs(change).toFixed(2)} (short)`;
      changeEl.classList.add("negative");
    } else {
      changeEl.innerText = `£${change.toFixed(2)}`;
      changeEl.classList.remove("negative");
    }
  };

  const toggleCashBox = () => {
    const box = document.getElementById("cash-change-box");
    if (!box) return;
    if (getPaymentMethod() === "cash") {
      box.classList.remove("hidden");
    } else {
      box.classList.add("hidden");
      const t = document.getElementById("shop-cash-tendered");
      const c = document.getElementById("shop-cash-change");
      if (t) t.value = "";
      if (c) {
        c.innerText = "£0.00";
        c.classList.remove("negative");
      }
    }
  };

  // ---------- Load order into cart for editing ----------
  const loadOrderForEdit = (id, ordersList) => {
    const source = ordersList || window.__lastShopOrders || [];
    const order = source.find((o) => o.id === id);
    if (!order) {
      console.warn("Order not found for edit:", id);
      return;
    }
    const items = Array.isArray(order.items)
      ? order.items
      : JSON.parse(order.items);
    currentOrder = items.map((i) => ({ ...i, qty: i.qty || 1 }));
    editingOrderId = id;
    document.getElementById("shop-customer-name").value =
      order.customer_name || "";
    document.getElementById("shop-notes").value = order.notes || "";
    setPaymentMethod(order.payment_method || "cash");
    updateUI();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------- Cart operations ----------
  const addItem = (item) => {
    const existing = currentOrder.find(
      (i) => i.name === item.name && i.price === item.price && !i.isCustom
    );
    if (existing) existing.qty++;
    else currentOrder.push({ ...item, qty: 1 });
    updateUI();
  };

  const addCustomItem = () => {
    const nameEl = document.getElementById("shop-custom-item-name");
    const priceEl = document.getElementById("shop-custom-item-price");
    const qtyEl = document.getElementById("shop-custom-item-qty");

    const name = (nameEl.value || "").trim();
    const price = parseFloat(priceEl.value);
    const qty = parseInt(qtyEl.value) || 1;

    if (!name) {
      alert("Please enter an item name.");
      nameEl.focus();
      return;
    }
    if (isNaN(price) || price < 0) {
      alert("Please enter a valid price.");
      priceEl.focus();
      return;
    }

    const existing = currentOrder.find(
      (i) => i.isCustom && i.name === name && i.price === price
    );
    if (existing) {
      existing.qty += qty;
    } else {
      currentOrder.push({
        name,
        price,
        qty,
        category: "CUSTOM",
        isCustom: true,
      });
    }

    nameEl.value = "";
    priceEl.value = "";
    qtyEl.value = "1";
    nameEl.focus();
    updateUI();
  };

  const changeQty = (index, delta) => {
    currentOrder[index].qty += delta;
    if (currentOrder[index].qty <= 0) currentOrder.splice(index, 1);
    updateUI();
  };

  const clearOrder = () => {
    if (!currentOrder.length) return;
    if (confirm("Clear current order?")) {
      currentOrder = [];
      editingOrderId = null;
      document.getElementById("shop-customer-name").value = "";
      document.getElementById("shop-notes").value = "";
      setPaymentMethod("cash");
      updateUI();
    }
  };

  const getTotal = () =>
    currentOrder.reduce((sum, i) => sum + i.price * i.qty, 0);

  // ---------- UI ----------
  const updateUI = () => {
    const list = document.getElementById("shop-order-list");
    const totalEl = document.getElementById("shop-total-price");
    const saveBtn = document.getElementById("shop-save-btn");

    if (!list) return;

    list.innerHTML = "";

    if (!currentOrder.length) {
      list.innerHTML = '<li class="empty-msg">No items selected</li>';
      if (saveBtn) saveBtn.innerText = "Place Order";
    } else {
      currentOrder.forEach((item, index) => {
        const li = document.createElement("li");
        const badge = item.isCustom
          ? ' <span class="custom-badge">CUSTOM</span>'
          : "";
        li.innerHTML = `
          <div>
            <div>${item.name}${badge}</div>
            <div style="font-size:0.8em;color:#666">£${item.price.toFixed(2)}</div>
          </div>
          <div class="item-controls">
            <button class="qty-btn" data-action="dec" data-index="${index}">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-index="${index}">+</button>
          </div>
        `;
        list.appendChild(li);
      });
      if (saveBtn)
        saveBtn.innerText = editingOrderId ? "Update Order" : "Place Order";
    }

      if (totalEl) totalEl.innerText = `£${getTotal().toFixed(2)}`;

    // Recompute change due whenever the cart total changes
    updateCashChange();
  };

  // ---------- Save / Update ----------
  const saveOrder = async () => {
    if (!currentOrder.length) {
      alert("Order is empty");
      return;
    }

    const customer_name =
      document.getElementById("shop-customer-name")?.value.trim() || null;
    const notes =
      document.getElementById("shop-notes")?.value.trim() || null;
    const payment_method = getPaymentMethod();

    const payload = {
      items: currentOrder,
      total_price: getTotal(),
      customer_name,
      notes,
      payment_method,
    };

    try {
      let response;
      if (editingOrderId) {
        response = await fetch(`${SHOP_ORDERS_API}/${editingOrderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(SHOP_ORDERS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const saved = await response.json();
      const txn = saved?.transaction_id || `#${saved?.id}`;
      const methodLabel = saved?.payment_method === "card" ? "💳 Card" : "💵 Cash";

      alert(
        editingOrderId
          ? `Order updated!\nTransaction: ${txn}\nPayment: ${methodLabel}`
          : `Order placed!\nTransaction: ${txn}\nPayment: ${methodLabel}`
      );

      currentOrder = [];
      editingOrderId = null;
      document.getElementById("shop-customer-name").value = "";
      document.getElementById("shop-notes").value = "";
      setPaymentMethod("cash");

      const tenderedEl = document.getElementById("shop-cash-tendered");
      if (tenderedEl) tenderedEl.value = "";

      updateUI();
      toggleCashBox();

      await loadHistory();

      if (typeof ShopSalesModule !== "undefined" && ShopSalesModule.load) {
        ShopSalesModule.load();
      }
    } catch (err) {
      console.error("Save order error:", err);
      alert("Error saving order. Check console.");
    }
  };

  // ---------- History panel ----------
  const loadHistory = async () => {
    const historyList = document.getElementById("shop-history-list");
    if (!historyList) return;

    try {
      const res = await fetch(SHOP_ORDERS_API);
      const orders = await res.json();

      window.__lastShopOrders = orders;

      historyList.innerHTML = "";
      if (!orders.length) {
        historyList.innerHTML = '<div class="empty-msg">No past orders</div>';
        return;
      }

      orders.forEach((order) => {
        const div = document.createElement("div");
        div.className = "history-item";
        const date = new Date(order.created_at).toLocaleString();
        const items = Array.isArray(order.items)
          ? order.items
          : JSON.parse(order.items);
        const summary = items.map((i) => `${i.qty}× ${i.name}`).join(", ");

        const payMethod = order.payment_method || "cash";
        const payBadge =
          payMethod === "card"
            ? '<span class="payment-badge card">💳 Card</span>'
            : '<span class="payment-badge cash">💵 Cash</span>';

        div.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-family:monospace;color:#0f3460;">${order.transaction_id || "#" + order.id}${payBadge}</strong>
            <span style="font-size:0.8em;color:#888;">${date}</span>
          </div>
          <div style="font-size:0.9em;margin:5px 0;">${summary}</div>
          ${order.customer_name ? `<div style="font-size:0.85em;color:#666;">👤 ${order.customer_name}</div>` : ""}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
            <span class="history-total">£${parseFloat(order.total_price).toFixed(2)}</span>
            <div>
              <button class="btn secondary" style="width:auto;padding:4px 8px;font-size:0.8em;" data-edit="${order.id}">Edit</button>
              <button class="btn secondary" style="width:auto;padding:4px 8px;font-size:0.8em;background:#fdd;" data-delete="${order.id}">Delete</button>
            </div>
          </div>
        `;
        historyList.appendChild(div);
      });

      historyList.querySelectorAll("[data-edit]").forEach((btn) => {
        btn.onclick = () => {
          const id = parseInt(btn.dataset.edit);
          loadOrderForEdit(id, orders);
        };
      });

      historyList.querySelectorAll("[data-delete]").forEach((btn) => {
        btn.onclick = async () => {
          const id = parseInt(btn.dataset.delete);
          if (!confirm(`Delete order #${id}?`)) return;
          try {
            await fetch(`${SHOP_ORDERS_API}/${id}`, { method: "DELETE" });
            await loadHistory();
            if (
              typeof ShopSalesModule !== "undefined" &&
              ShopSalesModule.load
            ) {
              ShopSalesModule.load();
            }
          } catch (err) {
            console.error("Delete error:", err);
          }
        };
      });
    } catch (err) {
      console.error("Load history error:", err);
      historyList.innerHTML =
        '<div class="empty-msg">Failed to load orders</div>';
    }
  };

  // ---------- Init ----------
  const init = () => {
    document
      .getElementById("shop-order-list")
      ?.addEventListener("click", (e) => {
        if (e.target.classList.contains("qty-btn")) {
          const index = parseInt(e.target.dataset.index);
          const delta = e.target.dataset.action === "inc" ? 1 : -1;
          changeQty(index, delta);
        }
      });

    document
      .getElementById("shop-clear-btn")
      ?.addEventListener("click", clearOrder);

    document
      .getElementById("shop-save-btn")
      ?.addEventListener("click", saveOrder);

    // Custom item
    document
      .getElementById("shop-add-custom-btn")
      ?.addEventListener("click", addCustomItem);

    // Enter key in any custom field triggers Add
    [
      "shop-custom-item-name",
      "shop-custom-item-price",
      "shop-custom-item-qty",
    ].forEach((id) => {
      document.getElementById(id)?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addCustomItem();
        }
      });
    });

        // Cash change calculator
    document
      .getElementById("shop-cash-tendered")
      ?.addEventListener("input", updateCashChange);

    // Show/hide cash box based on payment method
    document
      .querySelectorAll('input[name="shop-payment-method"]')
      .forEach((radio) => {
        radio.addEventListener("change", toggleCashBox);
      });

    // Initial state
    toggleCashBox();

    loadHistory();
  
  };

  return { init, addItem, loadHistory, loadOrderForEdit };
})();
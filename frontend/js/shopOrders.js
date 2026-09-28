const ShopOrderModule = (() => {
  const API_URL = "http://localhost:3000/api/shop-orders";

  let currentOrder = [];
  let editingOrderId = null;

  const loadOrderForEdit = (id) => {
    const order = window.__lastShopOrders?.find((o) => o.id === id);
    if (!order) return;
    const items = Array.isArray(order.items)
      ? order.items
      : JSON.parse(order.items);
    currentOrder = items.map((i) => ({ ...i, qty: i.qty || 1 }));
    editingOrderId = id;
    document.getElementById("shop-customer-name").value =
      order.customer_name || "";
    document.getElementById("shop-notes").value = order.notes || "";
    updateUI();
  };

  const addItem = (item) => {
    const existing = currentOrder.find((i) => i.name === item.name);
    if (existing) existing.qty++;
    else currentOrder.push({ ...item, qty: 1 });
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
      updateUI();
    }
  };

  const getTotal = () =>
    currentOrder.reduce((sum, i) => sum + i.price * i.qty, 0);

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
        li.innerHTML = `
          <div>
            <div>${item.name}</div>
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
  };

  const saveOrder = async () => {
    if (!currentOrder.length) {
      alert("Order is empty");
      return;
    }

    const customer_name =
      document.getElementById("shop-customer-name")?.value.trim() || null;
    const notes = document.getElementById("shop-notes")?.value.trim() || null;

    const payload = {
      items: currentOrder,
      total_price: getTotal(),
      customer_name,
      notes,
    };

    try {
      let response;
      if (editingOrderId) {
        response = await fetch(`${API_URL}/${editingOrderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      alert(editingOrderId ? "Order updated!" : "Order placed!");
      currentOrder = [];
      editingOrderId = null;
      document.getElementById("shop-customer-name").value = "";
      document.getElementById("shop-notes").value = "";
      updateUI();
      const orders = await res.json();
      window.__lastShopOrders = orders;
    } catch (err) {
      console.error("Save order error:", err);
      alert("Error saving order. Check console.");
    }
  };

  const loadHistory = async () => {
    const historyList = document.getElementById("shop-history-list");
    if (!historyList) return;

    try {
      const res = await fetch(API_URL);
      const orders = await res.json();

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

        div.innerHTML = `
          <div style="display:flex;justify-content:space-between;">
            <strong>#${order.id}</strong>
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
          const order = orders.find((o) => o.id === id);
          if (!order) return;
          currentOrder = Array.isArray(order.items)
            ? order.items
            : JSON.parse(order.items);
          editingOrderId = id;
          document.getElementById("shop-customer-name").value =
            order.customer_name || "";
          document.getElementById("shop-notes").value = order.notes || "";
          updateUI();
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
      });

      historyList.querySelectorAll("[data-delete]").forEach((btn) => {
        btn.onclick = async () => {
          const id = parseInt(btn.dataset.delete);
          if (!confirm(`Delete order #${id}?`)) return;
          try {
            await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            loadHistory();
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

    loadHistory();
  };

  return { init, addItem, loadHistory, loadOrderForEdit };
})();

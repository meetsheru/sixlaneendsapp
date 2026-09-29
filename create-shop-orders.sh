#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/frontend"

# Ensure folders exist
mkdir -p css js

# ---------- 1. shop-orders.html ----------
cat > shop-orders.html <<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shop Orders — Fish & Chips</title>
  <link rel="stylesheet" href="style.css" />
  <link rel="stylesheet" href="css/shop-orders.css" />
</head>
<body>

  <nav class="main-nav">
    <a href="index.html">Home</a>
    <a href="shop-orders.html" class="active">Shop Orders</a>
  </nav>

  <div class="container shop-container">
    <div class="menu-section">
      <header>
        <h1>Menu</h1>
        <p>Click items to add to order</p>
      </header>
      <div class="menu-grid" id="shop-menu-grid">
        <div class="loading-msg">Loading menu…</div>
      </div>
    </div>

    <div class="order-section">
      <div class="order-card">
        <h2>Current Order</h2>

        <input type="text" id="shop-customer-name" placeholder="Customer name (optional)" />
        <input type="text" id="shop-notes" placeholder="Notes (optional)" />

        <ul id="shop-order-list">
          <li class="empty-msg">No items selected</li>
        </ul>

        <div class="total-row">
          <span>Total:</span>
          <span id="shop-total-price">£0.00</span>
        </div>

        <div class="actions">
          <button id="shop-clear-btn" class="btn secondary">Clear</button>
          <button id="shop-save-btn" class="btn primary">Place Order</button>
        </div>
      </div>

      <div class="history-card">
        <h3>Order History</h3>
        <div id="shop-history-list">
          <div class="loading-msg">Loading…</div>
        </div>
      </div>
    </div>
  </div>

  <script src="js/shopMenu.js"></script>
  <script src="js/shopOrders.js"></script>
  <script src="js/shopOrdersApp.js"></script>
</body>
</html>
HTML

# ---------- 2. js/shopMenu.js ----------
cat > js/shopMenu.js <<'JS'
const ShopMenuModule = (() => {
  const API_URL = 'http://localhost:3000/api/shop-orders/menu/items';
  let menuData = [];

  const fetchMenu = async () => {
    try {
      const res = await fetch(API_URL);
      menuData = await res.json();
    } catch (err) {
      console.error('Failed to load menu:', err);
      menuData = [];
    }
    return menuData;
  };

  const renderMenu = () => {
    const grid = document.getElementById('shop-menu-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (!menuData.length) {
      grid.innerHTML = '<div class="loading-msg">No menu items available</div>';
      return;
    }

    let currentCategory = '';

    menuData.forEach((item) => {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        const header = document.createElement('div');
        header.className = 'shop-category-header';
        header.innerText = currentCategory;
        grid.appendChild(header);
      }

      const div = document.createElement('div');
      div.className = 'shop-menu-item';
      div.innerHTML = `
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-price">£${parseFloat(item.price).toFixed(2)}</div>
      `;
      div.onclick = () =>
        ShopOrderModule.addItem({
          name: item.name,
          price: parseFloat(item.price),
          category: item.category,
        });
      grid.appendChild(div);
    });
  };

  const init = async () => {
    await fetchMenu();
    renderMenu();
  };

  return { init, menuData };
})();
JS

# ---------- 3. js/shopOrders.js ----------
cat > js/shopOrders.js <<'JS'
const ShopOrderModule = (() => {
  const API_URL = 'http://localhost:3000/api/shop-orders';

  let currentOrder = [];
  let editingOrderId = null;

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
    if (confirm('Clear current order?')) {
      currentOrder = [];
      editingOrderId = null;
      document.getElementById('shop-customer-name').value = '';
      document.getElementById('shop-notes').value = '';
      updateUI();
    }
  };

  const getTotal = () =>
    currentOrder.reduce((sum, i) => sum + i.price * i.qty, 0);

  const updateUI = () => {
    const list = document.getElementById('shop-order-list');
    const totalEl = document.getElementById('shop-total-price');
    const saveBtn = document.getElementById('shop-save-btn');

    if (!list) return;

    list.innerHTML = '';

    if (!currentOrder.length) {
      list.innerHTML = '<li class="empty-msg">No items selected</li>';
      if (saveBtn) saveBtn.innerText = 'Place Order';
    } else {
      currentOrder.forEach((item, index) => {
        const li = document.createElement('li');
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
        saveBtn.innerText = editingOrderId ? 'Update Order' : 'Place Order';
    }

    if (totalEl) totalEl.innerText = `£${getTotal().toFixed(2)}`;
  };

  const saveOrder = async () => {
    if (!currentOrder.length) {
      alert('Order is empty');
      return;
    }

    const customer_name =
      document.getElementById('shop-customer-name')?.value.trim() || null;
    const notes = document.getElementById('shop-notes')?.value.trim() || null;

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
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      alert(editingOrderId ? 'Order updated!' : 'Order placed!');
      currentOrder = [];
      editingOrderId = null;
      document.getElementById('shop-customer-name').value = '';
      document.getElementById('shop-notes').value = '';
      updateUI();
      loadHistory();
    } catch (err) {
      console.error('Save order error:', err);
      alert('Error saving order. Check console.');
    }
  };

  const loadHistory = async () => {
    const historyList = document.getElementById('shop-history-list');
    if (!historyList) return;

    try {
      const res = await fetch(API_URL);
      const orders = await res.json();

      historyList.innerHTML = '';
      if (!orders.length) {
        historyList.innerHTML = '<div class="empty-msg">No past orders</div>';
        return;
      }

      orders.forEach((order) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        const date = new Date(order.created_at).toLocaleString();
        const items = Array.isArray(order.items)
          ? order.items
          : JSON.parse(order.items);
        const summary = items.map((i) => `${i.qty}× ${i.name}`).join(', ');

        div.innerHTML = `
          <div style="display:flex;justify-content:space-between;">
            <strong>#${order.id}</strong>
            <span style="font-size:0.8em;color:#888;">${date}</span>
          </div>
          <div style="font-size:0.9em;margin:5px 0;">${summary}</div>
          ${order.customer_name ? `<div style="font-size:0.85em;color:#666;">👤 ${order.customer_name}</div>` : ''}
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

      historyList.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.onclick = () => {
          const id = parseInt(btn.dataset.edit);
          const order = orders.find((o) => o.id === id);
          if (!order) return;
          currentOrder = Array.isArray(order.items)
            ? order.items
            : JSON.parse(order.items);
          editingOrderId = id;
          document.getElementById('shop-customer-name').value =
            order.customer_name || '';
          document.getElementById('shop-notes').value = order.notes || '';
          updateUI();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        };
      });

      historyList.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.onclick = async () => {
          const id = parseInt(btn.dataset.delete);
          if (!confirm(`Delete order #${id}?`)) return;
          try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            loadHistory();
          } catch (err) {
            console.error('Delete error:', err);
          }
        };
      });
    } catch (err) {
      console.error('Load history error:', err);
      historyList.innerHTML = '<div class="empty-msg">Failed to load orders</div>';
    }
  };

  const init = () => {
    document.getElementById('shop-order-list')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('qty-btn')) {
        const index = parseInt(e.target.dataset.index);
        const delta = e.target.dataset.action === 'inc' ? 1 : -1;
        changeQty(index, delta);
      }
    });

    document.getElementById('shop-clear-btn')?.addEventListener('click', clearOrder);
    document.getElementById('shop-save-btn')?.addEventListener('click', saveOrder);

    loadHistory();
  };

  return { init, addItem, loadHistory };
})();
JS

# ---------- 4. js/shopOrdersApp.js ----------
cat > js/shopOrdersApp.js <<'JS'
document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('shop-menu-grid')) {
    await ShopMenuModule.init();
    ShopOrderModule.init();
  }
});
JS

# ---------- 5. css/shop-orders.css ----------
cat > css/shop-orders.css <<'CSS'
:root {
  --shop-primary: #0f3460;
  --shop-accent: #e94560;
}

.shop-container {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.shop-container .menu-section {
  flex: 2;
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  max-height: 85vh;
}

.shop-container .menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
}

.shop-menu-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  background: #fafafa;
}

.shop-menu-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: var(--shop-primary);
  background: #fff;
}

.shop-item-name { font-weight: bold; font-size: 1.02em; }
.shop-item-price { color: var(--shop-accent); font-weight: bold; margin-top: 6px; }

.shop-category-header {
  grid-column: 1 / -1;
  margin-top: 18px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--shop-primary);
  color: var(--shop-primary);
  font-weight: bold;
  letter-spacing: 0.5px;
}

.shop-container .order-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.shop-container .order-card,
.shop-container .history-card {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.shop-container .order-card { flex: 1; display: flex; flex-direction: column; }
.shop-container .history-card { flex: 1; overflow-y: auto; max-height: 42vh; }

.shop-container .order-card input {
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
  font-size: 0.95em;
}

#shop-order-list {
  list-style: none;
  padding: 0;
  margin: 10px 0;
  flex: 1;
  overflow-y: auto;
  max-height: 30vh;
}

#shop-order-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.item-controls { display: flex; align-items: center; gap: 8px; }

.qty-btn {
  background: #eee;
  border: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
  font-size: 1em;
}

.qty-btn:hover { background: #ddd; }

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.3em;
  font-weight: bold;
  margin: 15px 0;
  color: var(--shop-primary);
}

.btn {
  padding: 10px 14px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  width: 100%;
  margin-bottom: 8px;
  font-size: 0.95em;
}

.btn.primary { background: var(--shop-primary); color: white; }
.btn.primary:hover { background: #0a2540; }
.btn.secondary { background: #eaeaea; color: #333; }
.btn.secondary:hover { background: #dcdcdc; }

.history-item {
  font-size: 0.9em;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.history-total { color: var(--shop-accent); font-weight: bold; }

.empty-msg, .loading-msg {
  color: #999;
  font-style: italic;
  font-size: 0.9em;
  padding: 15px 0;
  text-align: center;
}

.main-nav {
  display: flex;
  gap: 15px;
  padding: 12px 24px;
  background: #0f3460;
}

.main-nav a {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
}

.main-nav a.active,
.main-nav a:hover {
  background: rgba(255, 255, 255, 0.15);
}
CSS

echo ""
echo "✅ Created:"
echo "  frontend/shop-orders.html"
echo "  frontend/js/shopMenu.js"
echo "  frontend/js/shopOrders.js"
echo "  frontend/js/shopOrdersApp.js"
echo "  frontend/css/shop-orders.css"
echo ""
const ShopSalesModule = (() => {
  const API_URL = 'http://localhost:3000/api/shop-orders';

  let allOrders = [];
  let filteredOrders = [];

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const fetchOrders = async () => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  };

  const computeSummary = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let today = 0, week = 0, month = 0, total = 0;
    let count = 0;

    allOrders.forEach((o) => {
      const t = parseFloat(o.total_price) || 0;
      const d = new Date(o.created_at);
      total += t;
      count += 1;
      if (d >= startOfDay) today += t;
      if (d >= startOfWeek) week += t;
      if (d >= startOfMonth) month += t;
    });

    document.getElementById('salesToday').innerText = `£${today.toFixed(2)}`;
    document.getElementById('salesWeek').innerText = `£${week.toFixed(2)}`;
    document.getElementById('salesMonth').innerText = `£${month.toFixed(2)}`;
    document.getElementById('salesCount').innerText = count;
    document.getElementById('salesAvg').innerText = count ? `£${(total / count).toFixed(2)}` : '£0.00';
  };

  const applyFilters = () => {
    const dateFilter = document.getElementById('shopSalesFilterDate').value;
    const customerFilter = document.getElementById('shopSalesFilterCustomer').value.trim().toLowerCase();

    filteredOrders = allOrders.filter((o) => {
      const d = new Date(o.created_at);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const orderDate = `${yyyy}-${mm}-${dd}`;

      if (dateFilter && orderDate !== dateFilter) return false;
      if (customerFilter) {
        const name = (o.customer_name || '').toLowerCase();
        if (!name.includes(customerFilter)) return false;
      }
      return true;
    });

    renderList();
  };

  const renderList = () => {
    const list = document.getElementById('shopSalesList');
    if (!list) return;

    if (!filteredOrders.length) {
      list.innerHTML = '<p class="loading">No orders found.</p>';
      return;
    }

    let html = `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: #667eea; color: white;">
              <th style="padding: 10px; text-align: left;">#ID</th>
              <th style="padding: 10px; text-align: left;">📅 Date</th>
              <th style="padding: 10px; text-align: left;">🕐 Time</th>
              <th style="padding: 10px; text-align: left;">👤 Customer</th>
              <th style="padding: 10px; text-align: left;">📦 Items</th>
              <th style="padding: 10px; text-align: right;">💰 Total</th>
              <th style="padding: 10px; text-align: left;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredOrders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]');
      const itemsSummary = items.map((i) => `${i.qty}× ${i.name}`).join(', ') || '—';
      const customer = o.customer_name ? escapeHtml(o.customer_name) : '<em style="color:#888;">Walk-in</em>';

      html += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px;"><strong>#${o.id}</strong></td>
          <td style="padding: 10px;">${formatDate(o.created_at)}</td>
          <td style="padding: 10px;">${formatTime(o.created_at)}</td>
          <td style="padding: 10px;">${customer}</td>
          <td style="padding: 10px; max-width: 320px; font-size: 0.85em; color: #555;">${escapeHtml(itemsSummary)}</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; color: #28a745;">£${parseFloat(o.total_price).toFixed(2)}</td>
          <td style="padding: 10px; white-space: nowrap;">
            <button data-edit="${o.id}" style="background:#ffc107; color:#333; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.8em; margin-right:4px;">✏️ Edit</button>
            <button data-delete="${o.id}" style="background:#dc3545; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.8em;">🗑️ Delete</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    list.innerHTML = html;

    // Bind edit/delete
    list.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.onclick = () => {
        const id = parseInt(btn.dataset.edit);
        // Jump to Shop Orders tab and load this order into cart
        const shopTabBtn = document.querySelector('.tab-btn[data-tab="shop-orders"]');
        if (shopTabBtn) shopTabBtn.click();
        // Wait for tab switch, then load order
        setTimeout(() => {
          if (typeof ShopOrderModule !== 'undefined' && ShopOrderModule.loadOrderForEdit) {
            ShopOrderModule.loadOrderForEdit(id);
          }
        }, 100);
      };
    });

    list.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.onclick = async () => {
        const id = parseInt(btn.dataset.delete);
        if (!confirm(`Delete order #${id}? This cannot be undone.`)) return;
        try {
          await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
          await load();
        } catch (err) {
          console.error('Delete error:', err);
          alert('Failed to delete order.');
        }
      };
    });
  };

  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  };

  const load = async () => {
    const list = document.getElementById('shopSalesList');
    if (!list) return;
    try {
      allOrders = await fetchOrders();
      filteredOrders = [...allOrders];
      computeSummary();
      applyFilters();
    } catch (err) {
      console.error('Load shop sales error:', err);
      list.innerHTML = '<p class="loading">Failed to load shop sales.</p>';
    }
  };

  const init = () => {
    document.getElementById('shopSalesRefreshBtn')?.addEventListener('click', load);
    document.getElementById('shopSalesFilterDate')?.addEventListener('change', applyFilters);
    document.getElementById('shopSalesFilterCustomer')?.addEventListener('input', applyFilters);
    document.getElementById('shopSalesClearFilterBtn')?.addEventListener('click', () => {
      document.getElementById('shopSalesFilterDate').value = '';
      document.getElementById('shopSalesFilterCustomer').value = '';
      applyFilters();
    });
  };

  return { init, load };
})();
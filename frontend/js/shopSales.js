const ShopSalesModule = (() => {
  const SHOP_SALES_API = "http://localhost:3000/api/shop-orders";

  let allOrders = [];
  let filteredOrders = [];
  let dateRange = { from: null, to: null };

  // ---------- Helpers ----------
  const toLocalDateStr = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const escapeHtml = (str) => {
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
  };

  // Monday as start of week
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getWeekEnd = (weekStart) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  };

  // ---------- Fetch ----------
  const fetchOrders = async () => {
    const res = await fetch(SHOP_SALES_API);
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
  };

  // ---------- Filters ----------
  const applyDateRange = (orders) => {
    if (!dateRange.from && !dateRange.to) return orders;
    return orders.filter((o) => {
      const orderDate = toLocalDateStr(new Date(o.created_at));
      if (dateRange.from && orderDate < dateRange.from) return false;
      if (dateRange.to && orderDate > dateRange.to) return false;
      return true;
    });
  };

  // ---------- Summary Cards ----------
  const computeSummary = () => {
    const now = new Date();
    const todayStr = toLocalDateStr(now);
    const startOfWeek = getWeekStart(now);
    const weekStr = toLocalDateStr(startOfWeek);
    const monthStr = toLocalDateStr(
      new Date(now.getFullYear(), now.getMonth(), 1),
    );

    let today = 0,
      week = 0,
      month = 0,
      total = 0;
    let count = 0;

    allOrders.forEach((o) => {
      const t = parseFloat(o.total_price) || 0;
      const orderDate = toLocalDateStr(new Date(o.created_at));

      total += t;
      count += 1;

      if (orderDate === todayStr) today += t;
      if (orderDate >= weekStr) week += t;
      if (orderDate >= monthStr) month += t;
    });

    document.getElementById("salesToday").innerText = `£${today.toFixed(2)}`;
    document.getElementById("salesWeek").innerText = `£${week.toFixed(2)}`;
    document.getElementById("salesMonth").innerText = `£${month.toFixed(2)}`;
    document.getElementById("salesCount").innerText = count;
    document.getElementById("salesAvg").innerText = count
      ? `£${(total / count).toFixed(2)}`
      : "£0.00";
  };

  // ---------- Daily Breakdown ----------
    const renderDailyBreakdown = (orders) => {
    const container = document.getElementById('shopDailyBreakdown');
    if (!container) return;

    const map = new Map();
    orders.forEach((o) => {
      const dayKey = toLocalDateStr(new Date(o.created_at));
      if (!map.has(dayKey)) map.set(dayKey, { key: dayKey, total: 0, count: 0, cash: 0, card: 0 });
      const b = map.get(dayKey);
      const t = parseFloat(o.total_price) || 0;
      b.total += t;
      b.count += 1;
      if ((o.payment_method || "cash") === "card") b.card += t;
      else b.cash += t;
    });

    const days = Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));

    if (!days.length) {
      container.innerHTML = '<p class="loading">No sales in this period.</p>';
      return;
    }

    const todayStr = toLocalDateStr(new Date());

    let html = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
          <thead>
            <tr style="background:#667eea; color:white;">
              <th style="padding:12px; text-align:left;">📅 Date</th>
              <th style="padding:12px; text-align:right;">📦 Orders</th>
              <th style="padding:12px; text-align:right;">💵 Cash</th>
              <th style="padding:12px; text-align:right;">💳 Card</th>
              <th style="padding:12px; text-align:right;">💰 Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    days.forEach((d) => {
      const isToday = d.key === todayStr;
      const badge = isToday ? ' <span style="background:#28a745;color:white;padding:2px 8px;border-radius:10px;font-size:0.7em;margin-left:6px;">TODAY</span>' : '';
      const rowStyle = isToday ? 'background:#e8f4ff; font-weight:600; border-bottom:1px solid #eee;' : 'border-bottom:1px solid #eee;';
      const [y, m, dd] = d.key.split('-');
      const readable = new Date(parseInt(y), parseInt(m) - 1, parseInt(dd)).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

      html += `
        <tr style="${rowStyle}">
          <td style="padding:12px;">${readable}${badge}</td>
          <td style="padding:12px; text-align:right;">${d.count}</td>
          <td style="padding:12px; text-align:right; color:#155724;">£${d.cash.toFixed(2)}</td>
          <td style="padding:12px; text-align:right; color:#004085;">£${d.card.toFixed(2)}</td>
          <td style="padding:12px; text-align:right; color:#28a745; font-weight:bold;">£${d.total.toFixed(2)}</td>
        </tr>
      `;
    });

    const totalCount = days.reduce((s, d) => s + d.count, 0);
    const totalCash = days.reduce((s, d) => s + d.cash, 0);
    const totalCard = days.reduce((s, d) => s + d.card, 0);
    const totalSum = days.reduce((s, d) => s + d.total, 0);

    html += `
          </tbody>
          <tfoot>
            <tr style="background:#0f3460; color:white; font-weight:bold;">
              <td style="padding:12px;">TOTAL</td>
              <td style="padding:12px; text-align:right;">${totalCount}</td>
              <td style="padding:12px; text-align:right;">£${totalCash.toFixed(2)}</td>
              <td style="padding:12px; text-align:right;">£${totalCard.toFixed(2)}</td>
              <td style="padding:12px; text-align:right;">£${totalSum.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    container.innerHTML = html;
  };

  // ---------- Weekly Breakdown ----------
    const renderWeeklyBreakdown = (orders) => {
    const container = document.getElementById('shopWeeklyBreakdown');
    if (!container) return;

    const map = new Map();
    orders.forEach((o) => {
      const orderDate = new Date(o.created_at);
      const weekStart = getWeekStart(orderDate);
      const key = toLocalDateStr(weekStart);
      if (!map.has(key)) map.set(key, { key, total: 0, count: 0, cash: 0, card: 0 });
      const b = map.get(key);
      const t = parseFloat(o.total_price) || 0;
      b.total += t;
      b.count += 1;
      if ((o.payment_method || "cash") === "card") b.card += t;
      else b.cash += t;
    });

    const weeks = Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));

    if (!weeks.length) {
      container.innerHTML = '<p class="loading">No sales in this period.</p>';
      return;
    }

    const currentWeekStart = toLocalDateStr(getWeekStart(new Date()));

    let html = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
          <thead>
            <tr style="background:#667eea; color:white;">
              <th style="padding:12px; text-align:left;">🗓️ Week</th>
              <th style="padding:12px; text-align:right;">📦 Orders</th>
              <th style="padding:12px; text-align:right;">💵 Cash</th>
              <th style="padding:12px; text-align:right;">💳 Card</th>
              <th style="padding:12px; text-align:right;">💰 Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    weeks.forEach((w) => {
      const [y, m, dd] = w.key.split('-');
      const start = new Date(parseInt(y), parseInt(m) - 1, parseInt(dd));
      const end = getWeekEnd(start);
      const isCurrent = w.key === currentWeekStart;
      const badge = isCurrent ? ' <span style="background:#28a745;color:white;padding:2px 8px;border-radius:10px;font-size:0.7em;margin-left:6px;">CURRENT</span>' : '';
      const rowStyle = isCurrent ? 'background:#e8f4ff; font-weight:600; border-bottom:1px solid #eee;' : 'border-bottom:1px solid #eee;';

      const startStr = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const endStr = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      html += `
        <tr style="${rowStyle}">
          <td style="padding:12px;">${startStr} – ${endStr}${badge}</td>
          <td style="padding:12px; text-align:right;">${w.count}</td>
          <td style="padding:12px; text-align:right; color:#155724;">£${w.cash.toFixed(2)}</td>
          <td style="padding:12px; text-align:right; color:#004085;">£${w.card.toFixed(2)}</td>
          <td style="padding:12px; text-align:right; color:#28a745; font-weight:bold;">£${w.total.toFixed(2)}</td>
        </tr>
      `;
    });

    const totalCount = weeks.reduce((s, w) => s + w.count, 0);
    const totalCash = weeks.reduce((s, w) => s + w.cash, 0);
    const totalCard = weeks.reduce((s, w) => s + w.card, 0);
    const totalSum = weeks.reduce((s, w) => s + w.total, 0);

    html += `
          </tbody>
          <tfoot>
            <tr style="background:#0f3460; color:white; font-weight:bold;">
              <td style="padding:12px;">TOTAL</td>
              <td style="padding:12px; text-align:right;">${totalCount}</td>
              <td style="padding:12px; text-align:right;">£${totalCash.toFixed(2)}</td>
              <td style="padding:12px; text-align:right;">£${totalCard.toFixed(2)}</td>
              <td style="padding:12px; text-align:right;">£${totalSum.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    container.innerHTML = html;
  };

  // ---------- Monthly Breakdown ----------
   const renderMonthlyBreakdown = (orders) => {
    const container = document.getElementById('shopMonthlyBreakdown');
    if (!container) return;

    const map = new Map();
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, { key, total: 0, count: 0, cash: 0, card: 0 });
      const b = map.get(key);
      const t = parseFloat(o.total_price) || 0;
      b.total += t;
      b.count += 1;
      if ((o.payment_method || "cash") === "card") b.card += t;
      else b.cash += t;
    });

    const months = Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));

    if (!months.length) {
      container.innerHTML = '<p class="loading">No sales in this period.</p>';
      return;
    }

    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let html = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
          <thead>
            <tr style="background:#667eea; color:white;">
              <th style="padding:12px; text-align:left;">📅 Month</th>
              <th style="padding:12px; text-align:right;">📦 Orders</th>
              <th style="padding:12px; text-align:right;">💵 Cash</th>
              <th style="padding:12px; text-align:right;">💳 Card</th>
              <th style="padding:12px; text-align:right;">💰 Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    months.forEach((m) => {
      const [y, mm] = m.key.split('-');
      const readable = new Date(parseInt(y), parseInt(mm) - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      const isCurrent = m.key === currentKey;
      const badge = isCurrent ? ' <span style="background:#28a745;color:white;padding:2px 8px;border-radius:10px;font-size:0.7em;margin-left:6px;">CURRENT</span>' : '';
      const rowStyle = isCurrent ? 'background:#e8f4ff; font-weight:600; border-bottom:1px solid #eee;' : 'border-bottom:1px solid #eee;';

      html += `
        <tr style="${rowStyle}">
          <td style="padding:12px;">${readable}${badge}</td>
          <td style="padding:12px; text-align:right;">${m.count}</td>
          <td style="padding:12px; text-align:right; color:#155724;">£${m.cash.toFixed(2)}</td>
          <td style="padding:12px; text-align:right; color:#004085;">£${m.card.toFixed(2)}</td>
          <td style="padding:12px; text-align:right; color:#28a745; font-weight:bold;">£${m.total.toFixed(2)}</td>
        </tr>
      `;
    });

    const totalCount = months.reduce((s, m) => s + m.count, 0);
    const totalCash = months.reduce((s, m) => s + m.cash, 0);
    const totalCard = months.reduce((s, m) => s + m.card, 0);
    const totalSum = months.reduce((s, m) => s + m.total, 0);

    html += `
          </tbody>
          <tfoot>
            <tr style="background:#0f3460; color:white; font-weight:bold;">
              <td style="padding:12px;">ALL TIME TOTAL</td>
              <td style="padding:12px; text-align:right;">${totalCount}</td>
              <td style="padding:12px; text-align:right;">£${totalCash.toFixed(2)}</td>
              <td style="padding:12px; text-align:right;">£${totalCard.toFixed(2)}</td>
              <td style="padding:12px; text-align:right;">£${totalSum.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    container.innerHTML = html;
  };

  // ---------- Order List (with edit/delete) ----------
  const applyOrderFilters = () => {
    const dateFilter = document.getElementById("shopSalesFilterDate").value;
    const customerFilter = document
      .getElementById("shopSalesFilterCustomer")
      .value.trim()
      .toLowerCase();

    filteredOrders = allOrders.filter((o) => {
      const orderDate = toLocalDateStr(new Date(o.created_at));
      if (dateFilter && orderDate !== dateFilter) return false;
      if (customerFilter) {
        const name = (o.customer_name || "").toLowerCase();
        if (!name.includes(customerFilter)) return false;
      }
      return true;
    });

    renderOrderList();
  };

  const renderOrderList = () => {
    const list = document.getElementById("shopSalesList");
    if (!list) return;

    if (!filteredOrders.length) {
      list.innerHTML = '<p class="loading">No orders found.</p>';
      return;
    }

    let html = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
          <thead>
            <tr style="background:#667eea; color:white;">
                            <th style="padding:10px; text-align:left;">🧾 Transaction</th>
              <th style="padding:10px; text-align:left;">📅 Date</th>
              <th style="padding:10px; text-align:left;">🕐 Time</th>
                            <th style="padding:10px; text-align:left;">👤 Customer</th>
              <th style="padding:10px; text-align:left;">💳 Payment</th>
              <th style="padding:10px; text-align:left;">📦 Items</th>
              <th style="padding:10px; text-align:right;">💰 Total</th>
              <th style="padding:10px; text-align:left;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredOrders.forEach((o) => {
      const items = Array.isArray(o.items)
        ? o.items
        : JSON.parse(o.items || "[]");
      const itemsSummary =
        items.map((i) => `${i.qty}× ${i.name}`).join(", ") || "—";
      const customer = o.customer_name
        ? escapeHtml(o.customer_name)
        : '<em style="color:#888;">Walk-in</em>';

      html += `
        <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;"><strong style="font-family:monospace;color:#0f3460;">${o.transaction_id || "#" + o.id}</strong></td>
          <td style="padding:10px;">${formatDate(o.created_at)}</td>
          <td style="padding:10px;">${formatTime(o.created_at)}</td>
                    <td style="padding:10px;">${customer}</td>
          <td style="padding:10px;">${
            (o.payment_method || "cash") === "card"
              ? '<span class="payment-badge card">💳 Card</span>'
              : '<span class="payment-badge cash">💵 Cash</span>'
          }</td>
          <td style="padding:10px; max-width:320px; font-size:0.85em; color:#555;">${escapeHtml(itemsSummary)}</td>
          <td style="padding:10px; text-align:right; font-weight:bold; color:#28a745;">£${parseFloat(o.total_price).toFixed(2)}</td>
          <td style="padding:10px; white-space:nowrap;">
            <button data-edit="${o.id}" style="background:#ffc107;color:#333;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:0.8em;margin-right:4px;">✏️ Edit</button>
            <button data-delete="${o.id}" style="background:#dc3545;color:white;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:0.8em;">🗑️ Delete</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    list.innerHTML = html;

    list.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.onclick = () => {
        const id = parseInt(btn.dataset.edit);
        const shopTabBtn = document.querySelector(
          '.tab-btn[data-tab="shop-orders"]',
        );
        if (shopTabBtn) shopTabBtn.click();
        setTimeout(() => {
          if (
            typeof ShopOrderModule !== "undefined" &&
            ShopOrderModule.loadOrderForEdit
          ) {
            ShopOrderModule.loadOrderForEdit(id, allOrders);
          }
        }, 100);
      };
    });

    list.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.onclick = async () => {
        const id = parseInt(btn.dataset.delete);
        if (!confirm(`Delete order #${id}? This cannot be undone.`)) return;
        try {
          await fetch(`${SHOP_SALES_API}/${id}`, { method: "DELETE" });
          await load();
        } catch (err) {
          console.error("Delete error:", err);
          alert("Failed to delete order.");
        }
      };
    });
  };

  // ---------- Load ----------
  const load = async () => {
    const list = document.getElementById("shopSalesList");
    if (!list) return;

    try {
      allOrders = await fetchOrders();
      filteredOrders = [...allOrders];

      computeSummary();

      const inRange = applyDateRange(allOrders);
      renderDailyBreakdown(inRange);
      renderWeeklyBreakdown(inRange);
      renderMonthlyBreakdown(inRange);

      applyOrderFilters();
    } catch (err) {
      console.error("Load shop sales error:", err);
      list.innerHTML = '<p class="loading">Failed to load shop sales.</p>';
    }
  };

  // ---------- Init ----------
  const init = () => {
    document
      .getElementById("shopSalesRefreshBtn")
      ?.addEventListener("click", load);
    document
      .getElementById("shopSalesFilterDate")
      ?.addEventListener("change", applyOrderFilters);
    document
      .getElementById("shopSalesFilterCustomer")
      ?.addEventListener("input", applyOrderFilters);
    document
      .getElementById("shopSalesClearFilterBtn")
      ?.addEventListener("click", () => {
        document.getElementById("shopSalesFilterDate").value = "";
        document.getElementById("shopSalesFilterCustomer").value = "";
        applyOrderFilters();
      });

    const updateRange = () => {
      dateRange.from =
        document.getElementById("breakdownFromDate").value || null;
      dateRange.to = document.getElementById("breakdownToDate").value || null;
      const inRange = applyDateRange(allOrders);
      renderDailyBreakdown(inRange);
      renderWeeklyBreakdown(inRange);
      renderMonthlyBreakdown(inRange);
    };

    document
      .getElementById("breakdownFromDate")
      ?.addEventListener("change", updateRange);
    document
      .getElementById("breakdownToDate")
      ?.addEventListener("change", updateRange);
    document
      .getElementById("breakdownClearBtn")
      ?.addEventListener("click", () => {
        document.getElementById("breakdownFromDate").value = "";
        document.getElementById("breakdownToDate").value = "";
        dateRange.from = null;
        dateRange.to = null;
        const inRange = applyDateRange(allOrders);
        renderDailyBreakdown(inRange);
        renderWeeklyBreakdown(inRange);
        renderMonthlyBreakdown(inRange);
      });
  };

  return { init, load };
})();

const ShopItemReportModule = (() => {
  const API_URL = "http://localhost:3000/api/shop-orders/reports/items";

  let lastData = [];

  const toDateStr = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getRangeForPeriod = (period) => {
    const now = new Date();
    const today = toDateStr(now);

    switch (period) {
      case "today":
        return { from: today, to: today };
      case "week": {
        const start = new Date(now);
        const day = start.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        return { from: toDateStr(start), to: today };
      }
      case "month": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: toDateStr(start), to: today };
      }
      case "all":
      default:
        return { from: null, to: null };
    }
  };

  const fetchReport = async (from, to) => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const url = params.toString() ? `${API_URL}?${params}` : API_URL;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch report");
    return res.json();
  };

  const renderSummary = (data) => {
    const container = document.getElementById("itemReportSummary");
    if (!container) return;

    const totalQty = data.reduce((s, r) => s + parseInt(r.qty_sold, 10), 0);
    const totalRevenue = data.reduce((s, r) => s + parseFloat(r.revenue), 0);
    const uniqueItems = data.length;

    container.innerHTML = `
      <div class="item-report-summary-card">
        <div class="label">Items Sold</div>
        <div class="value">${totalQty}</div>
      </div>
      <div class="item-report-summary-card" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
        <div class="label">Total Revenue</div>
        <div class="value">£${totalRevenue.toFixed(2)}</div>
      </div>
      <div class="item-report-summary-card" style="background: linear-gradient(135deg, #f39c12 0%, #e74c3c 100%);">
        <div class="label">Unique Items</div>
        <div class="value">${uniqueItems}</div>
      </div>
    `;
  };

  const renderTable = (data) => {
    const container = document.getElementById("itemReportContainer");
    if (!container) return;

    if (!data.length) {
      container.innerHTML = '<p class="loading">No sales in this period.</p>';
      return;
    }

    let html = `
      <div style="overflow-x:auto;">
        <table class="item-report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Category</th>
              <th class="right">Qty Sold</th>
              <th class="right">Revenue</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach((row, idx) => {
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${row.item_name}</strong></td>
          <td><span class="item-report-category-tag">${row.category || "—"}</span></td>
          <td class="right"><strong>${row.qty_sold}</strong></td>
          <td class="right" style="color:#28a745;font-weight:bold;">£${parseFloat(row.revenue).toFixed(2)}</td>
        </tr>
      `;
    });

    const totalQty = data.reduce((s, r) => s + parseInt(r.qty_sold, 10), 0);
    const totalRevenue = data.reduce((s, r) => s + parseFloat(r.revenue), 0);

    html += `
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">TOTAL</td>
              <td class="right">${totalQty}</td>
              <td class="right">£${totalRevenue.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    container.innerHTML = html;
  };

  const load = async (from, to) => {
    const container = document.getElementById("itemReportContainer");
    if (!container) return;

    try {
      const data = await fetchReport(from, to);
      lastData = data;
      renderSummary(data);
      renderTable(data);
    } catch (err) {
      console.error("Item report load error:", err);
      container.innerHTML = '<p class="loading">Failed to load report.</p>';
    }
  };

  const init = () => {
    // Period quick buttons
    document.querySelectorAll(".report-range-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".report-range-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const period = btn.dataset.range;
        const { from, to } = getRangeForPeriod(period);
        document.getElementById("itemReportFrom").value = from || "";
        document.getElementById("itemReportTo").value = to || "";
        load(from, to);
      });
    });

    // Apply custom date
    document.getElementById("itemReportApplyBtn")?.addEventListener("click", () => {
      const from = document.getElementById("itemReportFrom").value || null;
      const to = document.getElementById("itemReportTo").value || null;
      document.querySelectorAll(".report-range-btn").forEach((b) => b.classList.remove("active"));
      load(from, to);
    });
  };

  return { init, load, getRangeForPeriod };
})();
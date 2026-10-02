const ShopComponentReportModule = (() => {
  const API_URL = "http://localhost:3000/api/shop-orders/reports/components";

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
    if (!res.ok) throw new Error("Failed to fetch component report");
    return res.json();
  };

  const renderTable = (data) => {
    const container = document.getElementById("componentReportContainer");
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
              <th>Component</th>
              <th class="right">Qty Sold</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach((row, idx) => {
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td><strong style="text-transform:capitalize;">${row.component}</strong></td>
          <td class="right"><strong>${row.qty_sold}</strong></td>
        </tr>
      `;
    });

    const totalQty = data.reduce((s, r) => s + parseInt(r.qty_sold, 10), 0);

    html += `
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2">TOTAL COMPONENTS USED</td>
              <td class="right">${totalQty}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    container.innerHTML = html;
  };

  const load = async (from, to) => {
    const container = document.getElementById("componentReportContainer");
    if (!container) return;

    try {
      const data = await fetchReport(from, to);
      renderTable(data);
    } catch (err) {
      console.error("Component report load error:", err);
      container.innerHTML = '<p class="loading">Failed to load report.</p>';
    }
  };

  const init = () => {
    document.querySelectorAll(".component-range-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".component-range-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const { from, to } = getRangeForPeriod(btn.dataset.range);
        document.getElementById("componentFrom").value = from || "";
        document.getElementById("componentTo").value = to || "";
        load(from, to);
      });
    });

    document.getElementById("componentApplyBtn")?.addEventListener("click", () => {
      const from = document.getElementById("componentFrom").value || null;
      const to = document.getElementById("componentTo").value || null;
      document.querySelectorAll(".component-range-btn").forEach((b) => b.classList.remove("active"));
      load(from, to);
    });
  };

  return { init, load, getRangeForPeriod };
})();
const SalesPanelsModule = (() => {
  const init = () => {
    const navItems = document.querySelectorAll(".sales-nav-item");
    const panels = document.querySelectorAll(".sales-panel");

    if (!navItems.length) return;

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const target = item.dataset.salesPanel;

        // Deactivate all
        navItems.forEach((n) => n.classList.remove("active"));
        panels.forEach((p) => p.classList.remove("active"));

        // Activate clicked
        item.classList.add("active");
        const panel = document.querySelector(`.sales-panel[data-sales-content="${target}"]`);
        if (panel) panel.classList.add("active");

        // Lazy-load data on first open
        lazyLoad(target);
      });
    });

    console.log("✅ Sales panels initialized");
  };

  const lazyLoad = (panelKey) => {
    // Summary — no load needed, computed by ShopSalesModule
    // Daily / Weekly / Monthly — all driven by ShopSalesModule.load()
    // Item Report — loaded by ShopItemReportModule.load()
    // All Orders — driven by ShopSalesModule.load()
    if (panelKey === "item-report") {
      if (typeof ShopItemReportModule !== "undefined") {
        const range = ShopItemReportModule.getRangeForPeriod("month");
        document.getElementById("itemReportFrom").value = range.from || "";
        document.getElementById("itemReportTo").value = range.to || "";
        ShopItemReportModule.load(range.from, range.to);
      }
    }
    if (panelKey === "components") {
      if (typeof ShopComponentReportModule !== "undefined") {
        const range = ShopComponentReportModule.getRangeForPeriod("month");
        document.getElementById("componentFrom").value = range.from || "";
        document.getElementById("componentTo").value = range.to || "";
        ShopComponentReportModule.load(range.from, range.to);
      }
    }

  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  SalesPanelsModule.init();
});
// ============================================
// MAIN APPLICATION - START
// ============================================

console.log("🚀 App module loaded...");

function startApp() {
  console.log("✅ Starting application...");

    if (typeof ShopItemReportModule !== "undefined") {
    ShopItemReportModule.init();
    console.log("✅ Item report initialized");
  }

  // Initialize modules
  if (typeof initEarnings === "function") {
    initEarnings();
    console.log("✅ Earnings initialized");
  }

  if (typeof initExpenses === "function") {
    initExpenses();
    console.log("✅ Expenses initialized");
  }

  if (typeof initInventory === "function") {
    initInventory();
    console.log("✅ Inventory initialized");
  }

  // Load initial data
  if (typeof loadBalance === "function") {
    loadBalance();
    console.log("✅ Balance loaded");
  }

  if (typeof loadStatistics === "function") {
    loadStatistics();
    console.log("✅ Statistics loaded");
  }

  if (typeof loadPeriodSummary === "function") {
    loadPeriodSummary();
    console.log("✅ Period summary loaded");
  }

  if (typeof loadAudit === "function") {
    loadAudit();
    console.log("✅ Audit loaded");
  }

    if (typeof ShopComponentReportModule !== "undefined") {
    ShopComponentReportModule.init();
  }

  // Initialize tabs + dropdown navigation (safe to call once)
  if (typeof bootstrapNav === "function") {
    bootstrapNav();
    console.log("✅ Navigation initialized");
  } else if (typeof initTabs === "function") {
    initTabs();
    console.log("✅ Tabs initialized (fallback)");
  }

  console.log("🚀 Application ready!");
}

window.startApp = startApp;

// Run startApp only after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
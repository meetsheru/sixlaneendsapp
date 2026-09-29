document.addEventListener("DOMContentLoaded", async () => {
  // If Shop Orders is the active tab on load, initialize it now
  const shopTab = document.getElementById("tab-shop-orders");
  if (shopTab && shopTab.classList.contains("active")) {
    if (typeof ShopMenuModule !== "undefined") {
      await ShopMenuModule.init();
    }
    if (typeof ShopOrderModule !== "undefined") {
      ShopOrderModule.init();
    }
  }

  // Always init Shop Sales module (filters, buttons)
  if (typeof ShopSalesModule !== "undefined") {
    ShopSalesModule.init();
  }
});
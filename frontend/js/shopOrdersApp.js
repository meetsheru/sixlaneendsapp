document.addEventListener('DOMContentLoaded', async () => {
  // Init shop order tab (menu, cart)
  if (document.getElementById('shop-menu-grid')) {
    await ShopMenuModule.init();
    ShopOrderModule.init();
  }
  // Init shop sales module (filters, buttons)
  if (typeof ShopSalesModule !== 'undefined') {
    ShopSalesModule.init();
  }
});
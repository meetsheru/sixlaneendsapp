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

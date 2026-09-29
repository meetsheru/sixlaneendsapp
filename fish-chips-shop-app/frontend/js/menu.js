const MenuModule = (() => {
    const menuData = [
        { category: 'MAINS', name: 'Special Fish & Chips', price: 10.00 },
        { category: 'MAINS', name: 'Fish & Chips', price: 8.00 },
        { category: 'MAINS', name: 'Special Fish', price: 7.00 },
        { category: 'MAINS', name: 'Fish (Regular)', price: 5.00 },
        { category: 'MAINS', name: 'Chips', price: 3.00 },
        { category: 'MAINS', name: 'Fish Cakes', price: 3.00 },
        { category: 'MAINS', name: 'Scallops', price: 0.70 },
        { category: 'MAINS', name: 'Jumbo Sausage', price: 1.50 },
        { category: 'BUTTY', name: 'Fish & Chip Butty', price: 7.50 },
        { category: 'BUTTY', name: 'Fish Butty', price: 6.00 },
        { category: 'BUTTY', name: 'Cake Butty', price: 4.00 },
        { category: 'BUTTY', name: 'Chip Butty', price: 3.50 },
        { category: 'BUTTY', name: 'Sausage Butty', price: 2.50 },
        { category: 'KIDS MENU', name: 'Fish & Chips', price: 5.00 },
        { category: 'KIDS MENU', name: 'Fish Nuggets & Chips', price: 4.50 },
        { category: 'KIDS MENU', name: 'Chicken Nuggets & Chips', price: 4.50 },
        { category: 'KIDS MENU', name: 'Sausage & Chips', price: 2.80 },
        { category: 'SIDES', name: 'Peas (Small)', price: 1.20 },
        { category: 'SIDES', name: 'Peas (Large)', price: 1.80 },
        { category: 'SIDES', name: 'Chip Shop Curry (Small)', price: 1.20 },
        { category: 'SIDES', name: 'Chip Shop Curry (Large)', price: 1.80 },
        { category: 'SIDES', name: 'Irish Curry (Small)', price: 1.20 },
        { category: 'SIDES', name: 'Irish Curry (Large)', price: 1.80 },
        { category: 'SIDES', name: 'Gravy (Small)', price: 1.20 },
        { category: 'SIDES', name: 'Gravy (Large)', price: 1.80 },
        { category: 'BURGERS', name: 'Cheese Burger & Chips', price: 5.00 },
        { category: 'BURGERS', name: 'Chicken Burger & Chips', price: 5.00 }
    ];

    const renderMenu = () => {
        const grid = document.getElementById('menu-grid');
        let currentCategory = '';

        menuData.forEach(item => {
            if (item.category !== currentCategory) {
                currentCategory = item.category;
                const header = document.createElement('div');
                header.className = 'category-header';
                header.innerText = currentCategory;
                grid.appendChild(header);
            }

            const div = document.createElement('div');
            div.className = 'menu-item';
            div.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-price">£${item.price.toFixed(2)}</div>
            `;
            // Call OrderModule when clicked
            div.onclick = () => OrderModule.addItem(item);
            grid.appendChild(div);
        });
    };

    return { renderMenu };
})();
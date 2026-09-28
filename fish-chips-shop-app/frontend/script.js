const API_URL = 'http://localhost:3000/api/orders';

// Full Menu Data from Image
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

let currentOrder = [];
let editingOrderId = null; // If set, we are editing an existing order

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
    loadHistory();
});

// --- Menu Rendering ---

function renderMenu() {
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
        div.onclick = () => addToOrder(item);
        grid.appendChild(div);
    });
}

// --- Order Logic ---

function addToOrder(item) {
    // Check if item already exists
    const existingItem = currentOrder.find(i => i.name === item.name);
    
    if (existingItem) {
        existingItem.qty++;
    } else {
        currentOrder.push({ ...item, qty: 1 });
    }
    
    updateOrderUI();
}

function changeQty(index, delta) {
    currentOrder[index].qty += delta;
    if (currentOrder[index].qty <= 0) {
        currentOrder.splice(index, 1);
    }
    updateOrderUI();
}

function updateOrderUI() {
    const list = document.getElementById('order-list');
    const totalEl = document.getElementById('total-price');
    const saveBtn = document.getElementById('save-btn');
    
    list.innerHTML = '';
    let total = 0;

    if (currentOrder.length === 0) {
        list.innerHTML = '<li class="empty-msg">No items selected</li>';
        saveBtn.innerText = "Place Order";
        editingOrderId = null;
    } else {
        currentOrder.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <div>${item.name}</div>
                    <div style="font-size:0.8em; color:#666">£${item.price.toFixed(2)}</div>
                </div>
                <div class="item-controls">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
            `;
            list.appendChild(li);
            total += item.price * item.qty;
        });
        
        if (editingOrderId) {
            saveBtn.innerText = "Update Order";
        } else {
            saveBtn.innerText = "Place Order";
        }
    }

    totalEl.innerText = `£${total.toFixed(2)}`;
}

function clearOrder() {
    if(confirm("Clear current order?")) {
        currentOrder = [];
        editingOrderId = null;
        updateOrderUI();
    }
}

// --- API Interaction ---

async function submitOrder() {
    if (currentOrder.length === 0) return alert("Order is empty");

    const total = currentOrder.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const payload = { items: currentOrder, total: total };

    try {
        let response;
        if (editingOrderId) {
            // Update existing
            response = await fetch(`${API_URL}/${editingOrderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Create new
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (response.ok) {
            alert(editingOrderId ? "Order Updated!" : "Order Placed Successfully!");
            currentOrder = [];
            editingOrderId = null;
            updateOrderUI();
            loadHistory();
        } else {
            alert("Error processing order");
        }
    } catch (err) {
        console.error(err);
        alert("Could not connect to server. Is Docker running?");
    }
}

async function loadHistory() {
    const historyList = document.getElementById('history-list');
    try {
        const response = await fetch(API_URL);
        const orders = await response.json();
        
        historyList.innerHTML = '';
        if (orders.length === 0) {
            historyList.innerHTML = '<div class="empty-msg">No past orders</div>';
            return;
        }

        orders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'history-item';
            const date = new Date(order.created_at).toLocaleString();
            
            // Create a string summary of items
            const itemSummary = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <strong>Order #${order.id}</strong>
                    <span>${date}</span>
                </div>
                <div style="font-size:0.9em; margin: 5px 0;">${itemSummary}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="history-total">£${parseFloat(order.total_price).toFixed(2)}</span>
                    <button class="btn secondary" style="width:auto; padding:4px 8px; font-size:0.8em;" onclick="editOrder(${order.id})">Edit</button>
                </div>
            `;
            historyList.appendChild(div);
        });

    } catch (err) {
        console.error("Error loading history", err);
    }
}

// Load specific order into the current order area for editing
async function editOrder(id) {
    try {
        const response = await fetch(API_URL);
        const orders = await response.json();
        const orderToEdit = orders.find(o => o.id === id);

        if (orderToEdit) {
            // Ensure items are parsed if they come as string (pg sometimes returns JSONB as object, but just in case)
            let items = orderToEdit.items;
            if (typeof items === 'string') items = JSON.parse(items);
            
            currentOrder = items;
            editingOrderId = id;
            updateOrderUI();
            window.scrollTo(0, 0); // Scroll to top to see order
        }
    } catch (err) {
        console.error(err);
    }
}

// Event Listeners
document.getElementById('clear-btn').addEventListener('click', clearOrder);
document.getElementById('save-btn').addEventListener('click', submitOrder);
const OrderModule = (() => {
    let currentOrder = [];
    let editingOrderId = null;

    const getOrderState = () => ({ currentOrder, editingOrderId });

    const addItem = (item) => {
        const existingItem = currentOrder.find(i => i.name === item.name);
        if (existingItem) {
            existingItem.qty++;
        } else {
            currentOrder.push({ ...item, qty: 1 });
        }
        updateUI();
    };

    const changeQty = (index, delta) => {
        currentOrder[index].qty += delta;
        if (currentOrder[index].qty <= 0) {
            currentOrder.splice(index, 1);
        }
        updateUI();
    };

    const clearOrder = () => {
        if(confirm("Clear current order?")) {
            currentOrder = [];
            editingOrderId = null;
            updateUI();
        }
    };

    const loadOrderForEdit = (id, items) => {
        currentOrder = items;
        editingOrderId = id;
        updateUI();
        window.scrollTo(0, 0);
    };

    const resetOrder = () => {
        currentOrder = [];
        editingOrderId = null;
        updateUI();
    };

    const getTotal = () => {
        return currentOrder.reduce((sum, item) => sum + (item.price * item.qty), 0);
    };

    const updateUI = () => {
        const list = document.getElementById('order-list');
        const totalEl = document.getElementById('total-price');
        const saveBtn = document.getElementById('save-btn');
        
        list.innerHTML = '';

        if (currentOrder.length === 0) {
            list.innerHTML = '<li class="empty-msg">No items selected</li>';
            saveBtn.innerText = "Place Order";
        } else {
            currentOrder.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <div>${item.name}</div>
                        <div style="font-size:0.8em; color:#666">£${item.price.toFixed(2)}</div>
                    </div>
                    <div class="item-controls">
                        <button class="qty-btn" data-action="dec" data-index="${index}">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" data-action="inc" data-index="${index}">+</button>
                    </div>
                `;
                list.appendChild(li);
            });
            
            saveBtn.innerText = editingOrderId ? "Update Order" : "Place Order";
        }

        totalEl.innerText = `£${getTotal().toFixed(2)}`;
    };

    // Event Delegation for +/- buttons
    document.getElementById('order-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('qty-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            const action = e.target.getAttribute('data-action');
            changeQty(index, action === 'inc' ? 1 : -1);
        }
    });

    document.getElementById('clear-btn').addEventListener('click', clearOrder);

    return { 
        addItem, 
        getOrderState, 
        getTotal, 
        resetOrder, 
        loadOrderForEdit 
    };
})();
const App = (() => {
    
    const init = () => {
        MenuModule.renderMenu();
        loadHistory();
        attachEventListeners();
    };

    const attachEventListeners = () => {
        document.getElementById('save-btn').addEventListener('click', handleSaveOrder);
    };

    const handleSaveOrder = async () => {
        const { currentOrder, editingOrderId } = OrderModule.getOrderState();
        
        if (currentOrder.length === 0) return alert("Order is empty");

        const total = OrderModule.getTotal();
        const payload = { items: currentOrder, total: total };

        try {
            if (editingOrderId) {
                await ApiService.updateOrder(editingOrderId, payload);
                alert("Order Updated Successfully!");
            } else {
                await ApiService.createOrder(payload);
                alert("Order Placed Successfully!");
            }
            OrderModule.resetOrder();
            loadHistory();
        } catch (err) {
            console.error(err);
            alert("Could not connect to server. Is Docker running?");
        }
    };

    const loadHistory = async () => {
        const historyList = document.getElementById('history-list');
        try {
            const orders = await ApiService.getOrders();
            
            historyList.innerHTML = '';
            if (orders.length === 0) {
                historyList.innerHTML = '<div class="empty-msg">No past orders</div>';
                return;
            }

            orders.forEach(order => {
                const div = document.createElement('div');
                div.className = 'history-item';
                const date = new Date(order.created_at).toLocaleString();
                const itemSummary = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');

                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <strong>Order #${order.id}</strong>
                        <span>${date}</span>
                    </div>
                    <div style="font-size:0.9em; margin: 5px 0;">${itemSummary}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="history-total">£${parseFloat(order.total_price).toFixed(2)}</span>
                        <button class="btn secondary" style="width:auto; padding:4px 8px; font-size:0.8em;" data-id="${order.id}">Edit</button>
                    </div>
                `;
                historyList.appendChild(div);
            });

            // Attach event listeners for Edit buttons
            document.querySelectorAll('#history-list button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    const orderToEdit = orders.find(o => o.id === id);
                    if (orderToEdit) {
                        let items = orderToEdit.items;
                        if (typeof items === 'string') items = JSON.parse(items); // Safety check
                        OrderModule.loadOrderForEdit(id, items);
                    }
                });
            });

        } catch (err) {
            console.error("Error loading history", err);
        }
    };

    return { init };
})();

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
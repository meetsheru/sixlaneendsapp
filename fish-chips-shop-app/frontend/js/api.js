const API_URL = 'http://localhost:3001/api/orders';

const ApiService = {
    async getOrders() {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch orders');
        return response.json();
    },

    async createOrder(orderData) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        if (!response.ok) throw new Error('Failed to create order');
        return response.json();
    },

    async updateOrder(id, orderData) {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        if (!response.ok) throw new Error('Failed to update order');
        return response.json();
    }
};
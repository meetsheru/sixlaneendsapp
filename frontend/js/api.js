// API Service
const API_URL = 'http://localhost:3000/api';

// Generic fetch function
async function apiFetch(endpoint, options = {}) {
    const url = API_URL + endpoint;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    // If body is FormData, don't set Content-Type (browser will set it with boundary)
    if (options.body && options.body instanceof FormData) {
        delete defaultOptions.headers['Content-Type'];
    }
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, mergedOptions);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || error.message || 'API request failed');
        }
        return await response.json();
    } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
    }
}

// Earnings API
const EarningsAPI = {
    getAll: (date = null) => {
        const url = date ? '/earnings?date=' + date : '/earnings';
        return apiFetch(url);
    },
    getByDate: (date) => apiFetch('/earnings/' + date),
    save: (data) => apiFetch('/earnings', { method: 'POST', body: JSON.stringify(data) }),
    delete: (date, time) => apiFetch('/earnings/' + date + '/' + time, { method: 'DELETE' })
};

// Expenses API
const ExpensesAPI = {
    getAll: (date = null) => {
        const url = date ? '/expenses?date=' + date : '/expenses';
        return apiFetch(url);
    },
    save: (data) => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => apiFetch('/expenses/' + id, { method: 'DELETE' })
};

// Inventory API
const InventoryAPI = {
    getAll: (date = null, category = null) => {
        let url = '/inventory';
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (category) params.append('category', category);
        if (params.toString()) url += '?' + params.toString();
        return apiFetch(url);
    },
    getStock: (category = null) => {
        let url = '/inventory/stock';
        if (category) url += '?category=' + category;
        return apiFetch(url);
    },
    save: (formData) => apiFetch('/inventory', { method: 'POST', body: formData }),
    delete: (id) => apiFetch('/inventory/' + id, { method: 'DELETE' })
};

// Balance API
const BalanceAPI = {
    get: () => apiFetch('/balance')
};

// Statistics API
const StatisticsAPI = {
    get: () => apiFetch('/statistics')
};

// Audit API
const AuditAPI = {
    getAll: () => apiFetch('/audit'),
    getInventory: () => apiFetch('/audit/inventory'),
    getByEntry: (entryId) => apiFetch('/audit/' + entryId)
};

// Export for global use
window.API = {
    EarningsAPI,
    ExpensesAPI,
    InventoryAPI,
    BalanceAPI,
    StatisticsAPI,
    AuditAPI,
    apiFetch
};
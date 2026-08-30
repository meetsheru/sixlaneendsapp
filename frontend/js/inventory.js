// ============================================
// INVENTORY MODULE
// ============================================

// DOM Elements
const inventoryForm = document.getElementById('inventoryForm');
const inventoryDateInput = document.getElementById('inventoryDateInput');
const inventoryItemInput = document.getElementById('inventoryItemInput');
const inventoryQuantityInput = document.getElementById('inventoryQuantityInput');
const inventoryUnitInput = document.getElementById('inventoryUnitInput');
const inventoryCostPerUnit = document.getElementById('inventoryCostPerUnit');
const inventoryTotalCost = document.getElementById('inventoryTotalCost');
const inventorySupplierInput = document.getElementById('inventorySupplierInput');
const inventoryCategoryInput = document.getElementById('inventoryCategoryInput');
const inventoryNotesInput = document.getElementById('inventoryNotesInput');
const inventoryReceiptInput = document.getElementById('inventoryReceiptInput');
const inventoryFilterDate = document.getElementById('inventoryFilterDate');
const inventoryFilterCategory = document.getElementById('inventoryFilterCategory');
const inventoryClearFilterBtn = document.getElementById('inventoryClearFilterBtn');
const inventoryList = document.getElementById('inventoryList');
const stockList = document.getElementById('stockList');
const inventoryMessageContainer = document.getElementById('inventoryMessageContainer');

// Initialize
function initInventory() {
    console.log('📦 Initializing Inventory...');

    if (inventoryDateInput) {
        inventoryDateInput.value = Utils.getToday();
    }

    // Auto-calculate total cost
    if (inventoryQuantityInput && inventoryCostPerUnit) {
        inventoryQuantityInput.addEventListener('input', calculateTotalCost);
        inventoryCostPerUnit.addEventListener('input', calculateTotalCost);
    }

    // Form submit
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', handleInventorySubmit);
    }

    // Filters
    if (inventoryFilterDate) {
        inventoryFilterDate.addEventListener('change', loadInventory);
    }
    if (inventoryFilterCategory) {
        inventoryFilterCategory.addEventListener('change', loadInventory);
    }
    if (inventoryClearFilterBtn) {
        inventoryClearFilterBtn.addEventListener('click', function() {
            if (inventoryFilterDate) inventoryFilterDate.value = '';
            if (inventoryFilterCategory) inventoryFilterCategory.value = '';
            loadInventory();
        });
    }

    loadInventory();
    loadStock();
}

// Calculate total cost
function calculateTotalCost() {
    const qty = parseFloat(inventoryQuantityInput.value) || 0;
    const cost = parseFloat(inventoryCostPerUnit.value) || 0;
    if (inventoryTotalCost) {
        inventoryTotalCost.value = (qty * cost).toFixed(2);
    }
}

// Handle inventory submit
async function handleInventorySubmit(e) {
    e.preventDefault();
    console.log('📦 Inventory form submitted!');

    const formData = new FormData();
    formData.append('date', inventoryDateInput.value);
    formData.append('item_name', inventoryItemInput.value);
    formData.append('quantity', inventoryQuantityInput.value);
    formData.append('unit', inventoryUnitInput.value);
    formData.append('cost_per_unit', inventoryCostPerUnit.value);
    formData.append('total_cost', inventoryTotalCost.value);
    formData.append('supplier', inventorySupplierInput.value || '');
    formData.append('category', inventoryCategoryInput.value || '');
    formData.append('notes', inventoryNotesInput.value || '');

    if (inventoryReceiptInput && inventoryReceiptInput.files[0]) {
        formData.append('receipt', inventoryReceiptInput.files[0]);
    }

    try {
        const response = await fetch(API_URL + '/inventory', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Server error');
        }

        const result = await response.json();
        console.log('✅ Inventory saved:', result);

        Utils.showMessage(inventoryMessageContainer, '✅ Purchase added: ' + result.purchase.item_name + ' (' + result.purchase.quantity + ' ' + result.purchase.unit + ')', 'success');

        inventoryForm.reset();
        if (inventoryDateInput) inventoryDateInput.value = Utils.getToday();
        if (inventoryReceiptInput) inventoryReceiptInput.value = '';

        loadInventory();
        loadStock();

    } catch (error) {
        console.error('❌ Error:', error);
        Utils.showMessage(inventoryMessageContainer, '❌ ' + error.message, 'error');
    }
}

// Load inventory
async function loadInventory() {
    console.log('📥 Loading inventory...');
    const list = inventoryList;
    if (!list) return;

    try {
        let url = API_URL + '/inventory';
        const params = new URLSearchParams();
        if (inventoryFilterDate && inventoryFilterDate.value) {
            params.append('date', inventoryFilterDate.value);
        }
        if (inventoryFilterCategory && inventoryFilterCategory.value) {
            params.append('category', inventoryFilterCategory.value);
        }
        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        const inventory = await response.json();
        console.log('📥 Received inventory:', inventory.length, 'items');
        displayInventory(inventory);
    } catch (error) {
        console.error('❌ Error loading inventory:', error);
        list.innerHTML = '<p class="error">❌ Failed to load inventory: ' + error.message + '</p>';
    }
}

// Display inventory
function displayInventory(inventory) {
    const list = inventoryList;
    if (!list) return;

    if (!inventory || inventory.length === 0) {
        list.innerHTML = '<p class="no-data">📭 No inventory purchases found</p>';
        return;
    }

    let html = '';
    let currentDate = '';
    let dailyTotal = 0;

    for (let i = 0; i < inventory.length; i++) {
        const item = inventory[i];
        const formattedDate = Utils.formatDate(item.date);
        const dateString = item.date.split('T')[0];

        if (currentDate !== dateString) {
            if (currentDate !== '') {
                html += '<div style="background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; text-align: right; color: #6f42c1;">Daily Total: ' + Utils.formatCurrency(dailyTotal) + '</div>';
                dailyTotal = 0;
            }
            currentDate = dateString;
            html += '<div style="background: #6f42c1; color: white; padding: 10px; border-radius: 5px; margin: 15px 0 10px 0; font-weight: bold; font-size: 1.1rem;">📅 ' + formattedDate + '</div>';
        }

        dailyTotal += parseFloat(item.total_cost) || 0;

        html += '<div style="background: #f8f9fa; padding: 15px 20px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #6f42c1;">';
        html += '<div>';
        html += '<div style="font-weight: 600; color: #6f42c1;">📦 ' + item.item_name + '</div>';
        html += '<div style="font-size: 0.9rem; color: #666;">' + item.quantity + ' ' + item.unit + ' × £' + parseFloat(item.cost_per_unit).toFixed(2) + ' = <strong>' + Utils.formatCurrency(item.total_cost) + '</strong></div>';
        if (item.supplier) {
            html += '<div style="font-size: 0.85rem; color: #666;">🏢 ' + item.supplier + '</div>';
        }
        if (item.category) {
            html += '<div style="font-size: 0.85rem; color: #666;">📂 ' + item.category + '</div>';
        }
        if (item.notes) {
            html += '<div style="font-size: 0.85rem; color: #666;">📝 ' + item.notes + '</div>';
        }
        if (item.receipt_filename) {
            html += '<div style="font-size: 0.85rem; color: #6f42c1;">📎 <a href="http://localhost:3000/uploads/receipts/' + item.receipt_filename + '" target="_blank" style="color: #6f42c1; text-decoration: underline;">View Receipt</a></div>';
        }
        html += '</div>';
        html += '</div>';
    }

    if (currentDate !== '') {
        html += '<div style="background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; text-align: right; color: #6f42c1;">Daily Total: ' + Utils.formatCurrency(dailyTotal) + '</div>';
    }

    list.innerHTML = html;
    console.log('✅ Inventory display complete!');
}

// Load stock
async function loadStock() {
    console.log('📊 Loading stock...');
    const list = stockList;
    if (!list) return;

    try {
        const response = await fetch(API_URL + '/inventory/stock');
        const stock = await response.json();
        console.log('📊 Received stock:', stock.length, 'items');
        displayStock(stock);
    } catch (error) {
        console.error('❌ Error loading stock:', error);
        list.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #dc3545;">❌ Failed to load stock</td></tr>';
    }
}

// Display stock
function displayStock(stock) {
    const list = stockList;
    if (!list) return;

    if (!stock || stock.length === 0) {
        list.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">📭 No stock items found</td></tr>';
        return;
    }

    let html = '';
    for (let i = 0; i < stock.length; i++) {
        const item = stock[i];
        const qty = parseFloat(item.quantity) || 0;
        const cost = parseFloat(item.cost_per_unit) || 0;
        const totalValue = qty * cost;

        html += '<tr>';
        html += '<td style="padding: 10px; font-weight: 500;">' + item.item_name + '</td>';
        html += '<td style="padding: 10px; font-weight: 600; color: #6f42c1;">' + qty.toFixed(2) + '</td>';
        html += '<td style="padding: 10px;">' + item.unit + '</td>';
        html += '<td style="padding: 10px;">£' + cost.toFixed(2) + '</td>';
        html += '<td style="padding: 10px; font-weight: 600; color: #28a745;">£' + totalValue.toFixed(2) + '</td>';
        html += '<td style="padding: 10px;">' + (item.category || 'Uncategorized') + '</td>';
        html += '<td style="padding: 10px; font-size: 0.85rem; color: #666;">' + new Date(item.last_updated).toLocaleString() + '</td>';
        html += '<td style="padding: 10px;">';
        html += '<button onclick="openViewPurchaseModal(\'' + item.item_name.replace(/'/g, "\\'") + '\')" style="background: #6f42c1; color: white; padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">👁️ View</button>';
        html += '</td>';
        html += '</tr>';
    }

    list.innerHTML = html;
    console.log('✅ Stock display complete!');
}

// Open view purchase modal
window.openViewPurchaseModal = async function(itemName) {
    console.log('👁️ Viewing item:', itemName);

    const modal = document.getElementById('editPurchaseModal');
    if (!modal) {
        console.error('❌ Modal element not found!');
        return;
    }

    modal.style.display = 'flex';
    modal.classList.add('show');

    // Reset to view mode
    isEditMode = false;
    const viewMode = document.getElementById('editPurchaseViewMode');
    const editMode = document.getElementById('editPurchaseEditMode');
    const toggleBtn = document.getElementById('editToggleBtn');
    const title = document.getElementById('editModalTitle');

    if (viewMode) viewMode.style.display = 'block';
    if (editMode) editMode.style.display = 'none';
    if (toggleBtn) {
        toggleBtn.textContent = '✏️ Edit';
        toggleBtn.style.background = '#ffc107';
        toggleBtn.style.color = '#333';
    }
    if (title) title.textContent = '📦 ' + itemName + ' - Purchase Details';

    try {
        const response = await fetch(API_URL + '/inventory/item/' + encodeURIComponent(itemName));
        const purchases = await response.json();

        if (!purchases || purchases.length === 0) {
            document.getElementById('viewPurchaseDate').textContent = 'No purchases found';
            document.getElementById('viewPurchaseItem').textContent = itemName;
            document.getElementById('viewPurchaseQuantity').textContent = '-';
            document.getElementById('viewPurchaseUnit').textContent = '-';
            document.getElementById('viewPurchaseCost').textContent = '-';
            document.getElementById('viewPurchaseTotal').textContent = '-';
            document.getElementById('viewPurchaseSupplier').textContent = '-';
            document.getElementById('viewPurchaseCategory').textContent = '-';
            document.getElementById('viewPurchaseNotes').textContent = 'No purchase history';
            document.getElementById('viewPurchaseReceipt').textContent = '-';
            document.getElementById('viewReceiptImage').style.display = 'none';
            return;
        }

        const purchase = purchases[0];
        console.log('📊 Loading purchase for view:', purchase);

        document.getElementById('viewPurchaseDate').textContent = new Date(purchase.date).toLocaleDateString('en-GB');
        document.getElementById('viewPurchaseTime').textContent = purchase.time;
        document.getElementById('viewPurchaseItem').textContent = purchase.item_name;
        document.getElementById('viewPurchaseQuantity').textContent = purchase.quantity;
        document.getElementById('viewPurchaseUnit').textContent = purchase.unit;
        document.getElementById('viewPurchaseCost').textContent = '£' + parseFloat(purchase.cost_per_unit).toFixed(2);
        document.getElementById('viewPurchaseTotal').textContent = '£' + parseFloat(purchase.total_cost).toFixed(2);
        document.getElementById('viewPurchaseSupplier').textContent = purchase.supplier || 'N/A';
        document.getElementById('viewPurchaseCategory').textContent = purchase.category || 'Uncategorized';
        document.getElementById('viewPurchaseNotes').textContent = purchase.notes || 'No notes';

        if (purchase.receipt_filename) {
            document.getElementById('viewPurchaseReceipt').innerHTML = '<a href="http://localhost:3000/uploads/receipts/' + purchase.receipt_filename + '" target="_blank" style="color: #6f42c1; text-decoration: underline;">View Receipt</a>';
            const img = document.getElementById('viewReceiptImg');
            if (img) {
                img.src = 'http://localhost:3000/uploads/receipts/' + purchase.receipt_filename;
                document.getElementById('viewReceiptImage').style.display = 'block';
            }
        } else {
            document.getElementById('viewPurchaseReceipt').textContent = 'No receipt uploaded';
            document.getElementById('viewReceiptImage').style.display = 'none';
        }

        currentEditingPurchaseId = purchase.id;

        document.getElementById('editPurchaseId').value = purchase.id;
        document.getElementById('editPurchaseDate').value = purchase.date.split('T')[0];
        document.getElementById('editPurchaseTime').value = purchase.time;
        document.getElementById('editPurchaseItem').value = purchase.item_name;
        document.getElementById('editPurchaseQuantity').value = purchase.quantity;
        document.getElementById('editPurchaseUnit').value = purchase.unit;
        document.getElementById('editPurchaseCostPerUnit').value = purchase.cost_per_unit;
        document.getElementById('editPurchaseTotalCost').value = purchase.total_cost;
        document.getElementById('editPurchaseSupplier').value = purchase.supplier || '';
        document.getElementById('editPurchaseCategory').value = purchase.category || 'Other';
        document.getElementById('editPurchaseNotes').value = purchase.notes || '';

        const msgDiv = document.getElementById('editPurchaseMessage');
        if (msgDiv) {
            msgDiv.style.display = 'none';
            msgDiv.className = '';
        }

    } catch (error) {
        console.error('❌ Error loading purchase:', error);
        alert('Failed to load purchase details: ' + error.message);
        closeEditPurchaseModal();
    }
};

// Close edit purchase modal
window.closeEditPurchaseModal = function() {
    const modal = document.getElementById('editPurchaseModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    cancelEditMode();
};

// Cancel edit mode
window.cancelEditMode = function() {
    isEditMode = false;
    const viewMode = document.getElementById('editPurchaseViewMode');
    const editMode = document.getElementById('editPurchaseEditMode');
    const toggleBtn = document.getElementById('editToggleBtn');
    const title = document.getElementById('editModalTitle');

    if (viewMode) viewMode.style.display = 'block';
    if (editMode) editMode.style.display = 'none';
    if (toggleBtn) {
        toggleBtn.textContent = '✏️ Edit';
        toggleBtn.style.background = '#ffc107';
        toggleBtn.style.color = '#333';
    }
    if (title) {
        title.textContent = '📦 Purchase Details';
        title.style.color = '#333';
    }

    const msgDiv = document.getElementById('editPurchaseMessage');
    if (msgDiv) {
        msgDiv.style.display = 'none';
        msgDiv.className = '';
    }
};

// Toggle edit mode
window.toggleEditMode = function() {
    const viewMode = document.getElementById('editPurchaseViewMode');
    const editMode = document.getElementById('editPurchaseEditMode');
    const toggleBtn = document.getElementById('editToggleBtn');
    const title = document.getElementById('editModalTitle');

    if (!isEditMode) {
        isEditMode = true;
        if (viewMode) viewMode.style.display = 'none';
        if (editMode) editMode.style.display = 'block';
        if (toggleBtn) {
            toggleBtn.textContent = '👁️ View';
            toggleBtn.style.background = '#6f42c1';
            toggleBtn.style.color = 'white';
        }
        if (title) {
            title.textContent = '✏️ Edit Purchase';
            title.style.color = '#ffc107';
        }
    } else {
        cancelEditMode();
    }
};

// Export
window.InventoryModule = {
    init: initInventory,
    load: loadInventory,
    loadStock: loadStock
};
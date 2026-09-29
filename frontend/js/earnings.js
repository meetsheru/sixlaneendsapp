// Earnings Module

let editingId = null;

// DOM Elements
const form = document.getElementById('earningForm');
const dateInput = document.getElementById('dateInput');
const amountInput = document.getElementById('amountInput');
const descriptionInput = document.getElementById('descriptionInput');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');
const filterDate = document.getElementById('filterDate');
const clearFilterBtn = document.getElementById('clearFilterBtn');
const earningsList = document.getElementById('earningsList');
const messageContainer = document.getElementById('messageContainer');

// Initialize
function initEarnings() {
    if (dateInput) {
        dateInput.value = Utils.getToday();
    }
    
    // Form submit
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    // Delete button
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDelete);
    }
    
    // Filter
    if (filterDate) {
        filterDate.addEventListener('change', function() {
            loadEarnings(filterDate.value);
        });
    }
    
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', function() {
            if (filterDate) filterDate.value = '';
            loadEarnings();
        });
    }
    
    // Load initial data
    loadEarnings();
}

// Handle form submit
async function handleSubmit(e) {
    e.preventDefault();
    console.log('📤 Earnings form submitted!');
    
    const date = dateInput ? dateInput.value : null;
    const amount = amountInput ? parseFloat(amountInput.value) : null;
    const description = descriptionInput ? descriptionInput.value.trim() || null : null;

    if (!date) {
        Utils.showMessage(messageContainer, '❌ Please select a date', 'error');
        return;
    }
    if (!amount || amount <= 0) {
        Utils.showMessage(messageContainer, '❌ Please enter a valid positive amount', 'error');
        return;
    }

    const data = { 
        date: date, 
        time: Utils.getCurrentTime(),
        amount: amount, 
        description: description 
    };
    
    if (editingId) {
        data.id = editingId;
        console.log('✏️ UPDATING entry ID:', editingId);
    }

    try {
        const result = await API.EarningsAPI.save(data);
        console.log('✅ Server response:', result);
        
        Utils.showMessage(messageContainer, '✅ Saved: £' + result.amount + ' at ' + result.time, 'success');
        
        editingId = null;
        if (amountInput) amountInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (saveBtn) saveBtn.textContent = '💾 Save Earnings';
        
        loadEarnings();
        if (typeof loadBalance === 'function') loadBalance();
        if (typeof loadStatistics === 'function') loadStatistics();
        if (typeof loadDailySummary === 'function') loadDailySummary();
        if (typeof loadPeriodSummary === 'function') loadPeriodSummary();
    } catch (error) {
        console.error('❌ Error:', error);
        Utils.showMessage(messageContainer, '❌ Failed to save: ' + error.message, 'error');
    }
}

// Handle delete
async function handleDelete() {
    if (!editingId) {
        Utils.showMessage(messageContainer, '❌ No entry selected to delete', 'error');
        return;
    }
    
    if (!confirm('Delete this entry?')) return;

    try {
        const allEarnings = await API.EarningsAPI.getAll();
        const entry = allEarnings.find(e => e.id === editingId);
        
        if (!entry) {
            Utils.showMessage(messageContainer, '❌ Entry not found', 'error');
            return;
        }
        
        await API.EarningsAPI.delete(entry.date.split('T')[0], entry.time);
        
        Utils.showMessage(messageContainer, '✅ Deleted successfully!', 'success');
        
        editingId = null;
        if (form) form.reset();
        if (dateInput) dateInput.value = Utils.getToday();
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (saveBtn) saveBtn.textContent = '💾 Save Earnings';
        
        loadEarnings();
        if (typeof loadBalance === 'function') loadBalance();
        if (typeof loadStatistics === 'function') loadStatistics();
        if (typeof loadDailySummary === 'function') loadDailySummary();
        if (typeof loadPeriodSummary === 'function') loadPeriodSummary();
    } catch (error) {
        console.error('❌ Error:', error);
        Utils.showMessage(messageContainer, '❌ Failed to delete: ' + error.message, 'error');
    }
}

// Load earnings
async function loadEarnings(date) {
    date = date || null;
    console.log('📥 Loading earnings...');
    try {
        const earnings = await API.EarningsAPI.getAll(date);
        console.log('📥 Received:', earnings.length, 'entries');
        displayEarnings(earnings);
    } catch (error) {
        console.error('❌ Error loading earnings:', error);
        if (earningsList) {
            earningsList.innerHTML = '<p class="error">❌ Failed to load earnings</p>';
        }
    }
}

// Display earnings
function displayEarnings(earnings) {
    console.log('🎨 Displaying earnings...', earnings.length);
    
    if (!earningsList) {
        console.error('❌ earningsList not found!');
        return;
    }
    
    if (!earnings || earnings.length === 0) {
        earningsList.innerHTML = '<p class="no-data">📭 No earnings found</p>';
        return;
    }

    let html = '';
    let currentDate = '';
    let dailyTotal = 0;
    
    for (let i = 0; i < earnings.length; i++) {
        const earning = earnings[i];
        
        try {
            const formattedDate = Utils.formatDate(earning.date);
            const dateString = earning.date.split('T')[0];
            
            if (currentDate !== dateString) {
                if (currentDate !== '') {
                    html += '<div style="background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; text-align: right; color: #28a745;">Daily Total: ' + Utils.formatCurrency(dailyTotal) + '</div>';
                    dailyTotal = 0;
                }
                currentDate = dateString;
                html += '<div style="background: #667eea; color: white; padding: 10px; border-radius: 5px; margin: 15px 0 10px 0; font-weight: bold; font-size: 1.1rem;">📅 ' + formattedDate + '</div>';
            }
            
            const amountNum = parseFloat(earning.amount) || 0;
            dailyTotal += amountNum;
            
            html += '<div style="background: #f8f9fa; padding: 15px 20px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #28a745;">';
            html += '<div>';
            html += '<div style="font-weight: 600; color: #667eea; font-size: 0.9rem;">🕐 ' + Utils.formatTime(earning.time) + '</div>';
            html += '<div style="font-size: 1.2rem; font-weight: 700; color: #28a745;">' + Utils.formatCurrency(amountNum) + '</div>';
            if (earning.description) {
                html += '<div style="color: #666; font-size: 0.9rem;">' + earning.description + '</div>';
            }
            html += '</div>';
            html += '<div style="display: flex; gap: 8px;">';
            html += '<button onclick="editEarning(' + earning.id + ')" style="background: #ffc107; color: #333; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">✏️ Edit</button>';
            html += '<button onclick="deleteEarning(' + earning.id + ')" style="background: #dc3545; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ Delete</button>';
            html += '</div>';
            html += '</div>';
        } catch (err) {
            console.error('Error processing earning:', earning, err);
        }
    }
    
    if (currentDate !== '') {
        html += '<div style="background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; text-align: right; color: #28a745;">Daily Total: ' + Utils.formatCurrency(dailyTotal) + '</div>';
    }
    
    earningsList.innerHTML = html;
    console.log('✅ Display complete!');
}

// Edit earning
window.editEarning = async function(id) {
    console.log('✏️ EDITING - ID:', id);
    
    try {
        const earnings = await API.EarningsAPI.getAll();
        const earning = earnings.find(e => e.id === id);
        
        if (!earning) {
            Utils.showMessage(messageContainer, '❌ Earning not found', 'error');
            return;
        }
        
        editingId = id;
        if (dateInput) dateInput.value = earning.date.split('T')[0];
        if (amountInput) amountInput.value = earning.amount;
        if (descriptionInput) descriptionInput.value = earning.description || '';
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
        if (saveBtn) saveBtn.textContent = '🔄 Update Earnings';
        
        Utils.showMessage(messageContainer, '📝 Editing: ' + Utils.formatCurrency(earning.amount) + ' - Time will update when you save', 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('❌ Error:', error);
        Utils.showMessage(messageContainer, '❌ Failed to load earning: ' + error.message, 'error');
    }
};

// Delete earning from list
window.deleteEarning = async function(id) {
    console.log('🗑️ Deleting ID:', id);
    
    if (!confirm('Delete this entry?')) return;

    try {
        const allEarnings = await API.EarningsAPI.getAll();
        const entry = allEarnings.find(e => e.id === id);
        
        if (!entry) {
            Utils.showMessage(messageContainer, '❌ Entry not found', 'error');
            return;
        }
        
        await API.EarningsAPI.delete(entry.date.split('T')[0], entry.time);
        
        Utils.showMessage(messageContainer, '✅ Deleted successfully!', 'success');
        loadEarnings(filterDate ? filterDate.value : null);
        if (typeof loadBalance === 'function') loadBalance();
        if (typeof loadStatistics === 'function') loadStatistics();
        if (typeof loadDailySummary === 'function') loadDailySummary();
        if (typeof loadPeriodSummary === 'function') loadPeriodSummary();
    } catch (error) {
        console.error('❌ Error:', error);
        Utils.showMessage(messageContainer, '❌ Failed to delete: ' + error.message, 'error');
    }
};

// Export
window.EarningsModule = {
    init: initEarnings,
    load: loadEarnings,
    display: displayEarnings
};
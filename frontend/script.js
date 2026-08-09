console.log('🔴 SCRIPT.JS IS LOADED!');

const API_URL = 'http://localhost:3000/api';

console.log('API_URL:', API_URL);

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

console.log('✅ DOM Elements found:');
console.log('form:', !!form);
console.log('earningsList:', !!earningsList);

// Store the entry ID when editing
let editingId = null;

// Set default date to today
const now = new Date();
if (dateInput) {
    dateInput.value = now.toISOString().split('T')[0];
}

console.log('🚀 App starting...');

// Message function
function showMessage(message, type = 'success') {
    console.log('📢 Message:', message, type);
    if (!messageContainer) {
        alert(message);
        return;
    }
    messageContainer.className = '';
    messageContainer.textContent = message;
    messageContainer.classList.add(type);
    messageContainer.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(function() {
            messageContainer.style.display = 'none';
        }, 5000);
    }
}

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Page loaded!');
    loadEarnings();
    loadStatistics();
    loadDailySummary();
});

// Form submit
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📤 Form submitted!');
        
        const date = dateInput ? dateInput.value : null;
        const amount = amountInput ? parseFloat(amountInput.value) : null;
        const description = descriptionInput ? descriptionInput.value.trim() || null : null;

        if (!date) {
            showMessage('❌ Please select a date', 'error');
            return;
        }
        if (!amount || amount <= 0) {
            showMessage('❌ Please enter a valid positive amount', 'error');
            return;
        }

        // Get current time
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 8);
        console.log('⏰ Current time:', currentTime);

        // Build the data object
        const data = { 
            date: date, 
            time: currentTime,
            amount: amount, 
            description: description 
        };
        
        if (editingId) {
            data.id = editingId;
            console.log('✏️ UPDATING entry ID:', editingId);
        }

        console.log('📤 Sending:', data);

        try {
            const response = await fetch(API_URL + '/earnings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }

            const result = await response.json();
            console.log('✅ Server response:', result);
            
            showMessage('✅ Saved: £' + result.amount + ' at ' + result.time, 'success');
            
            editingId = null;
            if (amountInput) amountInput.value = '';
            if (descriptionInput) descriptionInput.value = '';
            if (deleteBtn) deleteBtn.style.display = 'none';
            if (saveBtn) saveBtn.textContent = '💾 Save Earnings';
            
            loadEarnings();
            loadStatistics();
            loadDailySummary();
        } catch (error) {
            console.error('❌ Error:', error);
            showMessage('❌ Failed to save: ' + error.message, 'error');
        }
    });
}

// Delete button
if (deleteBtn) {
    deleteBtn.addEventListener('click', async function() {
        if (!editingId) {
            showMessage('❌ No entry selected to delete', 'error');
            return;
        }
        
        if (!confirm('Delete this entry?')) return;

        try {
            const getResp = await fetch(API_URL + '/earnings');
            const allEarnings = await getResp.json();
            const entry = allEarnings.find(e => e.id === editingId);
            
            if (!entry) {
                showMessage('❌ Entry not found', 'error');
                return;
            }
            
            const response = await fetch(API_URL + '/earnings/' + entry.date.split('T')[0] + '/' + entry.time, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete');
            }

            showMessage('✅ Deleted successfully!', 'success');
            
            editingId = null;
            if (form) form.reset();
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
            if (deleteBtn) deleteBtn.style.display = 'none';
            if (saveBtn) saveBtn.textContent = '💾 Save Earnings';
            loadEarnings();
            loadStatistics();
            loadDailySummary();
        } catch (error) {
            console.error('❌ Error:', error);
            showMessage('❌ Failed to delete: ' + error.message, 'error');
        }
    });
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

// Load earnings
async function loadEarnings(date) {
    date = date || null;
    console.log('📥 Loading earnings...');
    try {
        let url = API_URL + '/earnings';
        if (date) {
            url = url + '?date=' + date;
        }
        
        const response = await fetch(url);
        const earnings = await response.json();
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
            const dateObj = new Date(earning.date);
            const formattedDate = dateObj.toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const dateString = earning.date.split('T')[0];
            
            if (currentDate !== dateString) {
                if (currentDate !== '') {
                    html += '<div style="background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; text-align: right; color: #28a745;">Daily Total: £' + dailyTotal.toFixed(2) + '</div>';
                    dailyTotal = 0;
                }
                currentDate = dateString;
                html += '<div style="background: #667eea; color: white; padding: 10px; border-radius: 5px; margin: 15px 0 10px 0; font-weight: bold; font-size: 1.1rem;">📅 ' + formattedDate + '</div>';
            }
            
            const amountNum = parseFloat(earning.amount) || 0;
            dailyTotal += amountNum;
            
            html += '<div style="background: #f8f9fa; padding: 15px 20px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #28a745;">';
            html += '<div>';
            html += '<div style="font-weight: 600; color: #667eea; font-size: 0.9rem;">🕐 ' + (earning.time || '00:00:00') + '</div>';
            html += '<div style="font-size: 1.2rem; font-weight: 700; color: #28a745;">£' + amountNum.toFixed(2) + '</div>';
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
        html += '<div style="background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; text-align: right; color: #28a745;">Daily Total: £' + dailyTotal.toFixed(2) + '</div>';
    }
    
    earningsList.innerHTML = html;
    console.log('✅ Display complete!');
}

// Edit earning by ID
window.editEarning = async function(id) {
    console.log('✏️ EDITING - ID:', id);
    
    try {
        const response = await fetch(API_URL + '/earnings');
        const earnings = await response.json();
        const earning = earnings.find(e => e.id === id);
        
        if (!earning) {
            showMessage('❌ Earning not found', 'error');
            return;
        }
        
        console.log('✅ Found earning:', earning);
        
        editingId = id;
        if (dateInput) dateInput.value = earning.date.split('T')[0];
        if (amountInput) amountInput.value = earning.amount;
        if (descriptionInput) descriptionInput.value = earning.description || '';
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
        if (saveBtn) saveBtn.textContent = '🔄 Update Earnings';
        
        showMessage('📝 Editing: £' + earning.amount + ' - Time will update when you save', 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('❌ Failed to load earning: ' + error.message, 'error');
    }
};

// Delete earning by ID
window.deleteEarning = async function(id) {
    console.log('🗑️ Deleting ID:', id);
    
    if (!confirm('Delete this entry?')) return;

    try {
        const getResp = await fetch(API_URL + '/earnings');
        const allEarnings = await getResp.json();
        const entry = allEarnings.find(e => e.id === id);
        
        if (!entry) {
            showMessage('❌ Entry not found', 'error');
            return;
        }
        
        const response = await fetch(API_URL + '/earnings/' + entry.date.split('T')[0] + '/' + entry.time, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete');
        }

        showMessage('✅ Deleted successfully!', 'success');
        loadEarnings(filterDate ? filterDate.value : null);
        loadStatistics();
        loadDailySummary();
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('❌ Failed to delete: ' + error.message, 'error');
    }
};

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch(API_URL + '/statistics');
        const stats = await response.json();
        
        const totalEntries = document.getElementById('totalEntries');
        const totalEarnings = document.getElementById('totalEarnings');
        const averageEarning = document.getElementById('averageEarning');
        const minMaxEarning = document.getElementById('minMaxEarning');
        
        if (totalEntries) totalEntries.textContent = stats.total_entries || 0;
        if (totalEarnings) totalEarnings.textContent = '£' + parseFloat(stats.total_earnings || 0).toFixed(2);
        if (averageEarning) averageEarning.textContent = '£' + parseFloat(stats.average_earning || 0).toFixed(2);
        
        const min = stats.min_earning || 0;
        const max = stats.max_earning || 0;
        if (minMaxEarning) minMaxEarning.textContent = '£' + parseFloat(min).toFixed(2) + ' / £' + parseFloat(max).toFixed(2);
    } catch (error) {
        console.error('❌ Error loading statistics:', error);
    }
}

// Load daily summary
async function loadDailySummary() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(API_URL + '/earnings?date=' + today);
        const earnings = await response.json();
        
        let total = 0;
        earnings.forEach(function(e) {
            total += parseFloat(e.amount) || 0;
        });
        
        const todayTotal = document.getElementById('todayTotal');
        const todayEntries = document.getElementById('todayEntries');
        
        if (todayTotal) todayTotal.textContent = '£' + total.toFixed(2);
        if (todayEntries) todayEntries.textContent = earnings.length;
    } catch (error) {
        console.error('❌ Error loading daily summary:', error);
    }
}

// Force load earnings
setTimeout(function() {
    console.log('🔄 Forcing load...');
    loadEarnings();
}, 500);

console.log('🚀 Application loaded successfully!');
console.log('✅ loadEarnings function exists');
console.log('✅ displayEarnings function exists');
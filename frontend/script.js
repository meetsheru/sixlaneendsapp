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

// Expense Elements
const expenseForm = document.getElementById('expenseForm');
const expenseDateInput = document.getElementById('expenseDateInput');
const expenseAmountInput = document.getElementById('expenseAmountInput');
const expenseReasonInput = document.getElementById('expenseReasonInput');
const expenseSaveBtn = document.getElementById('expenseSaveBtn');
const expenseFilterDate = document.getElementById('expenseFilterDate');
const expenseClearFilterBtn = document.getElementById('expenseClearFilterBtn');
const expensesList = document.getElementById('expensesList');
const expenseMessageContainer = document.getElementById('expenseMessageContainer');
const expenseAvailableBalance = document.getElementById('expenseAvailableBalance');
const expenseBalanceWarning = document.getElementById('expenseBalanceWarning');
const expenseBalanceWarningText = document.getElementById('expenseBalanceWarningText');

// Balance Elements
const totalEarningsBalance = document.getElementById('totalEarningsBalance');
const totalExpensesBalance = document.getElementById('totalExpensesBalance');
const availableBalance = document.getElementById('availableBalance');
const balanceCard = document.getElementById('balanceCard');

// Statistics Elements
const totalExpensesStat = document.getElementById('totalExpensesStat');
const netBalanceStat = document.getElementById('netBalanceStat');

// Audit Elements
const auditList = document.getElementById('auditList');

// Store the entry ID when editing
let editingId = null;

// Set default date to today
const now = new Date();
if (dateInput) {
    dateInput.value = now.toISOString().split('T')[0];
}
if (expenseDateInput) {
    expenseDateInput.value = now.toISOString().split('T')[0];
}

console.log('🚀 App starting...');

// ============================================
// TAB NAVIGATION
// ============================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
        tabBtns.forEach(function(b) { b.classList.remove('active'); });
        tabContents.forEach(function(c) { c.classList.remove('active'); });
        
        btn.classList.add('active');
        const tabId = 'tab-' + btn.dataset.tab;
        document.getElementById(tabId).classList.add('active');
        
        // Load data when switching tabs
        if (btn.dataset.tab === 'expenses') {
            loadExpenses();
            loadBalance();
        }
        if (btn.dataset.tab === 'history') {
            loadAuditHistory();
        }
        if (btn.dataset.tab === 'statistics') {
            loadStatistics();
            loadPeriodSummary();
            loadBalance();
        }
    });
});

// ============================================
// MESSAGE FUNCTIONS
// ============================================
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

function showExpenseMessage(message, type = 'success') {
    console.log('📢 Expense Message:', message, type);
    if (!expenseMessageContainer) {
        alert(message);
        return;
    }
    expenseMessageContainer.className = '';
    expenseMessageContainer.textContent = message;
    expenseMessageContainer.classList.add(type);
    expenseMessageContainer.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(function() {
            expenseMessageContainer.style.display = 'none';
        }, 5000);
    }
}

// ============================================
// BALANCE FUNCTIONS
// ============================================
async function loadBalance() {
    try {
        const response = await fetch(API_URL + '/balance');
        const data = await response.json();
        
        console.log('💰 Balance:', data);
        
        if (totalEarningsBalance) {
            totalEarningsBalance.textContent = '£' + data.total_earnings.toFixed(2);
        }
        if (totalExpensesBalance) {
            totalExpensesBalance.textContent = '£' + data.total_expenses.toFixed(2);
        }
        if (availableBalance) {
            availableBalance.textContent = '£' + data.balance.toFixed(2);
        }
        if (totalExpensesStat) {
            totalExpensesStat.textContent = '£' + data.total_expenses.toFixed(2);
        }
        if (netBalanceStat) {
            netBalanceStat.textContent = '£' + data.balance.toFixed(2);
        }
        
        // Update balance card color based on balance
        if (balanceCard && availableBalance) {
            balanceCard.classList.remove('low-balance', 'zero-balance');
            if (data.balance <= 0) {
                balanceCard.classList.add('zero-balance');
                availableBalance.textContent = '£0.00';
                balanceCard.querySelector('.balance-label').textContent = '❌ No Balance Available';
            } else if (data.balance < 50) {
                balanceCard.classList.add('low-balance');
                balanceCard.querySelector('.balance-label').textContent = '⚠️ Low Balance';
            } else {
                balanceCard.querySelector('.balance-label').textContent = '✅ Available Balance';
            }
        }
        
        // Update expense form balance display
        if (expenseAvailableBalance) {
            expenseAvailableBalance.textContent = '£' + data.balance.toFixed(2);
            if (data.balance <= 0) {
                expenseAvailableBalance.style.color = '#dc3545';
            } else {
                expenseAvailableBalance.style.color = '#28a745';
            }
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error loading balance:', error);
        return null;
    }
}

// ============================================
// EARNINGS FUNCTIONS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Page loaded!');
    loadEarnings();
    loadExpenses();
    loadBalance();
    loadStatistics();
    loadDailySummary();
    loadPeriodSummary();
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

        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 8);
        console.log('⏰ Current time:', currentTime);

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
            loadBalance();
            loadStatistics();
            loadDailySummary();
            loadPeriodSummary();
        } catch (error) {
            console.error('❌ Error:', error);
            showMessage('❌ Failed to save: ' + error.message, 'error');
        }
    });
}

// Delete earnings button
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
            loadBalance();
            loadStatistics();
            loadDailySummary();
            loadPeriodSummary();
        } catch (error) {
            console.error('❌ Error:', error);
            showMessage('❌ Failed to delete: ' + error.message, 'error');
        }
    });
}

// Earnings filter
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
        loadBalance();
        loadStatistics();
        loadDailySummary();
        loadPeriodSummary();
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('❌ Failed to delete: ' + error.message, 'error');
    }
};

// ============================================
// EXPENSES FUNCTIONS
// ============================================

// Load expenses
async function loadExpenses(date) {
    date = date || null;
    console.log('📥 Loading expenses...');
    try {
        let url = API_URL + '/expenses';
        if (date) {
            url = url + '?date=' + date;
        }
        
        const response = await fetch(url);
        const expenses = await response.json();
        console.log('📥 Received expenses:', expenses.length, 'entries');
        displayExpenses(expenses);
    } catch (error) {
        console.error('❌ Error loading expenses:', error);
        if (expensesList) {
            expensesList.innerHTML = '<p class="error">❌ Failed to load expenses</p>';
        }
    }
}

function displayExpenses(expenses) {
    console.log('🎨 Displaying expenses...', expenses.length);
    
    if (!expensesList) {
        console.error('❌ expensesList not found!');
        return;
    }
    
    if (!expenses || expenses.length === 0) {
        expensesList.innerHTML = '<p class="no-data">📭 No expenses found</p>';
        return;
    }

    let html = '';
    let currentDate = '';
    let dailyTotal = 0;
    
    for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];
        
        try {
            const dateObj = new Date(expense.date);
            const formattedDate = dateObj.toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const dateString = expense.date.split('T')[0];
            
            if (currentDate !== dateString) {
                if (currentDate !== '') {
                    html += '<div style="background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; text-align: right; color: #dc3545;">Daily Expenses: £' + dailyTotal.toFixed(2) + '</div>';
                    dailyTotal = 0;
                }
                currentDate = dateString;
                html += '<div style="background: #dc3545; color: white; padding: 10px; border-radius: 5px; margin: 15px 0 10px 0; font-weight: bold; font-size: 1.1rem;">📅 ' + formattedDate + '</div>';
            }
            
            const amountNum = parseFloat(expense.amount) || 0;
            dailyTotal += amountNum;
            
            html += '<div style="background: #f8f9fa; padding: 15px 20px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #dc3545;">';
            html += '<div>';
            html += '<div style="font-weight: 600; color: #dc3545; font-size: 0.9rem;">🕐 ' + (expense.time || '00:00:00') + '</div>';
            html += '<div style="font-size: 1.2rem; font-weight: 700; color: #dc3545;">£' + amountNum.toFixed(2) + '</div>';
            html += '<div style="color: #333; font-weight: 500;">📝 ' + expense.reason + '</div>';
            html += '</div>';
            html += '<div style="display: flex; gap: 8px;">';
            html += '<button onclick="deleteExpense(' + expense.id + ')" style="background: #dc3545; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ Delete</button>';
            html += '</div>';
            html += '</div>';
        } catch (err) {
            console.error('Error processing expense:', expense, err);
        }
    }
    
    if (currentDate !== '') {
        html += '<div style="background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; text-align: right; color: #dc3545;">Daily Expenses: £' + dailyTotal.toFixed(2) + '</div>';
    }
    
    expensesList.innerHTML = html;
    console.log('✅ Expenses display complete!');
}

// Expense form submit
if (expenseForm) {
    expenseForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📤 Expense form submitted!');
        
        const date = expenseDateInput ? expenseDateInput.value : null;
        const amount = expenseAmountInput ? parseFloat(expenseAmountInput.value) : null;
        const reason = expenseReasonInput ? expenseReasonInput.value.trim() : null;

        if (!date) {
            showExpenseMessage('❌ Please select a date', 'error');
            return;
        }
        if (!amount || amount <= 0) {
            showExpenseMessage('❌ Please enter a valid positive amount', 'error');
            return;
        }
        if (!reason) {
            showExpenseMessage('❌ Please enter a reason for the expense', 'error');
            return;
        }

        const data = { 
            date: date, 
            amount: amount, 
            reason: reason 
        };

        console.log('📤 Sending expense:', data);

        try {
            const response = await fetch(API_URL + '/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Server error');
            }

            const result = await response.json();
            console.log('✅ Expense saved:', result);
            
            showExpenseMessage('✅ Expense added: £' + result.expense.amount + ' - ' + result.expense.reason + '. Remaining: £' + result.remaining_balance.toFixed(2), 'success');
            
            expenseAmountInput.value = '';
            expenseReasonInput.value = '';
            
            loadExpenses();
            loadBalance();
            loadStatistics();
            loadPeriodSummary();
        } catch (error) {
            console.error('❌ Error:', error);
            showExpenseMessage('❌ ' + error.message, 'error');
        }
    });
}

// Expense filter
if (expenseFilterDate) {
    expenseFilterDate.addEventListener('change', function() {
        loadExpenses(expenseFilterDate.value);
    });
}

if (expenseClearFilterBtn) {
    expenseClearFilterBtn.addEventListener('click', function() {
        if (expenseFilterDate) expenseFilterDate.value = '';
        loadExpenses();
    });
}

// Delete expense
window.deleteExpense = async function(id) {
    console.log('🗑️ Deleting expense ID:', id);
    
    if (!confirm('Delete this expense?')) return;

    try {
        const response = await fetch(API_URL + '/expenses/' + id, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete expense');
        }

        showExpenseMessage('✅ Expense deleted successfully!', 'success');
        loadExpenses(expenseFilterDate ? expenseFilterDate.value : null);
        loadBalance();
        loadStatistics();
        loadPeriodSummary();
    } catch (error) {
        console.error('❌ Error:', error);
        showExpenseMessage('❌ Failed to delete: ' + error.message, 'error');
    }
};

// ============================================
// STATISTICS FUNCTIONS
// ============================================
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

async function loadPeriodSummary() {
    try {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const allEarnings = await fetch(API_URL + '/earnings').then(r => r.json());
        
        let weekTotal = 0;
        let monthTotal = 0;
        let allTotal = 0;
        
        allEarnings.forEach(function(e) {
            const date = new Date(e.date);
            const amount = parseFloat(e.amount) || 0;
            allTotal += amount;
            
            if (date >= weekStart) weekTotal += amount;
            if (date >= monthStart) monthTotal += amount;
        });
        
        document.getElementById('weekTotal').textContent = '£' + weekTotal.toFixed(2);
        document.getElementById('monthTotal').textContent = '£' + monthTotal.toFixed(2);
        document.getElementById('allTimeTotal').textContent = '£' + allTotal.toFixed(2);
    } catch (error) {
        console.error('❌ Error loading period summary:', error);
    }
}

// ============================================
// AUDIT / HISTORY FUNCTIONS
// ============================================
async function loadAuditHistory() {
    console.log('📜 Loading audit history...');
    try {
        const response = await fetch(API_URL + '/audit');
        const audits = await response.json();
        console.log('📜 Audit records:', audits.length);
        displayAudit(audits);
        
        const summary = document.getElementById('auditSummary');
        const stats = document.getElementById('auditStats');
        if (summary && stats) {
            summary.style.display = 'block';
            const total = audits.length;
            const creates = audits.filter(a => a.action === 'CREATE').length;
            const updates = audits.filter(a => a.action === 'UPDATE').length;
            const deletes = audits.filter(a => a.action === 'DELETE').length;
            stats.textContent = '📊 Total: ' + total + ' | ➕ Create: ' + creates + ' | ✏️ Update: ' + updates + ' | 🗑️ Delete: ' + deletes;
        }
    } catch (error) {
        console.error('❌ Error loading audit:', error);
        if (auditList) {
            auditList.innerHTML = '<p class="error">❌ Failed to load audit history</p>';
        }
    }
}

function displayAudit(audits) {
    console.log('🎨 Displaying audit...', audits.length);
    
    if (!auditList) {
        console.error('❌ auditList not found!');
        return;
    }
    
    if (!audits || audits.length === 0) {
        auditList.innerHTML = '<p class="no-data">📭 No audit records found</p>';
        return;
    }

    let html = '<div style="font-size: 0.9rem;">';
    
    audits.forEach(function(audit) {
        const date = new Date(audit.changed_at);
        const formattedDate = date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        let actionClass = 'audit-badge-create';
        let actionIcon = '➕';
        let actionLabel = 'CREATE';
        if (audit.action === 'UPDATE') {
            actionClass = 'audit-badge-update';
            actionIcon = '✏️';
            actionLabel = 'UPDATE';
        } else if (audit.action === 'DELETE') {
            actionClass = 'audit-badge-delete';
            actionIcon = '🗑️';
            actionLabel = 'DELETE';
        }
        
        html += '<div style="background: #f8f9fa; padding: 12px 15px; margin: 8px 0; border-radius: 8px; border-left: 4px solid ' + (audit.action === 'CREATE' ? '#28a745' : audit.action === 'UPDATE' ? '#ffc107' : '#dc3545') + ';">';
        html += '<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">';
        html += '<div>';
        html += '<span class="audit-badge ' + actionClass + '">' + actionIcon + ' ' + actionLabel + '</span>';
        html += '<span style="color: #666; margin-left: 10px;">Entry ID: ' + audit.entry_id + '</span>';
        if (audit.entry_date) {
            html += '<span style="color: #666; margin-left: 10px;">📅 ' + audit.entry_date + '</span>';
        }
        html += '</div>';
        html += '<span style="color: #999; font-size: 0.8rem;">' + formattedDate + '</span>';
        html += '</div>';
        
        html += '<div style="margin-top: 5px; font-size: 0.9rem; color: #333;">';
        if (audit.action === 'CREATE') {
            html += '<span>💰 Amount: <strong>£' + parseFloat(audit.new_amount).toFixed(2) + '</strong></span>';
            if (audit.new_description) {
                html += '<span style="margin-left: 15px;">📝 ' + audit.new_description + '</span>';
            }
        } else if (audit.action === 'UPDATE') {
            html += '<span>💰 Old: <strong style="color: #dc3545;">£' + parseFloat(audit.old_amount).toFixed(2) + '</strong> → New: <strong style="color: #28a745;">£' + parseFloat(audit.new_amount).toFixed(2) + '</strong></span>';
            if (audit.old_description || audit.new_description) {
                html += '<br><span style="color: #666;">📝 Old: ' + (audit.old_description || 'N/A') + ' → New: ' + (audit.new_description || 'N/A') + '</span>';
            }
        } else if (audit.action === 'DELETE') {
            html += '<span>💰 Amount: <strong style="color: #dc3545;">£' + parseFloat(audit.old_amount).toFixed(2) + '</strong> (DELETED)</span>';
            if (audit.old_description) {
                html += '<span style="margin-left: 15px;">📝 ' + audit.old_description + '</span>';
            }
        }
        html += '</div>';
        html += '</div>';
    });
    
    html += '</div>';
    auditList.innerHTML = html;
    console.log('✅ Audit display complete!');
}

// Audit filters
const auditFilterAction = document.getElementById('auditFilterAction');
const auditFilterDate = document.getElementById('auditFilterDate');
const refreshAuditBtn = document.getElementById('refreshAuditBtn');
const clearAuditFilterBtn = document.getElementById('clearAuditFilterBtn');

if (auditFilterAction) {
    auditFilterAction.addEventListener('change', function() {
        applyAuditFilters();
    });
}

if (auditFilterDate) {
    auditFilterDate.addEventListener('change', function() {
        applyAuditFilters();
    });
}

if (refreshAuditBtn) {
    refreshAuditBtn.addEventListener('click', function() {
        loadAuditHistory();
    });
}

if (clearAuditFilterBtn) {
    clearAuditFilterBtn.addEventListener('click', function() {
        if (auditFilterAction) auditFilterAction.value = 'all';
        if (auditFilterDate) auditFilterDate.value = '';
        applyAuditFilters();
    });
}

async function applyAuditFilters() {
    const action = auditFilterAction ? auditFilterAction.value : 'all';
    const date = auditFilterDate ? auditFilterDate.value : '';
    
    console.log('🔍 Filtering audit:', action, date);
    
    try {
        let url = API_URL + '/audit';
        const response = await fetch(url);
        let audits = await response.json();
        
        if (action !== 'all') {
            audits = audits.filter(a => a.action === action);
        }
        
        if (date) {
            audits = audits.filter(function(a) {
                const auditDate = new Date(a.changed_at).toISOString().split('T')[0];
                return auditDate === date;
            });
        }
        
        displayAudit(audits);
        
        const summary = document.getElementById('auditSummary');
        const stats = document.getElementById('auditStats');
        if (summary && stats) {
            summary.style.display = 'block';
            const total = audits.length;
            const creates = audits.filter(a => a.action === 'CREATE').length;
            const updates = audits.filter(a => a.action === 'UPDATE').length;
            const deletes = audits.filter(a => a.action === 'DELETE').length;
            stats.textContent = '📊 Total: ' + total + ' | ➕ Create: ' + creates + ' | ✏️ Update: ' + updates + ' | 🗑️ Delete: ' + deletes;
        }
    } catch (error) {
        console.error('❌ Error filtering audit:', error);
    }
}

// ============================================
// CHECK BALANCE BEFORE EXPENSE
// ============================================
if (expenseAmountInput) {
    expenseAmountInput.addEventListener('input', async function() {
        const amount = parseFloat(this.value) || 0;
        const balanceData = await loadBalance();
        if (balanceData && amount > balanceData.balance) {
            expenseAmountInput.style.borderColor = '#dc3545';
            if (expenseBalanceWarning && expenseBalanceWarningText) {
                expenseBalanceWarning.style.display = 'block';
                expenseBalanceWarningText.textContent = 'You need £' + amount.toFixed(2) + ' but only have £' + balanceData.balance.toFixed(2) + ' available.';
            }
        } else {
            expenseAmountInput.style.borderColor = '#28a745';
            if (expenseBalanceWarning) {
                expenseBalanceWarning.style.display = 'none';
            }
        }
    });
}

// ============================================
// FORCE LOAD ON STARTUP
// ============================================
setTimeout(function() {
    console.log('🔄 Forcing initial load...');
    loadEarnings();
    loadExpenses();
    loadBalance();
    loadStatistics();
    loadDailySummary();
    loadPeriodSummary();
}, 500);

console.log('🚀 Application loaded successfully!');
console.log('✅ Tabs with Earnings, Expenses, History, and Statistics available');
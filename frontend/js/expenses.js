// ============================================
// EXPENSES MODULE
// ============================================

// DOM Elements
const expenseForm = document.getElementById('expenseForm');
const expenseDateInput = document.getElementById('expenseDateInput');
const expenseAmountInput = document.getElementById('expenseAmountInput');
const expenseReasonInput = document.getElementById('expenseReasonInput');
const expenseFilterDate = document.getElementById('expenseFilterDate');
const expenseClearFilterBtn = document.getElementById('expenseClearFilterBtn');
const expensesList = document.getElementById('expensesList');
const expenseMessageContainer = document.getElementById('expenseMessageContainer');
const expenseAvailableBalance = document.getElementById('expenseAvailableBalance');
const expenseBalanceWarning = document.getElementById('expenseBalanceWarning');
const expenseBalanceWarningText = document.getElementById('expenseBalanceWarningText');

// Initialize
function initExpenses() {
    if (expenseDateInput) {
        expenseDateInput.value = Utils.getToday();
    }

    if (expenseForm) {
        expenseForm.addEventListener('submit', handleExpenseSubmit);
    }

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

    // Check balance on amount input
    if (expenseAmountInput) {
        expenseAmountInput.addEventListener('input', checkBalance);
    }

    loadExpenses();
    loadBalance();
}

// Handle expense submit
async function handleExpenseSubmit(e) {
    e.preventDefault();
    console.log('📤 Expense form submitted!');

    const date = expenseDateInput ? expenseDateInput.value : null;
    const amount = expenseAmountInput ? parseFloat(expenseAmountInput.value) : null;
    const reason = expenseReasonInput ? expenseReasonInput.value.trim() : null;

    if (!date) {
        Utils.showMessage(expenseMessageContainer, '❌ Please select a date', 'error');
        return;
    }
    if (!amount || amount <= 0) {
        Utils.showMessage(expenseMessageContainer, '❌ Please enter a valid positive amount', 'error');
        return;
    }
    if (!reason) {
        Utils.showMessage(expenseMessageContainer, '❌ Please enter a reason for the expense', 'error');
        return;
    }

    const data = { date: date, amount: amount, reason: reason };

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

        Utils.showMessage(expenseMessageContainer, '✅ Expense added: £' + result.expense.amount + ' - ' + result.expense.reason, 'success');

        if (expenseAmountInput) expenseAmountInput.value = '';
        if (expenseReasonInput) expenseReasonInput.value = '';

        loadExpenses();
        loadBalance();
        if (typeof loadStatistics === 'function') loadStatistics();
        if (typeof loadPeriodSummary === 'function') loadPeriodSummary();

    } catch (error) {
        console.error('❌ Error:', error);
        Utils.showMessage(expenseMessageContainer, '❌ ' + error.message, 'error');
    }
}

// Load expenses
async function loadExpenses(date) {
    date = date || null;
    console.log('📥 Loading expenses...');
    const list = expensesList;
    if (!list) return;

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
        if (list) {
            list.innerHTML = '<p class="error">❌ Failed to load expenses</p>';
        }
    }
}

// Display expenses
function displayExpenses(expenses) {
    const list = expensesList;
    if (!list) return;

    if (!expenses || expenses.length === 0) {
        list.innerHTML = '<p class="no-data">📭 No expenses found</p>';
        return;
    }

    let html = '';
    let currentDate = '';
    let dailyTotal = 0;

    for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];

        try {
            const formattedDate = Utils.formatDate(expense.date);
            const dateString = expense.date.split('T')[0];

            if (currentDate !== dateString) {
                if (currentDate !== '') {
                    html += '<div style="background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; text-align: right; color: #dc3545;">Daily Expenses: ' + Utils.formatCurrency(dailyTotal) + '</div>';
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
            html += '<div style="font-size: 1.2rem; font-weight: 700; color: #dc3545;">' + Utils.formatCurrency(amountNum) + '</div>';
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
        html += '<div style="background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; text-align: right; color: #dc3545;">Daily Expenses: ' + Utils.formatCurrency(dailyTotal) + '</div>';
    }

    list.innerHTML = html;
    console.log('✅ Expenses display complete!');
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

        Utils.showMessage(expenseMessageContainer, '✅ Expense deleted successfully!', 'success');
        loadExpenses(expenseFilterDate ? expenseFilterDate.value : null);
        loadBalance();
        if (typeof loadStatistics === 'function') loadStatistics();
        if (typeof loadPeriodSummary === 'function') loadPeriodSummary();

    } catch (error) {
        console.error('❌ Error:', error);
        Utils.showMessage(expenseMessageContainer, '❌ Failed to delete: ' + error.message, 'error');
    }
};

// Check balance
async function checkBalance() {
    const amount = parseFloat(expenseAmountInput.value) || 0;
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
}

// Load balance
async function loadBalance() {
    try {
        const response = await fetch(API_URL + '/balance');
        const data = await response.json();

        const totalEarningsBalance = document.getElementById('totalEarningsBalance');
        const totalExpensesBalance = document.getElementById('totalExpensesBalance');
        const availableBalance = document.getElementById('availableBalance');

        if (totalEarningsBalance) totalEarningsBalance.textContent = Utils.formatCurrency(data.total_earnings);
        if (totalExpensesBalance) totalExpensesBalance.textContent = Utils.formatCurrency(data.total_expenses);
        if (availableBalance) availableBalance.textContent = Utils.formatCurrency(data.balance);

        if (expenseAvailableBalance) {
            expenseAvailableBalance.textContent = Utils.formatCurrency(data.balance);
            expenseAvailableBalance.style.color = data.balance <= 0 ? '#dc3545' : '#28a745';
        }

        return data;
    } catch (error) {
        console.error('❌ Error loading balance:', error);
        return null;
    }
}

// Export
window.ExpensesModule = {
    init: initExpenses,
    load: loadExpenses,
    display: displayExpenses
};
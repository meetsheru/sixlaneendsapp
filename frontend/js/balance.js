
// ============================================
// BALANCE MODULE
// ============================================

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
        
        return data;
    } catch (error) {
        console.error('❌ Error loading balance:', error);
        return null;
    }
}

// Export
window.BalanceModule = {
    load: loadBalance
};
EOF
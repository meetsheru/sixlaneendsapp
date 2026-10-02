// ============================================
// BALANCE MODULE
// ============================================

async function loadBalance() {
  try {
    const response = await fetch(API_URL + "/balance");
    const data = await response.json();

    // Cache for other modules
    window.__currentBalance = data.balance;
    window.__currentEarnings = data.total_earnings;
    window.__currentExpenses = data.total_expenses;

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = Utils.formatCurrency(val);
    };

    // ---- Two-card layout on Expenses page ----
    setText("allTimeEarningsValue", data.total_earnings);
    setText("balanceValue", data.balance);

    // Color the balance card
    const balanceCard = document.getElementById("balanceCard");
    if (balanceCard) {
      balanceCard.classList.remove("low", "empty");
      if (data.balance <= 0) {
        balanceCard.classList.add("empty");
      } else if (data.balance < 50) {
        balanceCard.classList.add("low");
      }
    }

    // ---- Old elements (kept for backward compat) ----
    setText("totalEarningsBalance", data.total_earnings);
    setText("totalExpensesBalance", data.total_expenses);
    setText("availableBalance", data.balance);

    // ---- Expense form "Available balance" indicator ----
    const expenseAvailableEl = document.getElementById("expenseAvailableBalance");
    if (expenseAvailableEl) {
      expenseAvailableEl.textContent = Utils.formatCurrency(data.balance);
      if (data.balance <= 0) {
        expenseAvailableEl.style.color = "#dc3545";
      } else if (data.balance < 50) {
        expenseAvailableEl.style.color = "#f39c12";
      } else {
        expenseAvailableEl.style.color = "#28a745";
      }
    }

    return data;
  } catch (error) {
    console.error("❌ Error loading balance:", error);
    return null;
  }
}

// Export
window.BalanceModule = {
  load: loadBalance,
};
// ============================================
// BALANCE MODULE
// ============================================

async function loadBalance() {
  try {
    const response = await fetch(API_URL + "/balance");
    const data = await response.json();

    // Cache the balance for other modules (expenses.js reads this)
    window.__currentBalance = data.balance;
    window.__currentEarnings = data.total_earnings;
    window.__currentExpenses = data.total_expenses;



    // ---------- Top nav balance badges ----------
    const topnavEarnings = document.getElementById("topnavTotalEarnings");
    const topnavExpenses = document.getElementById("topnavTotalExpenses");
    const topnavAvailable = document.getElementById("topnavAvailableBalance");

    if (topnavEarnings)
      topnavEarnings.textContent = Utils.formatCurrency(data.total_earnings);
    if (topnavExpenses)
      topnavExpenses.textContent = Utils.formatCurrency(data.total_expenses);
    if (topnavAvailable)
      topnavAvailable.textContent = Utils.formatCurrency(data.balance);

    // ---------- Expense form "Available balance" indicator ----------
    const expenseAvailableEl = document.getElementById("expenseAvailableBalance");
    if (expenseAvailableEl) {
      expenseAvailableEl.textContent = Utils.formatCurrency(data.balance);

      // Color-code based on remaining balance
      if (data.balance <= 0) {
        expenseAvailableEl.style.color = "#dc3545"; // red
      } else if (data.balance < 50) {
        expenseAvailableEl.style.color = "#f39c12"; // amber
      } else {
        expenseAvailableEl.style.color = "#28a745"; // green
      }
    }
        // Available to Spend banner (Expenses tab)
    const banner = document.getElementById("availableToSpendCard");
    const bannerValue = document.getElementById("availableToSpendValue");

    if (bannerValue) {
      bannerValue.textContent = Utils.formatCurrency(data.balance);
    }

    if (banner) {
      banner.classList.remove("low", "empty");
      if (data.balance <= 0) {
        banner.classList.add("empty"); // red
      } else if (data.balance < 50) {
        banner.classList.add("low"); // amber
      }
      // else default = green
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
// ============================================
// BALANCE MODULE
// ============================================

async function loadBalance() {
  const base =
    (window.APP_CONFIG && window.APP_CONFIG.API_URL) ||
    window.API_URL ||
    "http://localhost:3000/api";

  try {
    const response = await fetch(base + "/balance");
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();

    window.__currentBalance = Number(data.balance) || 0;
    window.__currentEarnings = Number(data.total_earnings) || 0;
    window.__currentExpenses = Number(data.total_expenses) || 0;

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "£" + (Number(val) || 0).toFixed(2);
    };

    setText("allTimeEarningsValue", data.total_earnings);
    setText("balanceValue", data.balance);
    setText("totalEarningsBalance", data.total_earnings);
    setText("totalExpensesBalance", data.total_expenses);
    setText("availableBalance", data.balance);

    const balanceCard = document.getElementById("balanceCard");
    if (balanceCard) {
      balanceCard.classList.remove("low", "empty");
      if (Number(data.balance) <= 0) balanceCard.classList.add("empty");
      else if (Number(data.balance) < 50) balanceCard.classList.add("low");
    }

    const expenseAvailableEl = document.getElementById("expenseAvailableBalance");
    if (expenseAvailableEl) {
      expenseAvailableEl.textContent = "£" + (Number(data.balance) || 0).toFixed(2);
      const bal = Number(data.balance) || 0;
      if (bal <= 0) expenseAvailableEl.style.color = "#dc3545";
      else if (bal < 50) expenseAvailableEl.style.color = "#f39c12";
      else expenseAvailableEl.style.color = "#28a745";
    }

    console.log("[BALANCE] success:", data);
    return data;
  } catch (err) {
    console.error("[BALANCE] failed:", err);
    return null;
  }
}

window.BalanceModule = {
  load: loadBalance,
};

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (typeof loadBalance === "function") loadBalance();
  }, 400);
});

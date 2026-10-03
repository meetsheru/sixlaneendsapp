// ============================================
// EXPENSES MODULE
// ============================================

// DOM Elements
const expenseForm = document.getElementById("expenseForm");
const expenseDateInput = document.getElementById("expenseDateInput");
const expenseAmountInput = document.getElementById("expenseAmountInput");
const expenseReasonInput = document.getElementById("expenseReasonInput");
const expenseFilterDate = document.getElementById("expenseFilterDate");
const expenseClearFilterBtn = document.getElementById("expenseClearFilterBtn");
const expensesList = document.getElementById("expensesList");
const expenseMessageContainer = document.getElementById("expenseMessageContainer");
const expenseAvailableBalance = document.getElementById("expenseAvailableBalance");
const expenseBalanceWarning = document.getElementById("expenseBalanceWarning");
const expenseBalanceWarningText = document.getElementById("expenseBalanceWarningText");

// ============================================
// INIT
// ============================================
function initExpenses() {
  if (expenseDateInput) {
    expenseDateInput.value = Utils.getToday();
  }

  if (expenseForm) {
    expenseForm.addEventListener("submit", handleExpenseSubmit);
  }

  if (expenseFilterDate) {
    expenseFilterDate.addEventListener("change", function () {
      loadExpenses(expenseFilterDate.value);
    });
  }

  if (expenseClearFilterBtn) {
    expenseClearFilterBtn.addEventListener("click", function () {
      if (expenseFilterDate) expenseFilterDate.value = "";
      loadExpenses();
    });
  }

  if (expenseAmountInput) {
    expenseAmountInput.addEventListener("input", checkBalance);
  }

  loadExpenses();
  if (typeof loadBalance === "function") loadBalance();
}

// ============================================
// SUBMIT EXPENSE
// ============================================
async function handleExpenseSubmit(e) {
  e.preventDefault();
  console.log("Expense form submitted");

  const date = expenseDateInput ? expenseDateInput.value : null;
  const amount = expenseAmountInput ? parseFloat(expenseAmountInput.value) : null;
  const reason = expenseReasonInput ? expenseReasonInput.value.trim() : null;

  // --- Validation ---
  if (!date) {
    Utils.showMessage(expenseMessageContainer, "Please select a date", "error");
    return;
  }
  if (!amount || amount <= 0) {
    Utils.showMessage(expenseMessageContainer, "Please enter a valid positive amount", "error");
    return;
  }
  if (!reason) {
    Utils.showMessage(expenseMessageContainer, "Please enter a reason for the expense", "error");
    return;
  }

  // --- Block overspend (frontend guard) ---
  const currentBalance = Number(window.__currentBalance) || 0;
  if (amount > currentBalance) {
    Utils.showMessage(
      expenseMessageContainer,
      "Cannot add expense of £" + amount.toFixed(2) +
        ". Available balance is only £" + currentBalance.toFixed(2),
      "error"
    );
    return;
  }

  const data = { date, amount, reason };

  try {
    const response = await fetch(API_URL + "/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Server error");
    }

    const result = await response.json();
    console.log("Expense saved:", result);

    Utils.showMessage(
      expenseMessageContainer,
      "Expense added: £" + result.expense.amount + " - " + result.expense.reason,
      "success"
    );

    if (expenseAmountInput) expenseAmountInput.value = "";
    if (expenseReasonInput) expenseReasonInput.value = "";
    if (expenseAmountInput) expenseAmountInput.style.borderColor = "";

    loadExpenses();
    if (typeof loadBalance === "function") loadBalance();
    if (typeof loadStatistics === "function") loadStatistics();
    if (typeof loadPeriodSummary === "function") loadPeriodSummary();

  } catch (error) {
    console.error("Error saving expense:", error);
    Utils.showMessage(expenseMessageContainer, error.message, "error");
  }
}

// ============================================
// LOAD EXPENSES
// ============================================
async function loadExpenses(date) {
  date = date || null;
  console.log("Loading expenses...");
  const list = expensesList;
  if (!list) return;

  try {
    let url = API_URL + "/expenses";
    if (date) url += "?date=" + date;

    const response = await fetch(url);
    const expenses = await response.json();
    console.log("Received expenses:", expenses.length, "entries");
    displayExpenses(expenses);

  } catch (error) {
    console.error("Error loading expenses:", error);
    if (list) list.innerHTML = '<p class="error">Failed to load expenses</p>';
  }
}

// ============================================
// DISPLAY EXPENSES
// ============================================
function displayExpenses(expenses) {
  const list = expensesList;
  if (!list) return;

  if (!expenses || expenses.length === 0) {
    list.innerHTML = '<p class="no-data">No expenses found</p>';
    return;
  }

  let html = "";
  let currentDate = "";
  let dailyTotal = 0;

  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];

    try {
      const formattedDate = Utils.formatDate(expense.date);
      const dateString = expense.date.split("T")[0];

      // New day group header
      if (currentDate !== dateString) {
        if (currentDate !== "") {
          html +=
            '<div style="background:#e9ecef;padding:10px;margin:10px 0;border-radius:5px;font-weight:bold;text-align:right;color:#dc3545;">Daily Expenses: ' +
            Utils.formatCurrency(dailyTotal) +
            "</div>";
          dailyTotal = 0;
        }
        currentDate = dateString;
        html +=
          '<div style="background:#dc3545;color:white;padding:10px;border-radius:5px;margin:15px 0 10px 0;font-weight:bold;font-size:1.1rem;">' +
          formattedDate +
          "</div>";
      }

      const amountNum = parseFloat(expense.amount) || 0;
      dailyTotal += amountNum;

      html +=
        '<div style="background:#f8f9fa;padding:15px 20px;border-radius:10px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;border-left:4px solid #dc3545;">';
      html += "<div>";
      html +=
        '<div style="font-weight:600;color:#dc3545;font-size:0.9rem;">' +
        (expense.time || "00:00:00") +
        "</div>";
      html +=
        '<div style="font-size:1.2rem;font-weight:700;color:#dc3545;">' +
        Utils.formatCurrency(amountNum) +
        "</div>";
      html +=
        '<div style="color:#333;font-weight:500;">' + expense.reason + "</div>";
      html += "</div>";
      html +=
        '<div><button onclick="deleteExpense(' +
        expense.id +
        ')" style="background:#dc3545;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;font-size:12px;">Delete</button></div>';
      html += "</div>";
    } catch (err) {
      console.error("Error processing expense:", expense, err);
    }
  }

  if (currentDate !== "") {
    html +=
      '<div style="background:#e9ecef;padding:10px;margin:10px 0;border-radius:5px;font-weight:bold;text-align:right;color:#dc3545;">Daily Expenses: ' +
      Utils.formatCurrency(dailyTotal) +
      "</div>";
  }

  list.innerHTML = html;
  console.log("Expenses display complete");
}

// ============================================
// DELETE EXPENSE
// ============================================
window.deleteExpense = async function (id) {
  console.log("Deleting expense ID:", id);

  if (!confirm("Delete this expense?")) return;

  try {
    const response = await fetch(API_URL + "/expenses/" + id, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete expense");

    Utils.showMessage(expenseMessageContainer, "Expense deleted successfully", "success");
    loadExpenses(expenseFilterDate ? expenseFilterDate.value : null);
    if (typeof loadBalance === "function") loadBalance();
    if (typeof loadStatistics === "function") loadStatistics();
    if (typeof loadPeriodSummary === "function") loadPeriodSummary();

  } catch (error) {
    console.error("Error deleting expense:", error);
    Utils.showMessage(expenseMessageContainer, "Failed to delete: " + error.message, "error");
  }
};

// ============================================
// CHECK BALANCE (client-side, uses cached value)
// ============================================
function checkBalance() {
  const amount = parseFloat(expenseAmountInput.value) || 0;
  const currentBalance = Number(window.__currentBalance) || 0;

  if (amount > currentBalance) {
    expenseAmountInput.style.borderColor = "#dc3545";
    if (expenseBalanceWarning && expenseBalanceWarningText) {
      expenseBalanceWarning.style.display = "block";
      expenseBalanceWarningText.textContent =
        "You need £" + amount.toFixed(2) +
        " but only have £" + currentBalance.toFixed(2) + " available.";
    }
  } else {
    expenseAmountInput.style.borderColor = "#28a745";
    if (expenseBalanceWarning) {
      expenseBalanceWarning.style.display = "none";
    }
  }
}

// ============================================
// EXPORT
// ============================================
window.ExpensesModule = {
  init: initExpenses,
  load: loadExpenses,
  display: displayExpenses,
};
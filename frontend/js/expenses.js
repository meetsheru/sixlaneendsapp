// ============================================
// EXPENSES MODULE (with line items + receipt)
// ============================================

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

// New for line items
const expenseItemsList = document.getElementById("expenseItemsList");
const expenseAddItemBtn = document.getElementById("expenseAddItemBtn");
const expenseItemsTotal = document.getElementById("expenseItemsTotal");
const expenseReceiptInput = document.getElementById("expenseReceiptInput");

// Cache of master items
let __expenseItemsCache = [];

// ============================================
// INIT
// ============================================
function initExpenses() {
  if (expenseDateInput) expenseDateInput.value = Utils.getToday();

  if (expenseForm) expenseForm.addEventListener("submit", handleExpenseSubmit);
  if (expenseFilterDate)
    expenseFilterDate.addEventListener("change", function () {
      loadExpenses(expenseFilterDate.value);
    });
  if (expenseClearFilterBtn)
    expenseClearFilterBtn.addEventListener("click", function () {
      if (expenseFilterDate) expenseFilterDate.value = "";
      loadExpenses();
    });
  if (expenseAddItemBtn)
    expenseAddItemBtn.addEventListener("click", function () {
      addItemRow();
    });

  // Load master items + first empty row
  loadExpenseItems().then(() => {
    addItemRow();
    recalculateTotal();
  });

  loadExpenses();
  if (typeof loadBalance === "function") loadBalance();
}

// ============================================
// MASTER ITEMS
// ============================================
async function loadExpenseItems() {
  try {
    const res = await fetch(API_URL + "/expense-items");
    __expenseItemsCache = await res.json();
  } catch (err) {
    console.error("Failed to load expense items:", err);
    __expenseItemsCache = [];
  }
}

// ============================================
// ITEM ROWS
// ============================================
function addItemRow() {
  if (!expenseItemsList) return;

  const row = document.createElement("div");
  row.className = "expense-item-row";

  // Dropdown
  const select = document.createElement("select");
  select.className = "expense-item-select";
  select.innerHTML =
    '<option value="">-- Select item --</option>' +
    __expenseItemsCache
      .map((it) => `<option value="${it.id}" data-name="${it.name}">${it.name}</option>`)
      .join("");

  // Amount
  const amount = document.createElement("input");
  amount.type = "number";
  amount.className = "expense-item-amount";
  amount.placeholder = "£";
  amount.step = "0.01";
  amount.min = "0";
  amount.addEventListener("input", recalculateTotal);

  // Remove button
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "expense-item-remove";
  remove.innerText = "×";
  remove.onclick = () => {
    row.remove();
    recalculateTotal();
  };

  row.appendChild(select);
  row.appendChild(amount);
  row.appendChild(remove);

  expenseItemsList.appendChild(row);
  select.focus();
}

function recalculateTotal() {
  const rows = expenseItemsList.querySelectorAll(".expense-item-row");
  let sum = 0;
  rows.forEach((r) => {
    const v = parseFloat(r.querySelector(".expense-item-amount").value) || 0;
    sum += v;
  });
  if (expenseItemsTotal) expenseItemsTotal.innerText = "£" + sum.toFixed(2);
  if (expenseAmountInput) expenseAmountInput.value = sum.toFixed(2);

  // Recheck balance
  checkBalance();
}

// ============================================
// SUBMIT
// ============================================
async function handleExpenseSubmit(e) {
  e.preventDefault();
  console.log("Expense form submitted");

  const date = expenseDateInput ? expenseDateInput.value : null;
  const reason = expenseReasonInput ? expenseReasonInput.value.trim() : null;
  const amount = parseFloat(expenseAmountInput?.value || 0);

  if (!date) {
    Utils.showMessage(expenseMessageContainer, "Please select a date", "error");
    return;
  }
  if (!reason) {
    Utils.showMessage(expenseMessageContainer, "Please enter a reason", "error");
    return;
  }
  if (!amount || amount <= 0) {
    Utils.showMessage(expenseMessageContainer, "Please add at least one item with an amount", "error");
    return;
  }

  // Collect line items
  const rows = expenseItemsList.querySelectorAll(".expense-item-row");
  const items = [];
  rows.forEach((r) => {
    const sel = r.querySelector(".expense-item-select");
    const amt = parseFloat(r.querySelector(".expense-item-amount").value) || 0;
    if (!sel.value || amt <= 0) return;

    const itemName = sel.options[sel.selectedIndex].getAttribute("data-name");
    items.push({
      item_id: parseInt(sel.value),
      name: itemName,
      amount: amt,
    });
  });

  if (items.length === 0) {
    Utils.showMessage(expenseMessageContainer, "Please add at least one item", "error");
    return;
  }

  // Balance check
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

  // Build FormData (needed for receipt upload)
  const fd = new FormData();
  fd.append("date", date);
  fd.append("amount", amount.toFixed(2));
  fd.append("reason", reason);
  fd.append("items", JSON.stringify(items));

  if (expenseReceiptInput && expenseReceiptInput.files[0]) {
    fd.append("receipt", expenseReceiptInput.files[0]);
  }

  try {
    const response = await fetch(API_URL + "/expenses", {
      method: "POST",
      body: fd,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Server error");
    }

    const result = await response.json();
    console.log("Expense saved:", result);

    Utils.showMessage(
      expenseMessageContainer,
      "Expense added: £" + amount.toFixed(2) + " - " + reason,
      "success"
    );

    // Reset
    expenseReasonInput.value = "";
    if (expenseReceiptInput) expenseReceiptInput.value = "";
    expenseItemsList.innerHTML = "";
    loadExpenseItems().then(() => {
      addItemRow();
      recalculateTotal();
    });

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
// async function loadExpenses(date) {
//   date = date || null;
//   const list = expensesList;
//   if (!list) return;

//   try {
//     let url = API_URL + "/expenses";
//     if (date) url += "?date=" + date;

//     const response = await fetch(url);
//     const expenses = await response.json();
//     displayExpenses(expenses);
//   } catch (error) {
//     console.error("Error loading expenses:", error);
//     if (list) list.innerHTML = '<p class="error">Failed to load expenses</p>';
//   }
// }

async function loadExpenses(date) {
  date = date || null;
  const list = expensesList;
  if (!list) return;

  try {
    // For the breakdown tables, always fetch ALL expenses (not filtered by date)
    let allUrl = API_URL + "/expenses";
    const allRes = await fetch(allUrl);
    const allExpenses = await allRes.json();

    // Filter for the list display
    let filtered = allExpenses;
    if (date) {
      filtered = allExpenses.filter((e) => (e.date || "").split("T")[0] === date);
    }

    displayExpenses(filtered);
    renderWeeklyExpenseBreakdown(allExpenses);
    renderMonthlyExpenseBreakdown(allExpenses);
  } catch (error) {
    console.error("Error loading expenses:", error);
    if (list) list.innerHTML = '<p class="error">Failed to load expenses</p>';
  }
}

// ============================================
// DISPLAY EXPENSES (with line items)
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

      // Line items block
      let itemsHtml = "";
      if (expense.items && expense.items.length) {
        itemsHtml =
          '<div style="margin-top:8px;font-size:0.85em;color:#555;">' +
          expense.items
            .map((it) => `• ${it.item_name}: £${parseFloat(it.amount).toFixed(2)}`)
            .join("<br>") +
          "</div>";
      }

      const receiptHtml = expense.receipt_path
        ? '<div style="margin-top:6px;"><a href="/uploads/expense-receipts/' +
          expense.receipt_filename +
          '" target="_blank" style="font-size:0.85em;color:#007bff;">📎 View receipt</a></div>'
        : "";

      html +=
        '<div style="background:#f8f9fa;padding:15px 20px;border-radius:10px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-start;border-left:4px solid #dc3545;">';
      html += "<div style='flex:1'>";
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
      html += itemsHtml;
      html += receiptHtml;
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
}

// ============================================
// DELETE
// ============================================
window.deleteExpense = async function (id) {
  if (!confirm("Delete this expense?")) return;

  try {
    const response = await fetch(API_URL + "/expenses/" + id, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete");

    Utils.showMessage(expenseMessageContainer, "Expense deleted", "success");
    loadExpenses(expenseFilterDate ? expenseFilterDate.value : null);
    if (typeof loadBalance === "function") loadBalance();
  } catch (error) {
    console.error("Error deleting expense:", error);
    Utils.showMessage(expenseMessageContainer, error.message, "error");
  }
};

// ============================================
// CHECK BALANCE
// ============================================
function checkBalance() {
  const amount = parseFloat(expenseAmountInput?.value) || 0;
  const currentBalance = Number(window.__currentBalance) || 0;

  if (amount > currentBalance) {
    if (expenseAmountInput) expenseAmountInput.style.borderColor = "#dc3545";
    if (expenseBalanceWarning && expenseBalanceWarningText) {
      expenseBalanceWarning.style.display = "block";
      expenseBalanceWarningText.textContent =
        "You need £" + amount.toFixed(2) +
        " but only have £" + currentBalance.toFixed(2) + " available.";
    }
  } else {
    if (expenseBalanceWarning) expenseBalanceWarning.style.display = "none";
  }
}

// ============================================
// WEEKLY BREAKDOWN
// ============================================
function renderWeeklyExpenseBreakdown(expenses) {
  const container = document.getElementById("expensesWeeklyBreakdown");
  if (!container) return;

  // Group by week (Monday start)
  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const map = new Map();
  expenses.forEach((e) => {
    const d = new Date(e.date);
    const ws = getWeekStart(d);
    const key = toLocalDateStr(ws);
    if (!map.has(key)) map.set(key, { key, total: 0, count: 0 });
    const b = map.get(key);
    b.total += parseFloat(e.amount) || 0;
    b.count += 1;
  });

  const weeks = Array.from(map.values()).sort((a, b) =>
    b.key.localeCompare(a.key)
  );

  if (!weeks.length) {
    container.innerHTML = '<p class="loading">No expenses in this period.</p>';
    return;
  }

  const currentWeekStart = toLocalDateStr(getWeekStart(new Date()));

  let html = `
    <div style="overflow-x:auto;">
      <table class="item-report-table">
        <thead>
          <tr>
            <th>🗓️ Week</th>
            <th class="right">📦 Count</th>
            <th class="right">💸 Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  weeks.forEach((w) => {
    const [y, m, dd] = w.key.split("-");
    const start = new Date(parseInt(y), parseInt(m) - 1, parseInt(dd));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const isCurrent = w.key === currentWeekStart;
    const badge = isCurrent
      ? ' <span style="background:#dc3545;color:white;padding:2px 8px;border-radius:10px;font-size:0.7em;margin-left:6px;">CURRENT</span>'
      : "";
    const rowStyle = isCurrent
      ? "background:#ffe5e5; font-weight:600; border-bottom:1px solid #eee;"
      : "border-bottom:1px solid #eee;";

    const startStr = start.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    const endStr = end.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    html += `
      <tr style="${rowStyle}">
        <td style="padding:10px 12px;">${startStr} – ${endStr}${badge}</td>
        <td class="right" style="padding:10px 12px;">${w.count}</td>
        <td class="right" style="padding:10px 12px;color:#dc3545;font-weight:bold;">£${w.total.toFixed(2)}</td>
      </tr>
    `;
  });

  const totalCount = weeks.reduce((s, w) => s + w.count, 0);
  const totalSum = weeks.reduce((s, w) => s + w.total, 0);

  html += `
        </tbody>
        <tfoot>
          <tr style="background:#0f3460;color:white;font-weight:bold;">
            <td style="padding:10px 12px;">TOTAL</td>
            <td class="right" style="padding:10px 12px;">${totalCount}</td>
            <td class="right" style="padding:10px 12px;">£${totalSum.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

// ============================================
// MONTHLY BREAKDOWN
// ============================================
function renderMonthlyExpenseBreakdown(expenses) {
  const container = document.getElementById("expensesMonthlyBreakdown");
  if (!container) return;

  const map = new Map();
  expenses.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, { key, total: 0, count: 0 });
    const b = map.get(key);
    b.total += parseFloat(e.amount) || 0;
    b.count += 1;
  });

  const months = Array.from(map.values()).sort((a, b) =>
    b.key.localeCompare(a.key)
  );

  if (!months.length) {
    container.innerHTML = '<p class="loading">No expenses in this period.</p>';
    return;
  }

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let html = `
    <div style="overflow-x:auto;">
      <table class="item-report-table">
        <thead>
          <tr>
            <th>📅 Month</th>
            <th class="right">📦 Count</th>
            <th class="right">💸 Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  months.forEach((m) => {
    const [y, mm] = m.key.split("-");
    const readable = new Date(parseInt(y), parseInt(mm) - 1, 1).toLocaleDateString(
      "en-GB",
      { month: "long", year: "numeric" }
    );

    const isCurrent = m.key === currentKey;
    const badge = isCurrent
      ? ' <span style="background:#dc3545;color:white;padding:2px 8px;border-radius:10px;font-size:0.7em;margin-left:6px;">CURRENT</span>'
      : "";
    const rowStyle = isCurrent
      ? "background:#ffe5e5; font-weight:600; border-bottom:1px solid #eee;"
      : "border-bottom:1px solid #eee;";

    html += `
      <tr style="${rowStyle}">
        <td style="padding:10px 12px;">${readable}${badge}</td>
        <td class="right" style="padding:10px 12px;">${m.count}</td>
        <td class="right" style="padding:10px 12px;color:#dc3545;font-weight:bold;">£${m.total.toFixed(2)}</td>
      </tr>
    `;
  });

  const totalCount = months.reduce((s, m) => s + m.count, 0);
  const totalSum = months.reduce((s, m) => s + m.total, 0);

  html += `
        </tbody>
        <tfoot>
          <tr style="background:#0f3460;color:white;font-weight:bold;">
            <td style="padding:10px 12px;">ALL TIME TOTAL</td>
            <td class="right" style="padding:10px 12px;">${totalCount}</td>
            <td class="right" style="padding:10px 12px;">£${totalSum.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

// ============================================
// EXPORT
// ============================================
window.ExpensesModule = {
  init: initExpenses,
  load: loadExpenses,
  display: displayExpenses,
};
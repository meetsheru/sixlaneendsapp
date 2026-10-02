// ============================================
// TAB NAVIGATION + TOP NAV DROPDOWN
// ============================================

function initTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn, .nav-item");
  const tabContents = document.querySelectorAll(".tab-content");

  console.log(`🔧 initTabs: found ${tabBtns.length} buttons, ${tabContents.length} panels`);

  tabBtns.forEach(function (btn) {
    // Skip if we already attached a listener (mark with data attribute)
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";

    btn.addEventListener("click", function () {
      const tabKey = btn.dataset.tab;
      console.log(`👆 Clicked tab: ${tabKey}`);

      // Remove active from all buttons and panels
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      // Activate clicked button
      btn.classList.add("active");

      // Show target panel
      const tabId = "tab-" + tabKey;
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add("active");
        console.log(`✅ Activated panel: ${tabId}`);
      } else {
        console.warn(`❌ No panel found: ${tabId}`);
      }

      // Trigger data load for the tab
      switch (tabKey) {
        case "earnings":
          if (typeof loadEarnings === "function") loadEarnings();
          if (typeof loadBalance === "function") loadBalance();
          break;
        case "expenses":
          if (typeof loadExpenses === "function") loadExpenses();
          if (typeof loadBalance === "function") loadBalance();
          console.log("💰 Called loadBalance() for expenses tab");
          break;
        case "inventory":
          if (typeof loadInventory === "function") loadInventory();
          if (typeof loadStock === "function") loadStock();
          break;
        case "history":
          if (typeof loadCombinedAudit === "function") loadCombinedAudit();
          break;
        case "statistics":
          if (typeof loadStatistics === "function") loadStatistics();
          if (typeof loadPeriodSummary === "function") loadPeriodSummary();
          if (typeof loadBalance === "function") loadBalance();
          break;
        case "shop-sales":
          if (typeof ShopSalesModule !== "undefined") ShopSalesModule.load();
          break;
        case "shop-orders":
          if (typeof ShopOrderModule !== "undefined" && ShopOrderModule.loadHistory) {
            ShopOrderModule.loadHistory();
          }
          if (typeof loadBalance === "function") loadBalance();
          break;
      }
    });
  });
}
window.initTabs = initTabs;

// ============================================
// TOP NAV DROPDOWN
// ============================================
function initTopNavDropdown() {
  const menuBtn = document.getElementById("nav-menu-btn");
  const dropdown = document.getElementById("nav-dropdown");
  const currentLabel = document.getElementById("nav-current-label");
  if (!menuBtn || !dropdown) {
    console.warn("Dropdown elements not found");
    return;
  }

  // Prevent double-binding
  if (menuBtn.dataset.bound === "true") return;
  menuBtn.dataset.bound = "true";

  // Toggle dropdown
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  });

  // Update label + close dropdown on item click
  dropdown.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (currentLabel) {
        currentLabel.textContent = item.textContent.trim();
      }
      dropdown.classList.add("hidden");
    });
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (dropdown.classList.contains("hidden")) return;
    if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") dropdown.classList.add("hidden");
  });

  console.log("✅ Dropdown initialized");
}

// ============================================
// BOOTSTRAP
// ============================================
function bootstrapNav() {
  if (typeof initTabs === "function") initTabs();
  if (typeof initTopNavDropdown === "function") initTopNavDropdown();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapNav);
} else {
  bootstrapNav();
}

window.bootstrapNav = bootstrapNav;
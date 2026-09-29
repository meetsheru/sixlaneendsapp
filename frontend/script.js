// ============================================
// MAIN ENTRY POINT - LOADS ALL MODULES
// ============================================

console.log("🔴 SCRIPT.JS IS LOADED!");

// API Configuration
// const API_URL = "http://localhost:3000/api";

// ============================================
// LOAD ALL MODULES
// ============================================

// First, load the module files dynamically
function loadScripts() {
  const scripts = [
    'js/api.js',        // <-- MUST BE FIRST
    'js/utils.js',
    'js/config.js',
    'js/balance.js',
    'js/statistics.js',
    'js/audit.js',
    'js/earnings.js',
    'js/expenses.js',
    'js/inventory.js',
    'js/tabs.js',
    'js/app.js'
];

  let loaded = 0;

  scripts.forEach(function (src) {
    const script = document.createElement("script");
    script.src = src + "?v=" + Date.now();
    script.async = false;
    script.onload = function () {
      loaded++;
      console.log("✅ Loaded:", src);
      if (loaded === scripts.length) {
        console.log("🚀 All modules loaded!");
        // Trigger app start
        if (typeof startApp === "function") {
          startApp();
        }
      }
    };
    script.onerror = function () {
      console.error("❌ Failed to load:", src);
    };
    document.head.appendChild(script);
  });
}

// Start loading
document.addEventListener("DOMContentLoaded", function () {
  console.log("📦 Loading modules...");
  loadScripts();
});

// Fallback - if DOM already loaded
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  console.log("📦 DOM already ready, loading modules...");
  loadScripts();
}

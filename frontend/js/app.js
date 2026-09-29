// ============================================
// MAIN APPLICATION - START
// ============================================

console.log('🚀 App module loaded...');

function startApp() {
    console.log('✅ Starting application...');
    
    // Initialize tabs
    if (typeof initTabs === 'function') {
        initTabs();
        console.log('✅ Tabs initialized');
    }
    
    // Initialize modules
    if (typeof initEarnings === 'function') {
        initEarnings();
        console.log('✅ Earnings initialized');
    }
    
    if (typeof initExpenses === 'function') {
        initExpenses();
        console.log('✅ Expenses initialized');
    }
    
    if (typeof initInventory === 'function') {
        initInventory();
        console.log('✅ Inventory initialized');
    }
    
    // Load initial data
    if (typeof loadBalance === 'function') {
        loadBalance();
        console.log('✅ Balance loaded');
    }
    
    if (typeof loadStatistics === 'function') {
        loadStatistics();
        console.log('✅ Statistics loaded');
    }
    
    if (typeof loadPeriodSummary === 'function') {
        loadPeriodSummary();
        console.log('✅ Period summary loaded');
    }
    
    if (typeof loadAudit === 'function') {
        loadAudit();
        console.log('✅ Audit loaded');
    }
    
    console.log('🚀 Application ready!');
}

// If all modules are already loaded, start immediately
if (typeof initEarnings === 'function' && typeof initInventory === 'function') {
    startApp();
}
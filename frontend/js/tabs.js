// Tab Navigation

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Remove active from all
            tabBtns.forEach(function(b) { b.classList.remove('active'); });
            tabContents.forEach(function(c) { c.classList.remove('active'); });
            
            // Add active to clicked
            btn.classList.add('active');
            const tabId = 'tab-' + btn.dataset.tab;
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            // Load data based on tab
            switch(btn.dataset.tab) {
                case 'expenses':
                    if (typeof loadExpenses === 'function') loadExpenses();
                    if (typeof loadBalance === 'function') loadBalance();
                    break;
                case 'inventory':
                    if (typeof loadInventory === 'function') loadInventory();
                    if (typeof loadStock === 'function') loadStock();
                    break;
                case 'history':
                    if (typeof loadCombinedAudit === 'function') loadCombinedAudit();
                    break;
                case 'statistics':
                    if (typeof loadStatistics === 'function') loadStatistics();
                    if (typeof loadPeriodSummary === 'function') loadPeriodSummary();
                    if (typeof loadBalance === 'function') loadBalance();
                    break;
            }
        });
    });
}

// Export for global use
window.initTabs = initTabs;
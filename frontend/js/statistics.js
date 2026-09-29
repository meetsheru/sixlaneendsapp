// ============================================
// STATISTICS MODULE
// ============================================

async function loadStatistics() {
    try {
        const response = await fetch(API_URL + '/statistics');
        const stats = await response.json();
        
        const totalEntries = document.getElementById('totalEntries');
        const totalEarnings = document.getElementById('totalEarnings');
        const averageEarning = document.getElementById('averageEarning');
        const minMaxEarning = document.getElementById('minMaxEarning');
        
        if (totalEntries) totalEntries.textContent = stats.total_entries || 0;
        if (totalEarnings) totalEarnings.textContent = Utils.formatCurrency(stats.total_earnings || 0);
        if (averageEarning) averageEarning.textContent = Utils.formatCurrency(stats.average_earning || 0);
        
        const min = stats.min_earning || 0;
        const max = stats.max_earning || 0;
        if (minMaxEarning) minMaxEarning.textContent = Utils.formatCurrency(min) + ' / ' + Utils.formatCurrency(max);
        
    } catch (error) {
        console.error('❌ Error loading statistics:', error);
    }
}

async function loadDailySummary() {
    try {
        const today = Utils.getToday();
        const response = await fetch(API_URL + '/earnings?date=' + today);
        const earnings = await response.json();
        
        let total = 0;
        earnings.forEach(function(e) {
            total += parseFloat(e.amount) || 0;
        });
        
        const todayTotal = document.getElementById('todayTotal');
        const todayEntries = document.getElementById('todayEntries');
        
        if (todayTotal) todayTotal.textContent = Utils.formatCurrency(total);
        if (todayEntries) todayEntries.textContent = earnings.length;
    } catch (error) {
        console.error('❌ Error loading daily summary:', error);
    }
}

async function loadPeriodSummary() {
    try {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const response = await fetch(API_URL + '/earnings');
        const allEarnings = await response.json();
        
        let weekTotal = 0;
        let monthTotal = 0;
        let allTotal = 0;
        
        allEarnings.forEach(function(e) {
            const date = new Date(e.date);
            const amount = parseFloat(e.amount) || 0;
            allTotal += amount;
            
            if (date >= weekStart) weekTotal += amount;
            if (date >= monthStart) monthTotal += amount;
        });
        
        const weekTotalEl = document.getElementById('weekTotal');
        const monthTotalEl = document.getElementById('monthTotal');
        const allTimeTotalEl = document.getElementById('allTimeTotal');
        
        if (weekTotalEl) weekTotalEl.textContent = Utils.formatCurrency(weekTotal);
        if (monthTotalEl) monthTotalEl.textContent = Utils.formatCurrency(monthTotal);
        if (allTimeTotalEl) allTimeTotalEl.textContent = Utils.formatCurrency(allTotal);
        
    } catch (error) {
        console.error('❌ Error loading period summary:', error);
    }
}

// Export
window.StatisticsModule = {
    load: loadStatistics,
    loadDaily: loadDailySummary,
    loadPeriod: loadPeriodSummary
};
// Utility functions

// Show message function
function showMessage(container, message, type = 'success') {
    console.log('📢 Message:', message, type);
    if (!container) {
        alert(message);
        return;
    }
    container.className = '';
    container.textContent = message;
    container.classList.add(type);
    container.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(function() {
            container.style.display = 'none';
        }, 5000);
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time
function formatTime(timeString) {
    if (!timeString) return '00:00:00';
    return timeString;
}

// Format currency
function formatCurrency(amount) {
    return '£' + parseFloat(amount || 0).toFixed(2);
}

// Get today's date
function getToday() {
    return new Date().toISOString().split('T')[0];
}

// Get current time
function getCurrentTime() {
    return new Date().toTimeString().slice(0, 8);
}

// Export for global use
window.Utils = {
    showMessage,
    formatDate,
    formatTime,
    formatCurrency,
    getToday,
    getCurrentTime
};
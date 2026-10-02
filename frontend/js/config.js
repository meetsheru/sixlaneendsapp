// API Configuration
// The base URL for all API calls
window.APP_CONFIG = window.APP_CONFIG || {};
window.APP_CONFIG.API_URL = 'http://localhost:3000/api';
// Expose globally for scripts that reference API_URL directly
window.API_URL = window.APP_CONFIG.API_URL;

// Also expose a global for scripts that reference `API_URL` directly
window.API_URL = window.APP_CONFIG.API_URL;

console.log('📡 API_URL:', window.APP_CONFIG.API_URL);
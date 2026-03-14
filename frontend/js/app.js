import { initDashboard } from './dashboard.js';
import { initProducts } from './products.js';
import { initReceipts } from './receipts.js';
import { initDeliveries } from './deliveries.js';
import { initTransfers } from './transfers.js';
import { initAdjustments } from './adjustments.js';
import { initAuth, initLoginForm } from './auth.js';

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
    
    // Auth initialization for protected pages
    if (!window.location.pathname.includes('login.html')) {
        initAuth();
    } else {
        initLoginForm();
    }

    // Page-specific initialization
    const path = window.location.pathname;
    
    if (path.includes('dashboard.html')) {
        initDashboard();
    } else if (path.includes('products.html')) {
        initProducts();
    } else if (path.includes('receipts.html')) {
        initReceipts();
    } else if (path.includes('deliveries.html')) {
        initDeliveries();
    } else if (path.includes('transfers.html')) {
        initTransfers();
    } else if (path.includes('adjustments.html')) {
        initAdjustments();
    }
    
    // Common UI logic (sidebar, user menu, etc.)
    initUI();
});

function initUI() {
    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('aside');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });
    }

    // User profile dropdown
    const userProfileBtn = document.getElementById('user-profile-btn');
    const userDropdown = document.getElementById('user-dropdown');
    if (userProfileBtn && userDropdown) {
        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
            userDropdown.classList.add('hidden');
        });
    }
}

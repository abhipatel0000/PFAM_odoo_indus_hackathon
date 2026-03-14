import { initModal, openModal, closeModal } from './modules/modal.js';
import { initToast } from './modules/toast.js';
import { initDropdown } from './modules/dropdown.js';
import { initSearch } from './modules/search.js';
import { initNotifications } from './modules/notifications.js';
import { initActivity, logActivity } from './modules/activity.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Shared Modules
    initModal();
    initToast();
    initDropdown();
    initSearch();
    initNotifications();
    initActivity();

    // Attach to window so we can use them in inline handlers
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.logActivity = logActivity;

    // 2. Page Specific Initialization
    const page = document.body.dataset.page;
    if (page) {
        console.log(`Initializing ${page} page...`);
        switch (page) {
            case 'dashboard':
                initDashboard();
                break;
            case 'products':
                initProducts();
                break;
            case 'deliveries':
                initDeliveries();
                break;
            case 'receipts':
                initReceipts();
                break;
        }
    }

    // Initialize mock data for activity if empty
    if (!localStorage.getItem('core_activity')) {
        logActivity('Product Added', 'Amoxicillin 500mg');
        logActivity('Delivery Shipped', 'Order #341');
        logActivity('Receipt Validated', 'Supplier RX Pharma');
    }
});

function initDashboard() { }
function initProducts() { }
function initDeliveries() { }
function initReceipts() { }

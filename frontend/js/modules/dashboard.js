import { apiCall } from '../api.js';

export function initDashboard() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = document.getElementById('userInfo');
    if (userInfo && user.name) {
        userInfo.textContent = `Welcome, ${user.name} (${user.role})`;
    }

    // Auth module handles standard logout buttons, but we can add dashboard specific logic here if needed
    
    loadDashboardStats();

    async function loadDashboardStats() {
        try {
            const response = await apiCall('/products');
            if (response.success && response.data) {
                const total = document.getElementById('totalProducts');
                if (total) {
                    total.textContent = response.data.length.toLocaleString();
                    total.classList.add('animate-pulse-slow');
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    }
}

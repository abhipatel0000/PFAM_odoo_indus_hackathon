import { apiCall } from './api.js';

export function initDashboard() {
    console.log('Initializing Dashboard Module');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = document.getElementById('userInfo');
    if (userInfo && user.name) {
        userInfo.textContent = `Welcome, ${user.name} (${user.role})`;
    }

    // Logout handler (backup — auth.js also sets this up)
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    async function loadDashboardStats() {
        try {
            const response = await apiCall('/products');
            if (response.success && response.data) {
                const total = document.getElementById('totalProducts');
                if (total) {
                    total.textContent = response.data.length.toLocaleString();
                    total.style.transition = 'all 0.5s ease';
                    total.style.color = '#10b981';
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    }

    loadDashboardStats();
}

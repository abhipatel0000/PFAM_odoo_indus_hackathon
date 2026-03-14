document.addEventListener('DOMContentLoaded', async function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = document.getElementById('userInfo');
    if (userInfo && user.name) {
        userInfo.textContent = `Welcome, ${user.name} (${user.role})`;
    }

    // auth.js now handles the logout button if present, 
    // but leaving this here in case there's another specific logoutBtn
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

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
});

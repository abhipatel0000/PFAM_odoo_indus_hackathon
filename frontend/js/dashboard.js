document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = document.getElementById('userInfo');
    if (userInfo && user.name) {
        userInfo.textContent = `Welcome, ${user.name} (${user.role})`;
    }

    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Mock data update
    setTimeout(() => {
        const total = document.getElementById('totalProducts');
        if (total) {
            total.textContent = '1,342';
            total.style.transition = 'all 0.5s ease';
            total.style.color = '#10b981';
        }
    }, 2000);
});

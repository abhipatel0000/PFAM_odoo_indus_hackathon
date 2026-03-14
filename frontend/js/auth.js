document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    console.log('Logging in:', username);
    
    // Simulating login for prototype
    if (username && pass) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify({ name: username, role: 'Inventory Manager' }));
        window.location.href = 'dashboard.html';
    } else {
        alert('Please enter credentials');
    }
});

// Check if already logged in (for other pages)
if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('products')) {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
    }
}

import { apiCall } from './api.js';

export function initAuth() {
    console.log('Auth Module initialized');
    
    // Check if already logged in (for protected pages)
    const protectedPages = ['dashboard', 'products', 'deliveries', 'receipts', 'transfers', 'adjustments', 'settings'];
    const path = window.location.pathname;
    const isProtectedPage = protectedPages.some(page => path.includes(page));

    if (isProtectedPage && !path.includes('login.html')) {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('Redirecting to login: No token found');
            window.location.href = 'login.html';
            return;
        }
        
        // Setup logout functionality
        setupLogout();
    }
}

export function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginBtn = e.target.querySelector('button[type="submit"]');

        if (username && password) {
            try {
                loginBtn.disabled = true;
                loginBtn.textContent = 'Logging in...';

                const response = await apiCall('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });

                if (response.success && response.token) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify({ name: username, role: 'Inventory Manager' }));
                    window.location.href = 'dashboard.html';
                } else {
                    alert(response.message || 'Login failed');
                }
            } catch (error) {
                alert(error.message || 'Unable to connect to server. Please try again.');
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        } else {
            alert('Please enter credentials');
        }
    });
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('[data-action="logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
}

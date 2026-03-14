<<<<<<< HEAD
import { apiCall } from './api.js';

export function initAuth() {
    console.log('Auth Module initialized');
    
    // Check if already logged in (for protected pages)
    const protectedPages = ['dashboard', 'products', 'deliveries', 'receipts', 'transfers', 'adjustments', 'settings'];
    const path = window.location.pathname;
    const isProtectedPage = protectedPages.some(page => path.includes(page));
=======
const apiBase = window.location.origin;

function setLoggedIn(user, token) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(user));
    if (token) {
        localStorage.setItem('authToken', token);
    }
    window.location.href = 'dashboard.html';
}

function showLogin() {
    document.getElementById('loginForm')?.classList.remove('hidden');
    document.getElementById('signupForm')?.classList.add('hidden');
    document.getElementById('loginPrompt')?.classList.remove('hidden');
    document.getElementById('signupPrompt')?.classList.add('hidden');
}

function showSignup() {
    document.getElementById('loginForm')?.classList.add('hidden');
    document.getElementById('signupForm')?.classList.remove('hidden');
    document.getElementById('loginPrompt')?.classList.add('hidden');
    document.getElementById('signupPrompt')?.classList.remove('hidden');
}

document.getElementById('showSignup')?.addEventListener('click', function (e) {
    e.preventDefault();
    showSignup();
});

document.getElementById('showLogin')?.addEventListener('click', function (e) {
    e.preventDefault();
    showLogin();
});

document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        return alert('Please enter both username and password.');
    }

    try {
        const res = await fetch(`${apiBase}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (!res.ok) {
            return alert(data?.message || 'Login failed');
        }

        setLoggedIn(data.user, data.token);
    } catch (err) {
        console.error('Login error', err);
        alert('Unable to reach server. Please try again later.');
    }
});

document.getElementById('signupForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !username || !email || !password) {
        return alert('Please fill in all fields.');
    }

    if (password !== confirmPassword) {
        return alert('Passwords do not match.');
    }

    try {
        const res = await fetch(`${apiBase}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, email, password, role: 'Inventory Manager' }),
        });

        const data = await res.json();
        if (!res.ok) {
            return alert(data?.message || 'Registration failed');
        }

        alert('Account created! You can now login.');
        showLogin();
    } catch (err) {
        console.error('Registration error', err);
        alert('Unable to reach server. Please try again later.');
    }
});
>>>>>>> 4f6c2025c38929cb9b7259e87ca8ba3be3091aba

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

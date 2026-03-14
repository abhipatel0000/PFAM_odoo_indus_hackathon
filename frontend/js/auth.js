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

    // Toggle between login and signup forms if they exist
    initAuthToggles();
}

function initAuthToggles() {
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginPrompt = document.getElementById('loginPrompt');
    const signupPrompt = document.getElementById('signupPrompt');

    if (showSignup) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm?.classList.add('hidden');
            signupForm?.classList.remove('hidden');
            loginPrompt?.classList.add('hidden');
            signupPrompt?.classList.remove('hidden');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm?.classList.remove('hidden');
            signupForm?.classList.add('hidden');
            loginPrompt?.classList.remove('hidden');
            signupPrompt?.classList.add('hidden');
        });
    }
}

export function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const loginBtn = e.target.querySelector('button[type="submit"]');

        if (username && password) {
            try {
                if (loginBtn) {
                    loginBtn.disabled = true;
                    loginBtn.textContent = 'Logging in...';
                }

                const response = await apiCall('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });

                // response format from remote: { user, token } or { success, token, user }
                // We'll handle both or assume the apiCall handles the success check
                const token = response.token;
                const user = response.user || { name: username, role: 'Inventory Manager' };

                if (token) {
                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(user));
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Login failed: Invalid response from server');
                }
            } catch (error) {
                alert(error.message || 'Unable to connect to server. Please try again.');
            } finally {
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Login';
                }
            }
        } else {
            alert('Please enter credentials');
        }
    });
}

export function initRegistrationForm() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const signupBtn = e.target.querySelector('button[type="submit"]');

        if (!name || !username || !email || !password) {
            return alert('Please fill in all fields.');
        }

        if (password !== confirmPassword) {
            return alert('Passwords do not match.');
        }

        try {
            if (signupBtn) {
                signupBtn.disabled = true;
                signupBtn.textContent = 'Creating account...';
            }

            const response = await apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ 
                    name, 
                    username, 
                    email, 
                    password, 
                    role: 'Manager' 
                })
            });

            alert('Account created! You can now login.');
            
            // Toggle back to login form
            document.getElementById('showLogin')?.click();
        } catch (error) {
            alert(error.message || 'Registration failed. Please try again.');
        } finally {
            if (signupBtn) {
                signupBtn.disabled = false;
                signupBtn.textContent = 'Create Account';
            }
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


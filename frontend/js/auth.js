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

// Check if already logged in (for other pages)
if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('products')) {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
    }
}

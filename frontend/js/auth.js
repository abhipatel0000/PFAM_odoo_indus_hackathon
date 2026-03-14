/**
 * MediSync Authentication Module
 * Handles: Login, Signup, OTP Verification, Forgot Password, Reset Password
 * Auto-detects current page and initializes the correct flow.
 */

const API_BASE = window.location.origin;

// ─── Utility Helpers ───────────────────────────
function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function hideError(id) {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
}
function showSuccess(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined text-xl animate-spin">progress_activity</span> Please wait...';
        btn.style.opacity = '0.7';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        btn.style.opacity = '1';
    }
}

function setLoggedIn(user, token) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(user));
    if (token) localStorage.setItem('authToken', token);
    window.location.href = 'dashboard.html';
}

// ─── Route Guard for Protected Pages ───────────
const protectedPages = ['dashboard', 'products', 'deliveries', 'receipts'];
const currentPath = window.location.pathname;
if (protectedPages.some(p => currentPath.includes(p))) {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
    }
}

// ─── Page Detection & Initialization ───────────
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm')) initLogin();
    if (document.getElementById('signupForm')) initSignup();
    if (document.getElementById('otpForm')) initOtpVerification();
    if (document.getElementById('forgotForm')) initForgotPassword();
    if (document.getElementById('resetForm')) initResetPassword();
});

// ═══════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════
function initLogin() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('login-error');
        setLoading('login-btn', true);

        const identifier = document.getElementById('login-identifier').value.trim();
        const password = document.getElementById('login-password').value;

        if (!identifier || !password) {
            showError('login-error', 'Please enter both credentials and password.');
            setLoading('login-btn', false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });
            const data = await res.json();

            if (!res.ok) {
                showError('login-error', data.message || 'Login failed.');
                setLoading('login-btn', false);
                return;
            }

            // Store userId and flow type, redirect to OTP page
            sessionStorage.setItem('otpUserId', data.userId);
            sessionStorage.setItem('otpEmail', data.email);
            sessionStorage.setItem('otpFlow', 'login');
            window.location.href = 'verify-otp.html';

        } catch (err) {
            showError('login-error', 'Unable to reach server. Please try again.');
            setLoading('login-btn', false);
        }
    });
}

// ═══════════════════════════════════════════════
// SIGNUP PAGE
// ═══════════════════════════════════════════════
function initSignup() {
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('signup-error');
        setLoading('signup-btn', true);

        const name = document.getElementById('signup-name').value.trim();
        const username = document.getElementById('signup-username').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const phone = document.getElementById('signup-phone')?.value.trim() || '';
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;

        if (!name || !username || !email || !password || !confirmPassword) {
            showError('signup-error', 'Please fill in all required fields.');
            setLoading('signup-btn', false);
            return;
        }
        if (password !== confirmPassword) {
            showError('signup-error', 'Passwords do not match.');
            setLoading('signup-btn', false);
            return;
        }
        if (password.length < 6) {
            showError('signup-error', 'Password must be at least 6 characters.');
            setLoading('signup-btn', false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, email, phone, password, confirmPassword })
            });
            const data = await res.json();

            if (!res.ok) {
                showError('signup-error', data.message || 'Registration failed.');
                setLoading('signup-btn', false);
                return;
            }

            sessionStorage.setItem('otpUserId', data.userId);
            sessionStorage.setItem('otpEmail', data.email);
            sessionStorage.setItem('otpFlow', 'signup');
            window.location.href = 'verify-otp.html';

        } catch (err) {
            showError('signup-error', 'Unable to reach server. Please try again.');
            setLoading('signup-btn', false);
        }
    });
}

// ═══════════════════════════════════════════════
// OTP VERIFICATION PAGE
// ═══════════════════════════════════════════════
function initOtpVerification() {
    const userId = sessionStorage.getItem('otpUserId');
    const email = sessionStorage.getItem('otpEmail');
    const flow = sessionStorage.getItem('otpFlow'); // 'login' | 'signup' | 'forgot'

    if (!userId || !flow) {
        window.location.href = 'login.html';
        return;
    }

    // Display email
    const emailDisplay = document.getElementById('otp-email-display');
    if (emailDisplay && email) {
        // Mask email for privacy
        const [user, domain] = email.split('@');
        emailDisplay.textContent = user.substring(0, 2) + '***@' + domain;
    }

    // ── OTP Input Box Logic ──
    const inputs = document.querySelectorAll('.otp-input');

    inputs.forEach((input, idx) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = val;
            if (val && idx < inputs.length - 1) {
                inputs[idx + 1].focus();
            }
            e.target.classList.toggle('filled', val.length > 0);
            e.target.classList.remove('error');
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && idx > 0) {
                inputs[idx - 1].focus();
                inputs[idx - 1].value = '';
                inputs[idx - 1].classList.remove('filled');
            }
        });

        // Handle paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').substring(0, 6);
            pasted.split('').forEach((char, i) => {
                if (inputs[i]) {
                    inputs[i].value = char;
                    inputs[i].classList.add('filled');
                }
            });
            if (pasted.length > 0) inputs[Math.min(pasted.length, 5)].focus();
        });
    });

    // ── Expiry Timer (5 min) ──
    let expirySeconds = 300;
    const timerEl = document.getElementById('otp-timer');
    const expiryInterval = setInterval(() => {
        expirySeconds--;
        const m = Math.floor(expirySeconds / 60).toString().padStart(2, '0');
        const s = (expirySeconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
        if (expirySeconds <= 60) timerEl.classList.add('text-tertiary');
        if (expirySeconds <= 0) {
            clearInterval(expiryInterval);
            timerEl.textContent = 'EXPIRED';
            showError('otp-error', 'OTP has expired. Please request a new one.');
        }
    }, 1000);

    // ── Resend OTP (30s cooldown) ──
    const resendBtn = document.getElementById('resend-btn');
    const resendTimerEl = document.getElementById('resend-timer');
    let resendCooldown = 30;

    const resendInterval = setInterval(() => {
        resendCooldown--;
        resendTimerEl.textContent = `(${resendCooldown}s)`;
        if (resendCooldown <= 0) {
            clearInterval(resendInterval);
            resendBtn.disabled = false;
            resendBtn.classList.remove('text-primary/50', 'cursor-not-allowed');
            resendBtn.classList.add('text-primary', 'hover:underline', 'cursor-pointer');
            resendTimerEl.textContent = '';
        }
    }, 1000);

    resendBtn.addEventListener('click', async () => {
        if (resendBtn.disabled) return;
        hideError('otp-error');

        try {
            const res = await fetch(`${API_BASE}/api/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();

            if (!res.ok) {
                showError('otp-error', data.message);
                return;
            }

            showSuccess('otp-success', 'New OTP sent! Check your console/email.');

            // Reset expiry timer
            expirySeconds = 300;
            timerEl.classList.remove('text-tertiary');

            // Reset resend cooldown
            resendCooldown = 30;
            resendBtn.disabled = true;
            resendBtn.classList.add('text-primary/50', 'cursor-not-allowed');
            resendBtn.classList.remove('text-primary', 'hover:underline', 'cursor-pointer');

            const newResendInterval = setInterval(() => {
                resendCooldown--;
                resendTimerEl.textContent = `(${resendCooldown}s)`;
                if (resendCooldown <= 0) {
                    clearInterval(newResendInterval);
                    resendBtn.disabled = false;
                    resendBtn.classList.remove('text-primary/50', 'cursor-not-allowed');
                    resendBtn.classList.add('text-primary', 'hover:underline', 'cursor-pointer');
                    resendTimerEl.textContent = '';
                }
            }, 1000);

            // Clear inputs
            inputs.forEach(inp => { inp.value = ''; inp.classList.remove('filled', 'error'); });
            inputs[0].focus();

        } catch (err) {
            showError('otp-error', 'Failed to resend OTP.');
        }
    });

    // ── Submit OTP ──
    document.getElementById('otpForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('otp-error');
        hideError('otp-success');

        const otp = Array.from(inputs).map(i => i.value).join('');
        if (otp.length !== 6) {
            inputs.forEach(i => i.classList.add('error'));
            showError('otp-error', 'Please enter all 6 digits.');
            return;
        }

        setLoading('verify-btn', true);

        // Determine API endpoint based on flow
        let endpoint;
        if (flow === 'signup') endpoint = '/api/auth/verify-signup';
        else if (flow === 'login') endpoint = '/api/auth/verify-login';
        else if (flow === 'forgot') endpoint = '/api/auth/verify-reset-otp';

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, otp })
            });
            const data = await res.json();

            if (!res.ok) {
                inputs.forEach(i => i.classList.add('error'));
                showError('otp-error', data.message || 'Invalid OTP. Please try again.');
                setLoading('verify-btn', false);
                return;
            }

            clearInterval(expiryInterval);

            if (flow === 'forgot') {
                // Store reset token and redirect to reset page
                sessionStorage.setItem('resetToken', data.resetToken);
                sessionStorage.removeItem('otpUserId');
                sessionStorage.removeItem('otpEmail');
                sessionStorage.removeItem('otpFlow');
                window.location.href = 'reset-password.html';
            } else {
                // Login or signup — store JWT and go to dashboard
                sessionStorage.removeItem('otpUserId');
                sessionStorage.removeItem('otpEmail');
                sessionStorage.removeItem('otpFlow');
                setLoggedIn(data.user, data.token);
            }

        } catch (err) {
            showError('otp-error', 'Unable to reach server. Please try again.');
            setLoading('verify-btn', false);
        }
    });
}

// ═══════════════════════════════════════════════
// FORGOT PASSWORD PAGE
// ═══════════════════════════════════════════════
function initForgotPassword() {
    document.getElementById('forgotForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('forgot-error');
        setLoading('forgot-btn', true);

        const identifier = document.getElementById('forgot-identifier').value.trim();
        if (!identifier) {
            showError('forgot-error', 'Please enter your email or phone.');
            setLoading('forgot-btn', false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            });
            const data = await res.json();

            if (data.userId) {
                sessionStorage.setItem('otpUserId', data.userId);
                sessionStorage.setItem('otpEmail', data.email);
                sessionStorage.setItem('otpFlow', 'forgot');
                window.location.href = 'verify-otp.html';
            } else {
                // Account doesn't exist but we don't reveal that
                showError('forgot-error', 'If an account exists, an OTP has been sent. Please check your email.');
                setLoading('forgot-btn', false);
            }

        } catch (err) {
            showError('forgot-error', 'Unable to reach server. Please try again.');
            setLoading('forgot-btn', false);
        }
    });
}

// ═══════════════════════════════════════════════
// RESET PASSWORD PAGE
// ═══════════════════════════════════════════════
function initResetPassword() {
    const resetToken = sessionStorage.getItem('resetToken');
    if (!resetToken) {
        window.location.href = 'forgot-password.html';
        return;
    }

    // Password strength indicator
    const pwInput = document.getElementById('reset-password');
    if (pwInput) {
        pwInput.addEventListener('input', () => {
            const pw = pwInput.value;
            let strength = 0;
            if (pw.length >= 6) strength++;
            if (/[A-Z]/.test(pw)) strength++;
            if (/[0-9]/.test(pw)) strength++;
            if (/[^a-zA-Z0-9]/.test(pw)) strength++;

            const colors = ['bg-outline-variant', 'bg-tertiary', 'bg-yellow-500', 'bg-primary', 'bg-secondary'];
            const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

            for (let i = 1; i <= 4; i++) {
                const bar = document.getElementById(`str-${i}`);
                bar.className = `h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength] : 'bg-outline-variant'}`;
            }
            document.getElementById('str-label').textContent = labels[strength] || '';
        });
    }

    document.getElementById('resetForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('reset-error');
        hideError('reset-success');
        setLoading('reset-btn', true);

        const newPassword = document.getElementById('reset-password').value;
        const confirmPassword = document.getElementById('reset-confirm').value;

        if (!newPassword || !confirmPassword) {
            showError('reset-error', 'Please fill in both fields.');
            setLoading('reset-btn', false);
            return;
        }
        if (newPassword.length < 6) {
            showError('reset-error', 'Password must be at least 6 characters.');
            setLoading('reset-btn', false);
            return;
        }
        if (newPassword !== confirmPassword) {
            showError('reset-error', 'Passwords do not match.');
            setLoading('reset-btn', false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetToken, newPassword, confirmPassword })
            });
            const data = await res.json();

            if (!res.ok) {
                showError('reset-error', data.message || 'Reset failed.');
                setLoading('reset-btn', false);
                return;
            }

            showSuccess('reset-success', 'Password updated successfully! Redirecting to login...');
            sessionStorage.removeItem('resetToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);

        } catch (err) {
            showError('reset-error', 'Unable to reach server. Please try again.');
            setLoading('reset-btn', false);
        }
    });
}

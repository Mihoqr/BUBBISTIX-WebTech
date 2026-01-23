// 1. PINAKATAAS: Redirect agad kung logged in na
if (localStorage.getItem('userLoggedIn') === 'true') {
    window.location.replace('purchase.html');
}

// 2. ISANG DOMContentLoaded lang para sa lahat ng UI logic
document.addEventListener('DOMContentLoaded', () => {
    
    // --- PASSWORD RESET MESSAGE LOGIC ---
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message === 'reset') {
        const resetEl = document.getElementById('resetMessage');
        if (resetEl) {
            resetEl.style.display = 'block';
            resetEl.setAttribute('role', 'status');
            resetEl.setAttribute('aria-live', 'polite');
        }
    }
});

// 3. LOGIN FORM SUBMISSION (Labas ng DOMContentLoaded ay okay lang basta may listener)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginForm = document.querySelector('.login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const form = e.currentTarget;
        const emailInput = form.querySelector('#email');
        const passwordInput = form.querySelector('#password');
        const submitBtn = form.querySelector('.login-btn');
        const canToast = !!(window.bubbistixUI && typeof window.bubbistixUI.showToast === 'function');
        const V = window.bubbistixValidate || {};

        let valid = true;
        
        // Email Validation
        if (!emailInput || !(V.isEmail ? V.isEmail(emailInput.value) : emailRegex.test(emailInput.value.trim()))) {
            valid = false;
            V.setFieldError ? V.setFieldError(emailInput, 'Please enter a valid email address.') : emailInput?.setAttribute('aria-invalid', 'true');
        } else {
            V.clearFieldError ? V.clearFieldError(emailInput) : emailInput.removeAttribute('aria-invalid');
        }

        // Password Validation
        if (!passwordInput || !(V.minLength ? V.minLength(passwordInput.value, 6) : passwordInput.value.trim().length >= 6)) {
            valid = false;
            V.setFieldError ? V.setFieldError(passwordInput, 'Password must be at least 6 characters.') : passwordInput?.setAttribute('aria-invalid', 'true');
        } else {
            V.clearFieldError ? V.clearFieldError(passwordInput) : passwordInput.removeAttribute('aria-invalid');
        }

        if (!valid) return;

        // UI State: Loading
        form.setAttribute('aria-busy', 'true');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Signing in...`;
        }

        if (canToast) {
            window.bubbistixUI.showToast({
                title: "You're now signed in",
                message: 'Redirecting to your account',
                autohide: true,
                delay: 1500,
                position: 'center',
                size: 'xl',
                backdrop: 'blur'
            });
        }

        // Final Action: Save and Redirect
        setTimeout(() => {
            const userNameFromEmail = emailInput.value.split('@')[0];
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userName', userNameFromEmail);
            localStorage.setItem('userEmail', emailInput.value);
            window.location.href = 'purchase.html';
        }, 1500);
    });
}
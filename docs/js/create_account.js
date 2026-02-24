// Handle create account form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createAccountForm');
  if (!form) return;

  const passwordInput = form.querySelector('#password');
  const togglePassword = form.querySelector('#togglePassword');

  // --- PASSWORD TOGGLE LOGIC ---
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
      // Toggle the type attribute
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      // Toggle the icon class
      this.classList.toggle('fa-eye');
      this.classList.toggle('fa-eye-slash');
    });
  }

  // Handle create account form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check if toast UI helper is available
    const canToast = !!(window.bubbistixUI && typeof window.bubbistixUI.showToast === 'function');
    const API_BASE = 'http://localhost:4000/api/v1';

    // Cache input references
    const usernameInput = form.querySelector('#username');
    const fullnameInput = form.querySelector('#fullname');
    const emailInput = form.querySelector('#email');
    const submitBtn = form.querySelector('.login-btn');

    // Validation patterns
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    const V = window.bubbistixValidate || {};
    let valid = true;

    // --- CLIENT SIDE VALIDATION ---
    // Username
    if (!usernameInput || usernameInput.value.trim().length < 3) {
      valid = false;
      V.setFieldError ? V.setFieldError(usernameInput, 'Username must be at least 3 characters.') : usernameInput.setAttribute('aria-invalid', 'true');
    } else { V.clearFieldError?.(usernameInput); }

    // Full Name
    const fullNameWords = fullnameInput.value.trim().split(/\s+/);
    if (!fullnameInput || fullNameWords.length < 2) {
      valid = false;
      V.setFieldError ? V.setFieldError(fullnameInput, 'Please enter your first and last name.') : fullnameInput.setAttribute('aria-invalid', 'true');
    } else { V.clearFieldError?.(fullnameInput); }

    // Email
    if (!emailInput || !emailRegex.test(emailInput.value.trim())) {
      valid = false;
      V.setFieldError ? V.setFieldError(emailInput, 'Please enter a valid email address.') : emailInput.setAttribute('aria-invalid', 'true');
    } else { V.clearFieldError?.(emailInput); }

    // Password
    if (!passwordInput || !strongPasswordRegex.test(passwordInput.value)) {
      valid = false;
      V.setFieldError ? V.setFieldError(passwordInput, 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.') : passwordInput.setAttribute('aria-invalid', 'true');
    } else { V.clearFieldError?.(passwordInput); }

    if (!valid) return;

    // Loading State
    form.setAttribute('aria-busy', 'true');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Creating...`;

    try {
      const response = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.value.trim(),
          full_name: fullnameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.message || 'Unable to create account.');

      canToast && window.bubbistixUI.showToast({
        title: 'Account created!',
        message: 'Redirecting to sign-in...',
        autohide: true,
        delay: 2000,
        position: 'center'
      });

      setTimeout(() => { window.location.href = 'registration.html'; }, 2000);

    } catch (error) {
      console.error('Error:', error);
      canToast && window.bubbistixUI.showToast({
        title: 'Registration failed',
        message: error.message,
        variant: 'danger',
        position: 'center'
      });
    } finally {
      form.removeAttribute('aria-busy');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create';
    }
  });
});

window.handleGoogleCredential = async function (response) {
  const API_BASE = "http://localhost:4000/api/v1";

  try {
    const res = await fetch(`${API_BASE}/users/googleAuth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        credential: response.credential
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Google authentication failed");
    }

    localStorage.setItem("authToken", data.token);
    localStorage.setItem("userLoggedIn", "true");
    localStorage.setItem("userId", data.user.id);
    localStorage.setItem("userName", data.user.username);
    localStorage.setItem("userEmail", data.user.email);

    window.location.href = "purchase.html";

  } catch (error) {
    console.error("Google signup error:", error);
    alert(error.message);
  }
};
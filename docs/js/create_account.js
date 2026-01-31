// Handle create account form submission
document.getElementById('createAccountForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Check if toast UI helper is available
  const canToast = !!(window.bubbistixUI && typeof window.bubbistixUI.showToast === 'function');
  // Base API endpoint for auth requests
  const API_BASE = 'http://localhost:4000/api/v1';

  // Cache form and input references
  const form = e.currentTarget;
  const usernameInput = form.querySelector('#username');
  const fullnameInput = form.querySelector('#fullname');
  const emailInput = form.querySelector('#email');
  const passwordInput = form.querySelector('#password');
  const submitBtn = form.querySelector('.login-btn');

  // Validation patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  // Optional validation utility
  const V = window.bubbistixValidate || {};
  let valid = true;

  // Client side validation
  // Validate username length
  if (!usernameInput || usernameInput.value.trim().length < 3) {
    valid = false;
    V.setFieldError
      ? V.setFieldError(usernameInput, 'Username must be at least 3 characters.')
      : usernameInput.setAttribute('aria-invalid', 'true');
  } else {
    V.clearFieldError?.(usernameInput);
  }

  // Validate full name contains at least two words
  const fullNameWords = fullnameInput.value.trim().split(/\s+/);
  if (!fullnameInput || fullNameWords.length < 2) {
    valid = false;
    V.setFieldError
      ? V.setFieldError(fullnameInput, 'Please enter your first and last name.')
      : fullnameInput.setAttribute('aria-invalid', 'true');
  } else {
    V.clearFieldError?.(fullnameInput);
  }

  // Validate email format
  if (!emailInput || !emailRegex.test(emailInput.value.trim())) {
    valid = false;
    V.setFieldError
      ? V.setFieldError(emailInput, 'Please enter a valid email address.')
      : emailInput.setAttribute('aria-invalid', 'true');
  } else {
    V.clearFieldError?.(emailInput);
  }

  // Validate strong password
  if (!passwordInput || !strongPasswordRegex.test(passwordInput.value)) {
    valid = false;
    V.setFieldError
      ? V.setFieldError(
          passwordInput,
          'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
        )
      : passwordInput.setAttribute('aria-invalid', 'true');
  } else {
    V.clearFieldError?.(passwordInput);
  }

  // Stop submission if validation fails
  if (!valid) return;

  // Set loading state and disable submit
  form.setAttribute('aria-busy', 'true');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
    Creating account...
  `;

  try {
    // Send registration request to backend
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

    // Handle backend validation or server errors
    if (!response.ok) {
      throw new Error(data.message || 'Unable to create account.');
    }

    // Show success feedback and redirect
    canToast && window.bubbistixUI.showToast({
      title: 'Account created!',
      message: 'Redirecting you to the sign-in page.',
      autohide: true,
      delay: 2000,
      position: 'center',
      size: 'xl',
      backdrop: 'blur'
    });

    setTimeout(() => {
      window.location.href = 'registration.html';
    }, 2000);

  } catch (error) {
    console.error('Create account error:', error);

    // Show registration error feedback
    canToast && window.bubbistixUI.showToast({
      title: 'Registration failed',
      message: error.message,
      autohide: true,
      delay: 3000,
      variant: 'danger',
      position: 'center'
    });

  } finally {
    // Restore form state after request completes
    form.removeAttribute('aria-busy');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create';
  }
});
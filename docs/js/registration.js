document.addEventListener("DOMContentLoaded", () => {
  // Base API endpoint for auth requests
  const API_BASE = "http://localhost:4000/api/v1";

  // Login form and optional reset success message
  const loginForm = document.getElementById("loginForm");
  const resetMessage = document.getElementById("resetMessage");

  // --- PASSWORD TOGGLE LOGIC START ---
  const togglePassword = document.querySelector('#togglePassword');
  const passwordInput = document.querySelector('#password');

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
      // I-toggle ang type attribute (password <-> text)
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      // I-toggle ang icon class (eye <-> eye-slash)
      this.classList.toggle('fa-eye');
      this.classList.toggle('fa-eye-slash');
    });
  }
  // --- PASSWORD TOGGLE LOGIC END ---

  // Check if custom toast UI is available
  const canToast =
    !!window.bubbistixUI &&
    typeof window.bubbistixUI.showToast === "function";

  // Validation helpers and email format check
  const V = window.bubbistixValidate || {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Display password reset confirmation if redirected from reset flow
  const params = new URLSearchParams(window.location.search);
  if (params.get("message") === "reset" && resetMessage) {
    resetMessage.classList.remove("hidden");
    resetMessage.setAttribute("role", "status");
    resetMessage.setAttribute("aria-live", "polite");

    // Remove query param to prevent repeat message on refresh
    window.history.replaceState({}, document.title, "registration.html");
  }

  // Exit early if login form is not present
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Input and button references
    const emailInput = loginForm.querySelector("#email");
    const passwordInputRef = loginForm.querySelector("#password"); // Renamed to avoid conflict
    const submitBtn = loginForm.querySelector(".login-btn");

    let valid = true;

    // Validate email format
    if (!emailInput || !emailRegex.test(emailInput.value.trim())) {
      valid = false;
      V.setFieldError?.(emailInput, "Please enter a valid email address.");
    } else {
      V.clearFieldError?.(emailInput);
    }

    // Ensure password is provided (strength validated server-side)
    if (!passwordInputRef || passwordInputRef.value.trim() === "") {
      valid = false;
      V.setFieldError?.(passwordInputRef, "Password is required.");
    } else {
      V.clearFieldError?.(passwordInputRef);
    }

    // Stop submission if validation fails
    if (!valid) return;

    // Set loading state and disable submit button
    loginForm.setAttribute("aria-busy", "true");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
      Signing in...
    `;

    try {
      // Send login request to backend
      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInputRef.value
        })
      });

      const data = await response.json();

      // Handle authentication failure
      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      // Persist auth token and session flags for purchase.js logic
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userLoggedIn", "true");
      localStorage.setItem("userId", data.user.id || data.user._id);
      localStorage.setItem("userName", data.user.username || data.user.full_name);
      localStorage.setItem("userEmail", data.user.email);

      // Show success feedback before redirect
      canToast &&
        window.bubbistixUI.showToast({
          title: "Welcome back!",
          message: "Redirecting to your account...",
          autohide: true,
          delay: 1500,
          position: "center",
          size: "xl",
          backdrop: "blur"
        });

      // Redirect to protected page
      setTimeout(() => {
        window.location.href = "purchase.html";
      }, 1500);

    } catch (error) {
      console.error("Login error:", error);

      // Show login error feedback
      canToast &&
        window.bubbistixUI.showToast({
          title: "Login failed",
          message: error.message,
          autohide: true,
          delay: 3000,
          variant: "danger",
          position: "center"
        });

    } finally {
      // Reset UI state after request completes
      loginForm.removeAttribute("aria-busy");
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In";
    }
  });
});

// Google callback function
window.handleGoogleCredential = async function (response) {
  const API_BASE = "http://localhost:4000/api/v1";

  // Uncomment to get Google ID token from the console for Postman testing
  //console.log("GOOGLE ID TOKEN:", response.credential);

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

    // Store JWT like normal login
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("userLoggedIn", "true");
    localStorage.setItem("userId", data.user.id);
    localStorage.setItem("userName", data.user.username);
    localStorage.setItem("userEmail", data.user.email);

    window.location.href = "purchase.html";

  } catch (error) {
    console.error("Google login error:", error);
    alert(error.message);
  }
};
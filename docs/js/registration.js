// // 1. PINAKATAAS: Redirect agad kung logged in na
// if (localStorage.getItem('userLoggedIn') === 'true') {
//     window.location.replace('purchase.html');
// }

// // 2. ISANG DOMContentLoaded lang para sa lahat ng UI logic
// document.addEventListener('DOMContentLoaded', () => {
    
//     // --- PASSWORD RESET MESSAGE LOGIC ---
//     const urlParams = new URLSearchParams(window.location.search);
//     const message = urlParams.get('message');
//     if (message === 'reset') {
//         const resetEl = document.getElementById('resetMessage');
//         if (resetEl) {
//             resetEl.style.display = 'block';
//             resetEl.setAttribute('role', 'status');
//             resetEl.setAttribute('aria-live', 'polite');
//         }
//     }
// });

// // 3. LOGIN FORM SUBMISSION (Labas ng DOMContentLoaded ay okay lang basta may listener)
// const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// const loginForm = document.querySelector('.login-form');
// if (loginForm) {
//     loginForm.addEventListener('submit', (e) => {
//         e.preventDefault();

//         const form = e.currentTarget;
//         const emailInput = form.querySelector('#email');
//         const passwordInput = form.querySelector('#password');
//         const submitBtn = form.querySelector('.login-btn');
//         const canToast = !!(window.bubbistixUI && typeof window.bubbistixUI.showToast === 'function');
//         const V = window.bubbistixValidate || {};

//         let valid = true;
        
//         // Email Validation
//         if (!emailInput || !(V.isEmail ? V.isEmail(emailInput.value) : emailRegex.test(emailInput.value.trim()))) {
//             valid = false;
//             V.setFieldError ? V.setFieldError(emailInput, 'Please enter a valid email address.') : emailInput?.setAttribute('aria-invalid', 'true');
//         } else {
//             V.clearFieldError ? V.clearFieldError(emailInput) : emailInput.removeAttribute('aria-invalid');
//         }

//         // Password Validation
//         if (!passwordInput || !(V.minLength ? V.minLength(passwordInput.value, 6) : passwordInput.value.trim().length >= 6)) {
//             valid = false;
//             V.setFieldError ? V.setFieldError(passwordInput, 'Password must be at least 6 characters.') : passwordInput?.setAttribute('aria-invalid', 'true');
//         } else {
//             V.clearFieldError ? V.clearFieldError(passwordInput) : passwordInput.removeAttribute('aria-invalid');
//         }

//         if (!valid) return;

//         // UI State: Loading
//         form.setAttribute('aria-busy', 'true');
//         if (submitBtn) {
//             submitBtn.disabled = true;
//             submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Signing in...`;
//         }

//         if (canToast) {
//             window.bubbistixUI.showToast({
//                 title: "You're now signed in",
//                 message: 'Redirecting to your account',
//                 autohide: true,
//                 delay: 1500,
//                 position: 'center',
//                 size: 'xl',
//                 backdrop: 'blur'
//             });
//         }

//         // Final Action: Save and Redirect
//         setTimeout(() => {
//             const userNameFromEmail = emailInput.value.split('@')[0];
//             localStorage.setItem('userLoggedIn', 'true');
//             localStorage.setItem('userName', userNameFromEmail);
//             localStorage.setItem('userEmail', emailInput.value);
//             window.location.href = 'purchase.html';
//         }, 1500);
//     });
// }

// Redirect if already logged in (temporary session logic)
// if (localStorage.getItem("userLoggedIn") === "true") {
//   window.location.replace("purchase.html");
// }

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:4000/api/v1";
  const loginForm = document.getElementById("loginForm");
  const resetMessage = document.getElementById("resetMessage");

  const canToast =
    !!window.bubbistixUI &&
    typeof window.bubbistixUI.showToast === "function";

  const V = window.bubbistixValidate || {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // =============================
  // SHOW RESET SUCCESS MESSAGE
  // =============================
  const params = new URLSearchParams(window.location.search);
  if (params.get("message") === "reset" && resetMessage) {
    resetMessage.classList.remove("hidden");
    resetMessage.setAttribute("role", "status");
    resetMessage.setAttribute("aria-live", "polite");

    // Clean URL so refresh won't re-show message
    window.history.replaceState({}, document.title, "registration.html");
  }

  // =============================
  // LOGIN FORM HANDLER
  // =============================
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = loginForm.querySelector("#email");
    const passwordInput = loginForm.querySelector("#password");
    const submitBtn = loginForm.querySelector(".login-btn");

    let valid = true;

    // ---- Email validation
    if (!emailInput || !emailRegex.test(emailInput.value.trim())) {
      valid = false;
      V.setFieldError?.(emailInput, "Please enter a valid email address.");
    } else {
      V.clearFieldError?.(emailInput);
    }

    // ---- Password required (strength validated backend-side)
    if (!passwordInput || passwordInput.value.trim() === "") {
      valid = false;
      V.setFieldError?.(passwordInput, "Password is required.");
    } else {
      V.clearFieldError?.(passwordInput);
    }

    if (!valid) return;

    // ---- UI loading state
    loginForm.setAttribute("aria-busy", "true");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
      Signing in...
    `;

    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInput.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      // ---- Persist minimal session info
      // localStorage.setItem("userLoggedIn", "true");
      // localStorage.setItem("userId", data.user.id);
      // localStorage.setItem("userName", data.user.full_name);
      // localStorage.setItem("userEmail", data.user.email);

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.full_name);
      localStorage.setItem("userEmail", data.user.email);

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

      setTimeout(() => {
        window.location.href = "purchase.html";
      }, 1500);

    } catch (error) {
      console.error("Login error:", error);

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
      loginForm.removeAttribute("aria-busy");
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In";
    }
  });
});

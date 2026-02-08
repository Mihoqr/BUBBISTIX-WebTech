// Handle password reset request on page load
document.addEventListener("DOMContentLoaded", () => {
  // Base API endpoint for auth-related requests
  const API_BASE = "http://localhost:4000/api/v1";
  const form = document.getElementById("resetPasswordForm");

  // Check if toast UI helper is available
  const canToast =
    !!window.bubbistixUI &&
    typeof window.bubbistixUI.showToast === "function";

  // Exit if reset form is not present
  if (!form) return;

  // Cache input and submit button
  const emailInput = form.querySelector("#email");
  const submitBtn = form.querySelector(".login-btn");

  // Handle reset password form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate email input
    if (!emailInput || emailInput.value.trim() === "") {
      window.bubbistixValidate?.setFieldError(
        emailInput,
        "Please enter your email address."
      );
      return;
    }

    // Set loading state
    form.setAttribute("aria-busy", "true");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      // Send reset password request to backend
      await fetch(`${API_BASE}/users/resetPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.value.trim() })
      });

      // Redirect with success flag regardless of account existence
      window.location.href = "registration.html?message=reset";

    } catch (error) {
      console.error("Reset password error:", error);

      // Show error feedback if request fails
      canToast &&
        window.bubbistixUI.showToast({
          title: "Error",
          message: "Something went wrong. Please try again later.",
          variant: "danger",
          position: "center"
        });

    } finally {
      // Restore form state
      form.removeAttribute("aria-busy");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });
});
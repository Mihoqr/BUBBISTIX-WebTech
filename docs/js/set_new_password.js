import { API_BASE_URL as API_BASE } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("setNewPasswordForm");
  const canToast =
    !!window.bubbistixUI && typeof window.bubbistixUI.showToast === "function";

  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    alert("Invalid or expired reset link.");
    window.location.href = "registration.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/setNewPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert("Password reset successful!");
      window.location.href = "registration.html";

    } catch (error) {
      alert(error.message);
    }
  });
});
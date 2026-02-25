document.addEventListener("DOMContentLoaded", () => {
  const setNewPasswordForm = document.getElementById("setNewPasswordForm");
  const canToast =
    !!window.bubbistixUI && typeof window.bubbistixUI.showToast === "function";

  if (!setNewPasswordForm) return;

  setNewPasswordForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    if (!newPassword || !confirmPassword) {
      canToast && window.bubbistixUI.showToast({
        title: "Error",
        message: "Please fill in both password fields.",
        variant: "danger",
        position: "center"
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      canToast && window.bubbistixUI.showToast({
        title: "Error",
        message: "Passwords do not match.",
        variant: "danger",
        position: "center"
      });
      return;
    }
    // Show success 
    canToast && window.bubbistixUI.showToast({
      title: "Success",
      message: "Password reset successful!",
      variant: "success",
      position: "center",
      duration: 3000 // 3 seconds
    });
    setNewPasswordForm.reset();
  });
});

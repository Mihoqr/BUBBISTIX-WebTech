// API base path for contact form backend endpoint
const API_BASE_URL = "http://localhost:4000/api/v1";

// Initialize contact form submission logic on page load
document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.querySelector("section.contact form");
  if (!contactForm) return;

  // Check if custom toast UI helper is available
  const canToast =
    window.bubbistixUI &&
    typeof window.bubbistixUI.showToast === "function";

  // Handle contact form submission
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const name = formData.get("name")?.trim();
    const email = formData.get("email")?.trim();
    const message = formData.get("comment")?.trim();

    // Block submission if any required field is missing
    if (!name || !email || !message) {
      showError("All fields are required 💌");
      return;
    }

    try {
      // Send contact message to backend
      const res = await fetch(
        `${API_BASE_URL}/contactMessages/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, message })
        }
      );

      const data = await res.json();

      // Handle backend validation or server errors
      if (!res.ok) {
        showError(data.message || "Failed to send message");
        return;
      }

      // Reset form and show success feedback
      contactForm.reset();
      showSuccess();

    } catch (err) {
      console.error("Contact submit error:", err);
      showError("Server error. Please try again later 💔");
    }
  });

  // Show success feedback using toast or fallback popup
  function showSuccess() {
    if (canToast) {
      window.bubbistixUI.showToast({
        title: "🎉 Message sent!",
        message:
          "Thanks for reaching out — your note is on its way to our inbox 💌",
        autohide: true,
        delay: 3000,
        position: "center",
        size: "xl",
        backdrop: "blur"
      });
      return;
    }

    showLegacyPopup();
  }

  // Display error message using toast or alert fallback
  function showError(message) {
    if (canToast) {
      window.bubbistixUI.showToast({
        title: "Oops!",
        message,
        autohide: true,
        delay: 3000,
        position: "center"
      });
    } else {
      alert(message);
    }
  }

  // Legacy success popup for environments without toast support
  function showLegacyPopup() {
    let popup = document.getElementById("contactPopup");

    if (!popup) {
      popup = document.createElement("div");
      popup.id = "contactPopup";
      popup.className = "success-popup";
      popup.innerHTML = `
        <div class="success-content">
          <h2 class="success-message">🎉 Message sent!</h2>
          <div class="success-image success-image-centered">
            <img src="https://bubbistix-storage.s3.ap-southeast-1.amazonaws.com/assets/strawberry-5.png" alt="Strawberry">
          </div>
          <p class="success-redirect">
            Thanks for reaching out — your note is on its way to our inbox 💌
          </p>
          <button class="login-btn success-btn" id="contactOkBtn">
            OK, yay! 💕
          </button>
        </div>
      `;
      document.body.appendChild(popup);
    }

    // Show popup and close on confirmation
    popup.style.display = "flex";
    document.getElementById("contactOkBtn").onclick = () => {
      popup.style.display = "none";
    };
  }
});
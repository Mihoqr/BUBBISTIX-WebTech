import { getAuthHeaders, handleUnauthorized } from "./utils/auth.js";
import { API_BASE_URL } from "./config.js";

// Base URL for accessing AWS bucket
const S3_BASE_URL = "https://bubbistix-storage.s3.amazonaws.com";

document.addEventListener("DOMContentLoaded", () => {
  // Check auth token before running protected account logic
  const token = localStorage.getItem("authToken");

  setupAvatarEditProtection();
  
  // Show demo content if not authenticated
  if (!token) {
    showDemoMode();
    return;
  }

  // Initialize account features for authenticated users only
  loadUserProfile();
  loadPurchasedStickers();
  setupAvatar();
  setupLogout();
});

// Show demo content for unauthenticated users
function showDemoMode() {
  const nameEl = document.getElementById("display-name");
  const emailEl = document.getElementById("display-email");
  const purchaseList = document.getElementById("purchase-list");
  const logoutBtn = document.getElementById("logout-btn");
  const avatarEl = document.getElementById("display-avatar");
  
  if (nameEl) nameEl.textContent = "Guest User";
  if (emailEl) emailEl.textContent = "Log in to see your account";

  // Default avatar for guests
  if (avatarEl) {
    avatarEl.src = `${S3_BASE_URL}/avatars/pink.png`;
  }

  if (logoutBtn) logoutBtn.style.display = "none";
  
  if (purchaseList) {
      purchaseList.innerHTML = `
        <div class="empty-state-card" style="text-align: center; padding: 3rem 2rem; background: white; border-radius: 15px; border: 2px dashed #e0e0e0;">
          <p style="color: #666; font-family: 'Poppins', sans-serif; margin-bottom: 1.5rem;">
            Please log in to view your digital stickers.
          </p>
          <div style="max-width: 400px; margin: 0 auto;">
            <a href="registration.html" class="login-btn" style="text-decoration: none; width: 100%; margin-bottom: 0.7rem; display: block;">Login or Register</a>
          </div>
        </div>
      `;
  }
}

// Fetch and display logged-in user profile details
async function loadUserProfile() {
  const nameEl = document.getElementById("display-name");
  const emailEl = document.getElementById("display-email");
  const logoutBtn = document.getElementById("logout-btn");

  try {
    // Attach auth headers, redirect if token is missing
    const headers = getAuthHeaders();
    if (!headers) {
      showDemoMode();
      return;
    }

    // Fetch currently authenticated user from backend
    const res = await fetch(`${API_BASE_URL}/users/getMe`, {
      headers,
      cache: "no-store"
    });

    // Handle expired or invalid session
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!res.ok) {
      console.warn("Failed to fetch user profile, using demo data");
      return;
    }

    const { user } = await res.json();
    if (nameEl) nameEl.textContent = user.username;
    if (emailEl) emailEl.textContent = user.email;

    const avatarEl = document.getElementById("display-avatar");

    if (avatarEl && user.avatar) {
      avatarEl.src = `${S3_BASE_URL}/${user.avatar}`;
    }

    // Show logout button for authenticated users
    if (logoutBtn) logoutBtn.style.display = "block";

  } catch (err) {
    console.error("Failed to load user profile:", err);
    // Page will still display with default names
  }
}

// Fetch and render purchased stickers for the user
async function loadPurchasedStickers() {
  const purchaseList = document.getElementById("purchase-list");
  if (!purchaseList) return;

  try {
    // Attach auth headers, redirect if token is missing
    const headers = getAuthHeaders();
    if (!headers) return;

    // Fetch current user's purchased stickers
    const res = await fetch(
      `${API_BASE_URL}/orders/getMyPurchasedStickers`,
      {
        headers,
        cache: "no-store"
      }
    );

    // Handle expired or invalid session
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await res.json();
    const stickers = data.stickers || [];

    // Show empty state if no purchases exist
    if (stickers.length === 0) {
      purchaseList.innerHTML =
        `<p class="text-center text-muted mt-4">No digital stickers yet. ✨</p>`;
      return;
    }

    purchaseList.innerHTML = "";

    stickers.forEach(sticker => {
      const imageUrl = `${sticker.preview_images[0]}`;

      // Format purchase date for display
      const purchaseDate = new Date(sticker.purchased_at)
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      // Build purchased sticker card
      const card = document.createElement("div");
      card.className = "sticker-purchase-card shadow-sm mb-3";
      card.innerHTML = `
        <div class="sticker-details-left">
          <div class="sticker-icon-bg">
            <img src="${imageUrl}" alt="${sticker.name}">
          </div>
          <div class="sticker-text">
            <h4 class="m-0">${sticker.name}</h4>
            <small class="text-muted">Purchased: ${purchaseDate}</small>
          </div>
        </div>

        <div class="sticker-actions-right">
          <span class="status-badge-custom ready-badge">READY!</span>
          <button class="download-btn-ready">Download</button>
        </div>
      `;

      purchaseList.appendChild(card);

      const btn = card.querySelector("button");

      // Attach download handler with loading effect
      setupDownloadEffect(btn, sticker._id, sticker.name);
    });

  } catch (err) {
    console.error("Failed to load purchases:", err);
    purchaseList.innerHTML = `
      <div style="padding: 2rem; background: #f8f8f8; border-radius: 10px; text-align: center;">
        <p style="color: #666; margin-bottom: 1rem;">Unable to load your digital stickers at this moment.</p>
        <p style="font-size: 0.9rem; color: #999;">Please try again later or contact support if the problem persists.</p>
      </div>
    `;
  }
}

// Handle secure download with visual loading feedback
function setupDownloadEffect(button, stickerId, stickerName) {
  button.onclick = () => {
    button.disabled = true;
    button.innerHTML =
      `<span class="spinner-border spinner-border-sm"></span> Saving...`;

    setTimeout(async () => {
      button.innerHTML = `<i class="fas fa-check"></i> Saved!`;
      button.style.backgroundColor = "#5b7c61";

      try {
        // Attach auth headers or redirect if session is missing
        const headers = getAuthHeaders();
        if (!headers) return;

        // Request secure download URL from backend
        const res = await fetch(
          `${API_BASE_URL}/downloads/${stickerId}`,
          { headers }
        );

        const data = await res.json();

        // Ensure backend provided a valid download URL
        if (!data.download_url) {
          throw new Error("Download URL missing");
        }

        // Redirect browser to signed S3 URL
        window.location.href = data.download_url;

      } catch (err) {
        console.error("Download failed:", err);
      }

      // Reset button state after feedback
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = "Download";
        button.style.backgroundColor = "";
      }, 2000);

    }, 1200);
  };
}

// Handle avatar selection and modal close
function setupAvatar() {
  const mainAvatar = document.getElementById("display-avatar");
  const options = document.querySelectorAll(".avatar-option");

  options.forEach(option => {
    option.addEventListener("click", async () => {

      const avatarPath = `avatars/${option.dataset.color}.png`;

      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        const res = await fetch(`${API_BASE_URL}/users/updateAvatar`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            avatar: avatarPath
          })
        });

        if (res.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to update avatar");
        }

        // Update UI avatar
        mainAvatar.src =
          `${S3_BASE_URL}/${avatarPath}`;

        window.bubbistixUI?.showToast({
          title: "Success!",
          message: "Your avatar has been updated! ✨",
          position: "top-right"
        });

        const modalEl = document.getElementById("avatarModal");
        bootstrap.Modal.getInstance(modalEl)?.hide();

      } catch (err) {
        console.error("Avatar update failed:", err);
      }

    });
  });
}

// Handle avatar edit button state
function setupAvatarEditProtection() {
  const editBtn = document.getElementById("avatar-edit-btn");
  const modalEl = document.getElementById("avatarModal");

  if (!editBtn || !modalEl) return;

  editBtn.addEventListener("click", () => {
    const token = localStorage.getItem("authToken");

    // Guest user
    if (!token) {
      window.bubbistixUI?.showToast({
        title: "Account Required",
        message: "Please create an account or log in to customize your avatar.",
        position: "top-right"
      });
      return;
    }

    // If user is logged in, open modal
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  });
}

// Clear session data and redirect user on logout
function setupLogout() {
  const btn = document.getElementById("confirmLogoutBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    window.location.href = "registration.html";
  });
}
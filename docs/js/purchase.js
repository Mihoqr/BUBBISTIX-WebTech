// Build auth headers using stored JWT and redirect if missing
function getAuthHeaders() {
  const token = localStorage.getItem("authToken");

  // Redirect to login if user is not authenticated
  if (!token) {
    return null;
  }

  // Attach Bearer token for protected API requests
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

// Clear auth state and redirect on unauthorized access
function handleUnauthorized() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userLoggedIn");
  localStorage.removeItem("userId");

  // Force re-login
  window.location.href = "registration.html";
}

// API base path for authenticated backend requests
const API_BASE_URL = "http://localhost:4000/api/v1";

// Backend host for serving images and downloads
const BACKEND_HOST = "http://localhost:4000";

document.addEventListener("DOMContentLoaded", () => {
  // Check auth token before running protected account logic
  const token = localStorage.getItem("authToken");

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
  
  if (nameEl) nameEl.textContent = "Guest User";
  if (emailEl) emailEl.textContent = "Log in to see your account";
  
  if (purchaseList) {
    purchaseList.innerHTML = `
      <div style="text-align: center; padding: 2rem; background: #f8f8f8; border-radius: 10px;">
        <p style="color: #666; margin-bottom: 1rem;">Please log in to view your digital stickers.</p>
        <a href="registration.html" style="display: inline-block; padding: 0.8rem 1.5rem; background: #49705b; color: white; text-decoration: none; border-radius: 8px;">
          Login or Register
        </a>
      </div>
    `;
  }
}

// Fetch and display logged-in user profile details
async function loadUserProfile() {
  const nameEl = document.getElementById("display-name");
  const emailEl = document.getElementById("display-email");

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
      const imageUrl = `${BACKEND_HOST}${sticker.preview_images[0]}`;

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

        const res = await fetch(
          `${API_BASE_URL}/downloads/${stickerId}`,
          { headers }
        );

        // Handle expired or invalid session
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }

        // Download sticker file
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${stickerName}.zip`;
        link.click();

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
    option.addEventListener("click", () => {
      mainAvatar.src = option.src;

      window.bubbistixUI?.showToast({
        title: "Success!",
        message: "Your avatar has been updated! ✨",
        position: "top-right"
      });

      const modalEl = document.getElementById("avatarModal");
      bootstrap.Modal.getInstance(modalEl)?.hide();
    });
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
import { getAuthHeaders, handleUnauthorized } from "./utils/auth.js";

// API base path for sticker, cart, and checkout backend endpoints
const API_BASE_URL = "http://localhost:4000/api/v1";

// Backend host for serving sticker preview images
const BACKEND_HOST = "http://localhost:4000";

// Initialize preview page logic on page load
document.addEventListener("DOMContentLoaded", () => {
  init();
});

// Main entry point for preview page setup
async function init() {
  initPreviewModal();
  await loadSticker();
  setupActionButtons();
}

// Initialize preview modal, carousel, and image navigation
function initPreviewModal() {
  const modalEl = document.getElementById("stickerPreviewModal");
  if (!modalEl || typeof bootstrap === "undefined") return;

  const modal = new bootstrap.Modal(modalEl);
  const previewImage = document.getElementById("previewImage");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  const carouselEl = document.getElementById("productCarousel");
  const carousel =
    carouselEl ? bootstrap.Carousel.getOrCreateInstance(carouselEl) : null;

  let images = [];
  let index = 0;

  // Refresh preview bindings after sticker data is loaded
  window.refreshPreviewTriggers = () => {
    if (!window.currentSticker) return;

    images = window.currentSticker.preview_images.map(
      img => `${img}`
    );
    index = 0;

    previewImage.src = images[0];

    bindThumbnailClicks();

    document.querySelectorAll(".product-image-main").forEach((img, i) => {
      img.style.cursor = "pointer";
      img.onclick = () => {
        index = i;
        previewImage.src = images[index];
        modal.show();
      };
    });
  };

  // Bind thumbnail clicks to carousel and preview image
  function bindThumbnailClicks() {
    const thumbnails = document.querySelectorAll(".thumbnail");

    thumbnails.forEach(thumb => {
      thumb.onclick = () => {
        const idx = Number(thumb.dataset.index);

        carousel?.to(idx);
        index = idx;
        previewImage.src = images[index];

        thumbnails.forEach(t => t.classList.remove("active"));
        thumb.classList.add("active");
      };
    });
  }

  // Sync active thumbnail on carousel slide
  carouselEl?.addEventListener("slid.bs.carousel", e => {
    index = e.to;

    const thumbnails = document.querySelectorAll(".thumbnail");
    thumbnails.forEach(t => t.classList.remove("active"));
    if (thumbnails[index]) thumbnails[index].classList.add("active");
  });

  // Navigate preview images manually
  prevBtn?.addEventListener("click", () => {
    index = (index - 1 + images.length) % images.length;
    previewImage.src = images[index];
  });

  nextBtn?.addEventListener("click", () => {
    index = (index + 1) % images.length;
    previewImage.src = images[index];
  });
}

// Fetch sticker data from backend using URL ID
async function loadSticker() {
  const params = new URLSearchParams(window.location.search);
  const stickerId = params.get("id");

  if (!stickerId) {
    console.error("Missing sticker ID");
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/stickers/getByID/${stickerId}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error("Sticker not found");

    const { sticker } = await res.json();
    window.currentSticker = sticker;

    renderMainSticker(sticker);
    await renderRelatedStickers(sticker);
    window.refreshPreviewTriggers?.();

  } catch (err) {
    console.error("Failed to load sticker:", err);
  }
}

// Render main sticker images, thumbnails, and details
function renderMainSticker(sticker) {
  const carouselInner = document.getElementById("carousel-inner-container");
  const thumbnailContainer = document.querySelector(".thumbnail-container");

  const images = sticker.preview_images.map(
    img => `${img}`
  );

  carouselInner.innerHTML = images.map((src, i) => `
    <div class="carousel-item ${i === 0 ? "active" : ""}">
      <img src="${src}" class="d-block w-100 product-image-main">
    </div>
  `).join("");

  thumbnailContainer.innerHTML = images.map((src, i) => `
    <img
      src="${src}"
      class="thumbnail ${i === 0 ? "active" : ""}"
      data-index="${i}"
    >
  `).join("");

  document.querySelector(".product-title").textContent = sticker.name;
  document.querySelector(".product-price").textContent =
    `₱${sticker.price}.00 PHP`;

  document.getElementById("product-description-text").innerHTML = `
    <strong>Description:</strong><br>${sticker.description}
  `;

  document.title = `Bubbistix | ${sticker.name}`;

  window.refreshPreviewTriggers?.();
}

// Fetch and render related stickers from the same category
async function renderRelatedStickers(currentSticker) {
  const container = document.getElementById("related-stickers-container");
  if (!container) return;

  // Normalize category data format
  const categoryId =
    typeof currentSticker.category_id === "object"
      ? currentSticker.category_id._id
      : currentSticker.category_id;

  const categoryName =
    typeof currentSticker.category_id === "object"
      ? currentSticker.category_id.name
      : "";

  if (!categoryId) {
    console.warn("Sticker has no category");
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/stickers/getByCategory/${categoryId}`,
      { cache: "no-store" }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const related = data.stickers.filter(
      s => s._id !== currentSticker._id
    );

    if (related.length === 0) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <div class="col-12 mb-4">
        <h3 class="fw-bold border-bottom pb-2">
          More from ${categoryName}
        </h3>
      </div>
    `;

    related.forEach(sticker => {
      const image = `${sticker.preview_images[0]}`;

      const col = document.createElement("div");
      col.className = "col-6 col-md-4 col-lg-3 mb-4";
      col.innerHTML = `
        <div class="card h-100 border-0 shadow-sm related-sticker-card"
             style="cursor:pointer; transition:transform .2s">
          <div class="p-3 d-flex justify-content-center align-items-center"
               style="height:200px; background:#f8f9fa; border-radius:10px;">
            <img src="${image}" class="img-fluid" alt="${sticker.name}">
          </div>
          <div class="card-body text-center">
            <h6 class="fw-bold mb-1 text-truncate">${sticker.name}</h6>
            <p class="fw-bold" style="color:#49705B;">₱${sticker.price}</p>
          </div>
        </div>
      `;

      const card = col.querySelector(".related-sticker-card");

      // Apply hover animation
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-5px)";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)";
      });

      // Navigate to selected sticker preview
      card.addEventListener("click", () => {
        window.location.href = `shop-preview.html?id=${sticker._id}`;
      });

      container.appendChild(col);
    });

  } catch (err) {
    console.error("Failed to load related stickers:", err);
  }
}

// Bind add-to-cart and checkout buttons
function setupActionButtons() {
  const addBtn = document.querySelector(".btn-add-cart");
  const checkoutBtn = document.querySelector(".btn-checkout");

  addBtn?.addEventListener("click", () => {
    if (!window.currentSticker) return;
    addToCart(window.currentSticker._id, window.currentSticker.name);
  });

  checkoutBtn?.addEventListener("click", async () => {
    if (!window.currentSticker) return;

    await addToCartAndCheckout(
      window.currentSticker._id,
      window.currentSticker.name
    );
  });
}

// Add sticker to cart with feedback toast
async function addToCart(stickerId, stickerName) {
  try {
    // Add item to protected cart and handle unauthorized access
    const headers = getAuthHeaders();
    if (!headers) return;

    const res = await fetch(`${API_BASE_URL}/carts/addToCart`, {
      method: "POST",
      headers,
      body: JSON.stringify({ sticker_id: stickerId })
    });

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      showToast(
        "Cart Info",
        data.message || "Unable to add to cart",
        "info"
      );
      return;
    }

    showToast(
      "Added to Cart",
      `${stickerName} has been added to your cart!`,
      "success"
    );

  } catch (error) {
    console.error("Add to cart failed:", error);
    showToast(
      "Error",
      "Something went wrong. Please try again.",
      "error"
    );
  }
}

// Add sticker to cart and immediately proceed to checkout
async function addToCartAndCheckout(stickerId) {
  try {
    // Add item to protected cart and handle unauthorized access
    const headers = getAuthHeaders();
    if (!headers) return;

    const res = await fetch(`${API_BASE_URL}/carts/addToCart`, {
      method: "POST",
      headers,
      body: JSON.stringify({ sticker_id: stickerId })
    });

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await res.json();

    // Handle ownership and availability edge cases
    if (data.code === "ALREADY_OWNED") {
      showToast("Already Owned", "You already own this sticker.", "info");
      return;
    }

    if (data.code === "LIMITED_SOLD") {
      showToast("Sold Out", "This limited sticker is already sold.", "info");
      return;
    }

    // Redirect if sticker is already in cart
    if (
      !res.ok &&
      data.message?.toLowerCase().includes("already in cart")
    ) {
      window.location.href = "checkout.html";
      return;
    }

    if (!res.ok) {
      showToast(
        "Cart Info",
        data.message || "Unable to proceed to checkout",
        "info"
      );
      return;
    }

    window.location.href = "checkout.html";

  } catch (error) {
    console.error("Checkout failed:", error);
    showToast(
      "Error",
      "Something went wrong. Please try again.",
      "error"
    );
  }
}

// Show toast message using shared UI helper
function showToast(title, message, type = "success") {
  if (window.bubbistixUI?.showToast) {
    window.bubbistixUI.showToast({ title, message, type });
  } else {
    alert(message);
  }
}
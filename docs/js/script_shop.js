import { getAuthHeaders, handleUnauthorized } from "./utils/auth.js";

// API base path for shop-related backend endpoints
const API_BASE_URL = "http://localhost:4000/api/v1";

// Backend host for serving sticker images
const BACKEND_HOST = "http://localhost:4000";

// DOM references for gallery, navigation, and controls
const gallery = document.getElementById("gallery");
const categoryNav = document.getElementById("category-nav");
const categoryNavMobile = document.getElementById("category-nav-mobile");
const searchInputs = document.querySelectorAll("#search-input, #search-input-mobile");
const sortSelectors = document.querySelectorAll("#sort-select, #sort-select-mobile");

// State variables for category scroll and sticker data
let pendingCategoryScroll = null;
let stickers = [];

// Read category from URL for auto-scroll
const urlParams = new URLSearchParams(window.location.search);
pendingCategoryScroll = urlParams.get("category");

// Fetch stickers from backend and initialize shop
async function initializeShop() {
  try {
    // Show loading spinner while fetching data
    gallery.innerHTML = `
      <div class="d-flex justify-content-center p-4">
        <div class="spinner-border text-danger" role="status"></div>
      </div>
    `;

    const res = await fetch(`${API_BASE_URL}/stickers/getAll`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    stickers = data.stickers;

    // Render gallery and activate filters
    renderGallery();
    setupEventListeners();

  } catch (error) {
    console.error("Failed to load stickers:", error);
    gallery.innerHTML = "<p>Error loading stickers.</p>";
  }
}

// Render sticker gallery with optional search and sorting
function renderGallery(filterText = "", sortBy = "") {
  gallery.innerHTML = "";
  categoryNav.innerHTML = "";
  categoryNavMobile.innerHTML = "";

  let filtered = [...stickers];

  // Apply search filter
  if (filterText) {
    filtered = filtered.filter(sticker =>
      sticker.name.toLowerCase().includes(filterText.toLowerCase())
    );
  }

  // Apply sorting option
  switch (sortBy) {
    case "az":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "za":
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "price-low":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filtered.sort((a, b) => b.price - a.price);
      break;
  }

  // Show empty state if no results
  if (filtered.length === 0) {
    gallery.innerHTML = "<p>No products found.</p>";
    return;
  }

  // Group stickers by category
  const grouped = {};
  filtered.forEach(sticker => {
    if (!sticker.category_id) return;

    const { name, slug } = sticker.category_id;

    if (!grouped[slug]) {
      grouped[slug] = { name, slug, items: [] };
    }

    grouped[slug].items.push(sticker);
  });

  // Render each category section
  Object.values(grouped).forEach(({ name, slug, items }) => {
    const navItem = document.createElement("li");
    navItem.innerHTML = `<a href="#${slug}">${name}</a>`;
    categoryNav.appendChild(navItem);

    // Duplicate nav item for mobile
    if (categoryNavMobile) {
      categoryNavMobile.appendChild(navItem.cloneNode(true));
    }

    const categoryEl = document.createElement("div");
    categoryEl.className = "category";
    categoryEl.id = slug;

    categoryEl.innerHTML = `
      <h2>${name}</h2>
      <div class="items">
        ${items.map(sticker => {
          const imageUrl = `${sticker.preview_images[0]}`;
          return `
            <div class="item">
              <a href="shop-preview.html?id=${sticker._id}" style="text-decoration: none; color: inherit;">
                <img src="${imageUrl}" alt="${sticker.name}">
                <p class="gallery-item-name">${sticker.name}</p>
                <p class="gallery-item-price">₱${sticker.price.toFixed(2)}</p>
              </a>
              <button class="product-btn"
                onclick="addToCart('${sticker._id}', '${sticker.name}', '${imageUrl}', ${sticker.price})">
                Add to Cart
              </button>
            </div>
          `;
        }).join("")}
      </div>
    `;

    gallery.appendChild(categoryEl);
  });

  // Auto-scroll to category from URL after render
  if (pendingCategoryScroll) {
    const target = document.getElementById(pendingCategoryScroll);

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("category-highlight");

      setTimeout(() => {
        target.classList.remove("category-highlight");
      }, 1500);
    }

    pendingCategoryScroll = null;
  }
}

// Sync search and sort controls across desktop and mobile
function setupEventListeners() {
  searchInputs.forEach(input => {
    input.addEventListener("input", () => {
      searchInputs.forEach(i => (i.value = input.value));
      renderGallery(input.value, sortSelectors[0].value);
    });
  });

  sortSelectors.forEach(select => {
    select.addEventListener("change", () => {
      sortSelectors.forEach(s => (s.value = select.value));
      renderGallery(searchInputs[0].value, select.value);
    });
  });
}

// Add selected sticker to cart via backend
async function addToCart(stickerId, stickerName) {
  try {
    // Add item to protected cart and redirect if session is invalid
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

    // Show backend message if request fails
    if (!res.ok) {
      showToast("Cart Info", data.message || "Unable to add to cart", "info");
      return;
    }

    showToast(
      "Added to Cart",
      `${stickerName} has been added to your cart!`,
      "success"
    );

  } catch (error) {
    console.error("Add to cart failed:", error);
    showToast("Error", "Something went wrong. Please try again.", "error");
  }
}

// Display toast notification with fallback alert
function showToast(title, message, type = "success") {
  if (window.bubbistixUI && typeof window.bubbistixUI.showToast === "function") {
    window.bubbistixUI.showToast({
      title,
      message,
      type,
      autohide: true,
      delay: 3000,
      position: "top-right"
    });
  } else {
    alert(message);
  }
}
window.addToCart = addToCart;
// Initialize shop on page load
initializeShop();
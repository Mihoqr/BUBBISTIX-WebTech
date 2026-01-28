// API base path for backend endpoints
const API_BASE_URL = "http://localhost:4000/api/v1";

// Backend host for serving images
const BACKEND_HOST = "http://localhost:4000";

// Load homepage collections on page load
document.addEventListener("DOMContentLoaded", () => {
  loadCollections();
});

// Fetch categories and preview stickers, then render collection cards
async function loadCollections() {
  const grid = document.querySelector(".collection-grid");
  if (!grid) return;

  try {
    const catRes = await fetch(`${API_BASE_URL}/categories/getAll`);
    const stickRes = await fetch(`${API_BASE_URL}/stickers/getAll`);

    const catData = await catRes.json();
    const stickData = await stickRes.json();
    const stickers = stickData.stickers;

    if (!catRes.ok) throw new Error(catData.message);

    // Clear grid and render one preview card per category
    grid.innerHTML = "";

    for (const category of catData.categories) {
      const previewSticker = stickers.find(
        s => s.category_id?._id === category._id
      );

      if (!previewSticker) continue;

      const imageUrl = `${BACKEND_HOST}${previewSticker.preview_images[0]}`;

      const col = document.createElement("div");
      col.className = "col";

      col.innerHTML = `
        <div class="collection-card">
          <img src="${imageUrl}" alt="Preview of ${category.name}">
          <a href="docs/html/shop.html?category=${category.slug}">
            ${category.name} →
          </a>
        </div>
      `;

      grid.appendChild(col);
    }

  } catch (error) {
    // Handle fetch or rendering errors
    console.error("Failed to load homepage collections:", error);

    if (window.bubbistixUI) {
      bubbistixUI.showToast({
        title: "Error",
        message: "Unable to load collections",
        type: "error"
      });
    }
  }
}
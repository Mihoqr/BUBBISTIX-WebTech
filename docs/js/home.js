import { API_BASE_URL } from "./config.js";

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

    const sortedCategories = [...catData.categories].sort((a, b) => {
      if (a.slug === 'limited-edition') return 1;
      if (b.slug === 'limited-edition') return -1;
      return a.name.localeCompare(b.name);
    });

    for (const category of sortedCategories) {
      const previewSticker = stickers.find(
        s => s.category_id?._id === category._id
      );

      if (!previewSticker) continue;

      const imageUrl = `${previewSticker.preview_images[0]}`;

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
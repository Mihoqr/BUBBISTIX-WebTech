import { getAuthHeaders, handleUnauthorized } from "./utils/auth.js";

// Base API URL for order-related backend requests
const API_BASE_URL = "http://localhost:4000/api/v1";

// Backend host used for resolving image URLs
const BACKEND_HOST = "http://localhost:4000";

// Load the latest order details once the page is ready
document.addEventListener("DOMContentLoaded", () => {
  loadLatestOrder();
});

// Load latest order from backend
async function loadLatestOrder() {
  // DOM references for order summary sections
  const orderItemsContainer = document.getElementById("orderItems");
  const totalElement = document.getElementById("total");
  const paymentContainer = document.getElementById("paymentDetails");

  try {
    // Fetch protected order data and redirect if session is invalid
    const headers = getAuthHeaders();
    if (!headers) return;

    const res = await fetch(`${API_BASE_URL}/orders/getMyOrders`, {
      headers,
      cache: "no-store"
    });

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await res.json();
    const orders = data.orders || [];

    // Handle case where no orders exist
    if (orders.length === 0) {
      orderItemsContainer.innerHTML =
        "<p>No recent order found. Please contact support.</p>";
      totalElement.textContent = "₱ 0.00";
      paymentContainer.innerHTML =
        "<p>Payment method information not available.</p>";
      return;
    }

    // Use the most recent order (latest first)
    const order = orders[0];

    // Render order sections
    renderOrderItems(order);
    renderPaymentInfo(order);
    renderTotal(order);

  } catch (err) {
    // Fallback UI if order fetch fails
    console.error("Order confirmation load failed:", err);
    orderItemsContainer.innerHTML =
      "<p>Error loading order details. Please try again.</p>";
  }
}

// Render order items
function renderOrderItems(order) {
  // Container for purchased items
  const orderItemsContainer = document.getElementById("orderItems");

  let itemsHTML = "";

  // Build UI for each purchased sticker
  order.items.forEach(item => {
    const sticker = item.sticker_id;
    const imageUrl = `${sticker.preview_images[0]}`;
    const price = item.price_at_purchase;

    itemsHTML += `
      <div class="order-item">
        <img src="${imageUrl}" alt="${sticker.name}" class="item-image">
        <div class="item-details">
          <div class="item-name">${sticker.name}</div>
          <div class="item-price">₱${price.toFixed(2)}</div>
        </div>
        <div class="item-total">₱${price.toFixed(2)}</div>
      </div>
    `;
  });

  // Inject rendered items into the page
  orderItemsContainer.innerHTML = itemsHTML;
}

// Render payment info
function renderPaymentInfo(order) {
  // Container for payment method display
  const paymentContainer = document.getElementById("paymentDetails");

  // Normalize payment method text
  const method = order.payment_method || "MOCK";
  const displayMethod = method.replace(/_/g, " ");

  // Show selected (read-only) payment method
  paymentContainer.innerHTML = `
    <div class="payment-option selected" style="pointer-events:none;">
      <input type="radio" checked disabled>
      <label>${displayMethod}</label>
    </div>
  `;
}

// Render total
function renderTotal(order) {
  // Display final order total
  const totalElement = document.getElementById("total");
  totalElement.textContent = `₱ ${order.total_amount.toFixed(2)}`;
}
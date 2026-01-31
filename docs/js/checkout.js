import { getAuthHeaders, handleUnauthorized } from "./utils/auth.js";

// API base path for checkout-related backend endpoints
const API_BASE_URL = "http://localhost:4000/api/v1";

// Backend host for serving sticker images
const BACKEND_HOST = "http://localhost:4000";

// Initialize checkout data, payment options, and form validation on load
document.addEventListener("DOMContentLoaded", () => {
  loadCartItems();
  initializePaymentMethods();
  initializeFormValidation();
});

// Fetch cart items from backend and render checkout summary
async function loadCartItems() {
  const orderItemsContainer = document.getElementById("orderItems");
  const totalElement = document.getElementById("total");
  const payNowBtn = document.getElementById("payNowBtn");

  try {
    // Attach auth headers, redirect if token is missing
    const headers = getAuthHeaders();
    if (!headers) return;

    // Request current user's cart
    const res = await fetch(`${API_BASE_URL}/carts/getCart`, {
      headers,
      cache: "no-store"
    });

    // Handle expired or invalid session
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await res.json();
    const cart = data.cart;

    // Handle empty cart state and disable payment
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      orderItemsContainer.innerHTML = "<p>Your cart is empty</p>";
      totalElement.textContent = "PHP ₱ 0.00";

      disablePayButton(payNowBtn);
      return;
    }

    let subtotal = 0;
    orderItemsContainer.innerHTML = "";

    // Render each cart item and compute subtotal
    cart.items.forEach(item => {
      const sticker = item.sticker_id;
      const imageUrl = `${BACKEND_HOST}${sticker.preview_images[0]}`;
      const itemTotal = item.price_at_add;

      subtotal += itemTotal;

      const orderItem = document.createElement("div");
      orderItem.className = "order-item";
      orderItem.innerHTML = `
        <img src="${imageUrl}" alt="${sticker.name}" class="item-image">
        <div class="item-details">
          <div class="item-name">${sticker.name}</div>
          <div class="item-price">₱${itemTotal.toFixed(2)}</div>
        </div>
        <div class="item-total">₱${itemTotal.toFixed(2)}</div>
      `;

      orderItemsContainer.appendChild(orderItem);
    });

    // Update total amount and enable payment
    totalElement.textContent = `PHP ₱ ${subtotal.toFixed(2)}`;
    enablePayButton(payNowBtn);

  } catch (err) {
    console.error("Checkout load error:", err);
    orderItemsContainer.innerHTML = "<p>Error loading cart</p>";
  }
}

// Validate form and confirm payment before checkout
function initializeFormValidation() {
  const payNowBtn = document.getElementById("payNowBtn");

  payNowBtn.addEventListener("click", e => {
    e.preventDefault();

    // Stop checkout if form validation fails
    if (!validateForm()) {
      showMessage("Please correct the highlighted fields before proceeding.", "error");
      return;
    }

    const modalEl = document.getElementById("confirmPaymentModal");
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();

      document.getElementById("confirmPayBtn").onclick = async () => {
        modal.hide();
        await processPayment();
      };
    } else {
      processPayment();
    }
  });
}

// Create order and process payment via backend
async function processPayment() {
  const payNowBtn = document.getElementById("payNowBtn");
  payNowBtn.textContent = "Processing...";
  payNowBtn.disabled = true;

  try {
    // Attach auth headers, redirect if token is missing
    const headers = getAuthHeaders();
    if (!headers) return;

    // Send order creation request
    const res = await fetch(`${API_BASE_URL}/orders/create`, {
      method: "POST",
      headers
    });

    // Handle expired or invalid session
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await res.json();

    // Handle checkout failure
    if (!res.ok) {
      showMessage(data.message || "Checkout failed", "error");
      payNowBtn.textContent = "Pay Now";
      payNowBtn.disabled = false;
      return;
    }

    // Redirect on successful order creation
    window.location.href = "order-confirmation.html";

  } catch (err) {
    console.error("Checkout error:", err);
    showMessage("Something went wrong. Please try again.", "error");
    payNowBtn.textContent = "Pay Now";
    payNowBtn.disabled = false;
  }
}

// Disable payment button when cart is empty
function disablePayButton(btn) {
  btn.disabled = true;
  btn.textContent = "Cart is Empty";
  btn.style.backgroundColor = "#ccc";
  btn.style.cursor = "not-allowed";
}

// Enable payment button when cart has items
function enablePayButton(btn) {
  btn.disabled = false;
  btn.textContent = "Pay Now";
  btn.style.backgroundColor = "";
  btn.style.cursor = "pointer";
}

// Display temporary checkout messages
function showMessage(message, type) {
  const existing = document.querySelector(".checkout-message");
  if (existing) existing.remove();

  const div = document.createElement("div");
  div.className = `checkout-message ${type}`;
  div.textContent = message;
  document.body.appendChild(div);

  setTimeout(() => div.remove(), 3000);
}

// Initialize payment method UI state
function initializePaymentMethods() {
  const creditCardFields = document.getElementById("credit-card-fields");
  creditCardFields.style.display = "block";
}

// Validate required checkout form fields
function validateForm() {
  const email = document.getElementById("email");
  let valid = true;

  if (!email.value.trim()) {
    email.style.borderColor = "#dc3545";
    valid = false;
  } else {
    email.style.borderColor = "#ddd";
  }

  return valid;
}
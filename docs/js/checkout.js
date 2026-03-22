import { getAuthHeaders, handleUnauthorized } from "./utils/auth.js";
import { API_BASE_URL } from "./config.js";

// Initialize checkout data, payment options, and form validation on load
document.addEventListener("DOMContentLoaded", () => {
  loadCartItems();
  initializePaymentMethods();
  initializeFormValidation();
  initializeLiveFormatting();
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
      const imageUrl = `${sticker.preview_images[0]}`;
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

    // Stop checkout if form validation fails — errors shown inline per field
    if (!validateForm()) return;

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

//  Inline error helpers
// Attach a red error message inside the field wrapper so it stacks below the input
function setFieldError(input, message) {
  clearFieldError(input);

  input.style.borderColor = "#dc3545";
  input.setAttribute("aria-invalid", "true");

  const error = document.createElement("div");
  error.className = "checkout-field-error";
  error.setAttribute("role", "alert");
  error.textContent = message;
  error.style.cssText = "color:#dc3545;font-size:0.8rem;margin-top:4px;";

  // Append INSIDE the wrapper so it becomes a child (stacks below in flex-column),
  // or insert after the input directly when there is no wrapper
  const wrapper = input.closest(".card-field-wrapper");
  if (wrapper) {
    wrapper.appendChild(error);
  } else {
    input.insertAdjacentElement("afterend", error);
  }
}

// Remove the error state from a field
function clearFieldError(input) {
  input.style.borderColor = "";
  input.removeAttribute("aria-invalid");

  const wrapper = input.closest(".card-field-wrapper");
  if (wrapper) {
    const existing = wrapper.querySelector(".checkout-field-error");
    if (existing) existing.remove();
  } else {
    const next = input.nextElementSibling;
    if (next && next.classList.contains("checkout-field-error")) next.remove();
  }
}

// Auto-format card fields as the user types
function initializeLiveFormatting() {
  const cardNumber = document.getElementById("cardNumber");
  const expiryDate = document.getElementById("expiryDate");
  const cvv        = document.getElementById("cvv");
  const cardName   = document.getElementById("cardName");
  const emailInput = document.getElementById("email");

  // Groups of 4 digits: 1234 5678 9012 3456
  if (cardNumber) {
    cardNumber.addEventListener("input", () => {
      let val = cardNumber.value.replace(/\D/g, "").slice(0, 16);
      cardNumber.value = val.replace(/(.{4})/g, "$1 ").trim();
      clearFieldError(cardNumber);
    });
  }

  // Auto-insert slash after MM: 12/26
  if (expiryDate) {
    expiryDate.addEventListener("input", () => {
      let val = expiryDate.value.replace(/\D/g, "").slice(0, 4);
      if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
      expiryDate.value = val;
      clearFieldError(expiryDate);
    });
  }

  // Digits only, max 4
  if (cvv) {
    cvv.addEventListener("input", () => {
      cvv.value = cvv.value.replace(/\D/g, "").slice(0, 4);
      clearFieldError(cvv);
    });
  }

  if (cardName)   cardName.addEventListener("input",   () => clearFieldError(cardName));
  if (emailInput) emailInput.addEventListener("input", () => clearFieldError(emailInput));
}

// Validate all checkout form fields and show specific inline errors
function validateForm() {
  // Wipe all previous errors for a clean re-validation pass
  document.querySelectorAll(".checkout-field-error").forEach(el => el.remove());
  document.querySelectorAll(".checkout-input").forEach(el => {
    el.style.borderColor = "";
    el.removeAttribute("aria-invalid");
  });

  let valid = true;
  let firstError = null;
  const track = (input) => { if (!firstError) firstError = input; };

  // Email
  const email = document.getElementById("email");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim()) {
    setFieldError(email, "Email is required."); valid = false; track(email);
  } else if (!emailRegex.test(email.value.trim())) {
    setFieldError(email, "Please enter a valid email address."); valid = false; track(email);
  }

  // Card number
  const cardNumber = document.getElementById("cardNumber");
  const rawCard = cardNumber.value.replace(/\s/g, "");
  if (!rawCard) {
    setFieldError(cardNumber, "Card number is required."); valid = false; track(cardNumber);
  } else if (!/^\d{16}$/.test(rawCard)) {
    setFieldError(cardNumber, "Card number must be 16 digits."); valid = false; track(cardNumber);
  }

  // Expiry date
  const expiryDate = document.getElementById("expiryDate");
  const expiryVal  = expiryDate.value.trim();
  if (!expiryVal) {
    setFieldError(expiryDate, "Expiration date is required."); valid = false; track(expiryDate);
  } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryVal)) {
    setFieldError(expiryDate, "Use MM/YY format (e.g. 08/27)."); valid = false; track(expiryDate);
  } else {
    const [month, year] = expiryVal.split("/").map(Number);
    const expiry    = new Date(2000 + year, month - 1, 1);
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    if (expiry < thisMonth) {
      setFieldError(expiryDate, "This card has expired."); valid = false; track(expiryDate);
    }
  }

  // CVV
  const cvv = document.getElementById("cvv");
  if (!cvv.value.trim()) {
    setFieldError(cvv, "CVV is required."); valid = false; track(cvv);
  } else if (!/^\d{3,4}$/.test(cvv.value.trim())) {
    setFieldError(cvv, "CVV must be 3 or 4 digits."); valid = false; track(cvv);
  }

  // Name on card
  const cardName = document.getElementById("cardName");
  if (!cardName.value.trim()) {
    setFieldError(cardName, "Name on card is required."); valid = false; track(cardName);
  } else if (cardName.value.trim().length < 2) {
    setFieldError(cardName, "Please enter the full name on your card."); valid = false; track(cardName);
  }

  // Scroll to and focus the first invalid field
  if (firstError) {
    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    firstError.focus();
  }

  return valid;
}
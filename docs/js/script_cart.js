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

// API base path for cart-related backend endpoints
const API_BASE_URL = "http://localhost:4000/api/v1";

// Backend host for serving sticker images
const BACKEND_HOST = "http://localhost:4000";

// Fetch cart from backend and render cart UI with totals
async function renderCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  const totalEl = document.querySelector('.final-total');
  const checkoutBtn = document.querySelector('.checkout-btn');

  try {
    // Fetch protected cart data and redirect if session is invalid
    const headers = getAuthHeaders();
    if (!headers) {
      // Show demo mode empty cart if not authenticated
      cartItemsContainer.innerHTML = `
        <p class="empty-cart" role="alert" aria-live="assertive">
          Your cart is currently empty. Click "Continue shopping" to add items.
        </p>
      `;

      totalEl.textContent = '₱ 0.00 PHP';

      if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Cart is Empty';
        checkoutBtn.style.backgroundColor = '#ccc';
        checkoutBtn.style.cursor = 'not-allowed';
        checkoutBtn.style.opacity = '0.5';
        checkoutBtn.style.color = '#666';
        checkoutBtn.style.border = '1px solid #999';
        checkoutBtn.style.boxShadow = 'none';
      }
      return;
    }

    const res = await fetch(`${API_BASE_URL}/carts/getCart`, {
      headers,
      cache: "no-store"
    });

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await res.json();
    const cart = data.cart;

    // Handle empty cart state and disable checkout
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      cartItemsContainer.innerHTML = `
        <p class="empty-cart" role="alert" aria-live="assertive">
          Your cart is currently empty. Click "Continue shopping" to add items.
        </p>
      `;

      totalEl.textContent = '₱ 0.00 PHP';

      if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Cart is Empty';
        checkoutBtn.style.backgroundColor = '#ccc';
        checkoutBtn.style.cursor = 'not-allowed';
        checkoutBtn.style.opacity = '0.5';
        checkoutBtn.style.color = '#666';
        checkoutBtn.style.border = '1px solid #999';
        checkoutBtn.style.boxShadow = 'none';
        checkoutBtn.onclick = function (e) {
          e.preventDefault();
          alert('Please add items to your cart before proceeding to checkout.');
          return false;
        };
      }
      return;
    }

    let total = 0;

    // Build cart header layout
    let cartHTML = `
      <div class="cart-item-header" role="row">
        <span class="header-product" role="columnheader">Product</span>
        <span class="header-total" role="columnheader">Price</span>
      </div>
    `;

    // Render each cart item and compute total price
    cart.items.forEach(item => {
      const sticker = item.sticker_id;
      const imageUrl = `${BACKEND_HOST}${sticker.preview_images[0]}`;
      const itemTotal = item.price_at_add;
      total += itemTotal;

      cartHTML += `
        <div class="cart-item" data-id="${sticker._id}" role="row">
          <div class="item-info" role="gridcell">
            <img src="${imageUrl}" alt="${sticker.name}" class="item-image">
            <div class="item-details">
              <h3 class="item-name">${sticker.name}</h3>
              <p class="item-price">₱ ${itemTotal.toFixed(2)} PHP</p>
            </div>
          </div>

          <div class="item-total" role="gridcell">
            <span class="total-price">₱ ${itemTotal.toFixed(2)} PHP</span>
          </div>

          <div class="item-remove" role="gridcell">
            <button
              class="remove-btn"
              aria-label="Remove ${sticker.name} from cart"
              onclick="removeItem('${sticker._id}')"
            >X</button>
          </div>
        </div>
      `;
    });

    // Update cart UI and total amount
    cartItemsContainer.innerHTML = cartHTML;
    totalEl.textContent = `₱ ${total.toFixed(2)} PHP`;

    // Enable checkout when cart has items
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Check Out';
      checkoutBtn.style.backgroundColor = '';
      checkoutBtn.style.cursor = 'pointer';
      checkoutBtn.style.opacity = '1';
      checkoutBtn.style.color = '';
      checkoutBtn.style.border = '';
      checkoutBtn.style.boxShadow = '';
      checkoutBtn.onclick = () => {
        window.location.href = './checkout.html';
      };
    }

  } catch (err) {
    console.error("Render cart failed:", err);
    
    const cartItemsContainer = document.getElementById('cart-items');
    const totalEl = document.querySelector('.final-total');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    // Display fallback empty cart if API is unavailable
    cartItemsContainer.innerHTML = `
      <p class="empty-cart" role="alert" aria-live="assertive">
        Your cart is currently empty. Click "Continue shopping" to add items.
      </p>
      <p style="font-size: 0.9rem; color: #999; margin-top: 1rem;">
        (Backend connection unavailable - demo mode)
      </p>
    `;

    totalEl.textContent = '₱ 0.00 PHP';

    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Cart is Empty';
      checkoutBtn.style.backgroundColor = '#ccc';
      checkoutBtn.style.cursor = 'not-allowed';
      checkoutBtn.style.opacity = '0.5';
      checkoutBtn.style.color = '#666';
      checkoutBtn.style.border = '1px solid #999';
    }
  }
}

// Remove a specific item from the backend cart
async function removeItem(stickerId) {
  try {
    // Perform protected cart removal and handle invalid session
    const headers = getAuthHeaders();
    if (!headers) {
      alert("Please login to manage your cart");
      return;
    }

    const res = await fetch(
      `${API_BASE_URL}/carts/removeFromCart/${stickerId}`,
      {
        method: "DELETE",
        headers
      }
    );

    if (res.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await res.json();

    // Show error if backend removal fails
    if (!res.ok) {
      alert(data.message || "Failed to remove item");
      return;
    }

    // Re-render cart after successful removal
    renderCart();
  } catch (error) {
    console.error("Remove item error:", error);
    alert("Something went wrong.");
  }
}

window.removeItem = removeItem;
// Load cart when page finishes loading
window.onload = renderCart;
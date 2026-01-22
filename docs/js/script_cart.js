/**
 * Persist cart to localStorage.
 * @param {Array<Object>} cart - Current cart items
 */
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

/**
 * Remove an item from the cart by button context.
 * @param {HTMLButtonElement} button
 */
function removeItem(button) {
  const itemName = button.closest('.cart-item').dataset.name;
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = cart.filter(i => i.name !== itemName);
  saveCart(cart);
  renderCart();
}

/**
 * Render cart UI and totals.
 */
function renderCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <p class="empty-cart" role="alert" aria-live="assertive">Your cart is currently empty. Click "Continue shopping" to add items.</p>
    `;
    document.querySelector('.final-total').textContent = '₱ 0.00 PHP';
    
    // Disable checkout button when cart is empty
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Cart is Empty';
      checkoutBtn.style.backgroundColor = '#ccc';
      checkoutBtn.style.cursor = 'not-allowed';
      checkoutBtn.style.opacity = '0.5';
      checkoutBtn.style.color = '#666';
      checkoutBtn.style.border = '1px solid #999';
      checkoutBtn.style.boxShadow = 'none';
      checkoutBtn.onclick = function(e) {
        e.preventDefault();
        alert('Please add items to your cart before proceeding to checkout.');
        return false;
      };
    }
    return;
  }

  let total = 0;
  let cartHTML = `
    <div class="cart-item-header" role="row">
      <span class="header-product" role="columnheader">Product</span>
      <span class="header-total" role="columnheader">Price</span>
    </div>
  `;

  cart.forEach(item => {
    // Force quantity to 1 for display/calculation if needed, or just use price
    const itemTotal = item.price; 
    total += itemTotal;

    cartHTML += `
      <div class="cart-item" data-name="${item.name}" role="row">
        <div class="item-info" role="gridcell">
          <img src="${item.image}" alt="${item.name}" class="item-image">
          <div class="item-details">
            <h3 class="item-name">${item.name}</h3>
            <p class="item-price">₱ ${item.price.toFixed(2)} PHP</p>
          </div>
        </div>

        <div class="item-total" role="gridcell">
          <span class="total-price">₱ ${itemTotal.toFixed(2)} PHP</span>
        </div>

        <div class="item-remove" role="gridcell">
          <button class="remove-btn" aria-label="Remove ${item.name} from cart" onclick="removeItem(this)">X</button>
        </div>
      </div>
    `;
  });

  cartItemsContainer.innerHTML = cartHTML;
  document.querySelector('.final-total').textContent = `₱ ${total.toFixed(2)} PHP`;
  
  // Re-enable checkout button when cart has items
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Check Out';
    checkoutBtn.style.backgroundColor = '';
    checkoutBtn.style.cursor = 'pointer';
    checkoutBtn.style.opacity = '1';
    checkoutBtn.style.color = '';
    checkoutBtn.style.border = '';
    checkoutBtn.style.boxShadow = '';
    checkoutBtn.onclick = function() {
      window.location.href = 'checkout.html';
    };
  }
}

// Initialize cart on load
window.onload = renderCart;

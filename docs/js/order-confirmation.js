// // Order Confirmation Page functionality
// // ES6 + maintainability: arrow init, reduced debug logging
// document.addEventListener('DOMContentLoaded', () => {
//     // Load and display all data sections
//     loadOrderData();
//     loadPaymentInfo();
    
//     // Clear order data after displaying (optional but recommended)
//     // clearOrderData(); 
// });

// // --- Core Logic Functions ---

// function loadOrderData() {
//     // Retrieve data
//     const orderData = JSON.parse(localStorage.getItem('orderData')) || {};
//     const discountAmount = parseFloat(localStorage.getItem('discountAmount')) || 0;
//     let items = orderData.items || JSON.parse(localStorage.getItem('cart')) || []; 
    
//     // Data loaded from localStorage; no verbose logging in production
    
//     // Retrieve HTML elements (CRITICAL STEP)
//     const orderItemsContainer = document.getElementById('orderItems');
//     const totalElement = document.getElementById('total');
    
//     // Safety check for the parent container before trying to use .closest()
//     const totalContainer = totalElement?.closest('.order-totals'); 

//     // --- Safety Check for Totals ---
//     if (!totalElement) {
//         console.error("Order Summary Error: Missing HTML element ID (total). Check your order-confirmation.html file.");
//         if (orderItemsContainer) {
//             orderItemsContainer.innerHTML = '<p>Order Summary failed to load. Please check console for errors.</p>';
//         }
//         return;
//     }
//     // ---------------------------------
    
//     if (items.length === 0) {
//         // Try to get items from cart as fallback
//         const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
//         if (cartItems.length > 0) {
//             // Use cart items as a graceful fallback
//             items = cartItems;
//         } else {
//             orderItemsContainer.innerHTML = '<p>No order items found. Please contact support.</p>';
//             totalElement.textContent = '₱ 0.00';
//             return;
//         }
//     }
    
//     let subtotal = 0;
//     let itemsHTML = '';
    
//     items.forEach((item, index) => {
//         // Ensure price is treated as a number
//         const itemPrice = parseFloat(item.price);
//         // Force quantity to 1
//         const itemTotal = itemPrice;
//         subtotal += itemTotal;
        
//         // Build item row output
        
//         itemsHTML += `
//             <div class="order-item">
//                 <img src="${item.image}" alt="${item.name}" class="item-image">
//                 <div class="item-details">
//                     <div class="item-name">${item.name}</div>
//                     <div class="item-price">₱${itemPrice.toFixed(2)}</div>
//                 </div>
//                 <div class="item-total">₱${itemTotal.toFixed(2)}</div>
//             </div>
//         `;
//     });
    
//     orderItemsContainer.innerHTML = itemsHTML;
    
//     // Calculate and Display Totals
//     const shipping = 0.00;
//     let finalTotal = subtotal + shipping;
    
//     // Totals computed; display below
    
//     // Handle Discount
//     if (discountAmount > 0 && totalContainer) { // Check if totalContainer is available for insertion
//         finalTotal -= discountAmount;
//         // Discount applied visually and to computed total
        
//         // Create and insert the discount line
//         const finalTotalLine = document.querySelector('.total-line.final-total');

//         const discountLine = document.createElement('div');
//         discountLine.id = 'discountLine';
//         discountLine.className = 'total-line';
//         discountLine.style.color = '#28a745';
//         discountLine.innerHTML = `
//             <span>Discount</span>
//             <span>-₱${discountAmount.toFixed(2)}</span>
//         `;
        
//         // Insert only if both container and final line are found
//         if (finalTotalLine) { 
//             totalContainer.insertBefore(discountLine, finalTotalLine);
//         }
//     }
    
//     // Display Final Total
//     totalElement.textContent = `₱${finalTotal.toFixed(2)}`;
//     // Final total rendered
// }

// function loadPaymentInfo() {
//     const paymentData = JSON.parse(localStorage.getItem('paymentData')) || null;
//     const paymentContainer = document.getElementById('paymentDetails');
    
//     if (!paymentData) {
//         paymentContainer.innerHTML = `<p>Payment method information not available.</p>`;
//         return;
//     }
    
//     let paymentHTML = '';
    
//     // Check if the method is Credit Card to display the fields
//     if (paymentData.method === 'credit_card') {
//         const last4 = paymentData.cardNumber ? paymentData.cardNumber.slice(-4) : '0000';
//         // Use placeholders if data is missing (though it should be there if validated)
//         const expiry = paymentData.expiryDate || 'MM/YY';
//         const cardName = paymentData.cardName || 'Cardholder Name';
        
//         paymentHTML = `
//             <div class="payment-option selected" style="pointer-events: none;">
//                 <input type="radio" id="credit-card" name="payment" value="credit_card" checked disabled>
//                 <label for="credit-card">Credit Card</label>
//             </div>
            
//             <div class="credit-card-fields" style="display: block; margin-top: 15px;">
//                 <input type="text" class="checkout-input" value="**** **** **** ${last4}" readonly style="background-color: #f9f9f9; cursor: default;">
                
//                 <div class="card-details">
//                     <input type="text" class="checkout-input half-width" value="${expiry}" readonly style="background-color: #f9f9f9; cursor: default;">
//                     <input type="text" class="checkout-input half-width" value="***" readonly style="background-color: #f9f9f9; cursor: default;">
//                 </div>
                
//                 <input type="text" class="checkout-input" value="${cardName}" readonly style="background-color: #f9f9f9; cursor: default;">
//             </div>
//         `;
//     } else {
//         // Fallback for other methods (e.g. COD if it existed)
//         const methodDisplay = paymentData.method.replace(/_/g, ' ');
//         paymentHTML = `
//             <div class="payment-option selected" style="pointer-events: none;">
//                 <input type="radio" checked disabled>
//                 <label>${methodDisplay}</label>
//             </div>
//         `;
//     }
    
//     paymentContainer.innerHTML = paymentHTML;
// }

// function clearOrderData() {
//     // Clears all temporary order-related data from localStorage after display
//     localStorage.removeItem('orderData');
//     localStorage.removeItem('deliveryData');
//     localStorage.removeItem('paymentData');
//     localStorage.removeItem('discountAmount'); 
// }




// Old code intentionally kept for future credit card implementation reference


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
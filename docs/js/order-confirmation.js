// Order Confirmation Page functionality
// ES6 + maintainability: arrow init, reduced debug logging
document.addEventListener('DOMContentLoaded', () => {
    // Load and display all data sections
    loadOrderData();
    loadPaymentInfo();
    
    // Clear order data after displaying (optional but recommended)
    // clearOrderData(); 
});

// --- Core Logic Functions ---

function loadOrderData() {
    // Retrieve data
    const orderData = JSON.parse(localStorage.getItem('orderData')) || {};
    const discountAmount = parseFloat(localStorage.getItem('discountAmount')) || 0;
    let items = orderData.items || JSON.parse(localStorage.getItem('cart')) || []; 
    
    // Data loaded from localStorage; no verbose logging in production
    
    // Retrieve HTML elements (CRITICAL STEP)
    const orderItemsContainer = document.getElementById('orderItems');
    const totalElement = document.getElementById('total');
    
    // Safety check for the parent container before trying to use .closest()
    const totalContainer = totalElement?.closest('.order-totals'); 

    // --- Safety Check for Totals ---
    if (!totalElement) {
        console.error("Order Summary Error: Missing HTML element ID (total). Check your order-confirmation.html file.");
        if (orderItemsContainer) {
            orderItemsContainer.innerHTML = '<p>Order Summary failed to load. Please check console for errors.</p>';
        }
        return;
    }
    // ---------------------------------
    
    if (items.length === 0) {
        // Try to get items from cart as fallback
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        if (cartItems.length > 0) {
            // Use cart items as a graceful fallback
            items = cartItems;
        } else {
            orderItemsContainer.innerHTML = '<p>No order items found. Please contact support.</p>';
            totalElement.textContent = '₱ 0.00';
            return;
        }
    }
    
    let subtotal = 0;
    let itemsHTML = '';
    
    items.forEach((item, index) => {
        // Ensure price is treated as a number
        const itemPrice = parseFloat(item.price);
        // Force quantity to 1
        const itemTotal = itemPrice;
        subtotal += itemTotal;
        
        // Build item row output
        
        itemsHTML += `
            <div class="order-item">
                <img src="${item.image}" alt="${item.name}" class="item-image">
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">₱${itemPrice.toFixed(2)}</div>
                </div>
                <div class="item-total">₱${itemTotal.toFixed(2)}</div>
            </div>
        `;
    });
    
    orderItemsContainer.innerHTML = itemsHTML;
    
    // Calculate and Display Totals
    const shipping = 0.00;
    let finalTotal = subtotal + shipping;
    
    // Totals computed; display below
    
    // Handle Discount
    if (discountAmount > 0 && totalContainer) { // Check if totalContainer is available for insertion
        finalTotal -= discountAmount;
        // Discount applied visually and to computed total
        
        // Create and insert the discount line
        const finalTotalLine = document.querySelector('.total-line.final-total');

        const discountLine = document.createElement('div');
        discountLine.id = 'discountLine';
        discountLine.className = 'total-line';
        discountLine.style.color = '#28a745';
        discountLine.innerHTML = `
            <span>Discount</span>
            <span>-₱${discountAmount.toFixed(2)}</span>
        `;
        
        // Insert only if both container and final line are found
        if (finalTotalLine) { 
            totalContainer.insertBefore(discountLine, finalTotalLine);
        }
    }
    
    // Display Final Total
    totalElement.textContent = `₱${finalTotal.toFixed(2)}`;
    // Final total rendered
}

function loadPaymentInfo() {
    const paymentData = JSON.parse(localStorage.getItem('paymentData')) || null;
    const paymentContainer = document.getElementById('paymentDetails');
    
    if (!paymentData) {
        paymentContainer.innerHTML = `<p>Payment method information not available.</p>`;
        return;
    }
    
    let paymentHTML = '';
    
    // Check if the method is Credit Card to display the fields
    if (paymentData.method === 'credit_card') {
        const last4 = paymentData.cardNumber ? paymentData.cardNumber.slice(-4) : '0000';
        // Use placeholders if data is missing (though it should be there if validated)
        const expiry = paymentData.expiryDate || 'MM/YY';
        const cardName = paymentData.cardName || 'Cardholder Name';
        
        paymentHTML = `
            <div class="payment-option selected" style="pointer-events: none;">
                <input type="radio" id="credit-card" name="payment" value="credit_card" checked disabled>
                <label for="credit-card">Credit Card</label>
            </div>
            
            <div class="credit-card-fields" style="display: block; margin-top: 15px;">
                <input type="text" class="checkout-input" value="**** **** **** ${last4}" readonly style="background-color: #f9f9f9; cursor: default;">
                
                <div class="card-details">
                    <input type="text" class="checkout-input half-width" value="${expiry}" readonly style="background-color: #f9f9f9; cursor: default;">
                    <input type="text" class="checkout-input half-width" value="***" readonly style="background-color: #f9f9f9; cursor: default;">
                </div>
                
                <input type="text" class="checkout-input" value="${cardName}" readonly style="background-color: #f9f9f9; cursor: default;">
            </div>
        `;
    } else {
        // Fallback for other methods (e.g. COD if it existed)
        const methodDisplay = paymentData.method.replace(/_/g, ' ');
        paymentHTML = `
            <div class="payment-option selected" style="pointer-events: none;">
                <input type="radio" checked disabled>
                <label>${methodDisplay}</label>
            </div>
        `;
    }
    
    paymentContainer.innerHTML = paymentHTML;
}

function clearOrderData() {
    // Clears all temporary order-related data from localStorage after display
    localStorage.removeItem('orderData');
    localStorage.removeItem('deliveryData');
    localStorage.removeItem('paymentData');
    localStorage.removeItem('discountAmount'); 
}
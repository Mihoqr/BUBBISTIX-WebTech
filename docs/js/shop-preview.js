document.addEventListener('DOMContentLoaded', async function() {
    // 1. Initialize Preview Modal Logic
    initPreviewModal();
    
    // 2. Load Product Data
    await loadProductData();

    // 3. Setup Cart & Checkout Buttons
    setupActionButtons();

    function initPreviewModal() {
        const modalElement = document.getElementById('stickerPreviewModal');
        if (!modalElement) return;

        const previewImage = document.getElementById('previewImage');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        let currentIndex = 0;
        let imagesList = [];

        if (typeof bootstrap === 'undefined') {
            console.error('Bootstrap 5 is required for the preview modal.');
            return;
        }

        const modal = new bootstrap.Modal(modalElement);

        window.refreshPreviewTriggers = function() {
            if (!window.currentProductData) return;

            const product = window.currentProductData;
            const folder = getFolderForSet(product.set);
            
            // Build images list from data
            if (product.images && product.images.length > 0) {
                imagesList = product.images.map(img => `../images/stickers/${folder}/${img}`);
            } else {
                imagesList = [`../images/stickers/${folder}/${product.image}`];
            }
            
            // Reset index
            currentIndex = 0;

            // Get Carousel Instance
            const carouselEl = document.getElementById('productCarousel');
            if (carouselEl) {
                let carousel = bootstrap.Carousel.getInstance(carouselEl);
                if (!carousel) {
                    carousel = new bootstrap.Carousel(carouselEl, {
                        interval: false,
                        touch: true
                    });
                }

                // Setup Thumbnails Click -> Carousel
                const thumbnails = document.querySelectorAll('.thumbnail');
                thumbnails.forEach((thumb, index) => {
                    thumb.style.cursor = 'pointer';
                    thumb.onclick = function() {
                        carousel.to(index);
                    };
                });
            }
            
            // Setup Main Image Click -> Open Modal (Zoom)
            const mainImages = document.querySelectorAll('.product-image-main');
            mainImages.forEach((img, index) => {
                img.style.cursor = 'pointer';
                img.title = 'Click to zoom';
                img.onclick = function() {
                    currentIndex = index;
                    updatePreview();
                    modal.show();
                };
            });
        };

        // Initialize Carousel Sync
        const carouselEl = document.getElementById('productCarousel');
        if (carouselEl) {
             carouselEl.addEventListener('slide.bs.carousel', function (event) {
                const index = event.to;
                
                // Sync Thumbnails
                const thumbnails = document.querySelectorAll('.thumbnail');
                thumbnails.forEach(t => t.classList.remove('active'));
                if (thumbnails[index]) {
                    thumbnails[index].classList.add('active');
                }
                
                // Sync Modal Index
                currentIndex = index;
            });
        }

        window.refreshPreviewTriggers();

        function showPrev() {
            if (imagesList.length === 0) return;
            currentIndex = (currentIndex - 1 + imagesList.length) % imagesList.length;
            updatePreview();
        }

        function showNext() {
            if (imagesList.length === 0) return;
            currentIndex = (currentIndex + 1) % imagesList.length;
            updatePreview();
        }

        function updatePreview() {
            if (imagesList.length > 0) {
                previewImage.src = imagesList[currentIndex];
            }
        }

        if (prevBtn) prevBtn.addEventListener('click', showPrev);
        if (nextBtn) nextBtn.addEventListener('click', showNext);

        modalElement.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'ArrowRight') showNext();
        });
    }
    
    async function loadProductData() {
        try {
            const response = await fetch('../data/inventory.json');
            const products = await response.json();
    
            // Parse URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            const productName = urlParams.get('product');
            
            // Default to first product if no param or not found (or Berry Boba Babies Set as fallback)
            let currentProduct = null;
            if (productName) {
                currentProduct = products.find(p => p.name === productName);
            }
            
            if (!currentProduct) {
                // Fallback or 404 handling. For now, fallback to Berry Boba Babies Set
                currentProduct = products.find(p => p.name === "Berry Boba Babies Set") || products[0];
            }

            if (currentProduct) {
                updateMainProductView(currentProduct);
                renderRelatedStickers(currentProduct, products);
                
                // Store current product data for Add to Cart button
                window.currentProductData = currentProduct;
            }
            
        } catch (error) {
            console.error('Error loading product data:', error);
        }
    }

    function renderRelatedStickers(currentProduct, allProducts) {
        const relatedProducts = allProducts.filter(p => p.set === currentProduct.set && p.name !== currentProduct.name);
        const container = document.getElementById('related-stickers-container');
        if (!container) return;

        if (relatedProducts.length > 0) {
            container.innerHTML = `
                <div class="col-12 mb-4">
                    <h3 class="fw-bold border-bottom pb-2">More from ${currentProduct.set}</h3>
                </div>
            `;
            
            relatedProducts.forEach(product => {
                const folder = getFolderForSet(product.set);
                const imagePath = `../images/stickers/${folder}/${product.image}`;
                
                const col = document.createElement('div');
                col.className = 'col-6 col-md-4 col-lg-3 mb-4';
                col.innerHTML = `
                    <div class="card h-100 border-0 shadow-sm related-sticker-card" style="cursor: pointer; transition: transform 0.2s;">
                        <div class="card-img-wrapper p-3 d-flex align-items-center justify-content-center" style="height: 200px; background-color: #f8f9fa; border-radius: 10px;">
                            <img src="${imagePath}" class="img-fluid" alt="${product.name}" style="max-height: 100%; object-fit: contain;">
                        </div>
                        <div class="card-body text-center">
                            <h6 class="card-title fw-bold mb-1 text-truncate">${product.name}</h6>
                            <p class="card-text fw-bold" style="color: #49705B;">₱${product.price}</p>
                        </div>
                    </div>
                `;
                
                const card = col.querySelector('.related-sticker-card');
                card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-5px)');
                card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');
                
                card.addEventListener('click', () => {
                    // Update URL without reloading (optional, but good for history)
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('product', product.name);
                    window.history.pushState({}, '', newUrl);
                    
                    updateMainProductView(product);
                    renderRelatedStickers(product, allProducts);
                    window.currentProductData = product;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                
                container.appendChild(col);
            });
        } else {
             container.innerHTML = '';
        }
    }

    function getFolderForSet(setName) {
        if (setName === "Berry Boba Babies") return "set_boba";
        if (setName === "Sakura Mochi") return "set_mochi";
        if (setName === "Moonlight Magic") return "set_magic";
        return "set_boba"; // Default
    }

    function updateMainProductView(product) {
        const folder = getFolderForSet(product.set);
        const carouselInner = document.getElementById('carousel-inner-container');
        
        // Generate Carousel Items
        if (carouselInner) {
            let carouselHTML = '';
            let imagesToUse = [];
            
            if (product.images && product.images.length > 0) {
                 imagesToUse = product.images.map(img => `../images/stickers/${folder}/${img}`);
            } else {
                 imagesToUse = [`../images/stickers/${folder}/${product.image}`];
            }
            
            imagesToUse.forEach((src, index) => {
                const activeClass = index === 0 ? 'active' : '';
                carouselHTML += `
                    <div class="carousel-item ${activeClass}">
                        <div class="d-flex justify-content-center align-items-center" style="background-color: transparent; min-height: 400px;">
                            <img src="${src}" class="d-block w-100 product-image-main sticker-preview-trigger" alt="${product.name} ${index + 1}" data-src="${src}" style="cursor: pointer; object-fit: contain; max-height: 500px;">
                        </div>
                    </div>
                `;
            });
            
            carouselInner.innerHTML = carouselHTML;
        }

        // Update Thumbnails
        const thumbnailContainer = document.querySelector('.thumbnail-container');
        if (thumbnailContainer) {
            let thumbnailsHTML = '';
            let imagesToUse = [];
            
            if (product.images && product.images.length > 0) {
                imagesToUse = product.images.map(img => `../images/stickers/${folder}/${img}`);
            } else {
                imagesToUse = [`../images/stickers/${folder}/${product.image}`];
            }

            imagesToUse.forEach((src, index) => {
                const activeClass = index === 0 ? 'active' : '';
                thumbnailsHTML += `
                    <img src="${src}" alt="${product.name} ${index + 1}" class="thumbnail sticker-preview-trigger ${activeClass}" data-src="${src}">
                `;
            });
            
            thumbnailContainer.innerHTML = thumbnailsHTML;
        }

        // Update Title and Price
        const titleElement = document.querySelector('.product-title');
        if (titleElement) titleElement.textContent = product.name;

        const priceElement = document.querySelector('.product-price');
        if (priceElement) priceElement.textContent = `${product.price}.00 PHP`;

        // Update Description
        const descriptionElement = document.getElementById('product-description-text');
        if (descriptionElement) {
            if (product.description) {
                descriptionElement.innerHTML = `<strong>Description:</strong><br>${product.description}`;
            } else {
                // Fallback description
                descriptionElement.innerHTML = `<strong>Description:</strong><br>A mixed set of adorable pastel animals holding berries, perfect for decorating planners, journals, to-do lists, and aesthetic digital pages. Each character adds sweetness and charm to your layouts.`;
            }
        }

        // Update Page Title
        document.title = `Bubbistix | ${product.name}`;

        // Re-initialize preview triggers
        if (window.refreshPreviewTriggers) {
            window.refreshPreviewTriggers();
        }
    }

    function setupActionButtons() {
        const addToCartBtn = document.querySelector('.btn-add-cart');
        const checkoutBtn = document.querySelector('.btn-checkout');

        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function() {
                if (!window.currentProductData) return;
                
                const product = window.currentProductData;
                const folder = getFolderForSet(product.set);
                const imagePath = `../images/stickers/${folder}/${product.image}`;
                
                addToCart(product.name, imagePath, product.price);
            });
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                if (window.currentProductData) {
                    const product = window.currentProductData;
                    const folder = getFolderForSet(product.set);
                    const imagePath = `../images/stickers/${folder}/${product.image}`;
                    
                    // Add to cart logic ensures the cart is not empty before checkout
                    let cart = JSON.parse(localStorage.getItem('cart')) || [];
                    let existingItem = cart.find(item => item.name === product.name);
                    
                    if (!existingItem) {
                        cart.push({ name: product.name, image: imagePath, price: product.price, quantity: 1 });
                        localStorage.setItem('cart', JSON.stringify(cart));
                    }
                }
                window.location.href = 'checkout.html';
            });
        }
    }

    function addToCart(name, image, price) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        let existingItem = cart.find(item => item.name === name);
        
        if (existingItem) {
             // Already in cart
             if (window.bubbistixUI && typeof window.bubbistixUI.showToast === 'function') {
                window.bubbistixUI.showToast({
                    title: 'Already in Cart',
                    message: `${name} is already in your cart!`,
                    type: 'info'
                });
            } else {
                alert(`${name} is already in your cart!`);
            }
            return;
        } else {
            cart.push({ name, image, price, quantity: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Show Toast
        if (window.bubbistixUI && typeof window.bubbistixUI.showToast === 'function') {
            window.bubbistixUI.showToast({
                title: 'Added to Cart',
                message: `${name} has been added to your cart!`,
                type: 'success'
            });
        } else {
            alert(`${name} added to cart!`);
        }
    }
});
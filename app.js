/* ====================================================================
   DIEU VA ME SAUVER (DVMS) - Main Storefront Runner
   ==================================================================== */

let products = [];
let activeCategory = 'all';
let currentSort = 'default';

// Initialize Storefront Application
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Cart Callback for Reactive UI Updates
    window.cart.registerCallback(updateCartUI);
    
    // 2. Initial Cart Render
    updateCartUI();

    // 3. Load Products from Database Layer
    await loadStorefrontProducts();

    // 4. Setup Events
    setupStorefrontEventListeners();
});

// Load Products from Database Manager
async function loadStorefrontProducts() {
    try {
        products = await window.db.getProducts();
        renderStorefrontProducts();
    } catch (err) {
        console.error("Storefront: Error loading products from database:", err);
        const grid = document.getElementById('product-grid');
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 0; font-family: var(--font-technical); border: var(--border-dashed);">
                ERREUR LORS DU CHARGEMENT DES PIÈCES. VEUILLEZ RÉESSAYER.
            </div>
        `;
    }
}

// Render Nike-style editorial grid
function renderStorefrontProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    // Filter Out Drafts
    let list = products.filter(p => p.status !== 'draft');

    // Filter Categories
    if (activeCategory !== 'all') {
        list = list.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // Apply Sorting
    if (currentSort === 'price-asc') {
        list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (currentSort === 'price-desc') {
        list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (currentSort === 'name-asc') {
        list.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (list.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 80px 0; font-family: var(--font-technical); border: var(--border-dashed);">
                AUCUNE PIÈCE N'EST DISPONIBLE DANS CETTE CATÉGORIE ACTUELLEMENT.
            </div>
        `;
        return;
    }

    list.forEach(product => {
        const isSoldOut = product.status === 'sold_out';
        const sizesList = Array.isArray(product.sizes) ? product.sizes.join(', ') : 'Unique';
        
        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
            ${isSoldOut ? '<div class="product-badge sold-out-badge">SOLD OUT</div>' : ''}
            <div class="product-image-container">
                <img class="product-image" src="${product.image_url || 'https://placehold.co/600x800'}" alt="${product.title}" loading="lazy">
            </div>
            <div class="product-info">
                <span class="product-category">${product.category} — Tailles: ${sizesList}</span>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-bottom">
                    <span class="product-price">${window.cart.formatPrice(product.price)}</span>
                    <button class="product-view-btn" onclick="openProductDetail('${product.id}')">
                        ${isSoldOut ? 'Détails' : 'Acheter'}
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Side Drawers Actions
const overlay = document.getElementById('overlay');
const detailPanel = document.getElementById('detail-panel');
const cartPanel = document.getElementById('cart-panel');

function openPanel(panel) {
    overlay.classList.add('open');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeAllPanels() {
    overlay.classList.remove('open');
    detailPanel.classList.remove('open');
    cartPanel.classList.remove('open');
    detailPanel.setAttribute('aria-hidden', 'true');
    cartPanel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// Detail Drawer States
let currentDetailProduct = null;
let currentDetailSize = null;
let currentDetailColor = null;

function openProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentDetailProduct = product;
    currentDetailSize = null; // Clear active size selection
    currentDetailColor = null; // Clear active color selection

    const body = document.getElementById('detail-body');
    const footer = document.getElementById('detail-footer');

    const isSoldOut = product.status === 'sold_out';
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const colors = Array.isArray(product.colors) ? product.colors : ['Noir'];

    body.innerHTML = `
        <div class="detail-image-wrapper">
            <img class="detail-image" src="${product.image_url || 'https://placehold.co/600x800'}" alt="${product.title}">
        </div>
        <div class="detail-meta">
            <span class="detail-category">${product.category}</span>
            <span class="detail-price">${window.cart.formatPrice(product.price)}</span>
        </div>
        <h2 class="product-title" style="font-size: 1.8rem; margin: 8px 0;">${product.title}</h2>
        <p class="detail-description">${product.description || 'Aucun détail technique disponible pour cette pièce.'}</p>
        
        <div class="color-selector-section" style="margin-top: 20px;">
            <div class="size-selector-label">Sélectionnez la couleur :</div>
            <div class="size-grid" id="color-grid">
                ${colors.map(color => `
                    <button class="color-btn" onclick="selectDetailColor('${color}', this)" ${isSoldOut ? 'disabled' : ''}>
                        ${color}
                    </button>
                `).join('')}
            </div>
        </div>

        <div class="size-selector-section" style="margin-top: 20px;">
            <div class="size-selector-label">Sélectionnez la taille :</div>
            <div class="size-grid">
                ${sizes.map(size => `
                    <button class="size-btn" onclick="selectDetailSize('${size}', this)" ${isSoldOut ? 'disabled' : ''}>
                        ${size}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    footer.innerHTML = `
        <button class="btn-brutal black-btn" id="add-to-cart-btn" style="width: 100%;" 
                onclick="handleAddToCart()" ${isSoldOut ? 'disabled' : ''}>
            ${isSoldOut ? 'RUPTURE DE STOCK' : 'AJOUTER AU PANIER'}
        </button>
    `;

    openPanel(detailPanel);
}

function selectDetailSize(size, element) {
    currentDetailSize = size;
    
    // Reset selections styles
    const buttons = document.querySelectorAll('.size-selector-section .size-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
}

function selectDetailColor(color, element) {
    currentDetailColor = color;
    
    // Reset selections styles
    const buttons = document.querySelectorAll('#color-grid .color-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
}

function handleAddToCart() {
    if (!currentDetailProduct) return;
    
    if (currentDetailProduct.status === 'sold_out') {
        alert('Cette pièce est épuisée.');
        return;
    }

    const sizes = Array.isArray(currentDetailProduct.sizes) ? currentDetailProduct.sizes : [];
    const colors = Array.isArray(currentDetailProduct.colors) ? currentDetailProduct.colors : [];
    
    // Block add if no color has been picked
    if (colors.length > 0 && !currentDetailColor) {
        alert('Veuillez sélectionner une couleur avant d\'ajouter la pièce au panier.');
        return;
    }

    // Block add if no size has been picked
    if (sizes.length > 0 && !currentDetailSize) {
        alert('Veuillez sélectionner une taille avant d\'ajouter la pièce au panier.');
        return;
    }

    window.cart.add(currentDetailProduct, currentDetailSize || 'Unique', currentDetailColor || 'Noir');
    closeAllPanels();
    openPanel(cartPanel);
}

// Reactive UI updates triggered by cart changes
function updateCartUI() {
    const list = document.getElementById('cart-items');
    const countBubble = document.getElementById('cart-count');
    const subtotalText = document.getElementById('cart-subtotal');
    const totalText = document.getElementById('cart-total');

    list.innerHTML = '';
    const cartItems = window.cart.items;

    if (cartItems.length === 0) {
        list.innerHTML = `
            <div class="cart-empty-message">
                VOTRE PANIER EST ACTUELLEMENT VIDE.
            </div>
        `;
        document.getElementById('checkout-btn').disabled = true;
    } else {
        document.getElementById('checkout-btn').disabled = false;
        
        cartItems.forEach(item => {
            const itemCost = item.product.price * item.qty;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img class="cart-item-image" src="${item.product.image_url || 'https://placehold.co/150x200'}" alt="${item.product.title}">
                <div class="cart-item-details">
                    <div>
                        <h4 class="cart-item-title">${item.product.title}</h4>
                        <span class="cart-item-meta">Taille: <strong>${item.size}</strong> | Couleur: <strong>${item.color}</strong></span>
                    </div>
                    <div class="cart-item-bottom">
                        <div class="cart-item-qty">
                            <button class="qty-btn" onclick="window.cart.changeQty('${item.product.id}', '${item.size}', '${item.color}', -1)">-</button>
                            <span class="qty-val">${item.qty}</span>
                            <button class="qty-btn" onclick="window.cart.changeQty('${item.product.id}', '${item.size}', '${item.color}', 1)">+</button>
                        </div>
                        <span class="cart-item-price">${window.cart.formatPrice(itemCost)}</span>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="window.cart.remove('${item.product.id}', '${item.size}', '${item.color}')" aria-label="Supprimer">&times;</button>
            `;
            list.appendChild(cartItem);
        });
    }

    countBubble.textContent = window.cart.getTotalQty();
    subtotalText.textContent = window.cart.formatPrice(window.cart.getTotal());
    totalText.textContent = window.cart.formatPrice(window.cart.getTotal());
}

// Fetch WhatsApp phone from DB dynamically on checkout click
async function handleCheckout() {
    if (window.cart.items.length === 0) return;
    
    // Disable button during fetching to look professional
    const btn = document.getElementById('checkout-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "CHARGEMENT DE LA COMMANDE...";

    // Load WhatsApp number from Database (Supabase or LocalStorage Fallback)
    const phone = await window.db.getSetting('whatsapp_number', window.CONFIG.DEFAULT_WHATSAPP_NUMBER);
    
    // Re-enable and trigger WhatsApp redirect
    btn.disabled = false;
    btn.textContent = originalText;
    window.cart.checkout(phone);
}

// Attach listeners
function setupStorefrontEventListeners() {
    document.getElementById('cart-btn').addEventListener('click', () => openPanel(cartPanel));
    document.getElementById('cart-close').addEventListener('click', closeAllPanels);
    document.getElementById('detail-close').addEventListener('click', closeAllPanels);
    overlay.addEventListener('click', closeAllPanels);

    // Filters categories clicks
    const filters = document.querySelectorAll('#category-filters .filter-btn');
    filters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filters.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeCategory = e.target.getAttribute('data-filter');
            renderStorefrontProducts();
        });
    });

    // Sort select
    document.getElementById('sort-select').addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderStorefrontProducts();
    });

    // Checkout
    document.getElementById('checkout-btn').addEventListener('click', handleCheckout);
}

// Expose actions globally for HTML click listeners
window.openProductDetail = openProductDetail;
window.selectDetailSize = selectDetailSize;
window.selectDetailColor = selectDetailColor;
window.handleAddToCart = handleAddToCart;

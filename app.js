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
        const sizes = Array.isArray(product.sizes) ? product.sizes : [];
        const sizePills = sizes.map(s => `<span class="size-pill">${s}</span>`).join('');

        const card = document.createElement('article');
        card.className = 'product-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
            <div class="product-image-container">
                <img class="product-image" src="${product.image_url || 'https://placehold.co/600x800'}" alt="${product.title}" loading="lazy">
                ${isSoldOut
                    ? '<div class="product-badge sold-out-badge">ÉPUISÉ</div>'
                    : '<div class="card-buy-bar"><span>ACHETER</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>'
                }
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-bottom">
                    <span class="product-price">${window.cart.formatPrice(product.price)}</span>
                    ${sizePills ? `<div class="size-pills-row">${sizePills}</div>` : ''}
                </div>
            </div>
        `;
        card.addEventListener('click', () => openProductDetail(product.id));
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openProductDetail(product.id); });
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
let currentDetailQty = 1;

// Inline toast notification (no browser alert)
function showToast(message, type = 'error') {
    const existing = document.getElementById('dvms-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'dvms-toast';
    toast.className = `dvms-toast dvms-toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('dvms-toast--visible'));
    });

    setTimeout(() => {
        toast.classList.remove('dvms-toast--visible');
        setTimeout(() => toast.remove(), 350);
    }, 2800);
}

function openProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentDetailProduct = product;
    currentDetailSize = null;
    currentDetailColor = null;
    currentDetailQty = 1;

    const body = document.getElementById('detail-body');
    const footer = document.getElementById('detail-footer');

    const isSoldOut = product.status === 'sold_out';
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const colors = Array.isArray(product.colors) ? product.colors : [];

    // Auto-select single color silently
    if (colors.length === 1) currentDetailColor = colors[0];

    body.innerHTML = `
        <div class="detail-hero-image">
            <img src="${product.image_url || 'https://placehold.co/600x800'}" alt="${product.title}" class="detail-hero-img">
            ${isSoldOut ? '<div class="detail-sold-overlay"><span>ÉPUISÉ</span></div>' : ''}
        </div>

        <div class="detail-content-block">
            <div class="detail-header-row">
                <span class="detail-cat-chip">${product.category}</span>
                <span class="detail-price-tag">${window.cart.formatPrice(product.price)}</span>
            </div>
            <h2 class="detail-product-title">${product.title}</h2>
            ${product.description ? `<p class="detail-description">${product.description}</p>` : ''}

            ${colors.length > 1 ? `
            <div class="selector-block">
                <div class="selector-header">
                    <span class="selector-label">COULEUR</span>
                    <span class="selector-value" id="selected-color-label">${currentDetailColor || '—'}</span>
                </div>
                <div class="selector-row" id="color-grid">
                    ${colors.map(color => `
                        <button class="variant-chip color-chip" onclick="selectDetailColor('${color}', this)" ${isSoldOut ? 'disabled' : ''}>
                            ${color}
                        </button>
                    `).join('')}
                </div>
            </div>
            ` : (colors.length === 1 ? `<div class="auto-color-row"><span class="selector-label">COULEUR</span><span class="auto-color-value">${colors[0]}</span></div>` : '')}

            ${sizes.length > 0 ? `
            <div class="selector-block">
                <div class="selector-header">
                    <span class="selector-label">TAILLE</span>
                    <span class="selector-value" id="selected-size-label">—</span>
                </div>
                <div class="selector-row size-selector-section">
                    ${sizes.map(size => `
                        <button class="variant-chip size-chip" onclick="selectDetailSize('${size}', this)" ${isSoldOut ? 'disabled' : ''}>
                            ${size}
                        </button>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;

    footer.innerHTML = `
        <div class="detail-footer-inner">
            <div class="qty-stepper">
                <button class="qty-step-btn" id="qty-dec" onclick="changeDetailQty(-1)" aria-label="Réduire la quantité">−</button>
                <span class="qty-step-val" id="detail-qty-val">1</span>
                <button class="qty-step-btn" id="qty-inc" onclick="changeDetailQty(1)" aria-label="Augmenter la quantité">+</button>
            </div>
            <button class="detail-cta-btn" id="add-to-cart-btn"
                    onclick="handleAddToCart()" ${isSoldOut ? 'disabled' : ''}>
                ${isSoldOut ? 'RUPTURE DE STOCK' : 'AJOUTER AU PANIER'}
            </button>
        </div>
    `;

    openPanel(detailPanel);
}

function changeDetailQty(delta) {
    currentDetailQty = Math.max(1, currentDetailQty + delta);
    const el = document.getElementById('detail-qty-val');
    if (el) el.textContent = currentDetailQty;
}

function selectDetailSize(size, element) {
    currentDetailSize = size;
    const buttons = document.querySelectorAll('.size-selector-section .variant-chip');
    buttons.forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    const label = document.getElementById('selected-size-label');
    if (label) label.textContent = size;
}

function selectDetailColor(color, element) {
    currentDetailColor = color;
    const buttons = document.querySelectorAll('#color-grid .variant-chip');
    buttons.forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    const label = document.getElementById('selected-color-label');
    if (label) label.textContent = color;
}

function handleAddToCart() {
    if (!currentDetailProduct) return;

    if (currentDetailProduct.status === 'sold_out') {
        showToast('Cette pièce est épuisée.');
        return;
    }

    const sizes = Array.isArray(currentDetailProduct.sizes) ? currentDetailProduct.sizes : [];
    const colors = Array.isArray(currentDetailProduct.colors) ? currentDetailProduct.colors : [];

    if (colors.length > 1 && !currentDetailColor) {
        showToast('Veuillez choisir une couleur.');
        document.getElementById('color-grid')?.classList.add('selector-shake');
        setTimeout(() => document.getElementById('color-grid')?.classList.remove('selector-shake'), 600);
        return;
    }

    if (sizes.length > 0 && !currentDetailSize) {
        showToast('Veuillez choisir une taille.');
        document.querySelector('.size-selector-section')?.classList.add('selector-shake');
        setTimeout(() => document.querySelector('.size-selector-section')?.classList.remove('selector-shake'), 600);
        return;
    }

    for (let i = 0; i < currentDetailQty; i++) {
        window.cart.add(currentDetailProduct, currentDetailSize || 'Unique', currentDetailColor || 'Noir');
    }
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
window.changeDetailQty = changeDetailQty;

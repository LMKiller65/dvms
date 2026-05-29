/* ====================================================================
   DIEU VA ME SAUVER (DVMS) - Isolated Admin Panel Runner
   ==================================================================== */

let products = [];

// Initialize Admin Portal
document.addEventListener('DOMContentLoaded', () => {
    setupLoginHandler();
    checkAuthSession();
});

// Check Session on page load
function checkAuthSession() {
    const isLoggedIn = sessionStorage.getItem('dvms_admin_logged') === 'true';
    if (isLoggedIn) {
        showDashboard();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('dashboard-screen').style.display = 'none';
    }
}

// Handle login Form
function setupLoginHandler() {
    const loginForm = document.getElementById('login-form');
    const errorAlert = document.getElementById('login-error');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwdInput = document.getElementById('password-input').value;

        if (pwdInput === window.CONFIG.ADMIN_PASSWORD) {
            sessionStorage.setItem('dvms_admin_logged', 'true');
            errorAlert.style.display = 'none';
            document.getElementById('password-input').value = '';
            showDashboard();
        } else {
            errorAlert.style.display = 'block';
            document.getElementById('password-input').value = '';
        }
    });
}

// Display control dashboard
async function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';

    // 1. Initialise database manager context
    window.db.init();

    // 2. Load inventory list
    await loadInventory();

    // 3. Load dynamic settings (WhatsApp Number)
    await loadSettings();

    // 4. Setup dashboard-only event hooks
    setupDashboardEventListeners();
}

// Load Inventory and Redraw Dashboard
async function loadInventory() {
    try {
        products = await window.db.getProducts();
        renderStats();
        renderInventoryTable();
    } catch (err) {
        console.error("Admin: Error loading inventory:", err);
    }
}

// Fetch Settings from Database
async function loadSettings() {
    try {
        const whatsappNumber = await window.db.getSetting('whatsapp_number', window.CONFIG.DEFAULT_WHATSAPP_NUMBER);
        document.getElementById('whatsapp-input').value = whatsappNumber;
    } catch (err) {
        console.error("Admin: Error loading settings:", err);
    }
}

// Stats Computation & Redraw
function renderStats() {
    const total = products.length;
    const active = products.filter(p => p.status === 'active').length;
    const soldout = products.filter(p => p.status === 'sold_out').length;
    const draft = products.filter(p => p.status === 'draft').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-soldout').textContent = soldout;
    document.getElementById('stat-draft').textContent = draft;
}

// Redraw Inventory List Table rows
function renderInventoryTable() {
    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 50px; font-family: var(--font-technical);">
                    AUCUNE PIÈCE DANS L'INVENTAIRE ACTUEL.
                </td>
            </tr>
        `;
        return;
    }

    products.forEach(p => {
        const sizesList = Array.isArray(p.sizes) ? p.sizes.join(', ') : 'Aucune';
        
        let statusLabel = 'Actif';
        if (p.status === 'sold_out') statusLabel = 'Sold Out';
        if (p.status === 'draft') statusLabel = 'Brouillon';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img class="table-img" src="${p.image_url || 'https://placehold.co/150x200'}" alt="${p.title}">
            </td>
            <td>
                <div class="table-title">${p.title}</div>
            </td>
            <td>
                <span style="font-family: var(--font-technical); font-size: 0.9rem;">${p.category}</span>
            </td>
            <td>
                <span class="table-price">${window.cart.formatPrice(p.price)}</span>
            </td>
            <td>
                <span style="font-family: var(--font-technical); font-size: 0.85rem;">${sizesList}</span>
            </td>
            <td>
                <span class="table-badge badge-${p.status}">${statusLabel}</span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn-table toggle-stock-btn" onclick="toggleProductSoldOut('${p.id}')" title="${p.status === 'sold_out' ? 'Remettre en Stock' : 'Marquer comme Épuisé'}">
                        ${p.status === 'sold_out' 
                            ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` 
                            : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`
                        }
                        <span class="table-btn-text">${p.status === 'sold_out' ? 'Restocker' : 'Rupture'}</span>
                    </button>
                    <button class="icon-btn-table edit-btn" onclick="openEditModal('${p.id}')" title="Éditer">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                        </svg>
                        <span class="table-btn-text">Éditer</span>
                    </button>
                    <button class="icon-btn-table delete-btn" onclick="handleDeleteProduct('${p.id}')" title="Supprimer">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        <span class="table-btn-text">Supprimer</span>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modals Management
const overlay = document.getElementById('admin-overlay');
const productModal = document.getElementById('product-modal');

function openModal() {
    overlay.classList.add('open');
    productModal.classList.add('open');
}

function closeModal() {
    overlay.classList.remove('open');
    productModal.classList.remove('open');
    document.getElementById('product-form').reset();
    document.getElementById('product-id-input').value = '';
    document.getElementById('image-file-input').value = '';
}

// Open Form modal for creation
function openNewProductModal() {
    document.getElementById('modal-title-text').textContent = "Ajouter un Article";
    openModal();
}

// Open Form modal for editing
function openEditModal(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    document.getElementById('modal-title-text').textContent = "Modifier l'Article";
    document.getElementById('product-id-input').value = p.id;
    document.getElementById('title-input').value = p.title;
    document.getElementById('category-input').value = p.category;
    document.getElementById('price-input').value = p.price;
    document.getElementById('image-url-input').value = p.image_url || '';
    document.getElementById('status-input').value = p.status;
    document.getElementById('description-input').value = p.description || '';

    // Handle Colors value populate
    const targetColors = Array.isArray(p.colors) ? p.colors : ['Noir'];
    document.getElementById('colors-input').value = targetColors.join(', ');

    // Handle Size checkmarks
    const targetSizes = Array.isArray(p.sizes) ? p.sizes : [];
    const checkboxes = document.querySelectorAll('input[name="sizes"]');
    checkboxes.forEach(cb => {
        cb.checked = targetSizes.includes(cb.value);
    });

    openModal();
}

// Delete Operation Handler
async function handleDeleteProduct(productId) {
    const confirmDelete = confirm("Êtes-vous sûr de vouloir supprimer cet article de la collection ? Cette action est définitive.");
    if (!confirmDelete) return;

    const success = await window.db.deleteProduct(productId);
    if (success) {
        console.log("Admin: Product deleted successfully.");
        await loadInventory();
    } else {
        alert("Erreur lors de la suppression du produit.");
    }
}

// FileReader Base64 utility
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Save Form submit
async function handleFormSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('product-id-input').value;
    const title = document.getElementById('title-input').value;
    const category = document.getElementById('category-input').value;
    const price = parseFloat(document.getElementById('price-input').value);
    const status = document.getElementById('status-input').value;
    const description = document.getElementById('description-input').value;

    // Get checked sizes
    const sizes = [];
    const checkboxes = document.querySelectorAll('input[name="sizes"]:checked');
    checkboxes.forEach(cb => sizes.push(cb.value));

    // Get colors parsed array
    const colorsInputVal = document.getElementById('colors-input').value;
    const colors = colorsInputVal.split(',').map(c => c.trim()).filter(c => c.length > 0);

    if (colors.length === 0) {
        alert("Veuillez spécifier au moins une couleur disponible pour cette pièce.");
        return;
    }

    // Handle Image uploaded/url parameters
    let imageUrl = document.getElementById('image-url-input').value.trim();
    const fileInput = document.getElementById('image-file-input');

    // If file uploaded, prioritize it and read Base64 DataURL
    if (fileInput.files.length > 0) {
        try {
            imageUrl = await getBase64(fileInput.files[0]);
        } catch (err) {
            alert("Erreur lors de la conversion de l'image locale.");
            return;
        }
    }

    if (!imageUrl) {
        alert("Veuillez fournir une URL d'image ou téléverser un fichier visuel local.");
        return;
    }

    const payload = {
        title,
        category,
        price,
        image_url: imageUrl,
        status,
        description,
        sizes,
        colors
    };

    const success = await window.db.saveProduct(productId || null, payload);
    
    if (success) {
        console.log("Admin: Product saved successfully.");
        closeModal();
        await loadInventory();
    } else {
        alert("Erreur lors de la sauvegarde du produit.");
    }
}

// Save WhatsApp settings
async function handleSettingsSubmit(e) {
    e.preventDefault();
    
    const whatsappVal = document.getElementById('whatsapp-input').value.trim().replace(/[^0-9]/g, '');
    
    if (!whatsappVal || whatsappVal.length < 7) {
        alert("Veuillez spécifier un numéro WhatsApp valide contenant l'indicatif Gabon (ex: 24106200000).");
        return;
    }

    const success = await window.db.setSetting('whatsapp_number', whatsappVal);
    
    if (success) {
        const successLabel = document.getElementById('settings-success');
        successLabel.style.display = 'block';
        setTimeout(() => {
            successLabel.style.display = 'none';
        }, 3000);
        console.log("Admin: WhatsApp settings updated in database.");
    } else {
        alert("Erreur lors de la sauvegarde des paramètres.");
    }
}

// Attach event hooks
function setupDashboardEventListeners() {
    document.getElementById('add-product-btn').addEventListener('click', openNewProductModal);
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Save product form
    const productForm = document.getElementById('product-form');
    productForm.removeEventListener('submit', handleFormSubmit);
    productForm.addEventListener('submit', handleFormSubmit);

    // Save settings form
    const settingsForm = document.getElementById('settings-form');
    settingsForm.removeEventListener('submit', handleSettingsSubmit);
    settingsForm.addEventListener('submit', handleSettingsSubmit);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('dvms_admin_logged');
        checkAuthSession();
    });
}

// Quick toggle product sold out status
async function toggleProductSoldOut(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    const newStatus = p.status === 'sold_out' ? 'active' : 'sold_out';
    const success = await window.db.saveProduct(p.id, {
        ...p,
        status: newStatus
    });

    if (success) {
        console.log(`Admin: Product ${p.title} toggled to ${newStatus}.`);
        await loadInventory();
    } else {
        alert("Erreur lors de la mise à jour du statut.");
    }
}

// Expose globally for click references in inventory table
window.openEditModal = openEditModal;
window.handleDeleteProduct = handleDeleteProduct;
window.toggleProductSoldOut = toggleProductSoldOut;

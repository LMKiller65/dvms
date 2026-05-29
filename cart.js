/* ====================================================================
   DIEU VA ME SAUVER (DVMS) - Cart Manager Module
   ==================================================================== */

class CartManager {
    constructor() {
        this.items = [];
        this.storageKey = window.CONFIG ? window.CONFIG.LOCAL_STORAGE_CART_KEY : 'dvms_cart_items';
        this.onUpdateCallback = null;
        this.init();
    }

    init() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                this.items = JSON.parse(saved);
            } catch (e) {
                this.items = [];
            }
        }
    }

    registerCallback(callback) {
        this.onUpdateCallback = callback;
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        if (this.onUpdateCallback) {
            this.onUpdateCallback();
        }
    }

    add(product, size, color) {
        const existing = this.items.find(item => item.product.id === product.id && item.size === size && item.color === color);
        
        if (existing) {
            existing.qty += 1;
        } else {
            this.items.push({
                product: {
                    id: product.id,
                    title: product.title,
                    price: parseFloat(product.price),
                    image_url: product.image_url,
                    category: product.category
                },
                size: size,
                color: color,
                qty: 1
            });
        }
        this.save();
    }

    changeQty(productId, size, color, delta) {
        const index = this.items.findIndex(item => item.product.id === productId && item.size === size && item.color === color);
        if (index === -1) return;

        this.items[index].qty += delta;

        if (this.items[index].qty <= 0) {
            this.items.splice(index, 1);
        }
        this.save();
    }

    remove(productId, size, color) {
        this.items = this.items.filter(item => !(item.product.id === productId && item.size === size && item.color === color));
        this.save();
    }

    clear() {
        this.items = [];
        this.save();
    }

    getTotal() {
        return this.items.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    }

    getTotalQty() {
        return this.items.reduce((acc, item) => acc + item.qty, 0);
    }

    // Money Formatter Utility
    formatPrice(value) {
        return parseInt(value).toLocaleString('fr-FR') + ' FCFA';
    }

    // WhatsApp Message compiler (Gabon Format)
    checkout(whatsappNumber) {
        if (this.items.length === 0) return;

        let total = 0;
        let messageText = `Bonjour DVMS (Gabon), je souhaite passer une commande :\n\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;

        this.items.forEach(item => {
            const itemCost = item.product.price * item.qty;
            total += itemCost;
            messageText += `• ${item.qty}x ${item.product.title}\n`;
            messageText += `  Couleur: ${item.color} | Taille: ${item.size} (${this.formatPrice(item.product.price)}) — ${this.formatPrice(itemCost)}\n\n`;
        });

        messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `TOTAL : ${this.formatPrice(total)} (Livraison gratuite Libreville/Gabon)\n\n`;
        messageText += `Merci de m'indiquer la disponibilité de ces pièces pour planifier ma livraison.`;

        // Clean WhatsApp business number: no + or spaces
        const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
        const encodedText = encodeURIComponent(messageText);
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

        window.open(whatsappUrl, '_blank');
    }
}

// Instantiate globally
window.cart = new CartManager();

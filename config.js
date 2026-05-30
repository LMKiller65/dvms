/* ====================================================================
   DIEU VA ME SAUVER (DVMS) - Global Configuration
   ==================================================================== */

const CONFIG = {
    // 1. SUPABASE CREDENTIALS
    // Replace these with your actual Supabase URL & Anon Key to go live.
    SUPABASE_URL: 'https://bnrjnbmpsimdedzuoaza.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_kKZ9NuK7qqdEXprjYf1JqA_lzjrZ_46',

    // 2. ADMIN PASSWORD
    // Secure your admin dashboard. Highly recommended to change this from 'admin'.
    ADMIN_PASSWORD: 'admin',

    // 3. DEFAULT WHATSAPP NUMBER (Gabon Format)
    // Used if not configured in the database yet. Country code +241. No '+' or spaces.
    DEFAULT_WHATSAPP_NUMBER: '241074024043',

    // 4. LOCAL STORAGE KEYS
    LOCAL_STORAGE_PRODUCTS_KEY: 'dvms_local_products',
    LOCAL_STORAGE_SETTINGS_KEY: 'dvms_local_settings',
    LOCAL_STORAGE_CART_KEY: 'dvms_cart_items'
};

// Export config for browser use
window.CONFIG = CONFIG;

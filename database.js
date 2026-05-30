/* ====================================================================
   DIEU VA ME SAUVER (DVMS) - Database Layer Manager (100% Supabase Cloud)
   ==================================================================== */

class DatabaseManager {
    constructor() {
        this.supabase = null;
        this.init();
    }

    init() {
        const conf = window.CONFIG;
        const isConfigured = conf && conf.SUPABASE_URL && conf.SUPABASE_ANON_KEY && 
                             conf.SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
                             conf.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
        
        if (isConfigured) {
            try {
                this.supabase = window.supabase.createClient(conf.SUPABASE_URL, conf.SUPABASE_ANON_KEY);
                console.log("Database: Supabase connection established successfully.");
            } catch (err) {
                console.error("Database: Failed to connect to Supabase:", err);
            }
        } else {
            console.error("Database: Supabase credentials are not configured in config.js!");
        }
    }

    // --- PRODUCTS CRUD INTERFACE (CLOUDBASE ONLY) ---
    async getProducts() {
        if (!this.supabase) {
            console.error("Database: Supabase is not connected.");
            return [];
        }

        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error("Database: Error loading products from Supabase:", err);
            return [];
        }
    }

    async saveProduct(productId, productData) {
        if (!this.supabase) {
            console.error("Database: Supabase is not connected.");
            return false;
        }

        try {
            if (productId) {
                // Update product row
                const { error } = await this.supabase
                    .from('products')
                    .update(productData)
                    .eq('id', productId);
                if (error) throw error;
            } else {
                // Insert new product row
                const { error } = await this.supabase
                    .from('products')
                    .insert([productData]);
                if (error) throw error;
            }
            return true;
        } catch (err) {
            console.error("Database: Error saving product to Supabase:", err);
            return false;
        }
    }

    async deleteProduct(productId) {
        if (!this.supabase) {
            console.error("Database: Supabase is not connected.");
            return false;
        }

        try {
            const { error } = await this.supabase
                .from('products')
                .delete()
                .eq('id', productId);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error("Database: Error deleting product from Supabase:", err);
            return false;
        }
    }

    // --- SETTINGS KEY-VALUE INTERFACE (CLOUDBASE ONLY) ---
    async getSetting(settingKey, defaultValue) {
        if (!this.supabase) {
            return defaultValue;
        }

        try {
            const { data, error } = await this.supabase
                .from('settings')
                .select('value')
                .eq('key', settingKey)
                .single();
            
            if (error) {
                // If setting row doesn't exist, return default value without throwing
                if (error.code === 'PGRST116') {
                    return defaultValue;
                }
                throw error;
            }
            return data ? data.value : defaultValue;
        } catch (err) {
            console.error(`Database: Error getting setting "${settingKey}" from Supabase:`, err);
            return defaultValue;
        }
    }

    async setSetting(settingKey, value) {
        if (!this.supabase) {
            console.error("Database: Supabase is not connected.");
            return false;
        }

        try {
            const { error } = await this.supabase
                .from('settings')
                .upsert({ key: settingKey, value: value });
            
            if (error) throw error;
            return true;
        } catch (err) {
            console.error(`Database: Error saving setting "${settingKey}" to Supabase:`, err);
            return false;
        }
    }
}

// Instantiate globally
window.db = new DatabaseManager();

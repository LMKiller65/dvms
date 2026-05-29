/* ====================================================================
   DIEU VA ME SAUVER (DVMS) - Database Layer Manager
   ==================================================================== */

class DatabaseManager {
    constructor() {
        this.supabase = null;
        this.isOfflineMode = true;
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
                this.isOfflineMode = false;
                console.log("Database: Supabase connection established successfully.");
            } catch (err) {
                console.error("Database: Failed to connect to Supabase. Activating local storage mode:", err);
                this.enableOfflineMode();
            }
        } else {
            this.enableOfflineMode();
        }
    }

    enableOfflineMode() {
        this.isOfflineMode = true;
        console.warn("Database: Running in offline LocalStorage sandbox mode.");
        
        // Seed initial data if localStorage is empty
        this.seedDefaultData();
    }

    seedDefaultData() {
        const conf = window.CONFIG;
        
        // 1. Seed default products
        if (!localStorage.getItem(conf.LOCAL_STORAGE_PRODUCTS_KEY)) {
            const defaultProducts = [
                {
                    id: 'p-1',
                    title: 'T-SHIRT OVERSIZED "DIEU VA"',
                    description: 'T-shirt coupe ultra oversized en coton lourd 240 GSM. Logo imprimé sérigraphie face haute densité. Col haut côtelé épais. Noir délavé industriel.',
                    price: 25000,
                    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
                    sizes: ['S', 'M', 'L', 'XL'],
                    colors: ['Noir', 'Gris Délavé'],
                    category: 'T-Shirt',
                    status: 'active',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'p-2',
                    title: 'T-SHIRT OUTLINE "ME SAUVER"',
                    description: 'T-shirt coupe boxy en coton blanc craie 220 GSM. Motif signature avec lettrage contour brodé noir sur la poitrine. Coutures contrastées apparentes.',
                    price: 25000,
                    image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop',
                    sizes: ['M', 'L', 'XL'],
                    colors: ['Blanc Craie', 'Noir'],
                    category: 'T-Shirt',
                    status: 'active',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'p-3',
                    title: 'HOODIE LOURD "SIGNATURE"',
                    description: 'Sweat à capuche en molleton ultra-épais 450 GSM. Coupe courte et boxy (boxy cropped). Capuche double épaisseur sans cordon. Broderie DVMS ton sur ton sur la manche droite.',
                    price: 50000,
                    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop',
                    sizes: ['S', 'M', 'L'],
                    colors: ['Noir Noir', 'Charbon'],
                    category: 'Sweatshirt',
                    status: 'active',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'p-4',
                    title: 'CASQUETTE COMPRESSION "DVMS DUST"',
                    description: 'Casquette déstructurée 6 panels en sergé de coton délavé à l\'acide. Logo DVMS brodé en relief sur l\'avant. Boucle métallique de serrage style industriel.',
                    price: 18000,
                    image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop',
                    sizes: ['Unique'],
                    colors: ['Noir Acide'],
                    category: 'Accessoire',
                    status: 'active',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'p-5',
                    title: 'CARGO WIDE-LEG "BRUTAL"',
                    description: 'Pantalon cargo coupe large à pinces en nylon ripstop technique durable. Poches 3D asymétriques avec sangles de serrage contrastées. Ourlet ajustable par cordon élastique.',
                    price: 55000,
                    image_url: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=1000&auto=format&fit=crop',
                    sizes: ['S', 'M', 'L', 'XL'],
                    colors: ['Nylon Noir', 'Kaki Brutal'],
                    category: 'Pantalon',
                    status: 'active',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'p-6',
                    title: 'BONNET TRICOT "NOISE"',
                    description: 'Bonnet court style docker tricoté en maille côtelée acrylique de haute qualité. Étiquette tissée DVMS noire cousue sur le revers.',
                    price: 15000,
                    image_url: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=1000&auto=format&fit=crop',
                    sizes: ['Unique'],
                    colors: ['Noir Tactique', 'Orange Vif'],
                    category: 'Accessoire',
                    status: 'sold_out',
                    created_at: new Date().toISOString()
                }
            ];
            localStorage.setItem(conf.LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(defaultProducts));
        }

        // 2. Seed default settings
        if (!localStorage.getItem(conf.LOCAL_STORAGE_SETTINGS_KEY)) {
            const defaultSettings = {
                whatsapp_number: conf.DEFAULT_WHATSAPP_NUMBER
            };
            localStorage.setItem(conf.LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(defaultSettings));
        }
    }

    // --- PRODUCTS CRUD INTERFACE ---
    async getProducts() {
        if (!this.isOfflineMode) {
            try {
                const { data, error } = await this.supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            } catch (err) {
                console.error("Database: Supabase error, reading local fallback instead:", err);
                return this.getLocalProducts();
            }
        } else {
            return this.getLocalProducts();
        }
    }

    getLocalProducts() {
        const key = window.CONFIG.LOCAL_STORAGE_PRODUCTS_KEY;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    async saveProduct(productId, productData) {
        if (!this.isOfflineMode) {
            try {
                if (productId) {
                    // Update
                    const { error } = await this.supabase
                        .from('products')
                        .update(productData)
                        .eq('id', productId);
                    if (error) throw error;
                } else {
                    // Create
                    const { error } = await this.supabase
                        .from('products')
                        .insert([productData]);
                    if (error) throw error;
                }
                return true;
            } catch (err) {
                console.error("Database: Supabase write error, saving locally instead:", err);
                return this.saveLocalProduct(productId, productData);
            }
        } else {
            return this.saveLocalProduct(productId, productData);
        }
    }

    saveLocalProduct(productId, productData) {
        const key = window.CONFIG.LOCAL_STORAGE_PRODUCTS_KEY;
        const productsList = this.getLocalProducts();

        if (productId) {
            // Update
            const index = productsList.findIndex(p => p.id === productId);
            if (index !== -1) {
                productsList[index] = { ...productsList[index], ...productData };
            }
        } else {
            // Create
            const newProduct = {
                id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                ...productData
            };
            productsList.push(newProduct);
        }

        localStorage.setItem(key, JSON.stringify(productsList));
        return true;
    }

    async deleteProduct(productId) {
        if (!this.isOfflineMode) {
            try {
                const { error } = await this.supabase
                    .from('products')
                    .delete()
                    .eq('id', productId);
                if (error) throw error;
                return true;
            } catch (err) {
                console.error("Database: Supabase delete error, deleting locally instead:", err);
                return this.deleteLocalProduct(productId);
            }
        } else {
            return this.deleteLocalProduct(productId);
        }
    }

    deleteLocalProduct(productId) {
        const key = window.CONFIG.LOCAL_STORAGE_PRODUCTS_KEY;
        let productsList = this.getLocalProducts();
        productsList = productsList.filter(p => p.id !== productId);
        localStorage.setItem(key, JSON.stringify(productsList));
        return true;
    }

    // --- SETTINGS KEY-VALUE INTERFACE ---
    async getSetting(settingKey, defaultValue) {
        if (!this.isOfflineMode) {
            try {
                const { data, error } = await this.supabase
                    .from('settings')
                    .select('value')
                    .eq('key', settingKey)
                    .single();
                
                if (error) throw error;
                return data ? data.value : defaultValue;
            } catch (err) {
                console.error(`Database: Supabase error getting setting "${settingKey}", using local key instead:`, err);
                return this.getLocalSetting(settingKey, defaultValue);
            }
        } else {
            return this.getLocalSetting(settingKey, defaultValue);
        }
    }

    getLocalSetting(settingKey, defaultValue) {
        const key = window.CONFIG.LOCAL_STORAGE_SETTINGS_KEY;
        const data = localStorage.getItem(key);
        if (data) {
            const settingsObj = JSON.parse(data);
            return settingsObj[settingKey] !== undefined ? settingsObj[settingKey] : defaultValue;
        }
        return defaultValue;
    }

    async setSetting(settingKey, value) {
        if (!this.isOfflineMode) {
            try {
                const { error } = await this.supabase
                    .from('settings')
                    .upsert({ key: settingKey, value: value });
                
                if (error) throw error;
                return true;
            } catch (err) {
                console.error(`Database: Supabase error setting "${settingKey}", updating locally:`, err);
                return this.setLocalSetting(settingKey, value);
            }
        } else {
            return this.setLocalSetting(settingKey, value);
        }
    }

    setLocalSetting(settingKey, value) {
        const key = window.CONFIG.LOCAL_STORAGE_SETTINGS_KEY;
        const data = localStorage.getItem(key);
        const settingsObj = data ? JSON.parse(data) : {};
        
        settingsObj[settingKey] = value;
        localStorage.setItem(key, JSON.stringify(settingsObj));
        return true;
    }
}

// Instantiate globally
window.db = new DatabaseManager();

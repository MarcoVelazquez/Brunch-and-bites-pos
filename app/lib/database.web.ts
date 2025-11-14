// Web-specific database implementation using IndexedDB
import type {
    User, Permission, Product, Sale, SaleItem,
    Expense, Costing, CostingItem, CountResult
} from './database.types';

// Web implementation using localStorage for offline functionality
class WebDatabaseManager {
    private static instance: WebDatabaseManager | null = null;
    private isInitialized = false;
    private storagePrefix = 'pos_system_';

    private constructor() {}

    static getInstance(): WebDatabaseManager {
        if (!WebDatabaseManager.instance) {
            WebDatabaseManager.instance = new WebDatabaseManager();
        }
        return WebDatabaseManager.instance;
    }

    async getDatabase(): Promise<any> {
        // For localStorage implementation, we don't need a database connection
        // Just check if localStorage is available
        try {
            if (typeof localStorage === 'undefined') {
                throw new Error('localStorage not available');
            }
            return { available: true };
        } catch (error) {
            console.error('Storage not available:', error);
            throw error;
        }
    }

    private getStorageKey(tableName: string): string {
        return `${this.storagePrefix}${tableName}`;
    }

    private getNextId(tableName: string): number {
        const counterKey = `${this.storagePrefix}${tableName}_counter`;
        const currentId = parseInt(localStorage.getItem(counterKey) || '0', 10);
        const nextId = currentId + 1;
        localStorage.setItem(counterKey, nextId.toString());
        return nextId;
    }

    private getTableData<T>(tableName: string): T[] {
        try {
            const key = this.getStorageKey(tableName);
            const data = localStorage.getItem(key);
            console.log(`🔍 getTableData(${tableName}): key=${key}, hasData=${!!data}`);
            const result = data ? JSON.parse(data) : [];
            console.log(`📋 getTableData(${tableName}): returning ${result.length} items`);
            return result;
        } catch (error) {
            console.error(`❌ Error getting ${tableName} data:`, error);
            return [];
        }
    }

    private setTableData<T>(tableName: string, data: T[]): void {
        try {
            localStorage.setItem(this.getStorageKey(tableName), JSON.stringify(data));
        } catch (error) {
            console.error(`Error setting ${tableName} data:`, error);
        }
    }

    async initializeTables(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            await this.getDatabase();
            this.seedDefaultData();
            this.isInitialized = true;
            console.log('Web database initialized successfully');
        } catch (error) {
            console.error('Error initializing web database:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    private seedDefaultData(): void {
        const permissions = [
            'CREAR_USUARIOS', 'ELIMINAR_USUARIOS', 'DAR_PERMISOS', 'QUITAR_PERMISOS', 'COBRAR',
            'ABRIR_CAJA', 'CERRAR_CAJA', 'REALIZAR_DEVOLUCIONES', 'AGREGAR_PRODUCTOS', 'ELIMINAR_PRODUCTOS',
            'EDITAR_PRODUCTOS', 'VER_COSTEOS', 'REALIZAR_COSTEOS', 'ELIMINAR_COSTEOS', 'REGISTRAR_GASTOS',
            'VER_GASTOS', 'ELIMINAR_GASTOS', 'VER_REPORTES'
        ];

        // Check if permissions already exist
        const existingPermissions = this.getTableData('permissions');
        if (existingPermissions.length === 0) {
            const permissionsData = permissions.map((permission, index) => ({
                id: index + 1,
                name: permission
            }));
            this.setTableData('permissions', permissionsData);
        }

        // Create default admin user if not exists
        const existingUsers = this.getTableData('users');
        if (existingUsers.length === 0) {
            const defaultUser = {
                id: 1,
                username: 'admin',
                password_hash: 'admin', // In real app, this should be hashed
                is_admin: true
            };
            this.setTableData('users', [defaultUser]);
        }

        // Add sample products if none exist
        const existingProducts = this.getTableData('products');
        if (existingProducts.length === 0) {
            const sampleProducts = [
                { id: 1, name: 'Café Americano', price: 25.00, cost: 8.00 },
                { id: 2, name: 'Croissant', price: 35.00, cost: 12.00 },
                { id: 3, name: 'Sandwich Club', price: 85.00, cost: 35.00 }
            ];
            this.setTableData('products', sampleProducts);
        }

        // Add sample sales if none exist
        const existingSales = this.getTableData('sales');
        console.log('🔍 Verificando sales existentes:', existingSales.length);
        if (existingSales.length === 0) {
            console.log('📝 Creando datos de prueba para sales...');
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const sampleSales = [
                {
                    id: 1,
                    sale_date: today.toISOString().slice(0, 10),
                    sale_time: '09:30:00',
                    total_amount: 110.00,
                    payment_received: 120.00,
                    change_given: 10.00,
                    business_name: 'Brunch & Bites',
                    user_id: 1
                },
                {
                    id: 2,
                    sale_date: yesterday.toISOString().slice(0, 10),
                    sale_time: '14:15:00',
                    total_amount: 60.00,
                    payment_received: 60.00,
                    change_given: 0.00,
                    business_name: 'Brunch & Bites',
                    user_id: 1
                }
            ];
            console.log('💾 Guardando sales de prueba:', sampleSales);
            this.setTableData('sales', sampleSales);
            
            // Add corresponding sale items
            console.log('📋 Creando sale items de prueba...');
            const sampleSaleItems = [
                { id: 1, sale_id: 1, product_id: 1, product_name: 'Café Americano', quantity: 2, price_at_sale: 25.00 },
                { id: 2, sale_id: 1, product_id: 3, product_name: 'Sandwich Club', quantity: 1, price_at_sale: 85.00 },
                { id: 3, sale_id: 2, product_id: 2, product_name: 'Croissant', quantity: 1, price_at_sale: 35.00 },
                { id: 4, sale_id: 2, product_id: 1, product_name: 'Café Americano', quantity: 1, price_at_sale: 25.00 }
            ];
            console.log('💾 Guardando sale items de prueba:', sampleSaleItems);
            this.setTableData('sale_items', sampleSaleItems);
        } else {
            console.log('✅ Sales ya existen en localStorage:', existingSales.length);
        }

        // Initialize remaining empty tables
        const emptyTables = ['expenses', 'costings', 'costing_items', 'user_permissions'];
        emptyTables.forEach(table => {
            if (this.getTableData(table).length === 0) {
                this.setTableData(table, []);
            }
        });
    }

    isDbInitialized(): boolean {
        return this.isInitialized;
    }

    reset(): void {
        // Clear all data from localStorage
        const tables = ['users', 'permissions', 'products', 'sales', 'sale_items', 'expenses', 'costings', 'costing_items', 'user_permissions'];
        tables.forEach(table => {
            localStorage.removeItem(this.getStorageKey(table));
            localStorage.removeItem(`${this.storagePrefix}${table}_counter`);
        });
        this.isInitialized = false;
    }

    // Generic helper for getting all records from a store
    async getAllFromStore<T>(storeName: string): Promise<T[]> {
        await this.getDatabase(); // Ensure storage is available
        const data = this.getTableData<T>(storeName);
        console.log(`📊 getAllFromStore(${storeName}):`, data.length, 'records found');
        return data;
    }

    // Generic helper for adding records
    async addToStore<T>(storeName: string, data: Omit<T, 'id'>): Promise<number> {
        await this.getDatabase(); // Ensure storage is available
        const existingData = this.getTableData<T & { id: number }>(storeName);
        const newId = this.getNextId(storeName);
        const newRecord = { ...data, id: newId } as T & { id: number };
        existingData.push(newRecord);
        this.setTableData(storeName, existingData);
        return newId;
    }
}

// Export web-compatible functions
export const openDB = async (): Promise<any> => {
    const manager = WebDatabaseManager.getInstance();
    return await manager.getDatabase();
};

export const initializeDatabase = async (): Promise<void> => {
    const manager = WebDatabaseManager.getInstance();
    await manager.initializeTables();
};

export const resetDatabase = (): void => {
    const manager = WebDatabaseManager.getInstance();
    manager.reset();
};

export const getAllProducts = async (): Promise<Product[]> => {
    try {
        const manager = WebDatabaseManager.getInstance();
        return await manager.getAllFromStore<Product>('products');
    } catch (error) {
        console.error('Error getting all products:', error);
        return [];
    }
};

export const getAllSales = async (): Promise<Sale[]> => {
    try {
        console.log('📦 WebDB getAllSales: Iniciando...');
        const manager = WebDatabaseManager.getInstance();
        console.log('📦 Manager obtenido:', manager);
        const sales = await manager.getAllFromStore<Sale>('sales');
        console.log('📦 WebDB getAllSales: Encontradas', sales.length, 'ventas:', sales);
        return sales;
    } catch (error) {
        console.error('❌ Error getting all sales:', error);
        return [];
    }
};

export const getAllExpenses = async (): Promise<Expense[]> => {
    try {
        const manager = WebDatabaseManager.getInstance();
        return await manager.getAllFromStore<Expense>('expenses');
    } catch (error) {
        console.error('Error getting all expenses:', error);
        return [];
    }
};

export const getSaleItems = async (db: any, saleId: number): Promise<SaleItem[]> => {
    try {
        const manager = WebDatabaseManager.getInstance();
        await manager.getDatabase();
        const saleItems = await manager.getAllFromStore<SaleItem>('sale_items');
        return saleItems.filter(item => item.sale_id === saleId);
    } catch (error) {
        console.error('Error getting sale items:', error);
        return [];
    }
};

export const getAllCostings = async (): Promise<Costing[]> => {
    try {
        const manager = WebDatabaseManager.getInstance();
        return await manager.getAllFromStore<Costing>('costings');
    } catch (error) {
        console.error('Error getting all costings:', error);
        return [];
    }
};

// Product management functions for web
export const addProduct = async (name: string, price: number, cost: number): Promise<number> => {
    try {
        const manager = WebDatabaseManager.getInstance();
        return await manager.addToStore<Product>('products', { name, price, cost });
    } catch (error) {
        console.error('Error adding product:', error);
        throw error;
    }
};

export const updateProduct = async (productId: number, name: string, price: number, cost: number): Promise<number> => {
    try {
        const manager = WebDatabaseManager.getInstance();
        await manager.getDatabase();
        const products = await manager.getAllFromStore<Product>('products');
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            products[productIndex] = { id: productId, name, price, cost };
            manager['setTableData']('products', products);
            return 1;
        }
        return 0;
    } catch (error) {
        console.error('Error updating product:', error);
        return 0;
    }
};

export const deleteProduct = async (productId: number): Promise<number> => {
    try {
        const manager = WebDatabaseManager.getInstance();
        await manager.getDatabase();
        const products = await manager.getAllFromStore<Product>('products');
        const filteredProducts = products.filter(p => p.id !== productId);
        
        if (filteredProducts.length < products.length) {
            manager['setTableData']('products', filteredProducts);
            return 1;
        }
        return 0;
    } catch (error) {
        console.error('Error deleting product:', error);
        return 0;
    }
};

// Sale management functions for web
export const addSaleWeb = async (userId: number, totalAmount: number, paymentReceived: number = 0, changeGiven: number = 0, businessName: string = ''): Promise<number> => {
    try {
        const manager = WebDatabaseManager.getInstance();
        await manager.getDatabase();
        
        const now = new Date();
        const saleDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const saleTime = now.toTimeString().slice(0, 8); // HH:MM:SS
        
        const saleData = {
            sale_date: saleDate,
            sale_time: saleTime,
            total_amount: totalAmount,
            payment_received: paymentReceived,
            change_given: changeGiven,
            business_name: businessName,
            user_id: userId
        };
        
        return await manager.addToStore<Sale>('sales', saleData);
    } catch (error) {
        console.error('Error adding sale:', error);
        throw error;
    }
};

export const deleteSaleWeb = async (saleId: number): Promise<number> => {
    try {
        const manager = WebDatabaseManager.getInstance();
        await manager.getDatabase();
        
        // Delete sale items first
        const saleItems = await manager.getAllFromStore<SaleItem>('sale_items');
        const filteredSaleItems = saleItems.filter(item => item.sale_id !== saleId);
        manager['setTableData']('sale_items', filteredSaleItems);
        
        // Then delete the sale
        const sales = await manager.getAllFromStore<Sale>('sales');
        const filteredSales = sales.filter(s => s.id !== saleId);
        
        if (filteredSales.length < sales.length) {
            manager['setTableData']('sales', filteredSales);
            return 1;
        }
        return 0;
    } catch (error) {
        console.error('Error deleting sale:', error);
        return 0;
    }
};

export const addSaleItemWeb = async (saleId: number, productId: number, productName: string, quantity: number, priceAtSale: number): Promise<number> => {
    try {
        const manager = WebDatabaseManager.getInstance();
        await manager.getDatabase();
        
        const saleItemData = {
            sale_id: saleId,
            product_id: productId,
            product_name: productName,
            quantity,
            price_at_sale: priceAtSale
        };
        
        return await manager.addToStore<SaleItem>('sale_items', saleItemData);
    } catch (error) {
        console.error('Error adding sale item:', error);
        throw error;
    }
};

// Dummy functions for compatibility with other operations that haven't been implemented yet
export const addUser = async () => { throw new Error('Not implemented for web'); };
export const addSale = async () => { throw new Error('Not implemented for web'); };
export const addExpense = async () => { throw new Error('Not implemented for web'); };
export const addCosting = async () => { throw new Error('Not implemented for web'); };
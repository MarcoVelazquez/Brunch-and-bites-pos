import { Platform } from 'react-native';

// More robust platform detection
const isWeb = () => {
  try {
    // Only return true for actual web browsers, not React Native Metro bundler
    return Platform.OS === 'web' && typeof localStorage !== 'undefined';
  } catch {
    // If Platform is not available, check for browser environment with localStorage
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
};

// Conditional import for SQLite
let SQLite: any;
if (isWeb()) {
  console.log('Database: Using web implementation');
  SQLite = null;
} else {
  console.log('Database: Using native SQLite implementation');
  SQLite = require('expo-sqlite');
}

// Type alias for SQLiteDatabase
type SQLiteDatabase = any;
import type {
    User, Permission, Product, Sale, SaleItem,
    Expense, Costing, CostingItem, CountResult
} from './database.types';

const dbName = 'pos_system.db';

// DatabaseManager class to handle singleton instance properly
class DatabaseManager {
    private static instance: DatabaseManager | null = null;
    private db: SQLiteDatabase | null = null;
    private isInitialized = false;
    private isOpening = false;

    private constructor() {}

    static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    async getDatabase(): Promise<SQLiteDatabase> {
        if (isWeb()) {
            throw new Error('DatabaseManager should not be used on web platform');
        }
        
        if (this.db && this.isInitialized) {
            try {
                // Test if the connection is still valid
                await this.db.getFirstAsync('SELECT 1');
                return this.db;
            } catch (error) {
                console.warn('Database connection test failed, reopening...', error);
                this.db = null;
                this.isInitialized = false;
            }
        }

        if (this.isOpening) {
            // Wait for existing opening process
            while (this.isOpening) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            if (this.db) return this.db;
        }

        this.isOpening = true;
        
        try {
            if (!this.db) {
                console.log('Opening database connection...');
                try {
                    this.db = await SQLite.openDatabaseAsync(dbName);
                    await this.db.execAsync('PRAGMA foreign_keys = ON;');
                    await this.db.execAsync('PRAGMA journal_mode = WAL;');
                    await this.db.execAsync('PRAGMA busy_timeout = 5000;');
                    console.log('Database connection established');
                } catch (openError) {
                    const errorMsg = openError instanceof Error ? openError.message : String(openError);
                    if (errorMsg.includes('NullPointerException') || errorMsg.includes('rejected')) {
                        console.warn('Database corrupted, deleting and recreating...');
                        try {
                            await SQLite.deleteDatabaseAsync(dbName);
                            console.log('Old database deleted');
                            this.db = await SQLite.openDatabaseAsync(dbName);
                            await this.db.execAsync('PRAGMA foreign_keys = ON;');
                            await this.db.execAsync('PRAGMA journal_mode = WAL;');
                            await this.db.execAsync('PRAGMA busy_timeout = 5000;');
                            this.isInitialized = false; // Force re-initialization
                            console.log('New database created successfully');
                        } catch (deleteError) {
                            console.error('Failed to recreate database:', deleteError);
                            throw deleteError;
                        }
                    } else {
                        throw openError;
                    }
                }
            }
            
            return this.db;
        } catch (error) {
            console.error('Error opening database:', error);
            this.db = null;
            this.isInitialized = false;
            throw error;
        } finally {
            this.isOpening = false;
        }
    }

    async initializeTables(): Promise<void> {
        if (isWeb()) {
            throw new Error('DatabaseManager should not be used on web platform');
        }
        
        if (this.isInitialized) {
            return;
        }

        try {
            const database = await this.getDatabase();
            console.log('Creating database tables...');
            await createTables(database);
            await seedDefaultData(database);
            this.isInitialized = true;
            console.log('Database tables initialized successfully');
        } catch (error) {
            console.error('Error initializing tables:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    isDbInitialized(): boolean {
        return this.isInitialized;
    }

    // Force reset (for troubleshooting)
    async reset(): Promise<void> {
        console.log('🔄 Resetting database connection...');
        try {
            if (this.db) {
                await this.db.closeAsync();
            }
        } catch (error) {
            console.warn('Error closing database during reset:', error);
        }
        this.db = null;
        this.isInitialized = false;
        this.isOpening = false;
        console.log('✅ Database reset complete');
    }
}

// Platform-specific database functions
const getWebDatabase = async () => {
    const webDB = await import('./database.web');
    return webDB;
};

// Export singleton functions
export const openDB = async (): Promise<SQLiteDatabase> => {
    if (isWeb()) {
        console.log('openDB: Using web database');
        const webDB = await getWebDatabase();
        return await webDB.openDB();
    } else {
        console.log('openDB: Using native database');
        const manager = DatabaseManager.getInstance();
        return await manager.getDatabase();
    }
};

export const createTables = async (db: SQLiteDatabase): Promise<void> => {
    if (!db) {
        throw new Error('Database instance is null');
    }
    
    try {
        // Create tables individually without transactions
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );`);
        
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                is_admin BOOLEAN NOT NULL DEFAULT 0
            );`);
        
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS user_permissions (
                user_id INTEGER,
                permission_id INTEGER,
                PRIMARY KEY (user_id, permission_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
            );`);
        
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                cost REAL NOT NULL
            );`);
        
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sale_date TEXT NOT NULL,
                sale_time TEXT NOT NULL,
                total_amount REAL NOT NULL,
                payment_received REAL NOT NULL,
                change_given REAL NOT NULL,
                business_name TEXT,
                user_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );`);
        
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS sale_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sale_id INTEGER NOT NULL,
                product_id INTEGER,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price_at_sale REAL NOT NULL,
                FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
            );`);
        
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                expense_date TEXT NOT NULL,
                expense_time TEXT NOT NULL,
                description TEXT,
                amount REAL NOT NULL
            );`);
        
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS costings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                total_cost REAL NOT NULL,
                costing_date TEXT NOT NULL
            );`);
        
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS costing_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                costing_id INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                unit_of_measure TEXT,
                unit_price REAL NOT NULL,
                quantity_used REAL NOT NULL,
                FOREIGN KEY (costing_id) REFERENCES costings(id) ON DELETE CASCADE
            );`);
        
        console.log('All tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
};

/**
 * Inserta los permisos iniciales del sistema en la tabla `permissions`.
 * Se ejecuta solo si la tabla está vacía.
 */
export const insertInitialPermissions = async (db: SQLiteDatabase): Promise<void> => {
    const permissions: string[] = [
        'CREAR_USUARIOS', 'ELIMINAR_USUARIOS', 'DAR_PERMISOS', 'QUITAR_PERMISOS', 'COBRAR',
        'ABRIR_CAJA', 'CERRAR_CAJA', 'REALIZAR_DEVOLUCIONES', 'AGREGAR_PRODUCTOS', 'ELIMINAR_PRODUCTOS',
        'EDITAR_PRODUCTOS', 'VER_COSTEOS', 'REALIZAR_COSTEOS', 'ELIMINAR_COSTEOS', 'REGISTRAR_GASTOS',
        'VER_GASTOS', 'ELIMINAR_GASTOS', 'VER_REPORTES'
    ];
    const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM permissions') as { count: number } | null;
    const count = row?.count ?? 0;
    if (count === 0) {
        const insertSql = permissions.map(() => '(?)').join(', ');
        await db.runAsync(`INSERT INTO permissions (name) VALUES ${insertSql}`, permissions);
    }
};

// User Management Functions

/**
 * Adds a new user to the system.
 */
export const addUser = async (db: SQLiteDatabase, username: string, passwordHash: string, isAdmin: boolean = false): Promise<number> => {
    const existing = await db.getFirstAsync('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
        throw new Error('El nombre de usuario ya está en uso');
    }
    const res = await db.runAsync('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)', [username, passwordHash, isAdmin ? 1 : 0]);
    return Number(res.lastInsertRowId);
};

/**
 * Gets a user by their username. Useful for authentication.
 */
export const getUserByUsername = async (db: SQLiteDatabase, username: string): Promise<User | null> => {
    const row = await db.getFirstAsync('SELECT * FROM users WHERE username = ?', [username]);
    if (!row) return null;
    return { ...row, is_admin: Boolean((row as any).is_admin) } as User;
};

/**
 * Gets a user by their ID.
 */
export const getUserById = async (db: SQLiteDatabase, userId: number): Promise<User | null> => {
    const row = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [userId]);
    if (!row) return null;
    return { ...row, is_admin: Boolean((row as any).is_admin) } as User;
};

/**
 * Gets all users in the system.
 */
export const getAllUsers = async (db: SQLiteDatabase): Promise<User[]> => {
    const rows = await db.getAllAsync('SELECT * FROM users');
    return rows.map((user: any) => ({ ...user, is_admin: Boolean(user.is_admin) } as User));
};

/**
 * Updates user information.
 */
export const updateUser = async (db: SQLiteDatabase, userId: number, username: string, passwordHash: string, isAdmin: boolean): Promise<number> => {
    const res = await db.runAsync('UPDATE users SET username = ?, password_hash = ?, is_admin = ? WHERE id = ?', [username, passwordHash, isAdmin ? 1 : 0, userId]);
    return Number(res.changes);
};

/**
 * Deletes a user by their ID.
 */
export const deleteUser = async (db: SQLiteDatabase, userId: number): Promise<number> => {
    const res = await db.runAsync('DELETE FROM users WHERE id = ?', [userId]);
    return Number(res.changes);
};

/**
 * Gets all permissions for a specific user.
 */
export const getUserPermissions = async (db: SQLiteDatabase, userId: number): Promise<string[]> => {
    const rows = await db.getAllAsync(
        `SELECT p.name FROM user_permissions up JOIN permissions p ON up.permission_id = p.id WHERE up.user_id = ?`,
        [userId]
    );
    return (rows as { name: string }[]).map((r) => r.name);
};

/**
 * Creates a new admin user with all permissions.
 */
export const seedAdminUser = async (db: SQLiteDatabase, username: string, passwordHash: string): Promise<User | null> => {
    // Verificar si ya existe un administrador
    const existingAdmin = await db.getFirstAsync('SELECT id FROM users WHERE is_admin = 1');
    const adminExists = Boolean(existingAdmin);
    if (adminExists) {
        return null;
    }
    // Crear el usuario
    let userId: number;
    try {
        userId = await addUser(db, username, passwordHash, true);
    } catch (error) {
        if (error instanceof Error && error.message === 'El nombre de usuario ya está en uso') {
            return null;
        }
        throw error;
    }
    // Obtener todos los permisos
    const permRows = await db.getAllAsync('SELECT id FROM permissions');
    const permIds: number[] = (permRows as { id: number }[]).map((p) => p.id);
    // Asignar cada permiso al usuario
    for (const permId of permIds) {
        await db.runAsync('INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)', [userId, permId]);
    }
    
    return await getUserById(db, userId);
};

// Permission Management Functions

/**
 * Gets all available permissions in the system.
 */
export const getAllPermissions = async (db: SQLiteDatabase): Promise<Permission[]> => {
    const rows = await db.getAllAsync('SELECT * FROM permissions');
    return rows as Permission[];
};

/**
 * Creates a new permission in the system.
 */
export const addPermission = async (db: SQLiteDatabase, permissionName: string): Promise<number> => {
    const res = await db.runAsync('INSERT INTO permissions (name) VALUES (?)', [permissionName]);
    return Number(res.lastInsertRowId);
};

/**
 * Assigns a permission to a user.
 */
export const assignPermissionToUser = async (db: SQLiteDatabase, userId: number, permissionId: number): Promise<number> => {
    const res = await db.runAsync('INSERT OR IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)', [userId, permissionId]);
    return Number(res.lastInsertRowId);
};

/**
 * Revokes a permission from a user.
 */
export const revokePermissionFromUser = async (db: SQLiteDatabase, userId: number, permissionId: number): Promise<number> => {
    const res = await db.runAsync('DELETE FROM user_permissions WHERE user_id = ? AND permission_id = ?', [userId, permissionId]);
    return Number(res.changes);
};

// Product Management Functions

/**
 * Adds a new product to the system.
 */
export const addProduct = async (db: SQLiteDatabase, name: string, price: number, cost: number): Promise<number> => {
    const res = await db.runAsync('INSERT INTO products (name, price, cost) VALUES (?, ?, ?)', [name, price, cost]);
    return Number(res.lastInsertRowId);
};

/**
 * Gets all products in the system.
 */
export const getAllProducts = async (db?: SQLiteDatabase): Promise<Product[]> => {
    if (isWeb()) {
        console.log('getAllProducts: Using web database');
        const webDB = await getWebDatabase();
        return await webDB.getAllProducts();
    }
    
    if (!db) {
        try {
            db = await getDBInstance();
        } catch (error) {
            console.error('Error getting database instance:', error);
            throw new Error('Database not initialized');
        }
    }
    try {
        const rows = await db.getAllAsync('SELECT * FROM products ORDER BY name ASC');
        return (rows || []) as Product[];
    } catch (error) {
        console.error('Error getting all products:', error);
        // Reset database connection on critical errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('shared object') || errorMessage.includes('NullPointerException')) {
            resetDatabase().catch(err => console.error('Error resetting database:', err));
        }
        return [];
    }
};

/**
 * Updates product information.
 */
export const updateProduct = async (db: SQLiteDatabase, productId: number, name: string, price: number, cost: number): Promise<number> => {
    const res = await db.runAsync('UPDATE products SET name = ?, price = ?, cost = ? WHERE id = ?', [name, price, cost, productId]);
    return Number(res.changes);
};

/**
 * Deletes a product by its ID.
 */
export const deleteProduct = async (db: SQLiteDatabase, productId: number): Promise<number> => {
    const res = await db.runAsync('DELETE FROM products WHERE id = ?', [productId]);
    return Number(res.changes);
};

// Sales Management Functions

/**
 * Creates a new sale in the system.
 */
export const addSale = async (db: SQLiteDatabase, total: number, payment: number, change: number, businessName: string, userId: number): Promise<number> => {
    const saleDate = new Date().toISOString().slice(0, 10);
    const saleTime = new Date().toLocaleTimeString('es-MX', { hour12: false });
    const res = await db.runAsync(
        `INSERT INTO sales (sale_date, sale_time, total_amount, payment_received, change_given, business_name, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [saleDate, saleTime, total, payment, change, businessName, userId]
    );
    return Number(res.lastInsertRowId);
};

/**
 * Adds items to a sale record.
 */
export const addSaleItems = async (db: SQLiteDatabase, saleId: number, items: Pick<SaleItem, 'product_id' | 'product_name' | 'quantity' | 'price_at_sale'>[]): Promise<void> => {
    if (items.length === 0) return;
    
    // Fixed: Remove withTransactionAsync and use simple loop
    for (const item of items) {
        await db.runAsync(
            `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price_at_sale) VALUES (?, ?, ?, ?, ?)`,
            [saleId, item.product_id, item.product_name, item.quantity, item.price_at_sale]
        );
    }
};

/**
 * Gets all sales in the system.
 */
export const getAllSales = async (db?: SQLiteDatabase): Promise<Sale[]> => {
    if (isWeb()) {
        console.log('🌐 getAllSales: Using web database');
        const webDB = await getWebDatabase();
        const sales = await webDB.getAllSales();
        console.log('🌐 getAllSales: Retrieved', sales.length, 'sales from web');
        return sales;
    }
    
    if (!db) {
        try {
            db = await getDBInstance();
        } catch (error) {
            console.error('Error getting database instance:', error);
            throw new Error('Database not initialized');
        }
    }
    try {
        const rows = await db.getAllAsync('SELECT * FROM sales ORDER BY sale_date DESC, sale_time DESC');
        return (rows || []) as Sale[];
    } catch (error) {
        console.error('Error getting all sales:', error);
        // Reset database connection on critical errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('shared object') || errorMessage.includes('NullPointerException')) {
            resetDatabase().catch(err => console.error('Error resetting database:', err));
        }
        return [];
    }
};

/**
 * Gets items from a specific sale.
 */
export const getSaleItems = async (db: SQLiteDatabase | any, saleId: number): Promise<SaleItem[]> => {
    if (isWeb()) {
        console.log('getSaleItems: Using web database');
        const webDB = await getWebDatabase();
        return await webDB.getSaleItems(db, saleId);
    }
    
    if (!db) {
        try {
            db = await getDBInstance();
        } catch (error) {
            console.error('Error getting database instance:', error);
            throw new Error('Database not initialized');
        }
    }
    try {
        const rows = await db.getAllAsync('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);
        return (rows || []) as SaleItem[];
    } catch (error) {
        console.error('Error getting sale items:', error);
        return [];
    }
};

/**
 * Gets details of a specific sale.
 */
export const getSaleById = async (db: SQLiteDatabase, saleId: number): Promise<Sale | null> => {
    const row = await db.getFirstAsync('SELECT * FROM sales WHERE id = ?', [saleId]);
    return (row as Sale) ?? null;
};

/**
 * Deletes a sale and its items.
 */
export const deleteSale = async (db: SQLiteDatabase, saleId: number): Promise<number> => {
    const res = await db.runAsync('DELETE FROM sales WHERE id = ?', [saleId]);
    return Number(res.changes);
};

// Expense Management Functions

/**
 * Records a new expense in the system.
 */
export const addExpense = async (db: SQLiteDatabase, description: string, amount: number): Promise<number> => {
    const expenseDate = new Date().toISOString().slice(0, 10);
    const expenseTime = new Date().toLocaleTimeString('es-MX', { hour12: false });
    const res = await db.runAsync(
        `INSERT INTO expenses (expense_date, expense_time, description, amount) VALUES (?, ?, ?, ?)`,
        [expenseDate, expenseTime, description, amount]
    );
    return Number(res.lastInsertRowId);
};

/**
 * Gets all expenses in the system.
 */
export const getAllExpenses = async (db?: SQLiteDatabase): Promise<Expense[]> => {
    if (isWeb()) {
        console.log('getAllExpenses: Using web database');
        const webDB = await getWebDatabase();
        return await webDB.getAllExpenses();
    }
    
    if (!db) {
        try {
            db = await getDBInstance();
        } catch (error) {
            console.error('Error getting database instance:', error);
            throw new Error('Database not initialized');
        }
    }
    try {
        const rows = await db.getAllAsync('SELECT * FROM expenses ORDER BY expense_date DESC, expense_time DESC');
        return (rows || []) as Expense[];
    } catch (error) {
        console.error('Error getting all expenses:', error);
        // Reset database connection on critical errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('shared object') || errorMessage.includes('NullPointerException')) {
            resetDatabase().catch(err => console.error('Error resetting database:', err));
        }
        return [];
    }
};

/**
 * Gets a specific expense by its ID.
 */
export const getExpenseById = async (db: SQLiteDatabase, expenseId: number): Promise<Expense | null> => {
    const row = await db.getFirstAsync('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    return (row as Expense) ?? null;
};

/**
 * Updates an existing expense.
 */
export const updateExpense = async (db: SQLiteDatabase, expenseId: number, description: string, amount: number): Promise<number> => {
    const res = await db.runAsync('UPDATE expenses SET description = ?, amount = ? WHERE id = ?', [description, amount, expenseId]);
    return Number(res.changes);
};

/**
 * Deletes an expense by its ID.
 */
export const deleteExpense = async (db: SQLiteDatabase, expenseId: number): Promise<number> => {
    const res = await db.runAsync('DELETE FROM expenses WHERE id = ?', [expenseId]);
    return Number(res.changes);
};

// Costing Management Functions

/**
 * Creates a new costing record.
 */
export const addCosting = async (db: SQLiteDatabase, name: string, totalCost: number): Promise<number> => {
    const costingDate = new Date().toISOString().slice(0, 10);
    const res = await db.runAsync('INSERT INTO costings (name, total_cost, costing_date) VALUES (?, ?, ?)', [name, totalCost, costingDate]);
    return Number(res.lastInsertRowId);
};

/**
 * Adds items to a costing record.
 */
export const addCostingItems = async (db: SQLiteDatabase, costingId: number, items: Omit<CostingItem, 'id' | 'costing_id'>[]): Promise<void> => {
    if (items.length === 0) return;
    
    // Fixed: Remove withTransactionAsync and use simple loop
    for (const item of items) {
        await db.runAsync(
            `INSERT INTO costing_items (costing_id, item_name, unit_of_measure, unit_price, quantity_used) VALUES (?, ?, ?, ?, ?)`,
            [costingId, item.item_name, item.unit_of_measure, item.unit_price, item.quantity_used]
        );
    }
};

/**
 * Gets all costing records in the system.
 */
export const getAllCostings = async (db?: SQLiteDatabase): Promise<Costing[]> => {
    if (isWeb()) {
        console.log('getAllCostings: Using web database');
        const webDB = await getWebDatabase();
        return await webDB.getAllCostings();
    }
    
    if (!db) {
        try {
            db = await getDBInstance();
        } catch (error) {
            console.error('Error getting database instance:', error);
            throw new Error('Database not initialized');
        }
    }
    try {
        const rows = await db.getAllAsync('SELECT * FROM costings ORDER BY costing_date DESC');
        return (rows || []) as Costing[];
    } catch (error) {
        console.error('Error getting all costings:', error);
        // Reset database connection on critical errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('shared object') || errorMessage.includes('NullPointerException')) {
            resetDatabase().catch(err => console.error('Error resetting database:', err));
        }
        return [];
    }
};

/**
 * Gets items from a specific costing record.
 */
export const getCostingItems = async (db: SQLiteDatabase, costingId: number): Promise<CostingItem[]> => {
    const rows = await db.getAllAsync('SELECT * FROM costing_items WHERE costing_id = ?', [costingId]);
    return rows as CostingItem[];
};

/**
 * Gets a specific costing record by its ID.
 */
export const getCostingById = async (db: SQLiteDatabase, costingId: number): Promise<Costing | null> => {
    const row = await db.getFirstAsync('SELECT * FROM costings WHERE id = ?', [costingId]);
    return (row as Costing) ?? null;
};

/**
 * Deletes a costing record and its items.
 */
export const deleteCosting = async (db: SQLiteDatabase, costingId: number): Promise<number> => {
    const res = await db.runAsync('DELETE FROM costings WHERE id = ?', [costingId]);
    return Number(res.changes);
};

// --- Maintenance / Admin helpers ---
/**
 * Resetea la contraseña del/los usuario(s) administrador(es) a un hash dado.
 * No crea usuarios, solo actualiza password_hash donde is_admin = 1.
 */
export const resetAdminPassword = async (db: SQLiteDatabase, newPasswordHash: string): Promise<number> => {
    const res = await db.runAsync('UPDATE users SET password_hash = ? WHERE is_admin = 1', [newPasswordHash]);
    return Number(res.changes);
};

/**
 * Elimina todos los usuarios de la tabla.
 */
export const clearAllUsers = async (db: SQLiteDatabase): Promise<number> => {
    const res = await db.runAsync('DELETE FROM users');
    return Number(res.changes);
};

/**
 * Crea un usuario admin nuevo con el username y contraseña hash dados.
 */
export const createFreshAdmin = async (db: SQLiteDatabase, username: string = 'admin', passwordHash: string): Promise<number> => {
    const res = await db.runAsync(
        `INSERT INTO users (username, password_hash, is_admin) 
         VALUES (?, ?, 1)`,
        [username, passwordHash]
    );
    return Number(res.lastInsertRowId);
};

/**
 * Crea un usuario con todos los permisos disponibles.
 */
export const createUserWithAllPermissions = async (db: SQLiteDatabase, username: string, passwordHash: string): Promise<number> => {
    // Crear el usuario
    const userRes = await db.runAsync(
        `INSERT INTO users (username, password_hash, is_admin) 
         VALUES (?, ?, 0)`,
        [username, passwordHash]
    );
    const userId = Number(userRes.lastInsertRowId);
    
    // Obtener todos los permisos
    const permissions = await db.getAllAsync('SELECT id FROM permissions') as { id: number }[];
    
    // Asignar todos los permisos al usuario
    for (const permission of permissions) {
        await db.runAsync(
            'INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)',
            [userId, permission.id]
        );
    }
    
    return userId;
};

// Exportación por defecto del módulo que contiene todas las funciones públicas
export default {
    openDB,
    createTables,
    insertInitialPermissions,
    getUserByUsername,
    getUserById,
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    getUserPermissions,
    seedAdminUser,
    clearAllUsers,
    createFreshAdmin,
    createUserWithAllPermissions,
    getAllPermissions,
    addPermission,
    assignPermissionToUser,
    revokePermissionFromUser,
    addProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    addSale,
    addSaleItems,
    getAllSales,
    getSaleItems,
    getSaleById,
    deleteSale,
    addExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    addCosting,
    addCostingItems,
    getAllCostings,
    getCostingItems,
    getCostingById,
    deleteCosting,
    resetAdminPassword
};

// Seed default data
const seedDefaultData = async (database: SQLiteDatabase): Promise<void> => {
    try {
        console.log('Seeding default data...');
        
        // Seed permissions first
        const permissions = ['caja', 'productos', 'gastos', 'reportes', 'costeos', 'usuarios', 'permisos'];
        for (const perm of permissions) {
            try {
                await database.runAsync(
                    'INSERT OR IGNORE INTO permissions (name) VALUES (?)',
                    [perm]
                );
            } catch (permError) {
                console.warn(`Failed to insert permission ${perm}:`, permError);
            }
        }
        
        // Create admin user if not exists
        try {
            const existingUser = await database.getFirstAsync(
                'SELECT id FROM users WHERE username = ?',
                ['admin']
            );
            
            if (!existingUser) {
                // Default admin password hash (for 'admin123')
                const defaultPasswordHash = 'e3afed0047b08059d0fada10f400c1e5';
                await createFreshAdmin(database, 'admin', defaultPasswordHash);
                console.log('Admin user created successfully');
            } else {
                console.log('Admin user already exists');
            }
        } catch (userError) {
            console.error('Error creating admin user:', userError);
        }
        
        console.log('Default data seeded successfully');
    } catch (error) {
        console.error('Error seeding default data:', error);
        // Don't rethrow - let app continue even if seeding fails
    }
};

// Convenience functions that use singleton database instance
export const getDBInstance = async (): Promise<SQLiteDatabase> => {
    try {
        const manager = DatabaseManager.getInstance();
        if (!manager.isDbInitialized()) {
            await manager.initializeTables();
        }
        return await manager.getDatabase();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('NullPointerException') || errorMessage.includes('rejected')) {
            console.warn('Database connection failed, resetting and retrying...');
            const manager = DatabaseManager.getInstance();
            manager.reset();
            await manager.initializeTables();
            return await manager.getDatabase();
        }
        throw error;
    }
};

// Initialize database function to be called once in app
export const initializeDatabase = async (): Promise<void> => {
    if (isWeb()) {
        console.log('initializeDatabase: Using web database');
        const webDB = await getWebDatabase();
        await webDB.initializeDatabase();
    } else {
        console.log('initializeDatabase: Using native database');
        const manager = DatabaseManager.getInstance();
        await manager.initializeTables();
    }
};

// Reset database connection (for error recovery)
export const resetDatabase = async (): Promise<void> => {
    if (isWeb()) {
        console.log('resetDatabase: Using web database');
        const webDB = await getWebDatabase();
        await webDB.resetDatabase();
    } else {
        console.log('resetDatabase: Using native database');
        const manager = DatabaseManager.getInstance();
        await manager.reset();
    }
};

// Simple wrapper functions that handle database instance automatically
export const simpleGetAllProducts = async (): Promise<Product[]> => {
    try {
        const db = await getDBInstance();
        return await getAllProducts(db);
    } catch (error) {
        console.error('Error in simpleGetAllProducts:', error);
        return [];
    }
};

export const simpleGetAllSales = async (): Promise<Sale[]> => {
    try {
        console.log('🚀 simpleGetAllSales: Iniciando...');
        const db = await getDBInstance();
        const sales = await getAllSales(db);
        console.log('✅ simpleGetAllSales: Obtenidas', sales.length, 'ventas');
        return sales;
    } catch (error) {
        console.error('❌ Error in simpleGetAllSales:', error);
        return [];
    }
};

export const simpleGetAllExpenses = async (): Promise<Expense[]> => {
    try {
        const db = await getDBInstance();
        return await getAllExpenses(db);
    } catch (error) {
        console.error('Error in simpleGetAllExpenses:', error);
        return [];
    }
};

export const simpleGetAllCostings = async (): Promise<Costing[]> => {
    try {
        const db = await getDBInstance();
        return await getAllCostings(db);
    } catch (error) {
        console.error('Error in simpleGetAllCostings:', error);
        return [];
    }
};

// Wrapper functions for product operations that work on all platforms
export const simpleAddProduct = async (name: string, price: number, cost: number): Promise<number> => {
    if (isWeb()) {
        console.log('simpleAddProduct: Using web database');
        const webDB = await getWebDatabase();
        return await webDB.addProduct(name, price, cost);
    } else {
        console.log('simpleAddProduct: Using native database');
        const db = await getDBInstance();
        return await addProduct(db, name, price, cost);
    }
};

export const simpleUpdateProduct = async (productId: number, name: string, price: number, cost: number): Promise<number> => {
    if (isWeb()) {
        console.log('simpleUpdateProduct: Using web database');
        const webDB = await getWebDatabase();
        return await webDB.updateProduct(productId, name, price, cost);
    } else {
        console.log('simpleUpdateProduct: Using native database');
        const db = await getDBInstance();
        return await updateProduct(db, productId, name, price, cost);
    }
};

export const simpleDeleteProduct = async (productId: number): Promise<number> => {
    if (isWeb()) {
        console.log('simpleDeleteProduct: Using web database');
        const webDB = await getWebDatabase();
        return await webDB.deleteProduct(productId);
    } else {
        console.log('simpleDeleteProduct: Using native database');
        const db = await getDBInstance();
        return await deleteProduct(db, productId);
    }
};

// Simple wrapper functions for user operations
export const simpleGetAllUsers = async (): Promise<User[]> => {
    try {
        if (isWeb()) {
            console.log('simpleGetAllUsers: Using web database - not implemented');
            return []; // Not fully implemented for web yet
        } else {
            console.log('simpleGetAllUsers: Using native database');
            const db = await getDBInstance();
            return await getAllUsers(db);
        }
    } catch (error) {
        console.error('Error in simpleGetAllUsers:', error);
        return [];
    }
};

export const simpleAddUser = async (username: string, passwordHash: string, isAdmin: boolean = false): Promise<number> => {
    if (isWeb()) {
        console.log('simpleAddUser: Using web database - not implemented');
        return 0; // Not implemented for web yet
    } else {
        console.log('simpleAddUser: Using native database');
        const db = await getDBInstance();
        return await addUser(db, username, passwordHash, isAdmin);
    }
};

export const simpleUpdateUser = async (userId: number, username: string, passwordHash: string, isAdmin: boolean = false): Promise<number> => {
    if (isWeb()) {
        console.log('simpleUpdateUser: Using web database - not implemented');
        return 0; // Not implemented for web yet
    } else {
        console.log('simpleUpdateUser: Using native database');
        const db = await getDBInstance();
        return await updateUser(db, userId, username, passwordHash, isAdmin);
    }
};

export const simpleDeleteUser = async (userId: number): Promise<number> => {
    if (isWeb()) {
        console.log('simpleDeleteUser: Using web database - not implemented');
        return 0; // Not implemented for web yet
    } else {
        console.log('simpleDeleteUser: Using native database');
        const db = await getDBInstance();
        return await deleteUser(db, userId);
    }
};

// Simple wrapper functions for expense operations
export const simpleAddExpense = async (description: string, amount: number): Promise<number> => {
    if (isWeb()) {
        console.log('simpleAddExpense: Using web database - not implemented');
        return 0; // Not implemented for web yet
    } else {
        console.log('simpleAddExpense: Using native database');
        const db = await getDBInstance();
        return await addExpense(db, description, amount);
    }
};

export const simpleUpdateExpense = async (expenseId: number, description: string, amount: number): Promise<number> => {
    if (isWeb()) {
        console.log('simpleUpdateExpense: Using web database - not implemented');
        return 0; // Not implemented for web yet
    } else {
        console.log('simpleUpdateExpense: Using native database');
        const db = await getDBInstance();
        return await updateExpense(db, expenseId, description, amount);
    }
};

export const simpleDeleteExpense = async (expenseId: number): Promise<number> => {
    if (isWeb()) {
        console.log('simpleDeleteExpense: Using web database - not implemented');
        return 0; // Not implemented for web yet
    } else {
        console.log('simpleDeleteExpense: Using native database');
        const db = await getDBInstance();
        return await deleteExpense(db, expenseId);
    }
};

// Simple wrapper functions for sale operations
export const simpleAddSale = async (userId: number, totalAmount: number, paymentReceived: number = 0, changeGiven: number = 0, businessName: string = ''): Promise<number> => {
    if (isWeb()) {
        console.log('simpleAddSale: Using web database - not implemented');
        return 0; // Not implemented for web yet
    } else {
        console.log('simpleAddSale: Using native database');
        const db = await getDBInstance();
        return await addSale(db, totalAmount, paymentReceived, changeGiven, businessName, userId);
    }
};

export const simpleGetSaleItems = async (saleId: number): Promise<SaleItem[]> => {
    if (isWeb()) {
        console.log('simpleGetSaleItems: Using web database');
        const webDB = await getWebDatabase();
        return await webDB.getSaleItems(null, saleId);
    } else {
        console.log('simpleGetSaleItems: Using native database');
        const db = await getDBInstance();
        return await getSaleItems(db, saleId);
    }
};

export const simpleAddSaleItem = async (saleId: number, productId: number, productName: string, quantity: number, price: number): Promise<number> => {
    if (isWeb()) {
        console.log('simpleAddSaleItem: Using web database - not implemented');
        return 0; // Not implemented for web yet
    } else {
        console.log('simpleAddSaleItem: Using native database');
        const db = await openDB();
        const result = await db.runAsync(
            `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price_at_sale) VALUES (?, ?, ?, ?, ?)`,
            [saleId, productId, productName, quantity, price]
        );
        return result.lastInsertRowId;
    }
};

// Simple wrapper function for deleting sales
export const simpleDeleteSale = async (saleId: number): Promise<number> => {
    if (isWeb()) {
        console.log('simpleDeleteSale: Using web database');
        const webDB = await getWebDatabase();
        return await webDB.deleteSaleWeb(saleId);
    } else {
        console.log('simpleDeleteSale: Using native database');
        const db = await getDBInstance();
        return await deleteSale(db, saleId);
    }
};

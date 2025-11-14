// @ts-ignore
const { openDatabaseSync } = require('expo-sqlite');

// Type alias for SQLiteDatabase
type SQLiteDatabase = any;
import type {
    User, Permission, Product, Sale, SaleItem,
    Expense, Costing, CostingItem, CountResult
} from './database.types';

const dbName = 'pos_system.db';
let currentDb: SQLiteDatabase | null = null;
let openingPromise: Promise<SQLiteDatabase> | null = null;

// Internal: detect native SQLite NPE/prepare/rejected errors
const isNativeDbError = (err: unknown): boolean => {
    const msg = err instanceof Error ? err.message : String(err);
    return (
        msg.includes('NullPointerException') ||
        msg.includes('prepareAsync') ||
        msg.includes('execAsync') ||
        msg.includes('rejected')
    );
};

// Internal: delete and recreate the database, then return a fresh handle
const recoverDatabase = async (): Promise<SQLiteDatabase> => {
    try {
        // Close existing handle if present
        if (currentDb && typeof currentDb.closeAsync === 'function') {
            try { await currentDb.closeAsync(); } catch {}
        }
        currentDb = null;
        const sqlite = await import('expo-sqlite');
        if ((sqlite as any).deleteDatabaseAsync) {
            try {
                await (sqlite as any).deleteDatabaseAsync(dbName);
                console.warn(`🧹 Deleted corrupted database '${dbName}'`);
            } catch (delErr) {
                console.warn('⚠️ First delete attempt failed, retrying after short delay...', delErr);
                await new Promise(r => setTimeout(r, 150));
                await (sqlite as any).deleteDatabaseAsync(dbName);
                console.warn(`🧹 Deleted corrupted database on retry '${dbName}'`);
            }
        }
    } catch (e) {
        console.warn('⚠️ Failed to delete database (may not exist):', e);
    }
    const db = openDatabaseSync(dbName);
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA busy_timeout = 5000;');
    await createTables(db);
    await insertInitialPermissions(db);
    currentDb = db;
    return db;
};

// Basic database operations
export const openDB = async (): Promise<SQLiteDatabase> => {
    if (currentDb) return currentDb;
    if (openingPromise) return openingPromise;
    openingPromise = (async () => {
        try {
            const db = openDatabaseSync(dbName);
            await db.execAsync('PRAGMA foreign_keys = ON;');
            await db.execAsync('PRAGMA journal_mode = WAL;');
            await db.execAsync('PRAGMA busy_timeout = 5000;');
            // Connection sanity check
            await db.getFirstAsync('SELECT 1 as ok');
            currentDb = db;
            return db;
        } catch (error) {
            console.error('❌ openDB failed, attempting recovery:', error);
            if (isNativeDbError(error)) {
                const healthy = await recoverDatabase();
                return healthy;
            }
            throw error;
        } finally {
            openingPromise = null;
        }
    })();
    return openingPromise;
};

export const closeDB = async (): Promise<void> => {
    if (currentDb && typeof currentDb.closeAsync === 'function') {
        try { await currentDb.closeAsync(); } catch {}
    }
    currentDb = null;
};

export const createTables = async (db: SQLiteDatabase): Promise<void> => {
    await db.withTransactionAsync(async () => {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                is_admin BOOLEAN NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS user_permissions (
                user_id INTEGER,
                permission_id INTEGER,
                PRIMARY KEY (user_id, permission_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                cost REAL NOT NULL
            );
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
            );
            CREATE TABLE IF NOT EXISTS sale_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sale_id INTEGER NOT NULL,
                product_id INTEGER,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price_at_sale REAL NOT NULL,
                FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                expense_date TEXT NOT NULL,
                expense_time TEXT NOT NULL,
                description TEXT,
                amount REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS costings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                total_cost REAL NOT NULL,
                costing_date TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS costing_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                costing_id INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                unit_of_measure TEXT,
                unit_price REAL NOT NULL,
                quantity_used REAL NOT NULL,
                FOREIGN KEY (costing_id) REFERENCES costings(id) ON DELETE CASCADE
            );
        `);
    });
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
    const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM permissions');
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
    return rows.map((r: { name: string }) => r.name);
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
    const permIds: number[] = permRows.map((p: { id: number }) => p.id);
    // Asignar cada permiso al usuario
    await db.withTransactionAsync(async () => {
        for (const permId of permIds) {
            await db.runAsync('INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)', [userId, permId]);
        }
    });
    
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
export const getAllProducts = async (db: SQLiteDatabase): Promise<Product[]> => {
    try {
        const rows = await db.getAllAsync('SELECT * FROM products ORDER BY name ASC');
        return rows as Product[];
    } catch (error) {
        console.error('❌ getAllProducts failed:', error);
        if (isNativeDbError(error)) {
            const freshDb = await recoverDatabase();
            const rows = await freshDb.getAllAsync('SELECT * FROM products ORDER BY name ASC');
            return rows as Product[];
        }
        throw error;
    }
};

/**
 * Updates product information.
 */
export const updateProduct = async (db: SQLiteDatabase, productId: number, name: string, price: number, cost: number): Promise<number> => {
    try {
        const res = await db.runAsync('UPDATE products SET name = ?, price = ?, cost = ? WHERE id = ?', [name, price, cost, productId]);
        return Number(res.changes);
    } catch (error) {
        if (isNativeDbError(error)) {
            const freshDb = await recoverDatabase();
            const res = await freshDb.runAsync('UPDATE products SET name = ?, price = ?, cost = ? WHERE id = ?', [name, price, cost, productId]);
            return Number(res.changes);
        }
        throw error;
    }
};

/**
 * Deletes a product by its ID.
 */
export const deleteProduct = async (db: SQLiteDatabase, productId: number): Promise<number> => {
    try {
        const res = await db.runAsync('DELETE FROM products WHERE id = ?', [productId]);
        return Number(res.changes);
    } catch (error) {
        if (isNativeDbError(error)) {
            const freshDb = await recoverDatabase();
            const res = await freshDb.runAsync('DELETE FROM products WHERE id = ?', [productId]);
            return Number(res.changes);
        }
        throw error;
    }
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
    await db.withTransactionAsync(async () => {
        for (const item of items) {
            await db.runAsync(
                `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price_at_sale) VALUES (?, ?, ?, ?, ?)`,
                [saleId, item.product_id, item.product_name, item.quantity, item.price_at_sale]
            );
        }
    });
};

/**
 * Gets all sales in the system.
 */
export const getAllSales = async (db: SQLiteDatabase): Promise<Sale[]> => {
    const rows = await db.getAllAsync('SELECT * FROM sales ORDER BY sale_date DESC, sale_time DESC');
    return rows as Sale[];
};

/**
 * Gets items from a specific sale.
 */
export const getSaleItems = async (db: SQLiteDatabase, saleId: number): Promise<SaleItem[]> => {
    const rows = await db.getAllAsync('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);
    return rows as SaleItem[];
};

/**
 * Gets details of a specific sale.
 */
export const getSaleById = async (db: SQLiteDatabase, saleId: number): Promise<Sale | null> => {
    const row = await db.getFirstAsync('SELECT * FROM sales WHERE id = ?', [saleId]);
    return row ?? null;
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
export const getAllExpenses = async (db: SQLiteDatabase): Promise<Expense[]> => {
    const rows = await db.getAllAsync('SELECT * FROM expenses ORDER BY expense_date DESC, expense_time DESC');
    return rows as Expense[];
};

/**
 * Gets a specific expense by its ID.
 */
export const getExpenseById = async (db: SQLiteDatabase, expenseId: number): Promise<Expense | null> => {
    const row = await db.getFirstAsync('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    return row ?? null;
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
    await db.withTransactionAsync(async () => {
        for (const item of items) {
            await db.runAsync(
                `INSERT INTO costing_items (costing_id, item_name, unit_of_measure, unit_price, quantity_used) VALUES (?, ?, ?, ?, ?)`,
                [costingId, item.item_name, item.unit_of_measure, item.unit_price, item.quantity_used]
            );
        }
    });
};

/**
 * Gets all costing records in the system.
 */
export const getAllCostings = async (db: SQLiteDatabase): Promise<Costing[]> => {
    const rows = await db.getAllAsync('SELECT * FROM costings ORDER BY costing_date DESC');
    return rows as Costing[];
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
    return row ?? null;
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
    const permissions = await db.getAllAsync('SELECT id FROM permissions');
    
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

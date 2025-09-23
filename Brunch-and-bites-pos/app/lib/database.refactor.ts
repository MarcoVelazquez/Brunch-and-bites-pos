import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type {
    User, Permission, Product, Sale, SaleItem,
    Expense, Costing, CostingItem, CountResult
} from './database.types';

const dbName = 'pos_system.db';

// Basic database operations
export const openDB = async (): Promise<SQLiteDatabase> => {
    try {
        const db = await openDatabaseAsync(dbName);
        console.log('¡Base de datos abierta exitosamente!');
        return db;
    } catch (error) {
        console.error('Error al abrir la base de datos:', error);
        throw error;
    }
};

export const createTables = async (db: SQLiteDatabase): Promise<void> => {
    try {
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
        console.log('¡Todas las tablas creadas exitosamente!');
    } catch (error) {
        console.error('Error en la transacción al crear tablas:', error);
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

    try {
        const stmt = await db.prepareAsync('SELECT COUNT(*) as count FROM permissions');
        const result = await stmt.executeAsync();
        await stmt.finalizeAsync();

        const rows = result as unknown as { _array: CountResult[] };
        const count = rows._array[0].count;

        if (count === 0) {
            const insertSql = permissions.map(name => `('${name}')`).join(', ');
            await db.execAsync(`INSERT INTO permissions (name) VALUES ${insertSql}`);
        }
    } catch (error) {
        console.error('Error al insertar permisos iniciales:', error);
        throw error;
    }
};

// User Management Functions

/**
 * Adds a new user to the system.
 */
export const addUser = async (db: SQLiteDatabase, username: string, passwordHash: string, isAdmin: boolean = false): Promise<number> => {
    try {
        const stmt = await db.prepareAsync(
            'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)'
        );
        const result = await stmt.executeAsync([username, passwordHash, isAdmin ? 1 : 0]);
        await stmt.finalizeAsync();
        
        // Get the inserted ID using last_insert_rowid()
        const idStmt = await db.prepareAsync('SELECT last_insert_rowid() as id');
        const idResult = await idStmt.executeAsync();
        await idStmt.finalizeAsync();
        
        const rows = idResult as unknown as { _array: { id: number }[] };
        return rows._array[0].id;
    } catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
};

/**
 * Gets a user by their username. Useful for authentication.
 */
export const getUserByUsername = async (db: SQLiteDatabase, username: string): Promise<User | null> => {
    try {
        const stmt = await db.prepareAsync('SELECT * FROM users WHERE username = ?');
        const result = await stmt.executeAsync([username]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: User[] };
        if (rows._array.length > 0) {
            const user = rows._array[0];
            return { ...user, is_admin: Boolean(user.is_admin) };
        }
        return null;
    } catch (error) {
        console.error('Error getting user by username:', error);
        throw error;
    }
};

/**
 * Gets a user by their ID.
 */
export const getUserById = async (db: SQLiteDatabase, userId: number): Promise<User | null> => {
    try {
        const stmt = await db.prepareAsync('SELECT * FROM users WHERE id = ?');
        const result = await stmt.executeAsync([userId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: User[] };
        if (rows._array.length > 0) {
            const user = rows._array[0];
            return { ...user, is_admin: Boolean(user.is_admin) };
        }
        return null;
    } catch (error) {
        console.error('Error getting user by ID:', error);
        throw error;
    }
};

/**
 * Gets all users in the system.
 */
export const getAllUsers = async (db: SQLiteDatabase): Promise<User[]> => {
    try {
        const stmt = await db.prepareAsync('SELECT * FROM users');
        const result = await stmt.executeAsync();
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: User[] };
        return rows._array.map(user => ({ ...user, is_admin: Boolean(user.is_admin) }));
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
};

/**
 * Updates user information.
 */
export const updateUser = async (
    db: SQLiteDatabase, 
    userId: number, 
    username: string, 
    passwordHash: string, 
    isAdmin: boolean
): Promise<number> => {
    try {
        const stmt = await db.prepareAsync(
            'UPDATE users SET username = ?, password_hash = ?, is_admin = ? WHERE id = ?'
        );
        const result = await stmt.executeAsync([username, passwordHash, isAdmin ? 1 : 0, userId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { rowsAffected: number };
        return rows.rowsAffected;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

/**
 * Deletes a user by their ID.
 */
export const deleteUser = async (db: SQLiteDatabase, userId: number): Promise<number> => {
    try {
        const stmt = await db.prepareAsync('DELETE FROM users WHERE id = ?');
        const result = await stmt.executeAsync([userId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { rowsAffected: number };
        return rows.rowsAffected;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

/**
 * Gets all permissions for a specific user.
 */
export const getUserPermissions = async (db: SQLiteDatabase, userId: number): Promise<string[]> => {
    try {
        const stmt = await db.prepareAsync(
            `SELECT p.name FROM user_permissions up
             JOIN permissions p ON up.permission_id = p.id
             WHERE up.user_id = ?`
        );
        const result = await stmt.executeAsync([userId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: { name: string }[] };
        return rows._array.map(row => row.name);
    } catch (error) {
        console.error('Error getting user permissions:', error);
        throw error;
    }
};

/**
 * Creates a new admin user with all permissions.
 */
export const seedAdminUser = async (db: SQLiteDatabase, username: string, password: string): Promise<User | null> => {
    try {
        // Start by creating the user
        const userId = await addUser(db, username, password, true);
        
        // Get all available permissions
        const stmt = await db.prepareAsync('SELECT id FROM permissions');
        const result = await stmt.executeAsync();
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: { id: number }[] };
        
        // Assign each permission to the user
        for (const { id: permId } of rows._array) {
            const permStmt = await db.prepareAsync(
                'INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)'
            );
            await permStmt.executeAsync([userId, permId]);
            await permStmt.finalizeAsync();
        }
        
        console.log(`Usuario administrador '${username}' creado con todos los permisos.`);
        return await getUserById(db, userId);
    } catch (error) {
        console.error('Error creating admin user:', error);
        throw error;
    }
};

// Permission Management Functions

/**
 * Gets all available permissions in the system.
 */
export const getAllPermissions = async (db: SQLiteDatabase): Promise<Permission[]> => {
    try {
        const stmt = await db.prepareAsync('SELECT * FROM permissions');
        const result = await stmt.executeAsync();
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: Permission[] };
        return rows._array;
    } catch (error) {
        console.error('Error getting all permissions:', error);
        throw error;
    }
};

/**
 * Creates a new permission in the system.
 */
export const addPermission = async (db: SQLiteDatabase, permissionName: string): Promise<number> => {
    try {
        const stmt = await db.prepareAsync('INSERT INTO permissions (name) VALUES (?)');
        await stmt.executeAsync([permissionName]);
        await stmt.finalizeAsync();
        
        // Get the inserted ID
        const idStmt = await db.prepareAsync('SELECT last_insert_rowid() as id');
        const idResult = await idStmt.executeAsync();
        await idStmt.finalizeAsync();
        
        const rows = idResult as unknown as { _array: { id: number }[] };
        return rows._array[0].id;
    } catch (error) {
        console.error('Error adding permission:', error);
        throw error;
    }
};

/**
 * Assigns a permission to a user.
 */
export const assignPermissionToUser = async (
    db: SQLiteDatabase,
    userId: number,
    permissionId: number
): Promise<number> => {
    try {
        const stmt = await db.prepareAsync(
            'INSERT OR IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)'
        );
        const result = await stmt.executeAsync([userId, permissionId]);
        await stmt.finalizeAsync();
        
        // Get the inserted ID
        const idStmt = await db.prepareAsync('SELECT last_insert_rowid() as id');
        const idResult = await idStmt.executeAsync();
        await idStmt.finalizeAsync();
        
        const rows = idResult as unknown as { _array: { id: number }[] };
        return rows._array[0].id;
    } catch (error) {
        console.error('Error assigning permission to user:', error);
        throw error;
    }
};

/**
 * Revokes a permission from a user.
 */
export const revokePermissionFromUser = async (
    db: SQLiteDatabase,
    userId: number,
    permissionId: number
): Promise<number> => {
    try {
        const stmt = await db.prepareAsync(
            'DELETE FROM user_permissions WHERE user_id = ? AND permission_id = ?'
        );
        const result = await stmt.executeAsync([userId, permissionId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { rowsAffected: number };
        return rows.rowsAffected;
    } catch (error) {
        console.error('Error revoking permission from user:', error);
        throw error;
    }
};

// Product Management Functions

/**
 * Adds a new product to the system.
 */
export const addProduct = async (db: SQLiteDatabase, name: string, price: number, cost: number): Promise<number> => {
    try {
        const stmt = await db.prepareAsync(
            'INSERT INTO products (name, price, cost) VALUES (?, ?, ?)'
        );
        await stmt.executeAsync([name, price, cost]);
        await stmt.finalizeAsync();
        
        // Get the inserted ID
        const idStmt = await db.prepareAsync('SELECT last_insert_rowid() as id');
        const idResult = await idStmt.executeAsync();
        await idStmt.finalizeAsync();
        
        const rows = idResult as unknown as { _array: { id: number }[] };
        return rows._array[0].id;
    } catch (error) {
        console.error('Error adding product:', error);
        throw error;
    }
};

/**
 * Gets all products in the system.
 */
export const getAllProducts = async (db: SQLiteDatabase): Promise<Product[]> => {
    try {
        const stmt = await db.prepareAsync('SELECT * FROM products ORDER BY name ASC');
        const result = await stmt.executeAsync();
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: Product[] };
        return rows._array;
    } catch (error) {
        console.error('Error getting all products:', error);
        throw error;
    }
};

/**
 * Updates product information.
 */
export const updateProduct = async (
    db: SQLiteDatabase,
    productId: number,
    name: string,
    price: number,
    cost: number
): Promise<number> => {
    try {
        const stmt = await db.prepareAsync(
            'UPDATE products SET name = ?, price = ?, cost = ? WHERE id = ?'
        );
        const result = await stmt.executeAsync([name, price, cost, productId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { rowsAffected: number };
        return rows.rowsAffected;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

/**
 * Deletes a product by its ID.
 */
export const deleteProduct = async (db: SQLiteDatabase, productId: number): Promise<number> => {
    try {
        const stmt = await db.prepareAsync('DELETE FROM products WHERE id = ?');
        const result = await stmt.executeAsync([productId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { rowsAffected: number };
        return rows.rowsAffected;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

// Sales Management Functions

/**
 * Creates a new sale in the system.
 */
export const addSale = async (
    db: SQLiteDatabase,
    total: number,
    payment: number,
    change: number,
    businessName: string,
    userId: number
): Promise<number> => {
    try {
        const saleDate = new Date().toISOString().slice(0, 10);
        const saleTime = new Date().toLocaleTimeString('es-MX', { hour12: false });
        
        const stmt = await db.prepareAsync(
            `INSERT INTO sales (
                sale_date, sale_time, total_amount, payment_received,
                change_given, business_name, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        await stmt.executeAsync([
            saleDate, saleTime, total, payment, change, businessName, userId
        ]);
        await stmt.finalizeAsync();
        
        // Get the inserted ID
        const idStmt = await db.prepareAsync('SELECT last_insert_rowid() as id');
        const idResult = await idStmt.executeAsync();
        await idStmt.finalizeAsync();
        
        const rows = idResult as unknown as { _array: { id: number }[] };
        return rows._array[0].id;
    } catch (error) {
        console.error('Error adding sale:', error);
        throw error;
    }
};

/**
 * Adds items to a sale record.
 */
export const addSaleItems = async (
    db: SQLiteDatabase,
    saleId: number,
    items: Pick<SaleItem, 'product_id' | 'product_name' | 'quantity' | 'price_at_sale'>[]
): Promise<void> => {
    try {
        const stmt = await db.prepareAsync(
            `INSERT INTO sale_items (
                sale_id, product_id, product_name, quantity, price_at_sale
            ) VALUES (?, ?, ?, ?, ?)`
        );
        
        for (const item of items) {
            await stmt.executeAsync([
                saleId,
                item.product_id,
                item.product_name,
                item.quantity,
                item.price_at_sale
            ]);
        }
        
        await stmt.finalizeAsync();
    } catch (error) {
        console.error('Error adding sale items:', error);
        throw error;
    }
};

/**
 * Gets all sales in the system.
 */
export const getAllSales = async (db: SQLiteDatabase): Promise<Sale[]> => {
    try {
        const stmt = await db.prepareAsync(
            'SELECT * FROM sales ORDER BY sale_date DESC, sale_time DESC'
        );
        const result = await stmt.executeAsync();
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: Sale[] };
        return rows._array;
    } catch (error) {
        console.error('Error getting all sales:', error);
        throw error;
    }
};

/**
 * Gets items from a specific sale.
 */
export const getSaleItems = async (db: SQLiteDatabase, saleId: number): Promise<SaleItem[]> => {
    try {
        const stmt = await db.prepareAsync('SELECT * FROM sale_items WHERE sale_id = ?');
        const result = await stmt.executeAsync([saleId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: SaleItem[] };
        return rows._array;
    } catch (error) {
        console.error('Error getting sale items:', error);
        throw error;
    }
};

/**
 * Gets details of a specific sale.
 */
export const getSaleById = async (db: SQLiteDatabase, saleId: number): Promise<Sale | null> => {
    try {
        const stmt = await db.prepareAsync('SELECT * FROM sales WHERE id = ?');
        const result = await stmt.executeAsync([saleId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: Sale[] };
        return rows._array.length > 0 ? rows._array[0] : null;
    } catch (error) {
        console.error('Error getting sale by ID:', error);
        throw error;
    }
};

/**
 * Deletes a sale and its items.
 */
export const deleteSale = async (db: SQLiteDatabase, saleId: number): Promise<number> => {
    try {
        // The sale_items will be deleted automatically due to ON DELETE CASCADE
        const stmt = await db.prepareAsync('DELETE FROM sales WHERE id = ?');
        const result = await stmt.executeAsync([saleId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { rowsAffected: number };
        return rows.rowsAffected;
    } catch (error) {
        console.error('Error deleting sale:', error);
        throw error;
    }
};

// Expense Management Functions

/**
 * Records a new expense in the system.
 */
export const addExpense = async (
    db: SQLiteDatabase,
    description: string,
    amount: number
): Promise<number> => {
    try {
        const expenseDate = new Date().toISOString().slice(0, 10);
        const expenseTime = new Date().toLocaleTimeString('es-MX', { hour12: false });
        
        const stmt = await db.prepareAsync(
            `INSERT INTO expenses (
                expense_date, expense_time, description, amount
            ) VALUES (?, ?, ?, ?)`
        );
        await stmt.executeAsync([expenseDate, expenseTime, description, amount]);
        await stmt.finalizeAsync();
        
        // Get the inserted ID
        const idStmt = await db.prepareAsync('SELECT last_insert_rowid() as id');
        const idResult = await idStmt.executeAsync();
        await idStmt.finalizeAsync();
        
        const rows = idResult as unknown as { _array: { id: number }[] };
        return rows._array[0].id;
    } catch (error) {
        console.error('Error adding expense:', error);
        throw error;
    }
};

/**
 * Gets all expenses in the system.
 */
export const getAllExpenses = async (db: SQLiteDatabase): Promise<Expense[]> => {
    try {
        const stmt = await db.prepareAsync(
            'SELECT * FROM expenses ORDER BY expense_date DESC, expense_time DESC'
        );
        const result = await stmt.executeAsync();
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: Expense[] };
        return rows._array;
    } catch (error) {
        console.error('Error getting all expenses:', error);
        throw error;
    }
};

/**
 * Gets a specific expense by its ID.
 */
export const getExpenseById = async (db: SQLiteDatabase, expenseId: number): Promise<Expense | null> => {
    try {
        const stmt = await db.prepareAsync('SELECT * FROM expenses WHERE id = ?');
        const result = await stmt.executeAsync([expenseId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: Expense[] };
        return rows._array.length > 0 ? rows._array[0] : null;
    } catch (error) {
        console.error('Error getting expense by ID:', error);
        throw error;
    }
};

/**
 * Updates an existing expense.
 */
export const updateExpense = async (
    db: SQLiteDatabase,
    expenseId: number,
    description: string,
    amount: number
): Promise<number> => {
    try {
        const stmt = await db.prepareAsync(
            'UPDATE expenses SET description = ?, amount = ? WHERE id = ?'
        );
        const result = await stmt.executeAsync([description, amount, expenseId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { rowsAffected: number };
        return rows.rowsAffected;
    } catch (error) {
        console.error('Error updating expense:', error);
        throw error;
    }
};

/**
 * Deletes an expense by its ID.
 */
export const deleteExpense = async (db: SQLiteDatabase, expenseId: number): Promise<number> => {
    try {
        const stmt = await db.prepareAsync('DELETE FROM expenses WHERE id = ?');
        const result = await stmt.executeAsync([expenseId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { rowsAffected: number };
        return rows.rowsAffected;
    } catch (error) {
        console.error('Error deleting expense:', error);
        throw error;
    }
};

// Costing Management Functions

/**
 * Creates a new costing record.
 */
export const addCosting = async (
    db: SQLiteDatabase,
    name: string,
    totalCost: number
): Promise<number> => {
    try {
        const costingDate = new Date().toISOString().slice(0, 10);
        
        const stmt = await db.prepareAsync(
            'INSERT INTO costings (name, total_cost, costing_date) VALUES (?, ?, ?)'
        );
        await stmt.executeAsync([name, totalCost, costingDate]);
        await stmt.finalizeAsync();
        
        // Get the inserted ID
        const idStmt = await db.prepareAsync('SELECT last_insert_rowid() as id');
        const idResult = await idStmt.executeAsync();
        await idStmt.finalizeAsync();
        
        const rows = idResult as unknown as { _array: { id: number }[] };
        return rows._array[0].id;
    } catch (error) {
        console.error('Error adding costing:', error);
        throw error;
    }
};

/**
 * Adds items to a costing record.
 */
export const addCostingItems = async (
    db: SQLiteDatabase,
    costingId: number,
    items: Omit<CostingItem, 'id' | 'costing_id'>[]
): Promise<void> => {
    try {
        const stmt = await db.prepareAsync(
            `INSERT INTO costing_items (
                costing_id, item_name, unit_of_measure, unit_price, quantity_used
            ) VALUES (?, ?, ?, ?, ?)`
        );
        
        for (const item of items) {
            await stmt.executeAsync([
                costingId,
                item.item_name,
                item.unit_of_measure,
                item.unit_price,
                item.quantity_used
            ]);
        }
        
        await stmt.finalizeAsync();
    } catch (error) {
        console.error('Error adding costing items:', error);
        throw error;
    }
};

/**
 * Gets all costing records in the system.
 */
export const getAllCostings = async (db: SQLiteDatabase): Promise<Costing[]> => {
    try {
        const stmt = await db.prepareAsync(
            'SELECT * FROM costings ORDER BY costing_date DESC'
        );
        const result = await stmt.executeAsync();
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: Costing[] };
        return rows._array;
    } catch (error) {
        console.error('Error getting all costings:', error);
        throw error;
    }
};

/**
 * Gets items from a specific costing record.
 */
export const getCostingItems = async (
    db: SQLiteDatabase,
    costingId: number
): Promise<CostingItem[]> => {
    try {
        const stmt = await db.prepareAsync(
            'SELECT * FROM costing_items WHERE costing_id = ?'
        );
        const result = await stmt.executeAsync([costingId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: CostingItem[] };
        return rows._array;
    } catch (error) {
        console.error('Error getting costing items:', error);
        throw error;
    }
};

/**
 * Gets a specific costing record by its ID.
 */
export const getCostingById = async (
    db: SQLiteDatabase,
    costingId: number
): Promise<Costing | null> => {
    try {
        const stmt = await db.prepareAsync('SELECT * FROM costings WHERE id = ?');
        const result = await stmt.executeAsync([costingId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { _array: Costing[] };
        return rows._array.length > 0 ? rows._array[0] : null;
    } catch (error) {
        console.error('Error getting costing by ID:', error);
        throw error;
    }
};

/**
 * Deletes a costing record and its items.
 */
export const deleteCosting = async (db: SQLiteDatabase, costingId: number): Promise<number> => {
    try {
        // The costing_items will be deleted automatically due to ON DELETE CASCADE
        const stmt = await db.prepareAsync('DELETE FROM costings WHERE id = ?');
        const result = await stmt.executeAsync([costingId]);
        await stmt.finalizeAsync();
        
        const rows = result as unknown as { rowsAffected: number };
        return rows.rowsAffected;
    } catch (error) {
        console.error('Error deleting costing:', error);
        throw error;
    }
};
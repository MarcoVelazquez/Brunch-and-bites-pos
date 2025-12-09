import { openDB } from './database.refactor';

// Type alias for SQLiteDatabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SQLiteDatabase = any;

export interface InventoryItem {
  id: number;
  name: string;
  sku: string | null;
  unit: string | null;
  stock: number;
  min_stock: number;
  created_at: string;
}

export interface InventoryMovement {
  id: number;
  item_id: number;
  delta: number; // positive for add, negative for remove
  reason: string | null;
  created_at: string; // ISO timestamp
}

export const ensureInventoryTables = async (db?: SQLiteDatabase): Promise<void> => {
  const _db = db ?? await openDB();
  await _db.withTransactionAsync(async () => {
    await _db.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        unit TEXT,
        stock REAL NOT NULL DEFAULT 0,
        min_stock REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        delta REAL NOT NULL,
        reason TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      );
    `);
  });
};

export const getAllInventoryItems = async (db?: SQLiteDatabase): Promise<InventoryItem[]> => {
  const _db = db ?? await openDB();
  await ensureInventoryTables(_db);
  const rows = await _db.getAllAsync(`SELECT * FROM inventory_items ORDER BY name ASC`);
  return rows as InventoryItem[];
};

export const addInventoryItem = async (
  db: SQLiteDatabase | undefined,
  name: string,
  options?: { sku?: string; unit?: string; min_stock?: number; initial_stock?: number }
): Promise<number> => {
  const _db = db ?? await openDB();
  await ensureInventoryTables(_db);
  const sku = options?.sku ?? null;
  const unit = options?.unit ?? null;
  const minStock = options?.min_stock ?? 0;
  const initial = options?.initial_stock ?? 0;
  const res = await _db.runAsync(
    `INSERT INTO inventory_items (name, sku, unit, stock, min_stock) VALUES (?, ?, ?, ?, ?)`,
    [name, sku, unit, initial, minStock]
  );
  const itemId = Number(res.lastInsertRowId);
  if (initial !== 0) {
    await _db.runAsync(
      `INSERT INTO inventory_movements (item_id, delta, reason) VALUES (?, ?, ?)`,
      [itemId, initial, 'Carga inicial']
    );
  }
  return itemId;
};

export const adjustInventory = async (
  db: SQLiteDatabase | undefined,
  itemId: number,
  delta: number,
  reason?: string
): Promise<void> => {
  const _db = db ?? await openDB();
  await ensureInventoryTables(_db);
  await _db.withTransactionAsync(async () => {
    await _db.runAsync(`UPDATE inventory_items SET stock = stock + ? WHERE id = ?`, [delta, itemId]);
    await _db.runAsync(
      `INSERT INTO inventory_movements (item_id, delta, reason) VALUES (?, ?, ?)`,
      [itemId, delta, reason ?? null]
    );
  });
};

export const getItemMovements = async (
  db: SQLiteDatabase | undefined,
  itemId: number,
  limit = 50
): Promise<InventoryMovement[]> => {
  const _db = db ?? await openDB();
  await ensureInventoryTables(_db);
  const rows = await _db.getAllAsync(
    `SELECT * FROM inventory_movements WHERE item_id = ? ORDER BY created_at DESC LIMIT ?`,
    [itemId, limit]
  );
  return rows as InventoryMovement[];
};

export default {
  ensureInventoryTables,
  getAllInventoryItems,
  addInventoryItem,
  adjustInventory,
  getItemMovements,
};

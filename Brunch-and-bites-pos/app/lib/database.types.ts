export interface SQLiteRow {
    [key: string]: number | string | boolean | null;
}

// Interface for count result from SQLite
export interface CountResult {
    count: number;
}

// Database entity types
export interface User {
    id: number;
    username: string;
    password_hash: string;
    is_admin: boolean;
}

export interface Permission {
    id: number;
    name: string;
}

export interface Product {
    id: number;
    name: string;
    price: number;
    cost: number;
}

export interface Sale {
    id: number;
    sale_date: string;
    sale_time: string;
    total_amount: number;
    payment_received: number;
    change_given: number;
    business_name: string;
    user_id: number;
}

export interface SaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price_at_sale: number;
}

export interface Expense {
    id: number;
    expense_date: string;
    expense_time: string;
    description: string;
    amount: number;
}

export interface Costing {
    id: number;
    name: string;
    total_cost: number;
    costing_date: string;
}

export interface CostingItem {
    id: number;
    costing_id: number;
    item_name: string;
    unit_of_measure: string;
    unit_price: number;
    quantity_used: number;
}
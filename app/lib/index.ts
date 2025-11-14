import { default as AuthContext, useAuth } from '../contexts/AuthContext';
import { default as Table } from '../components/Table';
import { 
    simpleGetAllProducts, 
    simpleGetAllSales, 
    simpleGetAllExpenses, 
    simpleGetAllCostings,
    initializeDatabase 
} from './database.refactor';

// Re-exportar componentes y hooks
export { AuthContext, useAuth };
export { Table };

// Re-exportar funciones de base de datos simplificadas
export { 
    simpleGetAllProducts, 
    simpleGetAllSales, 
    simpleGetAllExpenses, 
    simpleGetAllCostings,
    initializeDatabase 
};

// Exportación por defecto que incluye todo
const exports = {
    AuthContext,
    useAuth,
    Table,
    simpleGetAllProducts, 
    simpleGetAllSales, 
    simpleGetAllExpenses, 
    simpleGetAllCostings,
    initializeDatabase
};

export default exports;
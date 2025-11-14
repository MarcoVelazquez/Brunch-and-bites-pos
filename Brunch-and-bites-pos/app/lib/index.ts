import { default as AuthContext, useAuth } from '../contexts/AuthContext';
import { default as Table } from '../components/Table';

// Re-exportar componentes y hooks
export { AuthContext, useAuth };
export { Table };

// Exportación por defecto que incluye todo
const exports = {
    AuthContext,
    useAuth,
    Table
};

export default exports;
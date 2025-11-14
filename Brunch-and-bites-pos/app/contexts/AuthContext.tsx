import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { 
    openDB, 
    closeDB,
    getUserByUsername, 
    getUserPermissions, 
    createTables, 
    seedAdminUser,
    insertInitialPermissions,
    createUserWithAllPermissions,
    addUser,
    getAllProducts,
    addProduct
} from '../lib/database.refactor';
import { hashPassword, verifyPassword } from '../lib/auth';
import type { User } from '../lib/database.types';
// Type alias for SQLiteDatabase
type SQLiteDatabase = any;

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    permissions: string[];
    db: SQLiteDatabase | null;
    isLoading: boolean;
}

interface AuthContextType extends AuthState {
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    checkPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

function AuthProviderComponent({ children }: AuthProviderProps) {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        permissions: [],
        db: null,
        isLoading: true
    });

    useEffect(() => {
        // Inicializar la base de datos y verificar la sesión al cargar
        const initializeAuth = async () => {
            let db: SQLiteDatabase | null = null;
            try {
                // Abrir la base de datos
                db = await openDB();
                
                // Crear las tablas si no existen
                await createTables(db);
                // Asegurar permisos base
                await insertInitialPermissions(db);

                // Verificar si hay un usuario almacenado
                const storedUsername = await SecureStore.getItemAsync('username');
                const storedPasswordHash = await SecureStore.getItemAsync('passwordHash');

                if (storedUsername && storedPasswordHash) {
                    const user = await getUserByUsername(db, storedUsername);
                    if (user && user.password_hash === storedPasswordHash) {
                        const permissions = await getUserPermissions(db, user.id);
                        setState({
                            isAuthenticated: true,
                            user,
                            permissions,
                            db,
                            isLoading: false
                        });
                        return;
                    }
                }

                // Si no hay sesión válida, limpiar el storage
                await SecureStore.deleteItemAsync('username');
                await SecureStore.deleteItemAsync('passwordHash');

                // Si no hay sesión válida, verificar si existe un usuario administrador
                const adminUser = await getUserByUsername(db, 'admin');
                if (!adminUser) {
                    const hashedPassword = hashPassword('Admin123');
                    await seedAdminUser(db, 'admin', hashedPassword);
                }

                // Asegurar usuario Gina con todos los permisos
                const ginaUser = await getUserByUsername(db, 'Gina');
                if (!ginaUser) {
                    const ginaHash = hashPassword('Marco123');
                    await createUserWithAllPermissions(db, 'Gina', ginaHash);
                }
                
                // Crear usuario de prueba simple también
                const testUser = await getUserByUsername(db, 'test');
                if (!testUser) {
                    const testId = await addUser(db, 'test', hashPassword('123'), false);
                }

                // Agregar productos de ejemplo si no existen
                const existingProducts = await getAllProducts(db);
                if (existingProducts.length === 0) {
                    await addProduct(db, 'Traquea', 50, 30);
                    await addProduct(db, 'Pata de conejo', 30, 20);
                    await addProduct(db, 'Sandwich de pollo', 25, 15);
                    await addProduct(db, 'Hamburguesa clásica', 35, 25);
                    await addProduct(db, 'Café americano', 15, 8);
                    await addProduct(db, 'Jugo de naranja', 20, 12);
                }

                setState(prev => ({ ...prev, db, isLoading: false }));
            } catch (error) {
                console.error('Error initializing auth:', error);
                const errorMsg = error instanceof Error ? error.message : String(error);
                
                // Si es un error de base de datos corrupta, intentar recrearla
                if (errorMsg.includes('NullPointerException') || errorMsg.includes('rejected')) {
                    console.warn('🔧 Database corrupted detected, attempting recovery...');
                    try {
                        const { deleteDatabaseAsync } = await import('expo-sqlite');
                        // Ensure current handle is closed before deleting
                        try { await closeDB(); } catch {}
                        await deleteDatabaseAsync('pos_system.db');
                        console.log('✅ Corrupted database deleted');
                        
                        // Reintentar inicialización
                        db = await openDB();
                        await createTables(db);
                        await insertInitialPermissions(db);
                        
                        const hashedPassword = hashPassword('Admin123');
                        await seedAdminUser(db, 'admin', hashedPassword);
                        
                        console.log('✅ Database recreated successfully');
                        setState(prev => ({ ...prev, db, isLoading: false }));
                        return;
                    } catch (recoveryError) {
                        console.error('❌ Failed to recover database:', recoveryError);
                    }
                }
                
                setState(prev => ({ ...prev, db, isLoading: false }));
            }
        };

        initializeAuth();
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        if (!state.db) {
            console.error('Database not initialized');
            return false;
        }

        try {
            const user = await getUserByUsername(state.db, username);
            
            if (!user) {
                return false;
            }

            if (!verifyPassword(password, user.password_hash)) {
                return false;
            }

            const permissions = await getUserPermissions(state.db, user.id);
            
            // Guardar credenciales de forma segura
            try {
                await Promise.all([
                    SecureStore.setItemAsync('username', username),
                    SecureStore.setItemAsync('passwordHash', user.password_hash)
                ]);
            } catch (error) {
                console.error('Error saving credentials:', error);
                // Continuar con el login aunque falle el almacenamiento
            }

            setState({
                isAuthenticated: true,
                user,
                permissions,
                db: state.db,
                isLoading: false
            });

            return true;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            // Eliminar credenciales almacenadas en paralelo
            await Promise.all([
                SecureStore.deleteItemAsync('username'),
                SecureStore.deleteItemAsync('passwordHash')
            ]);
        } catch (error) {
            console.error('Error removing stored credentials:', error);
            // Continuar con el logout aunque falle la limpieza
        } finally {
            // Siempre limpiar el estado, incluso si falla la limpieza del storage
            setState({
                isAuthenticated: false,
                user: null,
                permissions: [],
                db: state.db,
                isLoading: false
            });
        }
    };

    const checkPermission = (permission: string): boolean => {
        if (!state.isAuthenticated || !state.user) {
            return false;
        }
        
        // Los administradores tienen todos los permisos
        if (state.user.is_admin) {
            return true;
        }

        return state.permissions.includes(permission);
    };

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                checkPermission
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export { AuthProviderComponent as AuthProvider };
export default AuthProviderComponent;
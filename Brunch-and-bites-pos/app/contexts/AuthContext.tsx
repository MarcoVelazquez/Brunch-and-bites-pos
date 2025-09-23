import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { openDB, getUserByUsername, getUserPermissions } from '../lib/database.refactor';
import type { User } from '../lib/database.types';
import type { SQLiteDatabase } from 'expo-sqlite';

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
            try {
                const db = await openDB();
                const storedUsername = await SecureStore.getItemAsync('username');
                const storedPassword = await SecureStore.getItemAsync('password');

                if (storedUsername && storedPassword) {
                    const user = await getUserByUsername(db, storedUsername);
                    if (user && user.password_hash === storedPassword) {
                        const permissions = await getUserPermissions(db, user.id);
                        setState({
                            isAuthenticated: true,
                            user,
                            permissions,
                            db,
                            isLoading: false
                        });
                    }
                } else {
                    setState(prev => ({ ...prev, db }));
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            }
        };

        initializeAuth();
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        if (!state.db) return false;

        try {
            const user = await getUserByUsername(state.db, username);
            
            if (user && user.password_hash === password) {
                const permissions = await getUserPermissions(state.db, user.id);
                
                // Guardar credenciales de forma segura
                await SecureStore.setItemAsync('username', username);
                await SecureStore.setItemAsync('password', password);

                setState({
                    isAuthenticated: true,
                    user,
                    permissions,
                    db: state.db,
                    isLoading: false
                });

                return true;
            }

            return false;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            // Eliminar credenciales almacenadas
            await SecureStore.deleteItemAsync('username');
            await SecureStore.deleteItemAsync('password');

            setState({
                isAuthenticated: false,
                user: null,
                permissions: [],
                db: state.db,
                isLoading: false
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const checkPermission = (permission: string): boolean => {
        return state.permissions.includes(permission) || (state.user?.is_admin ?? false);
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
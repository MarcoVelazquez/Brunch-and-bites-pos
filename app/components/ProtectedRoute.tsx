import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as Linking from 'expo-linking';
import Loading from './Loading';
import { Alert } from 'react-native';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: string;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
    const { user, isLoading, checkPermission } = useAuth();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (isLoading || isRedirecting) return;

        const handleAuth = async () => {
            try {
                setIsRedirecting(true);

                // Si no hay usuario autenticado, redirigir al login
                if (!user) {
                    const loginUrl = Linking.createURL('/login');
                    await Linking.openURL(loginUrl);
                    return;
                }

                // Si se requiere un permiso específico, verificarlo
                if (requiredPermission && !checkPermission(requiredPermission)) {
                    const cajaUrl = Linking.createURL('/caja');
                    await Linking.openURL(cajaUrl);
                    return;
                }
            } catch (error) {
                console.error('Error en la redirección:', error);
            } finally {
                setIsRedirecting(false);
            }
        };

        handleAuth();
    }, [user, isLoading, requiredPermission]);

    // Durante la carga o redirección, mostrar el componente de carga
    if (isLoading || isRedirecting) {
        return <Loading message="Verificando acceso..." />;
    }

    // Si no hay usuario o no tiene permisos, mostrar mensaje de redirección
    if (!user || (requiredPermission && !checkPermission(requiredPermission))) {
        return <Loading message="Redirigiendo..." />;
    }

    // Si todo está bien, renderizar los componentes hijos
    return <>{children}</>;
}

// Asegurarse de que el componente se exporta correctamente
export type { ProtectedRouteProps };
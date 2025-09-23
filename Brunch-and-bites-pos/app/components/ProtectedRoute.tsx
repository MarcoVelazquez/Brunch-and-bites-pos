import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import Loading from './Loading';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: string;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
    const { user, isLoading, checkPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        // Si no hay usuario autenticado, redirigir al login
        if (!user) {
            router.replace('/login');
            return;
        }

        // Si se requiere un permiso específico, verificarlo
        if (requiredPermission && !checkPermission(requiredPermission)) {
            router.back();
            return;
        }
    }, [user, isLoading, requiredPermission]);

    if (isLoading) {
        return <Loading message="Verificando acceso..." />;
    }

    if (!user) {
        return null; // Se redirigirá en el useEffect
    }

    if (requiredPermission && !checkPermission(requiredPermission)) {
        return null; // Se redirigirá en el useEffect
    }

    return <>{children}</>;
}
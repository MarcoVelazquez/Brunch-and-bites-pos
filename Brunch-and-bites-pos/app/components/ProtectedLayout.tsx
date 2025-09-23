import React from 'react';
import Layout from './Layout';
import ProtectedRoute from './ProtectedRoute';

interface ProtectedLayoutProps {
    children: React.ReactNode;
    title: string;
    requiredPermission?: string;
}

export default function ProtectedLayout({ children, title, requiredPermission }: ProtectedLayoutProps) {
    return (
        <ProtectedRoute requiredPermission={requiredPermission}>
            <Layout title={title}>
                {children}
            </Layout>
        </ProtectedRoute>
    );
}
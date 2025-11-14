import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import Button from './Button';
import Text from './Text';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
    title: string;
    sidebar?: React.ReactNode;
}

export default function Layout({ children, title, sidebar }: LayoutProps) {
    const { width } = useWindowDimensions();
    const isSmall = width < 700; // tablet/phone threshold
    const { logout, user, checkPermission } = useAuth();
    const handleNavigation = (route: string) => {
        const url = Linking.createURL(route);
        Linking.openURL(url);
    };

    const handleSwitchUser = async () => {
        Alert.alert(
            '¿Cambiar de usuario?',
            '¿Estás seguro de que deseas cerrar sesión y cambiar de usuario?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Sí, cambiar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } finally {
                            const url = Linking.createURL('/login');
                            Linking.openURL(url);
                        }
                    }
                }
            ]
        );
    };

    const defaultMenuItems = [
        { title: 'Caja', route: '/caja', permission: 'OPERAR_CAJA' },
        { title: 'Productos', route: '/productos', permission: 'GESTIONAR_PRODUCTOS' },
        { title: 'Recibos', route: '/recibos', permission: 'VER_VENTAS' },
        { title: 'Gastos', route: '/gastos', permission: 'GESTIONAR_GASTOS' },
        { title: 'Costeos', route: '/costeos', permission: 'GESTIONAR_COSTEOS' },
        { title: 'Reportes', route: '/reportes', permission: 'VER_REPORTES' },
        { title: 'Usuarios', route: '/usuarios', permission: 'GESTIONAR_USUARIOS' },
    ];

    const sidebarWidth = isSmall ? Math.max(140, Math.round(width * 0.28)) : 220;
    const menuButtonWidth = isSmall ? Math.max(72, Math.round(sidebarWidth * 0.4)) : 90;
    const menuButtonHeight = isSmall ? 48 : 60;

    return (
        <SafeAreaView style={styles.root}>
            {/* Sidebar */}
            <View style={[styles.sidebar, { width: sidebarWidth }] }>
                {sidebar || (
                    <>
                        <Image
                            source={require("../../assets/images/logo.jpeg")}
                            style={[styles.logo, isSmall && { width: 100, height: 100 }]}
                        />
                        <View style={styles.menuGrid}>
                            {defaultMenuItems.map((item, index) => {
                                const hasPermission = checkPermission(item.permission);
                                return (
                                    <Button
                                        key={index}
                                        title={item.title}
                                        variant="secondary"
                                        style={[styles.menuButton, { width: menuButtonWidth, height: menuButtonHeight }]}
                                        onPress={() => handleNavigation(item.route)}
                                        disabled={!hasPermission}
                                    />
                                );
                            })}
                        </View>
                        {/* Cambiar usuario / Cerrar sesión */}
                        <View style={{ marginTop: 16 }}>
                            <Button
                                title={user ? `Cambiar usuario` : 'Iniciar sesión'}
                                variant={user ? 'danger' : 'primary'}
                                onPress={handleSwitchUser}
                                style={{ width: menuButtonWidth, height: menuButtonHeight }}
                            />
                        </View>
                    </>
                )}
            </View>

            {/* Main Content */}
            <View style={styles.main}>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="h1" style={styles.headerTitle}>{title}</Text>
                </View>
                
                {/* Content Area */}
                <View style={styles.content}>
                    {children}
                </View>
            </View>
        </SafeAreaView>
    );
}

export const styles = StyleSheet.create({
    root: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#e6f0fa",
        borderRadius: 20,
        margin: 10,
        overflow: "hidden",
    },
    sidebar: {
        backgroundColor: "#a3d6b1",
        alignItems: "center",
        paddingTop: 20,
        paddingBottom: 20,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 20,
        borderRadius: 70,
        backgroundColor: "#fff",
        resizeMode: "cover",
        borderWidth: 3,
        borderColor: "#333",
    },
    menuGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
    },
    menuButton: {},
    main: {
        flex: 1,
        backgroundColor: "#fff",
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        overflow: "hidden",
    },
    header: {
        backgroundColor: "#a3d6b1",
        padding: 10,
        alignItems: "center",
        borderTopRightRadius: 20,
    },
    headerTitle: {
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 16,
    },
});
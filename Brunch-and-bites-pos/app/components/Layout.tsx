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
    const { width, height } = useWindowDimensions();
    const isSmall = width < 700; // tablet/phone threshold
    const isVerticalMobile = width < 500 && height > width; // Modo vertical en móvil

    // Sidebar width y botón - más compacto en modo vertical
    const sidebarWidth = isVerticalMobile 
        ? Math.max(100, Math.round(width * 0.22)) 
        : isSmall 
            ? Math.max(140, Math.round(width * 0.28)) 
            : 220;
    const menuButtonWidth = isVerticalMobile 
        ? Math.max(60, Math.round(sidebarWidth * 0.5)) 
        : isSmall 
            ? Math.max(72, Math.round(sidebarWidth * 0.4)) 
            : 90;
    const menuButtonHeight = isVerticalMobile ? 42 : isSmall ? 48 : 60;

    // Tamaño fijo de fuente para los botones del menú lateral
    const menuButtonFontSize = isVerticalMobile ? 10 : 12;
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
        { title: 'Caja', icon: '💰', route: '/caja', permission: 'OPERAR_CAJA', description: 'Ventas y cobros' },
        { title: 'Productos', icon: '📦', route: '/productos', permission: 'GESTIONAR_PRODUCTOS', description: 'Inventario' },
        { title: 'Recibos', icon: '🧾', route: '/recibos', permission: 'VER_VENTAS', description: 'Historial' },
        { title: 'Gastos', icon: '💳', route: '/gastos', permission: 'GESTIONAR_GASTOS', description: 'Egresos' },
        { title: 'Costeos', icon: '📋', route: '/costeos', permission: 'GESTIONAR_COSTEOS', description: 'Costos' },
        { title: 'Reportes', icon: '📊', route: '/reportes', permission: 'VER_REPORTES', description: 'Estadísticas' },
        { title: 'Usuarios', icon: '👥', route: '/usuarios', permission: 'GESTIONAR_USUARIOS', description: 'Gestión' },
    ];



    return (
        <SafeAreaView style={styles.root}>
            {/* Sidebar */}
            <View style={[styles.sidebar, { width: sidebarWidth }] }>
                {sidebar || (
                    <>
                        <Image
                            source={require("../../assets/images/logo.jpeg")}
                            style={[
                                styles.logo, 
                                isVerticalMobile && { width: 70, height: 70, marginBottom: 8 },
                                isSmall && !isVerticalMobile && { width: 100, height: 100 }
                            ]}
                        />
                        {/* Información del usuario */}
                        {user && (
                            <View style={[styles.userInfo, isVerticalMobile && { marginBottom: 8 }]}>
                                <Text 
                                    variant="body-bold" 
                                    style={[
                                        styles.userName, 
                                        isVerticalMobile ? { fontSize: 11 } : {}
                                    ]}
                                >
                                    👤 {user.username}
                                </Text>
                                {user.is_admin && (
                                    <View style={styles.adminBadge}>
                                        <Text 
                                            variant="small" 
                                            style={[
                                                styles.adminText, 
                                                isVerticalMobile ? { fontSize: 8 } : {}
                                            ]}
                                        >
                                            👑 Admin
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                        <View style={[styles.menuGrid, isVerticalMobile && { gap: 4, paddingHorizontal: 4 }]}>
                            {defaultMenuItems.map((item, index) => {
                                const hasPermission = checkPermission(item.permission);
                                return (
                                    <View key={index} style={styles.menuItemContainer}>
                                        <Button
                                            title={`${item.icon} ${item.title}`}
                                            variant="secondary"
                                            style={[
                                                styles.menuButton,
                                                { width: menuButtonWidth, height: menuButtonHeight },
                                                !hasPermission && styles.disabledButton
                                            ]}
                                            textStyle={[
                                                styles.menuButtonText,
                                                { fontSize: menuButtonFontSize, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false }
                                            ]}
                                            onPress={() => handleNavigation(item.route)}
                                            disabled={!hasPermission}
                                        />
                                        {!hasPermission && (
                                            <Text variant="small" style={styles.noAccessText}>🔒 Sin acceso</Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                        <View style={styles.bottomButton}>
                            <Button
                                title={user ? `🚪 Cambiar usuario` : '🔑 Iniciar sesión'}
                                variant={user ? 'danger' : 'primary'}
                                onPress={handleSwitchUser}
                                style={{ 
                                    width: menuButtonWidth * 2 + 8, 
                                    height: menuButtonHeight,
                                    paddingHorizontal: isVerticalMobile ? 4 : 20 
                                }}
                                textStyle={{ fontSize: menuButtonFontSize }}
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
        marginBottom: 15,
        borderRadius: 8,
        backgroundColor: "#fff",
        resizeMode: "contain",
    },
    userInfo: {
        alignItems: "center",
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    userName: {
        color: "#2d5016",
        fontSize: 16,
        marginBottom: 4,
        textAlign: "center",
    },
    adminBadge: {
        backgroundColor: "#2d5016",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    adminText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    menuGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 8,
    },
    menuItemContainer: {
        alignItems: "center",
        marginBottom: 4,
    },
    menuButton: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    menuButtonText: {
        fontSize: 12,
        textAlign: "center",
    },
    disabledButton: {
        opacity: 0.4,
    },
    noAccessText: {
        color: "#d32f2f",
        fontSize: 9,
        marginTop: 2,
        fontWeight: "600",
    },
    bottomButton: {
        marginTop: 16,
        paddingHorizontal: 8,
        width: '100%',
        alignItems: 'center',
    },
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
        padding: 0,
    },
});
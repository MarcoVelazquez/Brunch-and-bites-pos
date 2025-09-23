import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Button from './Button';
import AppText from './Text';

interface LayoutProps {
    children: React.ReactNode;
    title: string;
    sidebar?: React.ReactNode;
}

export default function Layout({ children, title, sidebar }: LayoutProps) {
    const router = useRouter();

    const defaultMenuItems = [
        { title: 'Caja', route: '/caja' },
        { title: 'Productos', route: '/productos' },
        { title: 'Recibos', route: '/recibos' },
        { title: 'Gastos', route: '/gastos' },
        { title: 'Costeos', route: '/costeos' },
        { title: 'Reportes', route: '/reportes' },
        { title: 'Usuarios', route: '/usuarios' },
    ];

    return (
        <View style={styles.root}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
                {sidebar || (
                    <>
                        <Image
                            source={require("../../assets/images/icon.png")}
                            style={styles.logo}
                        />
                        <View style={styles.menuGrid}>
                            {defaultMenuItems.map((item, index) => (
                                <Button
                                    key={index}
                                    title={item.title}
                                    variant="secondary"
                                    style={styles.menuButton}
                                    onPress={() => router.push(item.route as any)}
                                />
                            ))}
                        </View>
                    </>
                )}
            </View>

            {/* Main Content */}
            <View style={styles.main}>
                {/* Header */}
                <View style={styles.header}>
                    <AppText variant="h1" style={styles.headerTitle}>{title}</AppText>
                </View>
                
                {/* Content Area */}
                <View style={styles.content}>
                    {children}
                </View>
            </View>
        </View>
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
        width: 220,
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
        borderRadius: 8,
        backgroundColor: "#fff",
        resizeMode: "contain",
    },
    menuGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
    },
    menuButton: {
        width: 90,
        height: 60,
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
        padding: 16,
    },
});
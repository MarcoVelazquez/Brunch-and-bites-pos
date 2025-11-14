import React from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import type { Permission, User } from '../lib/database.types';
import AppText from './Text';
import Button from './Button';
import Card from './Card';

interface PermissionGridProps {
    user: User;
    permissions: Permission[];
    userPermissions: string[];
    isLoading?: boolean;
    onTogglePermission: (permission: Permission) => void;
}

export default function PermissionGrid({ 
    user, 
    permissions, 
    userPermissions, 
    isLoading,
    onTogglePermission 
}: PermissionGridProps) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    
    return (
        <Card style={isMobile ? styles.containerMobile : styles.container}>
            <AppText variant="h2" style={isMobile ? { fontSize: 20 } : undefined}>
                Permisos de {user.username}
            </AppText>
            <ScrollView style={styles.scroll}>
                <View style={styles.grid}>
                    {permissions.map(permission => (
                        <Button
                            key={permission.id}
                            title={permission.name}
                            variant={userPermissions.includes(permission.name) ? "primary" : "secondary"}
                            style={isMobile ? styles.permissionItemMobile : styles.permissionItem}
                            textStyle={isMobile ? { fontSize: 12 } : undefined}
                            onPress={() => !isLoading && onTogglePermission(permission)}
                        />
                    ))}
                </View>
            </ScrollView>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
    },
    containerMobile: {
        flex: 1,
        padding: 10,
    },
    scroll: {
        flex: 1,
        marginTop: 15,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    permissionItem: {
        minWidth: 150,
    },
    permissionItemMobile: {
        minWidth: 100,
    },
});
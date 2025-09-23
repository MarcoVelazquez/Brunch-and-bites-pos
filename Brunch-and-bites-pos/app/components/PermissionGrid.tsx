import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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
    return (
        <Card style={styles.container}>
            <AppText variant="h2">
                Permisos de {user.username}
            </AppText>
            <ScrollView style={styles.scroll}>
                <View style={styles.grid}>
                    {permissions.map(permission => (
                        <Button
                            key={permission.id}
                            title={permission.name}
                            variant={userPermissions.includes(permission.name) ? "primary" : "secondary"}
                            style={styles.permissionItem}
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
});
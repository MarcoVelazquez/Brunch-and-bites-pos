import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, getUserPermissions, deleteUser } from '../lib/database.refactor';
import ProtectedLayout from '../components/ProtectedLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import { TableHeader, TableRow } from '../components/Table';
import { LoadingScreen } from '../components/LoadingScreen';
import type { User } from '../lib/database.types';

interface UserWithPermissions extends User {
    permissionList: string[];
}

export default function Users() {
    const router = useRouter();
    const { checkPermission, db, user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserWithPermissions[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadUsers = async () => {
        if (!db) return;
        
        try {
            setIsLoading(true);
            const usersList = await getAllUsers(db);
            
            // Cargar los permisos de cada usuario
            const usersWithPermissions = await Promise.all(
                usersList.map(async (user) => ({
                    ...user,
                    permissionList: await getUserPermissions(db, user.id)
                }))
            );

            setUsers(usersWithPermissions);
        } catch (error) {
            console.error('Error loading users:', error);
            Alert.alert('Error', 'No se pudieron cargar los usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [db]);

    const handleDeleteUser = async (userId: number, username: string) => {
        if (!db) return;

        Alert.alert(
            'Confirmar',
            `¿Estás seguro de que quieres eliminar al usuario ${username}?`,
            [
                { text: 'Cancelar' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteUser(db, userId);
                            await loadUsers();
                        } catch (error) {
                            console.error('Error deleting user:', error);
                            Alert.alert('Error', 'No se pudo eliminar el usuario');
                        }
                    }
                }
            ]
        );
    };

    return (
        <ProtectedLayout title="Usuarios" requiredPermission="GESTIONAR_USUARIOS">
            <Card style={styles.container}>
                <View style={styles.header}>
                    <TableHeader
                        columns={[
                            { label: 'Usuario', flex: 2 },
                            { label: 'Permisos', flex: 2 },
                            { label: 'Acciones', flex: 1 }
                        ]}
                    />
                    <View style={styles.headerActions}>

                        {checkPermission('CREAR_USUARIOS') && (
                            <Button
                                title="Nuevo Usuario"
                                variant="primary"
                                onPress={() => router.push('/usuarios/register')}
                            />
                        )}
                    </View>
                </View>

                {isLoading ? (
                    <LoadingScreen message="Cargando usuarios..." />
                ) : (
                    <ScrollView>
                        {users.map((user) => (
                            <TableRow
                                key={user.id}
                                cells={[
                                    { content: user.username, flex: 2 },
                                    { 
                                        content: user.is_admin ? 'Administrador' : 
                                            user.permissionList.slice(0, 3).join(', ') + 
                                            (user.permissionList.length > 3 ? '...' : ''),
                                        flex: 2 
                                    },
                                    {
                                        content: (
                                            <View style={styles.rowActions}>
                                                {user.id !== currentUser?.id && (
                                                    <>
                                                        <Button
                                                            title="✏️"
                                                            variant="primary"
                                                            style={styles.actionButton}
                                                            onPress={() => router.push({
                                                                pathname: "/usuarios/[id]",
                                                                params: { id: user.id.toString() }
                                                            })}
                                                        />
                                                        <Button
                                                            title="🗑️"
                                                            variant="danger"
                                                            style={styles.actionButton}
                                                            onPress={() => handleDeleteUser(user.id, user.username)}
                                                        />
                                                    </>
                                                )}
                                            </View>
                                        ),
                                        flex: 1
                                    }
                                ]}
                            />
                        ))}
                    </ScrollView>
                )}
            </Card>
        </ProtectedLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    rowActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        padding: 0,
    },
});
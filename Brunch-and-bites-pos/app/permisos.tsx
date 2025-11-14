import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./contexts/AuthContext";
import { getAllUsers, getAllPermissions, getUserPermissions, assignPermissionToUser, revokePermissionFromUser } from "./lib/database.refactor";
import type { User, Permission } from "./lib/database.types";
import ProtectedLayout from "./components/ProtectedLayout";
import Loading from "./components/Loading";
import UserList from "./components/UserList";
import PermissionGrid from "./components/PermissionGrid";

interface UserPermissions {
    [key: number]: string[];
}

export default function PermissionsScreen() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    
    const [users, setUsers] = useState<User[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [userPermissions, setUserPermissions] = useState<UserPermissions>({});
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const router = useRouter();
    const { db, checkPermission } = useAuth();

    useEffect(() => {
        if (!db) return;
        if (!checkPermission('DAR_PERMISOS')) {
            Alert.alert('Error', 'No tienes permisos para gestionar los permisos de usuarios');
            router.back();
            return;
        }

        loadData();
    }, [db]);

    const loadData = async () => {
        if (!db) return;
        
        setIsLoading(true);
        try {
            // Cargar usuarios
            const allUsers = await getAllUsers(db);
            setUsers(allUsers);

            // Cargar permisos disponibles
            const allPermissions = await getAllPermissions(db);
            setPermissions(allPermissions);

            // Cargar permisos de cada usuario
            const permissionsMap: UserPermissions = {};
            for (const user of allUsers) {
                const userPerms = await getUserPermissions(db, user.id);
                permissionsMap[user.id] = userPerms;
            }
            setUserPermissions(permissionsMap);
        } catch (error) {
            console.error('Error cargando datos:', error);
            Alert.alert('Error', 'Hubo un problema al cargar los datos');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePermission = async (user: User, permission: Permission) => {
        if (!db) return;

        setIsLoading(true);
        try {
            const hasPermission = userPermissions[user.id]?.includes(permission.name);

            if (hasPermission) {
                await revokePermissionFromUser(db, user.id, permission.id);
            } else {
                await assignPermissionToUser(db, user.id, permission.id);
            }

            // Recargar los permisos del usuario
            const updatedPerms = await getUserPermissions(db, user.id);
            setUserPermissions(prev => ({
                ...prev,
                [user.id]: updatedPerms
            }));
        } catch (error) {
            console.error('Error al modificar permisos:', error);
            Alert.alert('Error', 'Hubo un problema al modificar los permisos');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && (!users.length || !permissions.length)) {
        return <Loading message="Cargando..." />;
    }

    return (
        <ProtectedLayout title="Gestión de Permisos" requiredPermission="DAR_PERMISOS">
            <View style={[styles.content, isMobile && styles.contentMobile]}>
                <UserList 
                    users={users}
                    selectedUserId={selectedUser?.id}
                    onSelectUser={setSelectedUser}
                />

                {selectedUser && (
                    <PermissionGrid
                        user={selectedUser}
                        permissions={permissions}
                        userPermissions={userPermissions[selectedUser.id] || []}
                        isLoading={isLoading}
                        onTogglePermission={(permission) => togglePermission(selectedUser, permission)}
                    />
                )}
            </View>
        </ProtectedLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        flexDirection: 'row',
        padding: 20,
        gap: 20,
    },
    contentMobile: {
        flexDirection: 'column',
        padding: 10,
        gap: 10,
    },
});
import { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getUserById, getUserPermissions, getAllPermissions, updateUser, assignPermissionToUser, revokePermissionFromUser } from '../lib/database.refactor';
import { useAuth } from '../contexts/AuthContext';
import { validateUsername, validatePassword, hashPassword } from '../lib/auth';
import ProtectedLayout from '../components/ProtectedLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import Text from '../components/Text';
import Input from '../components/Input';
import { LoadingScreen } from '../components/LoadingScreen';
import type { Permission } from '../lib/database.types';

interface FormData {
    username: string;
    newPassword: string;
    confirmPassword: string;
    isAdmin: boolean;
}

export default function EditUser() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { db, checkPermission } = useAuth();
    const userId = typeof params.id === 'string' ? parseInt(params.id, 10) : 0;
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        username: '',
        newPassword: '',
        confirmPassword: '',
        isAdmin: false
    });
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);

    useEffect(() => {
        loadUser();
    }, [db, userId]);

    const loadUser = async () => {
        if (!db || !userId) return;

        try {
            setIsLoading(true);
            const user = await getUserById(db, userId);
            
            if (!user) {
                Alert.alert('Error', 'Usuario no encontrado');
                router.back();
                return;
            }

            setFormData({
                username: user.username,
                newPassword: '',
                confirmPassword: '',
                isAdmin: user.is_admin
            });

            // Cargar permisos del usuario
            const permissions = await getUserPermissions(db, userId);
            setUserPermissions(permissions);

            // Cargar todos los permisos disponibles
            const allPermissions = await getAllPermissions(db);
            setAvailablePermissions(allPermissions);
        } catch (error) {
            console.error('Error loading user:', error);
            Alert.alert('Error', 'No se pudo cargar la información del usuario');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!db || !userId) return;

        // Validar usuario
        const usernameValidation = validateUsername(formData.username);
        if (!usernameValidation.isValid) {
            Alert.alert('Error', usernameValidation.message || 'Usuario inválido');
            return;
        }

        // Validar contraseña si se está cambiando
        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                Alert.alert('Error', 'Las contraseñas no coinciden');
                return;
            }

            const passwordValidation = validatePassword(formData.newPassword);
            if (!passwordValidation.isValid) {
                Alert.alert('Error', passwordValidation.message || 'Contraseña inválida');
                return;
            }
        }

        setIsSaving(true);
        try {
            // Obtener contraseña actual si no se está cambiando
            const currentUser = await getUserById(db, userId);
            if (!currentUser) throw new Error('Usuario no encontrado');

            const passwordHash = formData.newPassword ? 
                hashPassword(formData.newPassword) : 
                currentUser.password_hash;

            // Actualizar información del usuario
            await updateUser(db, userId, formData.username, passwordHash, formData.isAdmin);

            // Actualizar permisos
            const currentPermissions = await getUserPermissions(db, userId);
            const permissionsToAdd = userPermissions.filter(p => !currentPermissions.includes(p));
            const permissionsToRemove = currentPermissions.filter(p => !userPermissions.includes(p));

            // Obtener IDs de los permisos
            for (const permName of permissionsToAdd) {
                const perm = availablePermissions.find(p => p.name === permName);
                if (perm) await assignPermissionToUser(db, userId, perm.id);
            }

            for (const permName of permissionsToRemove) {
                const perm = availablePermissions.find(p => p.name === permName);
                if (perm) await revokePermissionFromUser(db, userId, perm.id);
            }

            Alert.alert(
                'Éxito',
                'Usuario actualizado correctamente',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Error updating user:', error);
            Alert.alert('Error', 'No se pudo actualizar el usuario');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingScreen message="Cargando información del usuario..." />;
    }

    return (
        <ProtectedLayout title="Editar Usuario" requiredPermission="GESTIONAR_USUARIOS">
            <ScrollView style={styles.container}>
                <Card style={styles.formContainer}>
                    <View style={styles.section}>
                                <Text variant="h3" style={styles.sectionTitle}>Información del Usuario</Text>
                        
                        <Input
                            label="Nombre de usuario"
                            placeholder="Ingrese el nombre de usuario"
                            value={formData.username}
                            onChangeText={(text: string) => setFormData(prev => ({ ...prev, username: text }))}
                            autoCapitalize="none"
                            autoCorrect={false}
                            disabled={isSaving}
                        />

                        <Input
                            label="Nueva contraseña"
                            placeholder="Dejar en blanco para no cambiar"
                            value={formData.newPassword}
                            onChangeText={(text: string) => setFormData(prev => ({ ...prev, newPassword: text }))}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            disabled={isSaving}
                        />

                        {formData.newPassword ? (
                            <Input
                                label="Confirmar nueva contraseña"
                                placeholder="Repita la nueva contraseña"
                                value={formData.confirmPassword}
                                onChangeText={(text: string) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                disabled={isSaving}
                            />
                        ) : null}

                        <View style={styles.checkboxContainer}>
                            <Button
                                title={formData.isAdmin ? "✓" : ""}
                                variant={formData.isAdmin ? "primary" : "secondary"}
                                style={styles.checkbox}
                                onPress={() => setFormData(prev => ({ ...prev, isAdmin: !prev.isAdmin }))}
                                disabled={isSaving}
                            />
                            <Text style={styles.checkboxLabel}>Es administrador</Text>
                        </View>
                    </View>

                    {!formData.isAdmin && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Permisos</Text>
                            <View style={styles.permissionsGrid}>
                                {availablePermissions.map((permission) => (
                                    <Button
                                        key={permission.id}
                                        title={permission.name}
                                        variant={userPermissions.includes(permission.name) ? "primary" : "secondary"}
                                        style={styles.permissionButton}
                                        onPress={() => {
                                            setUserPermissions(prev => 
                                                prev.includes(permission.name)
                                                    ? prev.filter(p => p !== permission.name)
                                                    : [...prev, permission.name]
                                            );
                                        }}
                                        disabled={isSaving}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        <Button
                            title="Guardar Cambios"
                            variant="primary"
                            onPress={handleSave}
                            disabled={isSaving}
                            style={styles.button}
                        />
                        <Button
                            title="Cancelar"
                            variant="secondary"
                            onPress={() => router.back()}
                            disabled={isSaving}
                            style={styles.button}
                        />
                    </View>
                </Card>
            </ScrollView>
        </ProtectedLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    formContainer: {
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        marginRight: 10,
        padding: 0,
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
    },
    permissionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    permissionButton: {
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 20,
    },
    button: {
        minWidth: 120,
    },
});
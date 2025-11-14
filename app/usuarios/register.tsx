import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { addUser, getAllPermissions, assignPermissionToUser } from '../lib/database.refactor';
import { validateUsername, validatePassword, hashPassword } from '../lib/auth';
import ProtectedLayout from '../components/ProtectedLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import Text from '../components/Text';
import Input from '../components/Input';
import type { Permission } from '../lib/database.types';

interface FormData {
    username: string;
    password: string;
    confirmPassword: string;
    isAdmin: boolean;
    selectedPermissions: string[];
}

export default function RegisterUser() {
    const router = useRouter();
    const { db } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [formData, setFormData] = useState<FormData>({
        username: '',
        password: '',
        confirmPassword: '',
        isAdmin: false,
        selectedPermissions: []
    });

    // Cargar los permisos disponibles
    useEffect(() => {
        const loadPermissions = async () => {
            if (!db) return;
            try {
                const allPermissions = await getAllPermissions(db);
                setPermissions(allPermissions);
            } catch (error) {
                console.error('Error loading permissions:', error);
                Alert.alert('Error', 'No se pudieron cargar los permisos');
            }
        };

        loadPermissions();
    }, [db]);

    const handleRegister = async () => {
        if (!db) {
            Alert.alert('Error', 'No hay conexión con la base de datos');
            return;
        }

        // Validar usuario
        const usernameValidation = validateUsername(formData.username);
        if (!usernameValidation.isValid) {
            Alert.alert('Error', usernameValidation.message || 'Usuario inválido');
            return;
        }

        // Validar contraseña
        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            Alert.alert('Error', passwordValidation.message || 'Contraseña inválida');
            return;
        }

        setIsLoading(true);
        try {
            // Crear usuario
            const hashedPassword = hashPassword(formData.password);
            const userId = await addUser(db, formData.username, hashedPassword, formData.isAdmin);

            // Asignar permisos si no es admin
            if (!formData.isAdmin) {
                for (const permName of formData.selectedPermissions) {
                    const permission = permissions.find(p => p.name === permName);
                    if (permission) {
                        await assignPermissionToUser(db, userId, permission.id);
                    }
                }
            }

            Alert.alert(
                'Éxito',
                'Usuario creado correctamente',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Error registering user:', error);
            Alert.alert('Error', 'No se pudo crear el usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProtectedLayout title="Registrar Usuario" requiredPermission="CREAR_USUARIOS">
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
                            disabled={isLoading}
                        />

                        <Input
                            label="Contraseña"
                            placeholder="Ingrese la contraseña"
                            value={formData.password}
                            onChangeText={(text: string) => setFormData(prev => ({ ...prev, password: text }))}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            disabled={isLoading}
                        />

                        <Input
                            label="Confirmar contraseña"
                            placeholder="Repita la contraseña"
                            value={formData.confirmPassword}
                            onChangeText={(text: string) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            disabled={isLoading}
                        />

                        <View style={styles.checkboxContainer}>
                            <Button
                                title={formData.isAdmin ? "✓" : ""}
                                variant={formData.isAdmin ? "primary" : "secondary"}
                                style={styles.checkbox}
                                onPress={() => setFormData(prev => ({ 
                                    ...prev, 
                                    isAdmin: !prev.isAdmin,
                                    selectedPermissions: [] // Limpiar permisos al cambiar a admin
                                }))}
                                disabled={isLoading}
                            />
                            <Text style={styles.checkboxLabel}>Es administrador</Text>
                        </View>
                    </View>

                    {!formData.isAdmin && (
                        <View style={styles.section}>
                            <Text variant="h3" style={styles.sectionTitle}>Permisos</Text>
                            <View style={styles.permissionsGrid}>
                                {permissions.map((permission) => (
                                    <Button
                                        key={permission.id}
                                        title={permission.name}
                                        variant={formData.selectedPermissions.includes(permission.name) ? "primary" : "secondary"}
                                        style={styles.permissionButton}
                                        onPress={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                selectedPermissions: prev.selectedPermissions.includes(permission.name)
                                                    ? prev.selectedPermissions.filter(p => p !== permission.name)
                                                    : [...prev.selectedPermissions, permission.name]
                                            }));
                                        }}
                                        disabled={isLoading}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        <Button
                            title={isLoading ? "Registrando..." : "Registrar Usuario"}
                            variant="primary"
                            onPress={handleRegister}
                            disabled={isLoading}
                            style={styles.button}
                        />
                        <Button
                            title="Cancelar"
                            variant="secondary"
                            onPress={() => router.back()}
                            disabled={isLoading}
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
        marginBottom: 15,
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
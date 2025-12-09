import { useState, useEffect, useMemo } from 'react';
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
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [permFilter, setPermFilter] = useState('');

    // Role presets
    const rolePresets: Record<string, string[]> = {
        'Cajero': ['COBRAR', 'ABRIR_CAJA', 'CERRAR_CAJA'],
        'Gerente': ['COBRAR', 'ABRIR_CAJA', 'CERRAR_CAJA', 'VER_REPORTES', 'VER_GASTOS', 'REGISTRAR_GASTOS', 'VER_COSTEOS', 'REALIZAR_COSTEOS'],
        'Inventario': ['AGREGAR_PRODUCTOS', 'EDITAR_PRODUCTOS', 'ELIMINAR_PRODUCTOS', 'GESTIONAR_INVENTARIO'],
        'Reportes': ['VER_REPORTES', 'VER_GASTOS', 'VER_COSTEOS']
    };

    const applyRolePreset = (roleName: string) => {
        console.log('Aplicando rol:', roleName);
        const presetPermissions = rolePresets[roleName] || [];
        console.log('Permisos del rol:', presetPermissions);
        setFormData(prev => ({ ...prev, selectedPermissions: presetPermissions }));
    };

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
                [{ text: 'OK', onPress: () => router.replace('/usuarios') }]
            );
        } catch (error) {
            console.error('Error registering user:', error);
            Alert.alert('Error', 'No se pudo crear el usuario');
        } finally {
            setIsLoading(false);
        }
    };

    // Password strength
    const pwdStrength = useMemo(() => {
        const p = formData.password || '';
        let score = 0;
        if (p.length >= 8) score++;
        if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
        if (/\d/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        const level = score <= 1 ? 'Débil' : score === 2 ? 'Media' : score === 3 ? 'Buena' : 'Fuerte';
        const color = score <= 1 ? '#dc3545' : score === 2 ? '#ff9800' : score === 3 ? '#4caf50' : '#2e7d32';
        return { level, color };
    }, [formData.password]);

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

                        <View style={styles.inlineRow}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Contraseña"
                                    placeholder="Ingrese la contraseña"
                                    value={formData.password}
                                    onChangeText={(text: string) => setFormData(prev => ({ ...prev, password: text }))}
                                    secureTextEntry={!showPwd}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    disabled={isLoading}
                                />
                            </View>
                            <Button title={showPwd ? '🙈' : '👁️'} variant="secondary" onPress={() => setShowPwd(s => !s)} style={styles.iconBtn} />
                        </View>
                        {formData.password.length > 0 && (
                            <Text style={{ color: pwdStrength.color, marginTop: -8, marginBottom: 8 }}>Fuerza: {pwdStrength.level}</Text>
                        )}

                        <View style={styles.inlineRow}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Confirmar contraseña"
                                    placeholder="Repita la contraseña"
                                    value={formData.confirmPassword}
                                    onChangeText={(text: string) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                                    secureTextEntry={!showConfirm}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    disabled={isLoading}
                                />
                            </View>
                            <Button title={showConfirm ? '🙈' : '👁️'} variant="secondary" onPress={() => setShowConfirm(s => !s)} style={styles.iconBtn} />
                        </View>

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
                            <Text style={{ fontSize: 14, marginBottom: 8, color: '#666' }}>Roles rápidos:</Text>
                            <View style={styles.presetRow}>
                                {Object.keys(rolePresets).map((role) => (
                                    <Button key={role} title={role} variant="secondary" onPress={() => applyRolePreset(role)} style={{ paddingHorizontal: 10 }} />
                                ))}
                            </View>
                            <Text style={{ fontSize: 14, marginTop: 10, marginBottom: 8, color: '#666' }}>O selecciona manualmente:</Text>
                            <View style={styles.presetRow}>
                                <Button title="Seleccionar todo" variant="secondary" onPress={() => setFormData(p => ({ ...p, selectedPermissions: permissions.map(x => x.name) }))} />
                                <Button title="Limpiar" variant="secondary" onPress={() => setFormData(p => ({ ...p, selectedPermissions: [] }))} />
                            </View>
                            <Input
                                placeholder="Filtrar permisos"
                                value={permFilter}
                                onChangeText={setPermFilter as any}
                            />
                            <View style={styles.permissionsGrid}>
                                {permissions
                                    .filter(p => p.name.toLowerCase().includes(permFilter.toLowerCase()))
                                    .map((permission) => (
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
    inlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconBtn: {
        width: 44,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
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
    presetRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
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
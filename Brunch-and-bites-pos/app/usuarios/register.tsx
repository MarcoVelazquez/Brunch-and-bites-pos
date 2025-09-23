import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { addUser } from '../lib/database.refactor';

interface FormData {
    username: string;
    password: string;
    confirmPassword: string;
    isAdmin: boolean;
}

export default function RegisterScreen() {
    const [formData, setFormData] = useState<FormData>({
        username: '',
        password: '',
        confirmPassword: '',
        isAdmin: false
    });
    const [isLoading, setIsLoading] = useState(false);
    
    const router = useRouter();
    const { db, checkPermission } = useAuth();

    const handleRegister = async () => {
        if (!db) {
            Alert.alert('Error', 'No hay conexión con la base de datos');
            return;
        }

        // Verificar permisos
        if (!checkPermission('CREAR_USUARIOS')) {
            Alert.alert('Error', 'No tienes permisos para crear usuarios');
            return;
        }

        // Validaciones
        if (!formData.username || !formData.password || !formData.confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);
        try {
            // En un entorno de producción, deberías hashear la contraseña
            const userId = await addUser(db, formData.username, formData.password, formData.isAdmin);
            
            if (userId) {
                Alert.alert(
                    'Éxito',
                    'Usuario creado correctamente',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back()
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error registering user:', error);
            Alert.alert('Error', 'Hubo un problema al crear el usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
                <Image
                    source={require("../../assets/images/icon.png")}
                    style={styles.logo}
                />
                <View style={styles.menuGrid}>
                    <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Caja</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Productos</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Recibos</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Gastos</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Costeos</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Reportes</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuButton}><Text style={styles.menuText}>Usuarios</Text></TouchableOpacity>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.main}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Registrar Usuario</Text>
                </View>
                
                <View style={styles.formWrapper}>
                    <View style={styles.formContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre de usuario"
                            value={formData.username}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña"
                            value={formData.password}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirmar contraseña"
                            value={formData.confirmPassword}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                        />

                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setFormData(prev => ({ ...prev, isAdmin: !prev.isAdmin }))}
                            disabled={isLoading}
                        >
                            <View style={[styles.checkbox, formData.isAdmin && styles.checkboxChecked]} />
                            <Text style={styles.checkboxLabel}>¿Es administrador?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.addBtn, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            <Text style={styles.addBtnText}>
                                {isLoading ? 'Registrando...' : 'Registrar Usuario'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            disabled={isLoading}
                        >
                            <Text style={styles.backButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    },
    menuButton: {
        width: 90,
        height: 60,
        backgroundColor: "#38b24d",
        margin: 5,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 6,
    },
    menuText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
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
        fontSize: 32,
        fontWeight: "bold",
    },
    formWrapper: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
        borderWidth: 2,
        borderColor: '#38b24d',
        borderRadius: 4,
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: '#38b24d',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
    },
    addBtn: {
        backgroundColor: '#38b24d',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#999',
    },
    addBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 15,
        padding: 10,
    },
    backButtonText: {
        color: '#38b24d',
        fontSize: 16,
        textAlign: 'center',
    },
});
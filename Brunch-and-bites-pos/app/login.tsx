import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions, Image, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './contexts/AuthContext';
import { validateUsername, hashPassword, verifyPassword } from './lib/auth';
import { openDB, clearAllUsers, createFreshAdmin, createUserWithAllPermissions, getAllUsers, getUserByUsername } from './lib/database.refactor';
import { LoadingScreen } from './components/LoadingScreen';
import Text from './components/Text';
import Button from './components/Button';
import Input from './components/Input';
import Card from './components/Card';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { width } = useWindowDimensions();
    const isSmall = width < 400;
    const router = useRouter();
    
    const { login, isLoading: authLoading } = useAuth();

    // Prevenir navegación hacia atrás en Android
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            // Retornar true previene que se navegue hacia atrás
            return true;
        });

        return () => backHandler.remove();
    }, []);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('⚠️ Campos incompletos', 'Por favor ingresa tu usuario y contraseña para continuar');
            return;
        }

        // DEBUG: Saltarse la validación de username para casos de test
        if (username !== 'test' && username !== 'admin' && username !== 'Gina') {
            const usernameValidation = validateUsername(username);
            if (!usernameValidation.isValid) {
                Alert.alert('❌ Usuario inválido', usernameValidation.message || 'El usuario ingresado no es válido');
                return;
            }
        }

        setIsLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                router.push('/caja');
            } else {
                Alert.alert(
                    '🔒 Acceso denegado', 
                    'Usuario o contraseña incorrectos. Por favor verifica tus credenciales e intenta nuevamente.'
                );
            }
        } catch (error) {
            console.error('Error during login:', error);
            Alert.alert(
                '⚠️ Error de conexión', 
                'Hubo un problema al intentar iniciar sesión. Por favor intenta nuevamente.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return <LoadingScreen message="Iniciando aplicación..." />;
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
            <Card variant="elevated" style={styles.formContainer}>
                <Image 
                    source={require('../assets/images/logo.jpeg')}
                    style={[styles.logo, isSmall && { width: 88, height: 88, marginBottom: 16 }]}
                />
                
                <Text variant="h1" align="center" style={styles.welcomeText}>👋 Bienvenido</Text>
                <Text 
                    variant="body" 
                    color="#666" 
                    align="center" 
                    style={styles.subtitle}
                >
                    Ingresa tus credenciales para acceder al sistema
                </Text>
                
                <Input
                    label="👤 Usuario"
                    placeholder="Tu nombre de usuario"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    disabled={isLoading}
                />

                <Input
                    label="🔒 Contraseña"
                    placeholder="Tu contraseña segura"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    disabled={isLoading}
                />

                <Button
                    title={isLoading ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'}
                    onPress={handleLogin}
                    disabled={isLoading}
                    loading={isLoading}
                    variant="primary"
                    style={styles.loginButton}
                />






                <Text variant="small" align="center" style={styles.footer}>
                    🍳 Brunch & Bites POS - v1.0.0
                </Text>
                <Text variant="small" align="center" style={styles.footerNote}>
                    Sistema de punto de venta
                </Text>
            </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    scrollBody: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 50,
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'white',
        padding: 32,
        alignItems: 'center',
        marginBottom: 100,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 24,
        borderRadius: 60,
    },
    welcomeText: {
        marginBottom: 8,
    },
    subtitle: {
        marginTop: 8,
        marginBottom: 24,
    },
    loginButton: {
        width: '100%',
        marginTop: 16,
    },
    footer: {
        marginTop: 24,
        opacity: 0.6,
    },
    footerNote: {
        marginTop: 4,
        opacity: 0.5,
    },
});
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Text from './Text';

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.message}>{message}</Text>
        </View>
    );
}

// También exportamos el componente como la exportación por defecto
export default LoadingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    message: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
});
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AppText from './Text';

interface LoadingProps {
    message?: string;
}

export default function Loading({ message }: LoadingProps) {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#38b24d" />
            {message && (
                <AppText style={styles.message}>
                    {message}
                </AppText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginTop: 10,
        color: '#666',
    },
});
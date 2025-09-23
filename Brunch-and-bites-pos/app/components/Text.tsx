import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface TextProps {
    children: React.ReactNode;
    variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
    style?: any;
}

export default function AppText({ children, variant = 'body', style }: TextProps) {
    return (
        <Text style={[
            styles.text,
            variant === 'h1' && styles.h1,
            variant === 'h2' && styles.h2,
            variant === 'h3' && styles.h3,
            variant === 'caption' && styles.caption,
            style
        ]}>
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    text: {
        fontSize: 16,
        color: '#333',
    },
    h1: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 6,
    },
    caption: {
        fontSize: 14,
        color: '#666',
    },
});
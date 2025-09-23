import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'danger';
    style?: any;
}

export default function Button({ onPress, title, variant = 'primary', style }: ButtonProps) {
    return (
        <TouchableOpacity 
            style={[
                styles.button, 
                variant === 'primary' && styles.primaryButton,
                variant === 'secondary' && styles.secondaryButton,
                variant === 'danger' && styles.dangerButton,
                style
            ]} 
            onPress={onPress}
        >
            <Text style={[
                styles.text,
                variant === 'primary' && styles.primaryText,
                variant === 'secondary' && styles.secondaryText,
                variant === 'danger' && styles.dangerText,
            ]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#38b24d',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#38b24d',
    },
    dangerButton: {
        backgroundColor: '#dc3545',
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryText: {
        color: '#fff',
    },
    secondaryText: {
        color: '#38b24d',
    },
    dangerText: {
        color: '#fff',
    },
});
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import AppText from './Text';

interface InputProps {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    style?: any;
}

export default function Input({ 
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    style 
}: InputProps) {
    return (
        <View style={styles.container}>
            {label && (
                <AppText variant="caption" style={styles.label}>
                    {label}
                </AppText>
            )}
            <TextInput
                style={[styles.input, style]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
                placeholderTextColor="#999"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
    },
    label: {
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        backgroundColor: '#fff',
    },
});
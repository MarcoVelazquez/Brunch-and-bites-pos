import React from 'react';
import { Text, StyleSheet, TextStyle, TextProps as RNTextProps } from 'react-native';

interface TextProps extends Omit<RNTextProps, 'style'> {
    children: React.ReactNode;
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-bold' | 'caption' | 'small';
    style?: TextStyle | TextStyle[];
    color?: string;
    align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export default function AppText({ 
    children, 
    variant = 'body', 
    style,
    color,
    align = 'auto',
    ...rest
}: TextProps) {
    const mergedStyle: (TextStyle | undefined)[] = [
        styles.text,
        variant === 'h1' ? styles.h1 : undefined,
        variant === 'h2' ? styles.h2 : undefined,
        variant === 'h3' ? styles.h3 : undefined,
        variant === 'h4' ? styles.h4 : undefined,
        variant === 'body-bold' ? styles.bodyBold : undefined,
        variant === 'caption' ? styles.caption : undefined,
        variant === 'small' ? styles.small : undefined,
        color ? { color } : undefined,
        align !== 'auto' ? { textAlign: align } : undefined,
    ];
    if (style) {
        if (Array.isArray(style)) {
            mergedStyle.push(...style);
        } else {
            mergedStyle.push(style);
        }
    }
    const filteredStyle: TextStyle[] = mergedStyle.filter((s): s is TextStyle => s !== undefined);
    return (
        <Text style={filteredStyle} {...rest}>
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    text: {
        fontSize: 16,
        color: '#333',
        fontFamily: undefined, // Usar la fuente del sistema por defecto
    },
    h1: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        lineHeight: 40,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        lineHeight: 32,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 6,
        lineHeight: 28,
    },
    h4: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
        lineHeight: 24,
    },
    bodyBold: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
    caption: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    small: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },
});
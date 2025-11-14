import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';

interface CardProps extends Omit<ViewProps, 'style'> {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'outlined' | 'elevated';
}

export default function Card({ children, style, variant = 'default', ...rest }: CardProps) {
    return (
        <View 
            style={[
                styles.card,
                variant === 'outlined' && styles.outlinedCard,
                variant === 'elevated' && styles.elevatedCard,
                style
            ]}
            {...rest}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
    },
    outlinedCard: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    elevatedCard: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
});
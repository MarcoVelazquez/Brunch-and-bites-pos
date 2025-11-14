import React from 'react';
import { View, StyleSheet } from 'react-native';

interface DividerProps {
    style?: any;
}

export default function Divider({ style }: DividerProps) {
    return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 10,
    },
});
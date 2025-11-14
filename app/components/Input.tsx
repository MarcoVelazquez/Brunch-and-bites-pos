import React, { forwardRef } from 'react';
import { 
    View, 
    TextInput, 
    StyleSheet, 
    TextInputProps, 
    ViewStyle, 
    TextStyle 
} from 'react-native';
import Text from './Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;
    inputStyle?: TextStyle;
    containerStyle?: ViewStyle;
    labelStyle?: TextStyle;
    disabled?: boolean;
}

const Input = forwardRef<TextInput, InputProps>(({ 
    label,
    error,
    inputStyle,
    containerStyle,
    labelStyle,
    disabled,
    ...rest
}, ref) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text 
                    variant="caption" 
                    style={[
                        styles.label,
                        error ? styles.errorLabel : undefined,
                        labelStyle
                    ].filter(s => !!s)}
                >
                    {label}
                </Text>
            )}
            <TextInput
                ref={ref}
                style={[
                    styles.input,
                    error ? styles.inputError : undefined,
                    disabled ? styles.inputDisabled : undefined,
                    inputStyle
                ].filter(s => !!s)}
                placeholderTextColor="#999"
                editable={!disabled}
                {...rest}
            />
            {error && (
                <Text 
                    variant="small" 
                    color="#dc3545" 
                    style={styles.errorText}
                >
                    {error}
                </Text>
            )}
        </View>
    );
});

Input.displayName = 'Input';

export default Input;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
    },
    inputError: {
        borderColor: '#dc3545',
    },
    inputDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#ddd',
    },
    errorLabel: {
        color: '#dc3545',
    },
    errorText: {
        marginTop: 4,
    }
});
import React from 'react';
import { 
    TouchableOpacity, 
    Text, 
    StyleSheet, 
    ViewStyle, 
    TextStyle, 
    TouchableOpacityProps,
    ActivityIndicator
} from 'react-native';
import type { StyleProp } from 'react-native';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'danger';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export default function Button({ 
    onPress, 
    title, 
    variant = 'primary', 
    style, 
    textStyle,
    disabled,
    loading,
    leftIcon,
    rightIcon,
    ...rest
}: ButtonProps) {
    const buttonStyles = [
        styles.button, 
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'danger' && styles.dangerButton,
        (disabled || loading) && styles.disabledButton,
        style
    ];

    const textStyles = [
        styles.text,
        variant === 'primary' && styles.primaryText,
        variant === 'secondary' && styles.secondaryText,
        variant === 'danger' && styles.dangerText,
        textStyle
    ];

    return (
        <TouchableOpacity 
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            {...rest}
        >
            <React.Fragment>
                {leftIcon && <React.Fragment>{leftIcon}</React.Fragment>}
                {loading ? (
                    <ActivityIndicator 
                        color={variant === 'secondary' ? '#38b24d' : '#fff'} 
                        style={styles.loader} 
                    />
                ) : (
                    <Text 
                        style={textStyles}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        adjustsFontSizeToFit
                        textBreakStrategy="highQuality"
                    >
                        {title}
                    </Text>
                )}
                {rightIcon && <React.Fragment>{rightIcon}</React.Fragment>}
            </React.Fragment>
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
        flexDirection: 'row',
        gap: 8,
        minWidth: 110,
        maxWidth: 180,
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
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
        width: '100%',
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
    disabledButton: {
        opacity: 0.5,
    },
    loader: {
        marginHorizontal: 8,
    },
});
import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { colors, theme } from '../constants/theme';

export const Button = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'primary' && styles.primaryButton,
                variant === 'secondary' && styles.secondaryButton,
                variant === 'outline' && styles.outlineButton,
                isDisabled && styles.disabledButton,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' ? colors.primary : colors.white}
                />
            ) : (
                <Text
                    style={[
                        styles.buttonText,
                        variant === 'primary' && styles.primaryButtonText,
                        variant === 'secondary' && styles.secondaryButtonText,
                        variant === 'outline' && styles.outlineButtonText,
                        isDisabled && styles.disabledButtonText,
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.base,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    primaryButton: {
        backgroundColor: colors.primary,
    },
    secondaryButton: {
        backgroundColor: colors.gray200,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: theme.fontSizes.base,
        fontWeight: theme.fontWeights.semibold,
    },
    primaryButtonText: {
        color: colors.white,
    },
    secondaryButtonText: {
        color: colors.textPrimary,
    },
    outlineButtonText: {
        color: colors.primary,
    },
    disabledButtonText: {
        color: colors.gray400,
    },
});

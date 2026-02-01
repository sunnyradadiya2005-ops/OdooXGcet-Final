import React from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
} from 'react-native';
import { colors, theme } from '../constants/theme';

export const Input = ({
    label,
    error,
    containerStyle,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                    style,
                ]}
                placeholderTextColor={colors.gray400}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.base,
    },
    label: {
        fontSize: theme.fontSizes.sm,
        fontWeight: theme.fontWeights.medium,
        color: colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: theme.borderRadius.base,
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.md,
        fontSize: theme.fontSizes.base,
        color: colors.textPrimary,
        backgroundColor: colors.white,
    },
    inputError: {
        borderColor: colors.error,
    },
    errorText: {
        fontSize: theme.fontSizes.xs,
        color: colors.error,
        marginTop: theme.spacing.xs,
    },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, theme } from '../constants/theme';
import { Button } from './Button';

export const ErrorMessage = ({ message, onRetry }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <Button
                    title="Retry"
                    onPress={onRetry}
                    variant="outline"
                    style={styles.retryButton}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: theme.spacing.md,
    },
    message: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    retryButton: {
        minWidth: 120,
    },
});

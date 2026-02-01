import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, theme } from '../constants/theme';

export const LoadingSpinner = ({ fullScreen = false, message }) => {
    if (fullScreen) {
        return (
            <View style={styles.fullScreenContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                {message && <Text style={styles.message}>{message}</Text>}
            </View>
        );
    }

    return (
        <View style={styles.inlineContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    inlineContainer: {
        padding: theme.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginTop: theme.spacing.md,
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
    },
});

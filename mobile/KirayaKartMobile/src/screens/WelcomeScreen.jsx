import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';


import { colors, theme } from '../constants/theme';
import { Button } from '../components/Button';



export const WelcomeScreen = ({ navigation }) => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.logo}>🛒</Text>
                    <Text style={styles.title}>Welcome to KirayaKart</Text>
                    <Text style={styles.subtitle}>
                        Rent products easily and securely
                    </Text>
                </View>

                <View style={styles.features}>
                    <FeatureItem
                        icon="📦"
                        title="Wide Selection"
                        description="Browse thousands of products available for rent"
                    />
                    <FeatureItem
                        icon="💳"
                        title="Secure Payments"
                        description="Safe and secure payment processing"
                    />
                    <FeatureItem
                        icon="🚚"
                        title="Easy Delivery"
                        description="Convenient pickup and delivery options"
                    />
                </View>

                <View style={styles.actions}>
                    <Button
                        title="Login"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.button}
                    />
                    <Button
                        title="Sign Up"
                        onPress={() => navigation.navigate('Signup')}
                        variant="outline"
                        style={styles.button}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

const FeatureItem = ({ icon, title, description }) => (
    <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>{icon}</Text>
        <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: colors.white,
    },
    content: {
        flex: 1,
        padding: theme.spacing.xl,
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginTop: theme.spacing['4xl'],
    },
    logo: {
        fontSize: 80,
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.fontSizes['2xl'],
        fontWeight: theme.fontWeights.bold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    features: {
        marginVertical: theme.spacing['2xl'],
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    featureIcon: {
        fontSize: 40,
        marginRight: theme.spacing.base,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    featureDescription: {
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
    },
    actions: {
        marginBottom: theme.spacing.xl,
    },
    button: {
        marginBottom: theme.spacing.md,
    },
});


import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';


import { colors, theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';



export const SplashScreen = ({ navigation }) => {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            // Navigate based on auth state
            setTimeout(() => {
                if (user) {
                    navigation.replace('Main');
                } else {
                    navigation.replace('Welcome');
                }
            }, 1500); // Show splash for at least 1.5 seconds
        }
    }, [loading, user, navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Text style={styles.logo}>🛒</Text>
                <Text style={styles.title}>KirayaKart</Text>
                <Text style={styles.subtitle}>Rental Management System</Text>
            </View>
            <LoadingSpinner />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing['3xl'],
    },
    logo: {
        fontSize: 80,
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.fontSizes['3xl'],
        fontWeight: theme.fontWeights.bold,
        color: colors.white,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.fontSizes.sm,
        color: colors.white,
        opacity: 0.9,
    },
});


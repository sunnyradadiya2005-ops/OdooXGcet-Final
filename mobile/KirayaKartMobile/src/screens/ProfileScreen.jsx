import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';


import { colors, theme } from '../constants/theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';



export const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        // Navigation will be handled by AuthContext/AppNavigator
                    },
                },
            ]
        );
    };

    if (!user) {
        return null;
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </Text>
                </View>
                <Text style={styles.name}>
                    {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.email}>{user.email}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Information</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Role</Text>
                    <Text style={styles.infoValue}>Customer</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>
                        {user.firstName} {user.lastName}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Information</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Version</Text>
                    <Text style={styles.infoValue}>1.0.0</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Platform</Text>
                    <Text style={styles.infoValue}>React Native</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <Button
                    title="Logout"
                    onPress={handleLogout}
                    variant="outline"
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
    },
    header: {
        backgroundColor: colors.white,
        alignItems: 'center',
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.base,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    avatarText: {
        fontSize: theme.fontSizes['2xl'],
        fontWeight: theme.fontWeights.bold,
        color: colors.white,
    },
    name: {
        fontSize: theme.fontSizes.xl,
        fontWeight: theme.fontWeights.bold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    email: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
    },
    section: {
        backgroundColor: colors.white,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.base,
    },
    sectionTitle: {
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    infoLabel: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
    },
    infoValue: {
        fontSize: theme.fontSizes.base,
        fontWeight: theme.fontWeights.medium,
        color: colors.textPrimary,
    },
    actions: {
        padding: theme.spacing.base,
    },
});


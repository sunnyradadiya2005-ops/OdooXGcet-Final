import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';


import { colors, theme } from '../constants/theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../services/api';
import { validateEmail } from '../utils/validators';



export const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
            Alert.alert(
                'Email Sent',
                'If an account exists with this email, you will receive password reset instructions.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.icon}>🔒</Text>
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        Enter your email address and we'll send you instructions to reset your password
                    </Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Email Address"
                        placeholder="you@example.com"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (error) setError('');
                        }}
                        error={error}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!success}
                    />

                    <Button
                        title={loading ? 'Sending...' : 'Send Reset Link'}
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={success}
                        style={styles.submitButton}
                    />

                    <Button
                        title="Back to Login"
                        onPress={() => navigation.goBack()}
                        variant="outline"
                        style={styles.backButton}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing['3xl'],
    },
    icon: {
        fontSize: 60,
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.fontSizes['2xl'],
        fontWeight: theme.fontWeights.bold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    subtitle: {
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    form: {
        marginBottom: theme.spacing.xl,
    },
    submitButton: {
        marginTop: theme.spacing.md,
    },
    backButton: {
        marginTop: theme.spacing.md,
    },
});


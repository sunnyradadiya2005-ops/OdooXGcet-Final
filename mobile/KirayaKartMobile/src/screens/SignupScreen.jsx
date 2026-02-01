import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';


import { colors, theme } from '../constants/theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, validateName, validateOTP } from '../utils/validators';



export const SignupScreen = ({ navigation }) => {
    const { registerCustomer, requestOTP, verifyOTP } = useAuth();

    const [step, setStep] = useState('details');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [otp, setOtp] = useState('');
    const [verificationToken, setVerificationToken] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!validateName(formData.firstName)) {
            newErrors.firstName = 'First name is required';
        }
        if (!validateName(formData.lastName)) {
            newErrors.lastName = 'Last name is required';
        }
        if (!validateEmail(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.errors[0];
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRequestOTP = async () => {
        if (!validateEmail(formData.email)) {
            setErrors({ email: 'Enter a valid email first' });
            return;
        }

        setLoading(true);
        try {
            await requestOTP(formData.email);
            setStep('otp');
            Alert.alert('OTP Sent', 'Please check your email for the verification code');
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!validateOTP(otp)) {
            setErrors({ otp: 'Enter a valid 6-digit OTP' });
            return;
        }

        setLoading(true);
        try {
            const token = await verifyOTP(formData.email, otp);
            setVerificationToken(token);
            setStep('verified');
            setErrors({});
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!validateForm()) return;
        if (!verificationToken) {
            Alert.alert('Error', 'Please verify your email first');
            return;
        }

        setLoading(true);
        try {
            await registerCustomer({
                ...formData,
                verificationToken,
            });
            // Navigation will be handled by AuthContext/AppNavigator
        } catch (err) {
            Alert.alert('Signup Failed', err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: undefined });
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
                    <Text style={styles.logo}>🛒</Text>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join KirayaKart today</Text>
                </View>

                <View style={styles.form}>
                    {/* Step 1: User Details */}
                    <View style={styles.row}>
                        <Input
                            label="First Name"
                            placeholder="John"
                            value={formData.firstName}
                            onChangeText={(text) => updateField('firstName', text)}
                            error={errors.firstName}
                            containerStyle={styles.halfInput}
                        />
                        <Input
                            label="Last Name"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChangeText={(text) => updateField('lastName', text)}
                            error={errors.lastName}
                            containerStyle={styles.halfInput}
                        />
                    </View>

                    {/* Email with Verification */}
                    <View>
                        <Input
                            label="Email Address"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChangeText={(text) => updateField('email', text)}
                            error={errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={step === 'details'}
                        />
                        {step === 'details' && (
                            <Button
                                title="Verify Email"
                                onPress={handleRequestOTP}
                                loading={loading}
                                variant="outline"
                                style={styles.verifyButton}
                            />
                        )}
                        {step === 'verified' && (
                            <Text style={styles.verifiedText}>✓ Email verified</Text>
                        )}
                    </View>

                    {/* Step 2: OTP Verification */}
                    {step === 'otp' && (
                        <View style={styles.otpContainer}>
                            <Input
                                label="Verification Code"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChangeText={(text) => {
                                    setOtp(text.replace(/\D/g, ''));
                                    if (errors.otp) setErrors({ ...errors, otp: undefined });
                                }}
                                error={errors.otp}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                            <Button
                                title="Verify OTP"
                                onPress={handleVerifyOTP}
                                loading={loading}
                                style={styles.verifyButton}
                            />
                            <TouchableOpacity onPress={handleRequestOTP}>
                                <Text style={styles.resendText}>Resend OTP</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 3: Password (after email verified) */}
                    {step === 'verified' && (
                        <>
                            <Input
                                label="Password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChangeText={(text) => updateField('password', text)}
                                error={errors.password}
                                secureTextEntry
                            />
                            <Text style={styles.hint}>Min 6 characters, include a number</Text>

                            <Input
                                label="Confirm Password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChangeText={(text) => updateField('confirmPassword', text)}
                                error={errors.confirmPassword}
                                secureTextEntry
                            />

                            <Button
                                title={loading ? 'Creating account...' : 'Create Account'}
                                onPress={handleSignup}
                                loading={loading}
                                style={styles.signupButton}
                            />
                        </>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
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
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        marginTop: theme.spacing.lg,
    },
    logo: {
        fontSize: 50,
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.fontSizes['2xl'],
        fontWeight: theme.fontWeights.bold,
        color: colors.primary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
    },
    form: {
        marginBottom: theme.spacing.xl,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    verifyButton: {
        marginTop: theme.spacing.sm,
    },
    verifiedText: {
        fontSize: theme.fontSizes.sm,
        color: colors.success,
        fontWeight: theme.fontWeights.medium,
        marginTop: theme.spacing.sm,
    },
    otpContainer: {
        backgroundColor: colors.gray50,
        padding: theme.spacing.base,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.base,
    },
    resendText: {
        fontSize: theme.fontSizes.sm,
        color: colors.primary,
        textAlign: 'center',
        marginTop: theme.spacing.md,
        fontWeight: theme.fontWeights.medium,
    },
    hint: {
        fontSize: theme.fontSizes.xs,
        color: colors.textSecondary,
        marginTop: -theme.spacing.sm,
        marginBottom: theme.spacing.base,
    },
    signupButton: {
        marginTop: theme.spacing.lg,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        paddingBottom: theme.spacing.lg,
    },
    footerText: {
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
    },
    loginLink: {
        fontSize: theme.fontSizes.sm,
        color: colors.primary,
        fontWeight: theme.fontWeights.semibold,
    },
});


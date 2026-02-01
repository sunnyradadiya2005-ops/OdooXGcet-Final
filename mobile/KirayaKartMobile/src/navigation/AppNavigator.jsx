import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { colors, theme } from '../constants/theme';

// Auth Screens
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';

// Main App
import { MainTabs } from './MainTabs';

// Detail Screens
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
    const { user, loading } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: colors.white,
                    },
                    headerTitleStyle: {
                        fontSize: theme.fontSizes.lg,
                        fontWeight: theme.fontWeights.bold,
                        color: colors.textPrimary,
                    },
                    headerTintColor: colors.primary,
                    headerShadowVisible: false,
                }}
            >
                {loading ? (
                    // Show splash while checking auth
                    <Stack.Screen
                        name="Splash"
                        component={SplashScreen}
                        options={{ headerShown: false }}
                    />
                ) : user ? (
                    // Authenticated Stack
                    <>
                        <Stack.Screen
                            name="Main"
                            component={MainTabs}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ProductDetail"
                            component={ProductDetailScreen}
                            options={{ title: 'Product Details' }}
                        />
                        <Stack.Screen
                            name="Checkout"
                            component={CheckoutScreen}
                            options={{ title: 'Checkout' }}
                        />
                        <Stack.Screen
                            name="Payment"
                            component={PaymentScreen}
                            options={{ title: 'Payment' }}
                        />
                        <Stack.Screen
                            name="OrderDetail"
                            component={OrderDetailScreen}
                            options={{ title: 'Order Details' }}
                        />
                    </>
                ) : (
                    // Unauthenticated Stack
                    <>
                        <Stack.Screen
                            name="Splash"
                            component={SplashScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Welcome"
                            component={WelcomeScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Signup"
                            component={SignupScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ForgotPassword"
                            component={ForgotPasswordScreen}
                            options={{ title: 'Reset Password' }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

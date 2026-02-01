import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../screens/HomeScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { CartScreen } from '../screens/CartScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors, theme } from '../constants/theme';
import { useCart } from '../context/CartContext';
import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
    const { cartCount } = useCart();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.gray400,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: theme.fontSizes.xs,
                    fontWeight: theme.fontWeights.medium,
                },
                headerStyle: {
                    backgroundColor: colors.white,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
                headerTitleStyle: {
                    fontSize: theme.fontSizes.lg,
                    fontWeight: theme.fontWeights.bold,
                    color: colors.textPrimary,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: size, color }}>🏠</Text>
                    ),
                    headerTitle: 'KirayaKart',
                }}
            />
            <Tab.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                    tabBarLabel: 'Orders',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: size, color }}>📋</Text>
                    ),
                    headerTitle: 'My Orders',
                }}
            />
            <Tab.Screen
                name="Cart"
                component={CartScreen}
                options={{
                    tabBarLabel: 'Cart',
                    tabBarIcon: ({ color, size }) => (
                        <View>
                            <Text style={{ fontSize: size, color }}>🛒</Text>
                            {cartCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{cartCount}</Text>
                                </View>
                            )}
                        </View>
                    ),
                    headerTitle: 'My Cart',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: size, color }}>👤</Text>
                    ),
                    headerTitle: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        right: -8,
        top: -4,
        backgroundColor: colors.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: theme.fontWeights.bold,
    },
});


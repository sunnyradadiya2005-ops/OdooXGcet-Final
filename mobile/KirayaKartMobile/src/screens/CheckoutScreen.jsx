import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';


import { colors, theme } from '../constants/theme';
import { Button } from '../components/Button';
import { useCart } from '../context/CartContext';
import { formatCurrency, calculateRentalDays } from '../utils/formatters';
import api from '../services/api';



export const CheckoutScreen = ({ navigation }) => {
    const { cartItems, clearCart } = useCart();
    const [loading, setLoading] = useState(false);

    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => {
            const days = calculateRentalDays(new Date(item.startDate), new Date(item.endDate));
            return sum + (item.product.basePrice * days * item.quantity);
        }, 0);
    };

    const subtotal = calculateSubtotal();
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    const handleProceedToPayment = () => {
        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Your cart is empty');
            return;
        }

        // Navigate to payment screen with order data
        navigation.navigate('Payment', {
            cartItems,
            subtotal,
            tax,
            total,
            deliveryMethod: 'standard',
        });
    };


    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Summary</Text>

                {cartItems.map((item) => {
                    const days = calculateRentalDays(new Date(item.startDate), new Date(item.endDate));
                    const itemTotal = item.product.basePrice * days * item.quantity;

                    return (
                        <View key={item.id} style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.product.name}</Text>
                                <Text style={styles.itemDetails}>
                                    {days} day(s) × {item.quantity}
                                </Text>
                            </View>
                            <Text style={styles.itemPrice}>{formatCurrency(itemTotal)}</Text>
                        </View>
                    );
                })}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Price Breakdown</Text>

                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Subtotal</Text>
                    <Text style={styles.priceValue}>{formatCurrency(subtotal)}</Text>
                </View>

                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Tax (18%)</Text>
                    <Text style={styles.priceValue}>{formatCurrency(tax)}</Text>
                </View>

                <View style={[styles.priceRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Button
                    title="Proceed to Payment"
                    onPress={handleProceedToPayment}
                    loading={loading}
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
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: theme.fontSizes.base,
        color: colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    itemDetails: {
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
    },
    itemPrice: {
        fontSize: theme.fontSizes.base,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
    },
    priceLabel: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
    },
    priceValue: {
        fontSize: theme.fontSizes.base,
        fontWeight: theme.fontWeights.medium,
        color: colors.textPrimary,
    },
    totalRow: {
        borderTopWidth: 2,
        borderTopColor: colors.border,
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.md,
    },
    totalLabel: {
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.bold,
        color: colors.textPrimary,
    },
    totalValue: {
        fontSize: theme.fontSizes.xl,
        fontWeight: theme.fontWeights.bold,
        color: colors.primary,
    },
    footer: {
        padding: theme.spacing.base,
    },
});


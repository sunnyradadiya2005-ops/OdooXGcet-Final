import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

import { colors, theme } from '../constants/theme';
import { Button } from '../components/Button';
import { formatCurrency, formatDate, calculateRentalDays } from '../utils/formatters';
import api from '../services/api';

export const PaymentScreen = ({ route, navigation }) => {
    const { cartItems, subtotal, tax, total, deliveryMethod = 'standard' } = route.params;
    const [loading, setLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('online'); // 'online' or 'cod'

    const handlePayment = async () => {
        if (selectedMethod === 'cod') {
            // For COD, directly place order without payment
            await placeOrder();
            return;
        }

        // Online payment via Razorpay
        setLoading(true);
        try {
            console.log('🔄 Starting Razorpay payment process...');
            console.log('💰 Total amount:', total);

            // Step 1: Create Razorpay order directly with the total amount
            console.log('💳 Creating Razorpay payment order...');
            const paymentOrderResponse = await api.post('/payments/create-order', {
                amount: total,
                currency: 'INR',
            });

            const { orderId, amount, currency, keyId } = paymentOrderResponse.data;
            console.log('✅ Razorpay order created:', orderId);

            // Step 2: Open Razorpay checkout
            console.log('🚀 Opening Razorpay checkout...');
            const options = {
                description: 'KirayaKart Order Payment',
                currency: currency,
                key: keyId,
                amount: amount,
                name: 'KirayaKart',
                order_id: orderId,
                prefill: {
                    email: '',
                    contact: '',
                    name: '',
                },
                theme: { color: colors.primary },
            };

            RazorpayCheckout.open(options)
                .then(async (data) => {
                    // Payment successful
                    console.log('✅ Payment successful:', data.razorpay_payment_id);
                    try {
                        // Step 3: Create order after successful payment
                        console.log('📦 Creating order after payment...');
                        const orderResponse = await api.post('/orders/from-cart', {
                            deliveryMethod,
                            paymentDetails: {
                                razorpay_order_id: data.razorpay_order_id,
                                razorpay_payment_id: data.razorpay_payment_id,
                                razorpay_signature: data.razorpay_signature,
                                amount: amount / 100, // Convert paise to rupees
                            },
                        });

                        console.log('✅ Order created successfully');
                        console.log('Full order response:', JSON.stringify(orderResponse.data, null, 2));

                        const createdOrder = orderResponse.data.order || orderResponse.data;
                        console.log('Extracted order:', createdOrder);
                        console.log('Order ID:', createdOrder?.id);

                        // Backend returns { orders: [...] } array
                        const orderToUse = orderResponse.data.orders?.[0] || orderResponse.data.order || orderResponse.data;
                        console.log('Final order to use:', orderToUse);
                        console.log('Final order ID:', orderToUse?.id);

                        setLoading(false);

                        Alert.alert(
                            'Payment Successful!',
                            'Your order has been placed successfully.',
                            [
                                {
                                    text: 'View Order',
                                    onPress: () => {
                                        const order = orderResponse.data.orders?.[0] || orderResponse.data.order || orderResponse.data;
                                        navigation.replace('OrderDetail', { orderId: order.id });
                                    },
                                },
                                {
                                    text: 'Go to Orders',
                                    onPress: () => navigation.navigate('Main', { screen: 'Orders' }),
                                },
                            ]
                        );
                    } catch (orderError) {
                        console.error('❌ Order creation failed:', orderError);
                        setLoading(false);
                        Alert.alert(
                            'Order Creation Failed',
                            'Payment was successful but order creation failed. Please contact support with payment ID: ' + data.razorpay_payment_id,
                            [{ text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Orders' }) }]
                        );
                    }
                })
                .catch((error) => {
                    // Payment failed or cancelled
                    console.error('❌ Razorpay error:', error);
                    setLoading(false);
                    if (error.code === RazorpayCheckout.PAYMENT_CANCELLED) {
                        Alert.alert('Payment Cancelled', 'You cancelled the payment.');
                    } else {
                        Alert.alert('Payment Failed', error.description || 'Payment could not be processed.');
                    }
                });
        } catch (error) {
            setLoading(false);
            console.error('❌ Payment initiation error:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });

            const errorMessage = error.userMessage || error.response?.data?.error || error.message || 'Failed to initiate payment';
            Alert.alert('Error', `Payment initiation failed:\n\n${errorMessage}\n\nPlease check your internet connection and try again.`);
        }
    };

    const placeOrder = async () => {
        setLoading(true);
        try {
            console.log('📦 Placing COD order...');
            const response = await api.post('/orders/from-cart', {
                deliveryMethod,
            });

            console.log('✅ COD order placed successfully');
            setLoading(false);

            Alert.alert(
                'Order Placed!',
                'Your order has been placed successfully. Payment will be collected on delivery.',
                [
                    {
                        text: 'View Order',
                        onPress: () => {
                            const createdOrder = response.data.orders?.[0] || response.data.order || response.data;
                            navigation.replace('OrderDetail', { orderId: createdOrder.id });
                        },
                    },
                    {
                        text: 'Go to Orders',
                        onPress: () => navigation.navigate('Main', { screen: 'Orders' }),
                    },
                ]
            );
        } catch (error) {
            console.error('❌ COD order failed:', error);
            setLoading(false);
            const errorMessage = error.userMessage || error.response?.data?.error || 'Failed to place order';
            Alert.alert('Error', errorMessage);
        }
    };

    const renderCartItem = (item) => {
        const days = calculateRentalDays(new Date(item.startDate), new Date(item.endDate));
        const itemTotal = item.product.basePrice * days * item.quantity;

        return (
            <View key={item.id} style={styles.cartItem}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                        {item.product.name}
                    </Text>
                    <Text style={styles.itemDetails}>
                        {days} day(s) × {item.quantity}
                    </Text>
                    <Text style={styles.itemDates}>
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                    </Text>
                </View>
                <Text style={styles.itemPrice}>{formatCurrency(itemTotal)}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    {cartItems.map(renderCartItem)}
                </View>

                {/* Price Breakdown */}
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

                {/* Payment Method Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>

                    <TouchableOpacity
                        style={[
                            styles.paymentMethod,
                            selectedMethod === 'online' && styles.paymentMethodSelected,
                        ]}
                        onPress={() => setSelectedMethod('online')}
                    >
                        <View style={styles.radioOuter}>
                            {selectedMethod === 'online' && <View style={styles.radioInner} />}
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={styles.methodName}>Online Payment</Text>
                            <Text style={styles.methodDesc}>Pay securely via Razorpay (Card/UPI/Netbanking)</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.paymentMethod,
                            selectedMethod === 'cod' && styles.paymentMethodSelected,
                        ]}
                        onPress={() => setSelectedMethod('cod')}
                    >
                        <View style={styles.radioOuter}>
                            {selectedMethod === 'cod' && <View style={styles.radioInner} />}
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={styles.methodName}>Cash on Delivery</Text>
                            <Text style={styles.methodDesc}>Pay when you receive the items</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Payment Info */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>🔒</Text>
                    <Text style={styles.infoText}>
                        {selectedMethod === 'online'
                            ? 'Your payment is secured by Razorpay with 256-bit encryption'
                            : 'You can pay in cash when the items are delivered to you'}
                    </Text>
                </View>
            </ScrollView>

            {/* Footer with Pay Button */}
            <View style={styles.footer}>
                <View style={styles.footerAmount}>
                    <Text style={styles.footerLabel}>Total Amount</Text>
                    <Text style={styles.footerValue}>{formatCurrency(total)}</Text>
                </View>
                <Button
                    title={loading ? 'Processing...' : selectedMethod === 'online' ? 'Pay Now' : 'Place Order'}
                    onPress={handlePayment}
                    loading={loading}
                    disabled={loading}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.base,
    },
    section: {
        backgroundColor: colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.base,
    },
    sectionTitle: {
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    itemInfo: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    itemName: {
        fontSize: theme.fontSizes.base,
        color: colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    itemDetails: {
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    itemDates: {
        fontSize: theme.fontSizes.xs,
        color: colors.textTertiary,
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
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: theme.spacing.md,
        borderWidth: 2,
        borderColor: colors.border,
        borderRadius: theme.borderRadius.base,
        marginBottom: theme.spacing.md,
    },
    paymentMethodSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight || `${colors.primary}10`,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
        marginTop: 2,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.primary,
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        fontSize: theme.fontSizes.base,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    methodDesc: {
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.gray100,
        borderRadius: theme.borderRadius.base,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.base,
    },
    infoIcon: {
        fontSize: 24,
        marginRight: theme.spacing.sm,
    },
    infoText: {
        flex: 1,
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
    },
    footer: {
        backgroundColor: colors.white,
        padding: theme.spacing.base,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...theme.shadows.md,
    },
    footerAmount: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    footerLabel: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
    },
    footerValue: {
        fontSize: theme.fontSizes.xl,
        fontWeight: theme.fontWeights.bold,
        color: colors.primary,
    },
});

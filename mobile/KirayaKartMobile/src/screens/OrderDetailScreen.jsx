import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';


import { colors, theme } from '../constants/theme';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import api from '../services/api';
import { formatCurrency, formatDate, formatOrderStatus } from '../utils/formatters';



export const OrderDetailScreen = ({ route }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrderDetail();
    }, [orderId]);

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get(`/orders/${orderId}`);
            setOrder(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            QUOTATION: colors.statusQuotation,
            RENTAL_ORDER: colors.statusRentalOrder,
            CONFIRMED: colors.statusConfirmed,
            PICKED_UP: colors.statusPickedUp,
            RETURNED: colors.statusReturned,
            CANCELLED: colors.statusCancelled,
        };
        return statusColors[status] || colors.gray500;
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading order details..." />;
    }

    if (error || !order) {
        return <ErrorMessage message={error || 'Order not found'} onRetry={fetchOrderDetail} />;
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{formatOrderStatus(order.status)}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Information</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Order Date</Text>
                    <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
                </View>

                {order.vendor && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Vendor</Text>
                        <Text style={styles.infoValue}>{order.vendor.companyName}</Text>
                    </View>
                )}

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Delivery Method</Text>
                    <Text style={styles.infoValue}>{order.deliveryMethod}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items</Text>

                {order.items.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                        <Text style={styles.itemName}>{item.product.name}</Text>
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemDetail}>Quantity: {item.quantity}</Text>
                            <Text style={styles.itemDetail}>
                                {formatDate(item.startDate)} - {formatDate(item.endDate)}
                            </Text>
                            <Text style={styles.itemPrice}>{formatCurrency(item.lineTotal)}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Summary</Text>

                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Subtotal</Text>
                    <Text style={styles.priceValue}>{formatCurrency(order.subtotal)}</Text>
                </View>

                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Tax</Text>
                    <Text style={styles.priceValue}>{formatCurrency(order.taxAmount)}</Text>
                </View>

                {order.discountAmount > 0 && (
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Discount</Text>
                        <Text style={[styles.priceValue, { color: colors.success }]}>
                            -{formatCurrency(order.discountAmount)}
                        </Text>
                    </View>
                )}

                {order.securityDeposit > 0 && (
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Security Deposit</Text>
                        <Text style={styles.priceValue}>{formatCurrency(order.securityDeposit)}</Text>
                    </View>
                )}

                <View style={[styles.priceRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
                </View>
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
        padding: theme.spacing.base,
        marginBottom: theme.spacing.base,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderNumber: {
        fontSize: theme.fontSizes.xl,
        fontWeight: theme.fontWeights.bold,
        color: colors.textPrimary,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.base,
    },
    statusText: {
        fontSize: theme.fontSizes.xs,
        fontWeight: theme.fontWeights.semibold,
        color: colors.white,
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
        paddingVertical: theme.spacing.sm,
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
    itemCard: {
        padding: theme.spacing.md,
        backgroundColor: colors.gray50,
        borderRadius: theme.borderRadius.base,
        marginBottom: theme.spacing.sm,
    },
    itemName: {
        fontSize: theme.fontSizes.base,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    itemDetails: {
        gap: theme.spacing.xs,
    },
    itemDetail: {
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
    },
    itemPrice: {
        fontSize: theme.fontSizes.base,
        fontWeight: theme.fontWeights.bold,
        color: colors.primary,
        marginTop: theme.spacing.xs,
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
});


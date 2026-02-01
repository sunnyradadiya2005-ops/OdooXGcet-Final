import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';


import { colors, theme } from '../constants/theme';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import api from '../services/api';
import { formatCurrency, formatDate, formatOrderStatus } from '../utils/formatters';



export const OrdersScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setError('');
            const response = await api.get('/orders');
            setOrders(response.data.orders || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOrders();
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

    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
            <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{formatOrderStatus(item.status)}</Text>
                </View>
            </View>

            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>

            {item.vendor && (
                <Text style={styles.orderVendor}>Vendor: {item.vendor.companyName}</Text>
            )}

            <View style={styles.orderFooter}>
                <Text style={styles.itemCount}>
                    {item.items?.length || 0} item(s)
                </Text>
                <Text style={styles.orderTotal}>{formatCurrency(item.totalAmount)}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Your rental orders will appear here</Text>
        </View>
    );

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading orders..." />;
    }

    if (error && orders.length === 0) {
        return <ErrorMessage message={error} onRetry={fetchOrders} />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
    },
    listContent: {
        flexGrow: 1,
        padding: theme.spacing.base,
    },
    orderCard: {
        backgroundColor: colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    orderNumber: {
        fontSize: theme.fontSizes.lg,
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
    orderDate: {
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    orderVendor: {
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    itemCount: {
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
    },
    orderTotal: {
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.bold,
        color: colors.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing['4xl'],
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: theme.spacing.lg,
    },
    emptyText: {
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    emptySubtext: {
        fontSize: theme.fontSizes.sm,
        color: colors.textSecondary,
    },
});


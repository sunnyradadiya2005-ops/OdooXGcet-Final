import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Alert,
} from 'react-native';


import { colors, theme } from '../constants/theme';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useCart } from '../context/CartContext';
import { formatCurrency, formatDate, calculateRentalDays } from '../utils/formatters';



export const CartScreen = ({ navigation }) => {
    const { cartItems, loading, removeFromCart } = useCart();

    const handleRemoveItem = (itemId) => {
        Alert.alert(
            'Remove Item',
            'Are you sure you want to remove this item from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeFromCart(itemId);
                        } catch (err) {
                            Alert.alert('Error', err.message);
                        }
                    },
                },
            ]
        );
    };

    const calculateItemTotal = (item) => {
        const days = calculateRentalDays(new Date(item.startDate), new Date(item.endDate));
        return item.product.basePrice * days * item.quantity;
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart before checking out');
            return;
        }
        navigation.navigate('Checkout');
    };

    const renderCartItem = ({ item }) => {
        const imageUrl = item.product.images && item.product.images.length > 0
            ? item.product.images[0]
            : 'https://via.placeholder.com/100';

        return (
            <View style={styles.cartItem}>
                <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                        {item.product.name}
                    </Text>
                    {item.product.vendor && (
                        <Text style={styles.itemVendor}>{item.product.vendor.companyName}</Text>
                    )}
                    <Text style={styles.itemDates}>
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                    </Text>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(calculateItemTotal(item))}</Text>
                </View>
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.id)}
                >
                    <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Button
                title="Browse Products"
                onPress={() => navigation.navigate('Main')}
                variant="outline"
                style={styles.browseButton}
            />
        </View>
    );

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading cart..." />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmpty}
            />

            {cartItems.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>{formatCurrency(calculateSubtotal())}</Text>
                    </View>
                    <Button title="Proceed to Checkout" onPress={handleCheckout} />
                </View>
            )}
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
    cartItem: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: theme.borderRadius.base,
        backgroundColor: colors.gray100,
    },
    itemDetails: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    itemName: {
        fontSize: theme.fontSizes.base,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    itemVendor: {
        fontSize: theme.fontSizes.xs,
        color: colors.textTertiary,
        marginBottom: theme.spacing.xs,
    },
    itemDates: {
        fontSize: theme.fontSizes.xs,
        color: colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    itemQuantity: {
        fontSize: theme.fontSizes.xs,
        color: colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    itemPrice: {
        fontSize: theme.fontSizes.base,
        fontWeight: theme.fontWeights.bold,
        color: colors.primary,
    },
    removeButton: {
        width: 32,
        height: 32,
        borderRadius: theme.borderRadius.full,
        backgroundColor: colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        fontSize: 18,
        color: colors.error,
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
        color: colors.textSecondary,
        marginBottom: theme.spacing.xl,
    },
    browseButton: {
        minWidth: 200,
    },
    footer: {
        backgroundColor: colors.white,
        padding: theme.spacing.base,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    totalLabel: {
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
    },
    totalValue: {
        fontSize: theme.fontSizes.xl,
        fontWeight: theme.fontWeights.bold,
        color: colors.primary,
    },
});


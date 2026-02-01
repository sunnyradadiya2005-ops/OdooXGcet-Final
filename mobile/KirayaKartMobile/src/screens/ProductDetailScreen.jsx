import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    TouchableOpacity,
} from 'react-native';


import { colors, theme } from '../constants/theme';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { formatCurrency, calculateRentalDays } from '../utils/formatters';
import DatePicker from 'react-native-date-picker';



export const ProductDetailScreen = ({ route, navigation }) => {
    const { productId } = route.params;
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [addingToCart, setAddingToCart] = useState(false);

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000)); // +1 day
    const [quantity, setQuantity] = useState(1);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        fetchProduct();
    }, [productId]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get(`/products/${productId}`);
            setProduct(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!product) return;

        if (endDate <= startDate) {
            Alert.alert('Invalid Dates', 'End date must be after start date');
            return;
        }

        setAddingToCart(true);
        try {
            await addToCart(product.id, startDate, endDate, quantity);
            Alert.alert(
                'Added to Cart',
                'Product has been added to your cart',
                [
                    { text: 'Continue Shopping', style: 'cancel' },
                    { text: 'View Cart', onPress: () => navigation.navigate('Main') },
                ]
            );
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setAddingToCart(false);
        }
    };

    const calculateTotal = () => {
        if (!product) return 0;
        const days = calculateRentalDays(startDate, endDate);
        return product.basePrice * days * quantity;
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading product..." />;
    }

    if (error || !product) {
        return <ErrorMessage message={error || 'Product not found'} onRetry={fetchProduct} />;
    }

    const imageUrl = product.images && product.images.length > 0
        ? product.images[0]
        : 'https://via.placeholder.com/400';

    return (
        <View style={styles.container}>
            <ScrollView>
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

                <View style={styles.content}>
                    <Text style={styles.name}>{product.name}</Text>
                    {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
                    {product.vendor && (
                        <Text style={styles.vendor}>By {product.vendor.companyName}</Text>
                    )}

                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>{formatCurrency(product.basePrice)}</Text>
                        <Text style={styles.priceUnit}>/day</Text>
                    </View>

                    {product.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.description}>{product.description}</Text>
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Rental Period</Text>

                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Text style={styles.dateLabel}>Start Date</Text>
                            <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <Text style={styles.dateLabel}>End Date</Text>
                            <Text style={styles.dateValue}>{endDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>

                        <Text style={styles.rentalDays}>
                            Duration: {calculateRentalDays(startDate, endDate)} day(s)
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quantity</Text>
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Text style={styles.quantityButtonText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => setQuantity(quantity + 1)}
                            >
                                <Text style={styles.quantityButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatCurrency(calculateTotal())}</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Add to Cart"
                    onPress={handleAddToCart}
                    loading={addingToCart}
                />
            </View>

            <DatePicker
                modal
                open={showStartPicker}
                date={startDate}
                mode="date"
                minimumDate={new Date()}
                onConfirm={(date) => {
                    setShowStartPicker(false);
                    setStartDate(date);
                    if (date >= endDate) {
                        setEndDate(new Date(date.getTime() + 86400000));
                    }
                }}
                onCancel={() => setShowStartPicker(false)}
            />

            <DatePicker
                modal
                open={showEndPicker}
                date={endDate}
                mode="date"
                minimumDate={startDate}
                onConfirm={(date) => {
                    setShowEndPicker(false);
                    setEndDate(date);
                }}
                onCancel={() => setShowEndPicker(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    image: {
        width: '100%',
        height: 300,
        backgroundColor: colors.gray100,
    },
    content: {
        padding: theme.spacing.base,
    },
    name: {
        fontSize: theme.fontSizes['2xl'],
        fontWeight: theme.fontWeights.bold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    brand: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    vendor: {
        fontSize: theme.fontSizes.sm,
        color: colors.textTertiary,
        marginBottom: theme.spacing.md,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: theme.spacing.lg,
    },
    price: {
        fontSize: theme.fontSizes['2xl'],
        fontWeight: theme.fontWeights.bold,
        color: colors.primary,
    },
    priceUnit: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
        marginLeft: theme.spacing.xs,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    description: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.gray50,
        padding: theme.spacing.base,
        borderRadius: theme.borderRadius.base,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dateLabel: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
    },
    dateValue: {
        fontSize: theme.fontSizes.base,
        fontWeight: theme.fontWeights.medium,
        color: colors.textPrimary,
    },
    rentalDays: {
        fontSize: theme.fontSizes.sm,
        color: colors.primary,
        fontWeight: theme.fontWeights.medium,
        marginTop: theme.spacing.sm,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 40,
        height: 40,
        backgroundColor: colors.gray100,
        borderRadius: theme.borderRadius.base,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonText: {
        fontSize: theme.fontSizes.xl,
        color: colors.textPrimary,
    },
    quantityText: {
        fontSize: theme.fontSizes.xl,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
        marginHorizontal: theme.spacing.xl,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    totalLabel: {
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
    },
    totalValue: {
        fontSize: theme.fontSizes['2xl'],
        fontWeight: theme.fontWeights.bold,
        color: colors.primary,
    },
    footer: {
        padding: theme.spacing.base,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.white,
    },
});


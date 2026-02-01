import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { colors, theme } from '../constants/theme';
import { formatCurrency } from '../utils/formatters';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing.base * 3) / 2;

export const ProductCard = ({ product, onPress }) => {
    const imageUrl = product.images && product.images.length > 0
        ? product.images[0]
        : 'https://via.placeholder.com/200';

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={2}>
                    {product.name}
                </Text>
                {product.brand && (
                    <Text style={styles.brand} numberOfLines={1}>
                        {product.brand}
                    </Text>
                )}
                <Text style={styles.price}>
                    {formatCurrency(product.basePrice)}/day
                </Text>
                {product.vendor && (
                    <Text style={styles.vendor} numberOfLines={1}>
                        {product.vendor.companyName}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        backgroundColor: colors.white,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.base,
        overflow: 'hidden',
        ...theme.shadows.sm,
    },
    image: {
        width: '100%',
        height: CARD_WIDTH * 0.8,
        backgroundColor: colors.gray100,
    },
    content: {
        padding: theme.spacing.md,
    },
    name: {
        fontSize: theme.fontSizes.sm,
        fontWeight: theme.fontWeights.semibold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    brand: {
        fontSize: theme.fontSizes.xs,
        color: colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    price: {
        fontSize: theme.fontSizes.base,
        fontWeight: theme.fontWeights.bold,
        color: colors.primary,
        marginBottom: theme.spacing.xs,
    },
    vendor: {
        fontSize: theme.fontSizes.xs,
        color: colors.textTertiary,
    },
});

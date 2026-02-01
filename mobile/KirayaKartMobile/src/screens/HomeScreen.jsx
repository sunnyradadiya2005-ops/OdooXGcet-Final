import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';


import { colors, theme } from '../constants/theme';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import api from '../services/api';



export const HomeScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async (pageNum = 1, search = searchQuery) => {
        try {
            if (pageNum === 1) {
                setLoading(true);
            }
            setError('');

            const params = {
                page: pageNum,
                limit: 12,
            };
            if (search) {
                params.search = search;
            }

            const response = await api.get('/products', { params });

            const newProducts = response.data.products || [];

            if (pageNum === 1) {
                setProducts(newProducts);
            } else {
                setProducts(prev => [...prev, ...newProducts]);
            }

            setHasMore(newProducts.length === 12);
            setPage(pageNum);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load products');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchProducts(1);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchProducts(page + 1);
        }
    };

    const handleSearch = () => {
        fetchProducts(1, searchQuery);
    };

    const renderProduct = ({ item }) => (
        <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        />
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Browse Products</Text>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>🔍</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>No products found</Text>
            </View>
        );
    };

    if (loading && products.length === 0) {
        return <LoadingSpinner fullScreen message="Loading products..." />;
    }

    if (error && products.length === 0) {
        return <ErrorMessage message={error} onRetry={() => fetchProducts(1)} />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loading && products.length > 0 ? (
                        <LoadingSpinner message="Loading more..." />
                    ) : null
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
    header: {
        backgroundColor: colors.white,
        padding: theme.spacing.base,
        marginBottom: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: theme.fontSizes.xl,
        fontWeight: theme.fontWeights.bold,
        color: colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        backgroundColor: colors.gray100,
        borderRadius: theme.borderRadius.base,
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.sm,
        fontSize: theme.fontSizes.base,
        marginRight: theme.spacing.sm,
    },
    searchButton: {
        backgroundColor: colors.primary,
        borderRadius: theme.borderRadius.base,
        padding: theme.spacing.sm,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonText: {
        fontSize: 20,
    },
    listContent: {
        padding: theme.spacing.base,
    },
    row: {
        justifyContent: 'space-between',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing['4xl'],
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: theme.spacing.md,
    },
    emptyText: {
        fontSize: theme.fontSizes.base,
        color: colors.textSecondary,
    },
});


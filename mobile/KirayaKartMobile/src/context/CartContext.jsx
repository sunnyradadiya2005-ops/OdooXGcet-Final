import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Fetch cart when user logs in
    useEffect(() => {
        if (user) {
            fetchCart();
        } else {
            setCartItems([]);
        }
    }, [user]);

    const fetchCart = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const response = await api.get('/cart');
            setCartItems(response.data);
        } catch (error) {
            console.error('Fetch cart error:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (productId, startDate, endDate, quantity, variantId) => {
        try {
            await api.post('/cart', {
                productId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                quantity,
                variantId,
            });

            // Refresh cart
            await fetchCart();
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to add to cart');
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            await api.delete(`/cart/${itemId}`);

            // Update local state immediately
            setCartItems(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to remove item');
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        try {
            await api.patch(`/cart/${itemId}`, { quantity });

            // Update local state
            setCartItems(prev =>
                prev.map(item =>
                    item.id === itemId ? { ...item, quantity } : item
                )
            );
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to update quantity');
        }
    };

    const clearCart = async () => {
        try {
            await api.delete('/cart');
            setCartItems([]);
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to clear cart');
        }
    };

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                cartCount,
                loading,
                fetchCart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

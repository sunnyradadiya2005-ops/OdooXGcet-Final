import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing token on app launch
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userStr = await AsyncStorage.getItem('user');

            if (token && userStr) {
                const userData = JSON.parse(userStr);
                setUser(userData);

                // Optionally verify token is still valid
                try {
                    const response = await api.get('/users/me');
                    setUser(response.data);
                    await AsyncStorage.setItem('user', JSON.stringify(response.data));
                } catch (error) {
                    // Token invalid, clear storage
                    await AsyncStorage.multiRemove(['token', 'user']);
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });

            const { token, user: userData } = response.data;

            // Store token and user data
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove(['token', 'user']);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const requestOTP = async (email) => {
        try {
            await api.post('/auth/request-otp', { email });
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to send OTP');
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            const response = await api.post('/auth/verify-otp', { email, otp });
            return response.data.verificationToken;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Invalid OTP');
        }
    };

    const registerCustomer = async (data) => {
        try {
            const response = await api.post('/auth/register/customer', data);

            const { token, user: userData } = response.data;

            // Store token and user data
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                registerCustomer,
                requestOTP,
                verifyOTP,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

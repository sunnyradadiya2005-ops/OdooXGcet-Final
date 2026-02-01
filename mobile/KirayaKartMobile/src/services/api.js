import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getErrorMessage } from '../config/apiConfig';

/**
 * Axios instance configured for KirayaKart API
 * 
 * Configuration is centralized in src/config/apiConfig.js
 * To change backend IP, update the BACKEND_IP constant in apiConfig.js
 */
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: API_CONFIG.HEADERS,
    timeout: API_CONFIG.TIMEOUT,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Log API calls in development
            if (__DEV__) {
                console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
            }
        } catch (error) {
            console.error('Error reading token from storage:', error);
        }
        return config;
    },
    (error) => {
        if (__DEV__) {
            console.error('❌ Request Error:', error);
        }
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        // Log successful responses in development
        if (__DEV__) {
            console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        }
        return response;
    },
    async (error) => {
        // Log errors in development
        if (__DEV__) {
            console.error('❌ API Error:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                message: error.message,
                data: error.response?.data,
            });
        }

        // Handle 401 Unauthorized - clear token and redirect to login
        if (error.response?.status === 401) {
            try {
                await AsyncStorage.multiRemove(['token', 'user']);
                if (__DEV__) {
                    console.log('🔒 Unauthorized - Token cleared');
                }
            } catch (e) {
                console.error('Error clearing storage:', e);
            }
        }

        // Enhance error with user-friendly message
        error.userMessage = getErrorMessage(error);

        return Promise.reject(error);
    }
);

export default api;


/**
 * API Configuration
 * 
 * IMPORTANT: This file contains the backend server configuration
 * 
 * How to find backend server IP:
 * - Windows: Run 'ipconfig' in Command Prompt, look for IPv4 Address
 * - Mac/Linux: Run 'ifconfig' or 'ip addr'
 * 
 * Current Setup:
 * - Backend Server IP: 10.236.250.182
 * - Backend Port: 5000
 * - Network: Same local network (10.236.250.0/24)
 * 
 * For Different Environments:
 * - Physical device on same network: Use backend laptop's IP (current setup)
 * - Android Emulator: Use 'http://10.0.2.2:5000' (special alias for host machine)
 * - iOS Simulator: Use 'http://localhost:5000'
 * 
 * Using ngrok (for remote testing):
 * - Install ngrok: https://ngrok.com/
 * - Run: ngrok http 5000
 * - Copy the https URL and update BACKEND_IP below (without /api)
 */

// ========================================
// CONFIGURATION - UPDATE THIS SECTION
// ========================================

/**
 * Backend server IP address
 * Current: Backend running on laptop at 10.236.250.182
 */
const BACKEND_IP = 'http://10.236.250.182:5000';

// Alternative configurations (uncomment as needed):
// const BACKEND_IP = 'http://10.0.2.2:5000';           // For Android Emulator
// const BACKEND_IP = 'http://localhost:5000';          // For iOS Simulator
// const BACKEND_IP = 'https://your-app.ngrok.io';      // For ngrok tunnel

// ========================================
// DO NOT MODIFY BELOW THIS LINE
// ========================================

export const API_CONFIG = {
    BASE_URL: `${BACKEND_IP}/api`,
    TIMEOUT: 15000, // 15 seconds
    HEADERS: {
        'Content-Type': 'application/json',
    },
};

// Export for easy access
export const BASE_API_URL = API_CONFIG.BASE_URL;

// Network error messages
export const NETWORK_ERRORS = {
    TIMEOUT: 'Request timed out. Please check your internet connection.',
    NO_CONNECTION: 'Cannot connect to server. Please ensure:\n1. Backend server is running\n2. Both devices are on the same network\n3. Backend IP address is correct',
    UNAUTHORIZED: 'Session expired. Please login again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
};

// Helper to get user-friendly error message
export const getErrorMessage = (error) => {
    if (!error) return NETWORK_ERRORS.NETWORK_ERROR;

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return NETWORK_ERRORS.TIMEOUT;
    }

    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        return NETWORK_ERRORS.NO_CONNECTION;
    }

    if (error.response) {
        const status = error.response.status;

        if (status === 401) {
            return NETWORK_ERRORS.UNAUTHORIZED;
        }

        if (status >= 500) {
            return NETWORK_ERRORS.SERVER_ERROR;
        }

        // Return server error message if available
        return error.response.data?.message || error.response.data?.error || NETWORK_ERRORS.SERVER_ERROR;
    }

    return error.message || NETWORK_ERRORS.NETWORK_ERROR;
};

// Log configuration on app start (development only)
if (__DEV__) {
    console.log('📡 API Configuration:');
    console.log('   Base URL:', API_CONFIG.BASE_URL);
    console.log('   Timeout:', API_CONFIG.TIMEOUT + 'ms');
}

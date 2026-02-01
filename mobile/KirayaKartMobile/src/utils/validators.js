// Email validation
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
    const errors = [];

    if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Name validation
export const validateName = (name) => {
    return name.trim().length > 0;
};

// OTP validation
export const validateOTP = (otp) => {
    return /^\d{6}$/.test(otp);
};

import { colors as themeColors } from './colors';

export const colors = themeColors;

export const theme = {
    colors,

    // Typography
    fonts: {
        regular: 'System',
        medium: 'System',
        bold: 'System',
    },

    fontSizes: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },

    fontWeights: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // Spacing
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        base: 16,
        lg: 20,
        xl: 24,
        '2xl': 32,
        '3xl': 40,
        '4xl': 48,
    },

    // Border Radius
    borderRadius: {
        none: 0,
        sm: 4,
        base: 8,
        md: 12,
        lg: 16,
        xl: 20,
        full: 9999,
    },

    // Shadows
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
        base: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 5,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 8,
        },
    },
};

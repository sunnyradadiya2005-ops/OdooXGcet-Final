import prisma from '../lib/prisma.js';

/**
 * Get a setting value with type conversion
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if setting not found
 * @returns {Promise<any>} Setting value with proper type
 */
export async function getSettingValue(key, defaultValue) {
    try {
        const setting = await prisma.setting.findUnique({ where: { key } });
        if (!setting) return defaultValue;

        switch (setting.type) {
            case 'number':
                return parseFloat(setting.value);
            case 'boolean':
                return setting.value === 'true';
            case 'json':
                return JSON.parse(setting.value);
            default:
                return setting.value;
        }
    } catch (err) {
        console.error(`Error getting setting ${key}:`, err);
        return defaultValue;
    }
}

/**
 * Set a setting value
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @param {string} type - Value type ('number', 'string', 'boolean', 'json')
 * @param {string} category - Setting category ('system', 'company', 'rental')
 * @returns {Promise<Setting>} Updated setting
 */
export async function setSettingValue(key, value, type = 'string', category = 'system') {
    return prisma.setting.upsert({
        where: { key },
        create: {
            key,
            value: String(value),
            type,
            category,
        },
        update: {
            value: String(value),
        },
    });
}

/**
 * Get all settings by category
 * @param {string} category - Setting category
 * @returns {Promise<Object>} Settings object with key-value pairs
 */
export async function getSettingsByCategory(category) {
    const settings = await prisma.setting.findMany({ where: { category } });
    const result = {};

    for (const setting of settings) {
        switch (setting.type) {
            case 'number':
                result[setting.key] = parseFloat(setting.value);
                break;
            case 'boolean':
                result[setting.key] = setting.value === 'true';
                break;
            case 'json':
                result[setting.key] = JSON.parse(setting.value);
                break;
            default:
                result[setting.key] = setting.value;
        }
    }

    return result;
}

/**
 * Initialize default settings if they don't exist
 */
export async function initializeDefaultSettings() {
    const defaults = [
        { key: 'tax_rate', value: '0.18', type: 'number', category: 'system' },
        { key: 'late_fee_per_day', value: '100', type: 'number', category: 'rental' },
        { key: 'company_name', value: 'KirayaKart', type: 'string', category: 'company' },
        { key: 'company_address', value: '', type: 'string', category: 'company' },
        { key: 'company_gst', value: '', type: 'string', category: 'company' },
    ];

    for (const setting of defaults) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            create: setting,
            update: {}, // Don't update if exists
        });
    }
}

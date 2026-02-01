import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getSettingValue, setSettingValue, getSettingsByCategory, initializeDefaultSettings } from '../utils/settings.js';

export const settingRoutes = Router();

settingRoutes.use(authenticate);

// Initialize default settings on first request
let initialized = false;
settingRoutes.use(async (req, res, next) => {
    if (!initialized) {
        await initializeDefaultSettings();
        initialized = true;
    }
    next();
});

// Get all settings (admin gets all, others get public only)
settingRoutes.get('/', async (req, res) => {
    try {
        const where = {};

        // Non-admin users only see company settings
        if (req.user.role !== 'ADMIN') {
            where.category = 'company';
        }

        const settings = await prisma.setting.findMany({ where });

        // Convert to key-value object
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

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single setting by key
settingRoutes.get('/:key', async (req, res) => {
    try {
        const setting = await prisma.setting.findUnique({
            where: { key: req.params.key },
        });

        if (!setting) {
            return res.status(404).json({ error: 'Setting not found' });
        }

        // Non-admin can only view company settings
        if (req.user.role !== 'ADMIN' && setting.category !== 'company') {
            return res.status(403).json({ error: 'Access denied' });
        }

        let value;
        switch (setting.type) {
            case 'number':
                value = parseFloat(setting.value);
                break;
            case 'boolean':
                value = setting.value === 'true';
                break;
            case 'json':
                value = JSON.parse(setting.value);
                break;
            default:
                value = setting.value;
        }

        res.json({ key: setting.key, value, type: setting.type, category: setting.category });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update setting (admin only for system/rental, vendor can update company)
settingRoutes.put('/:key', async (req, res) => {
    try {
        const { value } = req.body;

        const existing = await prisma.setting.findUnique({
            where: { key: req.params.key },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Setting not found' });
        }

        // Only admin can update system/rental settings
        if (['system', 'rental'].includes(existing.category) && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const updated = await prisma.setting.update({
            where: { key: req.params.key },
            data: { value: String(value) },
        });

        res.json({ message: 'Setting updated', setting: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk update settings (admin only)
settingRoutes.post('/bulk', requireRole('ADMIN'), async (req, res) => {
    try {
        const { settings } = req.body; // { key: value, ... }

        const updates = [];
        for (const [key, value] of Object.entries(settings)) {
            // Validation
            if (key === 'company_gst' && value && String(value).trim().length !== 15) {
                return res.status(400).json({ error: 'Company GST number must be exactly 15 characters' });
            }

            const existing = await prisma.setting.findUnique({ where: { key } });
            if (existing) {
                updates.push(
                    prisma.setting.update({
                        where: { key },
                        data: { value: String(value) },
                    })
                );
            }
        }

        await Promise.all(updates);

        res.json({ message: `Updated ${updates.length} settings` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

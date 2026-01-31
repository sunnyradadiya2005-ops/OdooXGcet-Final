import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

export const profileRoutes = Router();

profileRoutes.use(authenticate);

// Get current user profile
profileRoutes.get('/', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { vendor: true },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                vendor: {
                    select: {
                        id: true,
                        companyName: true,
                        gstNumber: true,
                        category: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update profile
profileRoutes.put('/', async (req, res) => {
    try {
        const { firstName, lastName, vendorCompanyName, vendorGST } = req.body;

        // Update user
        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                firstName,
                lastName,
            },
        });

        // Update vendor if applicable
        if (req.user.vendor && (vendorCompanyName || vendorGST)) {
            await prisma.vendor.update({
                where: { id: req.user.vendor.id },
                data: {
                    ...(vendorCompanyName && { companyName: vendorCompanyName }),
                    ...(vendorGST && { gstNumber: vendorGST }),
                },
            });
        }

        res.json({ message: 'Profile updated', user: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change password
profileRoutes.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Get user with password hash
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const newHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: req.user.id },
            data: { passwordHash: newHash },
        });

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

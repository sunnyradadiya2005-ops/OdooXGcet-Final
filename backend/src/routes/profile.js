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
                        address: true,
                        city: true,
                        state: true,
                        zipCode: true,
                        country: true,
                        phone: true,
                        website: true,
                        bankName: true,
                        bankAccount: true,
                        ifscCode: true,
                        enableLateFee: true,
                        lateFeeAmount: true,
                        minPaymentPercent: true,
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
        const { firstName, lastName, vendor: vendorData } = req.body;

        // Update user
        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                firstName,
                lastName,
            },
        });

        // Update vendor if applicable
        if (req.user.vendor && vendorData) {
            const updateData = {};
            
            // Company info
            if (vendorData.companyName) updateData.companyName = vendorData.companyName;
            if (vendorData.gstNumber) {
                if (vendorData.gstNumber.trim().length !== 15) {
                    return res.status(400).json({ error: 'GST number must be exactly 15 characters' });
                }
                updateData.gstNumber = vendorData.gstNumber;
            }
            
            // Address
            if (vendorData.address !== undefined) updateData.address = vendorData.address;
            if (vendorData.city !== undefined) updateData.city = vendorData.city;
            if (vendorData.state !== undefined) updateData.state = vendorData.state;
            if (vendorData.zipCode !== undefined) updateData.zipCode = vendorData.zipCode;
            if (vendorData.country !== undefined) updateData.country = vendorData.country;
            
            // Contact
            if (vendorData.phone !== undefined) updateData.phone = vendorData.phone;
            if (vendorData.website !== undefined) updateData.website = vendorData.website;
            
            // Bank details
            if (vendorData.bankName !== undefined) updateData.bankName = vendorData.bankName;
            if (vendorData.bankAccount !== undefined) updateData.bankAccount = vendorData.bankAccount;
            if (vendorData.ifscCode !== undefined) updateData.ifscCode = vendorData.ifscCode;
            
            // Late fee settings
            if (vendorData.enableLateFee !== undefined) updateData.enableLateFee = vendorData.enableLateFee;
            if (vendorData.lateFeeAmount !== undefined) updateData.lateFeeAmount = parseFloat(vendorData.lateFeeAmount);
            if (vendorData.minPaymentPercent !== undefined) updateData.minPaymentPercent = parseFloat(vendorData.minPaymentPercent);
            
            if (Object.keys(updateData).length > 0) {
                await prisma.vendor.update({
                    where: { id: req.user.vendor.id },
                    data: updateData,
                });
            }
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

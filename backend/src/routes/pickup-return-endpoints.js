// Pickup & Return Flow Endpoints

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { sendPickupConfirmation, sendLateReturnAlert } from '../utils/email.js';
import { getSettingValue } from '../utils/settings.js';

// Confirm Pickup
orderRoutes.patch('/:id/pickup', requireRole('VENDOR', 'ADMIN'), async (req, res) => {
    try {
        const order = await prisma.rentalOrder.findUnique({
            where: { id: req.params.id },
            include: {
                customer: true,
                vendor: true,
                items: { include: { product: { select: { name: true } } } },
                pickups: true,
            },
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Validate vendor ownership
        if (req.user.role === 'VENDOR' && order.vendorId !== req.user.vendor?.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Validate order status
        if (order.status !== 'CONFIRMED') {
            return res.status(400).json({ error: 'Order must be CONFIRMED before pickup' });
        }

        // Check if already picked up
        if (order.pickups.length > 0) {
            return res.status(400).json({ error: 'Order already picked up' });
        }

        // Create pickup record
        const pickup = await prisma.pickup.create({
            data: {
                orderId: order.id,
                pickedAt: new Date(),
                notes: req.body.notes || null,
            },
        });

        // Update order status to PICKED_UP
        await prisma.rentalOrder.update({
            where: { id: order.id },
            data: { status: 'PICKED_UP' },
        });

        // Send confirmation email
        try {
            await sendPickupConfirmation(order, order.customer, order.vendor);
        } catch (emailErr) {
            console.error('Failed to send pickup confirmation email:', emailErr);
        }

        res.json({ message: 'Pickup confirmed', pickup });
    } catch (err) {
        console.error('Pickup confirmation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Confirm Return
orderRoutes.patch('/:id/return', requireRole('VENDOR', 'ADMIN'), async (req, res) => {
    try {
        const order = await prisma.rentalOrder.findUnique({
            where: { id: req.params.id },
            include: {
                customer: true,
                vendor: true,
                items: { include: { product: { select: { name: true } } } },
                pickups: true,
                returns: true,
                reservations: true,
                invoices: true,
            },
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Validate vendor ownership
        if (req.user.role === 'VENDOR' && order.vendorId !== req.user.vendor?.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Validate pickup completed
        if (order.pickups.length === 0) {
            return res.status(400).json({ error: 'Order must be picked up before return' });
        }

        // Check if already returned
        if (order.returns.length > 0) {
            return res.status(400).json({ error: 'Order already returned' });
        }

        const returnedAt = new Date();
        const endDate = new Date(order.items[0].endDate);

        // Calculate delay in hours
        const delayMs = returnedAt - endDate;
        const delayHours = Math.max(0, delayMs / (1000 * 60 * 60));
        const delayDays = Math.max(0, Math.ceil((new Date() - new Date(order.items[0].endDate)) / (1000 * 60 * 60 * 24)));
        const LATE_FEE_PER_DAY = await getSettingValue('late_fee_per_day', parseFloat(process.env.LATE_FEE_PER_DAY || '100'));
        const lateFee = delayDays > 0 ? delayDays * LATE_FEE_PER_DAY : 0;

        // Create return record
        const returnRecord = await prisma.return.create({
            data: {
                orderId: order.id,
                returnedAt,
                lateFee: new Decimal(lateFee),
                damageFee: req.body.damageFee ? new Decimal(req.body.damageFee) : new Decimal(0),
                notes: req.body.notes || null,
            },
        });

        // Update order status to RETURNED
        await prisma.rentalOrder.update({
            where: { id: order.id },
            data: { status: 'RETURNED' },
        });

        // Release all reservations (restore stock)
        await prisma.reservation.updateMany({
            where: { orderId: order.id },
            data: { status: 'released' },
        });

        // Update invoice with late fee if applicable
        if (lateFee > 0 && order.invoices.length > 0) {
            const invoice = order.invoices[0];
            const newLateFee = new Decimal(invoice.lateFee).plus(lateFee);
            const additionalAmount = new Decimal(lateFee).plus(req.body.damageFee || 0);
            const newTotal = new Decimal(invoice.totalAmount).plus(additionalAmount);

            await prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    lateFee: newLateFee,
                    totalAmount: newTotal,
                },
            });
        }

        // Send late return alert if overdue
        if (lateFee > 0) {
            try {
                await sendLateReturnAlert(order, order.customer, order.vendor, delayHours, lateFee);
            } catch (emailErr) {
                console.error('Failed to send late return alert:', emailErr);
            }
        }

        res.json({
            message: 'Return confirmed',
            return: {
                ...returnRecord,
                lateFee: Number(returnRecord.lateFee),
                damageFee: Number(returnRecord.damageFee),
            },
            delayDays,
            lateFeeApplied: lateFee,
        });
    } catch (err) {
        console.error('Return confirmation error:', err);
        res.status(500).json({ error: err.message });
    }
});

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const couponRoutes = Router();

couponRoutes.post('/validate', authenticate, async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
      },
    });

    if (!coupon) return res.status(400).json({ valid: false, error: 'Invalid or expired coupon' });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ valid: false, error: 'Coupon usage limit reached' });
    }
    if (amount && coupon.minOrderAmount && parseFloat(amount) < Number(coupon.minOrderAmount)) {
      return res.status(400).json({
        valid: false,
        error: `Minimum order amount ₹${coupon.minOrderAmount} required`,
      });
    }

    let discount = 0;
    const amt = parseFloat(amount) || 0;
    if (coupon.discountType === 'percent') {
      discount = amt * (Number(coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    res.json({
      valid: true,
      discount,
      coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: Number(coupon.discountValue) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

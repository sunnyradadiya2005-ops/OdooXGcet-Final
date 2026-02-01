import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { sendPasswordResetEmail, sendOtpEmail } from '../utils/email.js';

export const authRoutes = Router();

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Furniture',
  'Equipment',
  'Vehicles',
  'Sports',
  'Events',
  'Other',
];

authRoutes.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), message: 'Validation failed' });
      }
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: { email },
        include: { vendor: true },
      });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          vendor: user.vendor ? { id: user.vendor.id, companyName: user.vendor.companyName } : null,
        },
      });
    } catch (err) {
      res.status(500).json({ message: 'Login failed', error: err.message });
    }
  }
);

// Request a 6-digit OTP to verify email before registration
authRoutes.post(
  '/request-otp',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email } = req.body;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await prisma.emailVerification.create({
        data: { email, otp, expiresAt },
      });
      try {
        await sendOtpEmail(email, otp);
      } catch (e) {
        console.error('Failed to send OTP email:', e.message);
      }
      res.json({ message: 'OTP sent to email if it is deliverable' });
    } catch (err) {
      console.error('Request OTP error:', err);
      res.status(500).json({ message: 'Failed to request OTP', error: err.message });
    }
  }
);

// Verify the OTP and return a short-lived verification token for registration
authRoutes.post(
  '/verify-otp',
  [body('email').isEmail().normalizeEmail(), body('otp').isLength({ min: 6, max: 6 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, otp } = req.body;
      const record = await prisma.emailVerification.findFirst({
        where: { email, otp, expiresAt: { gt: new Date() }, verified: false },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
      const token = crypto.randomBytes(24).toString('hex');
      const tokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await prisma.emailVerification.update({
        where: { id: record.id },
        data: { verified: true, verifiedAt: new Date(), token, tokenExp },
      });
      res.json({ message: 'Email verified', verificationToken: token });
    } catch (err) {
      console.error('Verify OTP error:', err);
      res.status(500).json({ message: 'Failed to verify OTP', error: err.message });
    }
  }
);

authRoutes.post(
  '/register/customer',
  [
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    body('email').isEmail().normalizeEmail(),
    body('verificationToken').notEmpty().withMessage('Email verification required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/\d/)
      .withMessage('Password must contain a number'),
    body('confirmPassword').custom((val, { req }) => val === req.body.password),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), message: 'Validation failed' });
      }
      const { firstName, lastName, email, password, verificationToken, referralCode } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      // verify the OTP token exists and is valid
      const ver = await prisma.emailVerification.findFirst({
        where: {
          email,
          token: verificationToken,
          tokenExp: { gt: new Date() },
          verified: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!ver) {
        return res.status(400).json({ message: 'Email not verified or verification token expired' });
      }

      // Referral Logic
      let referredBy = null;
      if (referralCode) {
        const referrer = await prisma.user.findUnique({ where: { referralCode } });
        if (referrer) referredBy = referrer.id;
      }

      // Generate own referral code
      const ownReferralCode = (firstName.slice(0, 3) + Math.random().toString(36).substring(2, 5)).toUpperCase();

      const hash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          emailVerified: true,
          passwordHash: hash,
          firstName,
          lastName,
          role: 'CUSTOMER',
          referralCode: ownReferralCode,
          referredBy,
        },
      });

      // Create Welcome Coupon if referred
      if (referredBy) {
        try {
           await prisma.coupon.create({
            data: {
              code: `WELCOME-${ownReferralCode}`,
              discountType: 'percent',
              discountValue: 10,
              usageLimit: 1,
              validFrom: new Date(),
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              minOrderAmount: 500
            }
           });
        } catch (couponErr) {
           console.error("Failed to create welcome coupon", couponErr);
        }
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      res.status(201).json({
        token,
        user: { id: user.id, email, firstName, lastName, role: 'CUSTOMER', referralCode: ownReferralCode },
      });
    } catch (err) {
      res.status(500).json({ message: 'Registration failed', error: err.message });
    }
  }
);

authRoutes.post(
  '/register/vendor',
  [
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    body('companyName').trim().notEmpty().withMessage('Company name required'),
    body('gstNumber').trim().notEmpty().withMessage('GST number required'),
    body('category').isIn(PRODUCT_CATEGORIES).withMessage('Invalid category'),
    body('email').isEmail().normalizeEmail(),
    body('verificationToken').notEmpty().withMessage('Email verification required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/\d/)
      .withMessage('Password must contain a number'),
    body('confirmPassword').custom((val, { req }) => val === req.body.password),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), message: 'Validation failed' });
      }
      const { firstName, lastName, companyName, gstNumber, category, email, password, verificationToken } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      // verify the OTP token exists and is valid
      const ver = await prisma.emailVerification.findFirst({
        where: {
          email,
          token: verificationToken,
          tokenExp: { gt: new Date() },
          verified: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!ver) {
        return res.status(400).json({ message: 'Email not verified or verification token expired' });
      }
      const hash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          emailVerified: true,
          passwordHash: hash,
          firstName,
          lastName,
          role: 'VENDOR',
          vendor: {
            create: { companyName, gstNumber, category },
          },
        },
        include: { vendor: true },
      });
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email,
          firstName,
          lastName,
          role: 'VENDOR',
          vendor: { id: user.vendor.id, companyName: user.vendor.companyName },
        },
      });
    } catch (err) {
      res.status(500).json({ message: 'Registration failed', error: err.message });
    }
  }
);

authRoutes.get('/categories', (req, res) => {
  res.json(PRODUCT_CATEGORIES);
});

authRoutes.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.json({ message: 'If the email exists, a reset link has been sent.' });
      }
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: token,
          resetTokenExp: new Date(Date.now() + 3600000),
        },
      });
      try {
        await sendPasswordResetEmail(email, token);
      } catch (emailErr) {
        console.error('Email sending error:', emailErr.message);
        // Continue anyway - don't fail the request
      }
      res.json({ message: 'If the email exists, a reset link has been sent.' });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ message: 'Failed to process reset request', error: err.message });
    }
  }
);

authRoutes.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/\d/)
      .withMessage('Password must contain a number'),
    body('confirmPassword').custom((val, { req }) => val === req.body.password).withMessage('Passwords do not match'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { token, password } = req.body;
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExp: { gt: new Date() },
        },
      });
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      const hash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hash,
          resetToken: null,
          resetTokenExp: null,
        },
      });
      res.json({ message: 'Password reset successfully' });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ message: 'Reset failed', error: err.message });
    }
  }
);

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kirayakart.com' },
    update: {},
    create: {
      email: 'admin@kirayakart.com',
      passwordHash: hash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@kirayakart.com' },
    update: {},
    create: {
      email: 'customer@kirayakart.com',
      passwordHash: hash,
      firstName: 'John',
      lastName: 'Customer',
      role: 'CUSTOMER',
      emailVerified: true,
    },
  });

  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@kirayakart.com' },
    update: {},
    create: {
      email: 'vendor@kirayakart.com',
      passwordHash: hash,
      firstName: 'Jane',
      lastName: 'Vendor',
      role: 'VENDOR',
      emailVerified: true,
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      companyName: 'RentPro Solutions',
      gstNumber: '29AABCT1234F1Z5',
      category: 'Electronics',
    },
  });

  const cat1 = await prisma.productCategory.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: { name: 'Electronics', slug: 'electronics', description: 'Electronic devices' },
  });

  const cat2 = await prisma.productCategory.upsert({
    where: { slug: 'furniture' },
    update: {},
    create: { name: 'Furniture', slug: 'furniture', description: 'Home and office furniture' },
  });

  const p1 = await prisma.product.upsert({
    where: { id: 'demo-prod-1' },
    update: {},
    create: {
      id: 'demo-prod-1',
      vendorId: vendor.id,
      categoryId: cat1.id,
      name: 'Canon EOS R5 Camera',
      slug: 'canon-eos-r5-camera',
      description: 'Professional mirrorless camera for events and photography',
      brand: 'Canon',
      basePrice: 2500,
      hourlyRate: 150,
      stockQty: 3,
      images: ['https://picsum.photos/400/300?random=1'],
      isActive: true,
    },
  });

  const p2 = await prisma.product.upsert({
    where: { id: 'demo-prod-2' },
    update: {},
    create: {
      id: 'demo-prod-2',
      vendorId: vendor.id,
      categoryId: cat1.id,
      name: 'Sony A7 III',
      slug: 'sony-a7-iii',
      description: 'Full-frame mirrorless camera',
      brand: 'Sony',
      basePrice: 2000,
      hourlyRate: 120,
      stockQty: 2,
      images: ['https://picsum.photos/400/300?random=2'],
      isActive: true,
    },
  });

  const p3 = await prisma.product.upsert({
    where: { id: 'demo-prod-3' },
    update: {},
    create: {
      id: 'demo-prod-3',
      vendorId: vendor.id,
      categoryId: cat2.id,
      name: 'Office Chair Ergonomic',
      slug: 'office-chair-ergonomic',
      description: 'Premium ergonomic office chair',
      brand: 'Herman Miller',
      basePrice: 500,
      stockQty: 5,
      images: ['https://picsum.photos/400/300?random=3'],
      isActive: true,
    },
  });

  await prisma.productAttribute.createMany({
    data: [
      { productId: p1.id, name: 'Color', value: 'Black' },
      { productId: p1.id, name: 'Color', value: 'Silver' },
      { productId: p2.id, name: 'Color', value: 'Black' },
    ],
    skipDuplicates: true,
  });

  await prisma.rentalPeriod.createMany({
    data: [
      { productId: p1.id, name: '4 Hours', hours: 4, days: 0, multiplier: 0.25 },
      { productId: p1.id, name: '1 Day', days: 1, multiplier: 1 },
      { productId: p1.id, name: '1 Week', days: 7, multiplier: 5 },
      { productId: p2.id, name: '1 Day', days: 1, multiplier: 1 },
      { productId: p2.id, name: '1 Week', days: 7, multiplier: 5 },
      { productId: p3.id, name: '1 Day', days: 1, multiplier: 1 },
      { productId: p3.id, name: '1 Month', days: 30, multiplier: 20 },
    ],
    skipDuplicates: true,
  });

  await prisma.address.upsert({
    where: { id: 'demo-addr-1' },
    update: {},
    create: {
      id: 'demo-addr-1',
      userId: customer.id,
      label: 'Home',
      line1: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400001',
      country: 'India',
      isDefault: true,
    },
  });

  const validFrom = new Date();
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: 'percent',
      discountValue: 10,
      minOrderAmount: 1000,
      maxDiscount: 500,
      usageLimit: 100,
      validFrom,
      validUntil,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FLAT200' },
    update: {},
    create: {
      code: 'FLAT200',
      discountType: 'fixed',
      discountValue: 200,
      minOrderAmount: 1500,
      usageLimit: 50,
      validFrom,
      validUntil,
      isActive: true,
    },
  });

  console.log('Seed completed:');
  console.log('- Admin:', admin.email);
  console.log('- Customer:', customer.email);
  console.log('- Vendor:', vendorUser.email);
  console.log('- Products:', 3);
  console.log('- Coupons: WELCOME10, FLAT200');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

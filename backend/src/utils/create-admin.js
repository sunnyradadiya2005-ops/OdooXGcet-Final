import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      console.log('✓ Admin user already exists:');
      console.log('  Email:', existingAdmin.email);
      console.log('  Name:', existingAdmin.firstName, existingAdmin.lastName);
      console.log('\nIf you forgot the password, you can reset it via the forgot password flow.');
      return;
    }

    // Create new admin user
    const password = 'admin123'; // Default password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@kirayakart.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        emailVerified: true,
      },
    });

    console.log('✓ Admin user created successfully!');
    console.log('\n📧 Email:', admin.email);
    console.log('🔑 Password:', password);
    console.log('\n⚠️  Please change the password after first login!');
  } catch (err) {
    console.error('Failed to create admin user:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

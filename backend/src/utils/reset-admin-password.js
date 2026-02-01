import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  try {
    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: 'ADMIN' },
          { email: 'admin@kirayakart.com' }
        ]
      },
    });

    if (!admin) {
      console.log('❌ No admin user found. Creating one...');
      
      const password = 'Admin@123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const newAdmin = await prisma.user.create({
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
      console.log('\n📧 Email:', newAdmin.email);
      console.log('🔑 Password:', password);
      return;
    }

    // Reset password
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: admin.id },
      data: { 
        passwordHash: hashedPassword,
        emailVerified: true,
      },
    });

    console.log('✓ Admin password reset successfully!');
    console.log('\n📧 Email:', admin.email);
    console.log('🔑 New Password:', newPassword);
    console.log('\n✅ You can now login with these credentials');
  } catch (err) {
    console.error('❌ Failed to reset admin password:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();

import prisma from '../lib/prisma.js';

// Initialize default system settings
export async function seedSettings() {
  const defaultSettings = [
    // General Company Info
    { key: 'company_name', value: 'KirayaKart', dataType: 'string', category: 'general', description: 'Company name', isPublic: true },
    { key: 'company_email', value: 'info@kirayakart.com', dataType: 'string', category: 'general', description: 'Company email', isPublic: true },
    { key: 'company_phone', value: '+91-XXXXXXXXXX', dataType: 'string', category: 'general', description: 'Company phone', isPublic: true },
    { key: 'company_address', value: '', dataType: 'string', category: 'general', description: 'Company address', isPublic: true },
    { key: 'company_city', value: '', dataType: 'string', category: 'general', description: 'Company city', isPublic: true },
    { key: 'company_state', value: '', dataType: 'string', category: 'general', description: 'Company state', isPublic: true },
    { key: 'company_zip', value: '', dataType: 'string', category: 'general', description: 'Company ZIP code', isPublic: true },
    { key: 'gst_number', value: '', dataType: 'string', category: 'general', description: 'GST number', isPublic: false },
    
    // Tax & Fees
    { key: 'tax_rate', value: '0.18', dataType: 'number', category: 'tax', description: 'Tax rate (18%)', isPublic: true },
    { key: 'platform_fee_percent', value: '2.5', dataType: 'number', category: 'tax', description: 'Platform fee percentage', isPublic: false },
    
    // Payment Gateway
    { key: 'razorpay_key_id', value: process.env.RAZORPAY_KEY_ID || '', dataType: 'string', category: 'payment', description: 'Razorpay API Key ID', isPublic: false },
    { key: 'razorpay_key_secret', value: process.env.RAZORPAY_KEY_SECRET || '', dataType: 'string', category: 'payment', description: 'Razorpay API Key Secret', isPublic: false },
    { key: 'payment_mode', value: 'test', dataType: 'string', category: 'payment', description: 'Payment mode (test/live)', isPublic: false },
  ];

  console.log('Seeding default settings...');
  
  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {}, // Don't overwrite existing values
      create: setting,
    });
  }
  
  console.log(`✓ Seeded ${defaultSettings.length} settings`);
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSettings()
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

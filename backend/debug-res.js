import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    reservations.forEach(r => {
      console.log(`Res ID: ${r.id}, ProductId: ${r.productId}, Dates: ${r.startDate.toISOString()} - ${r.endDate.toISOString()}`);
    });
    
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();

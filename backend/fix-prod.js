import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixProduct() {
  const id = 'cml2n9e0v0009ycerg8o6o2n3';
  await prisma.product.update({
    where: { id },
    data: { isActive: true }
  });
  console.log(`Product ${id} has been re-enabled (isActive: true).`);
}

fixProduct()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

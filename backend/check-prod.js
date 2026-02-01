import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkProduct() {
  const id = 'cml2n9e0v0009ycerg8o6o2n3';
  const p = await prisma.product.findUnique({ where: { id } });
  console.log(`Product ${id}: Name=${p?.name}, Active=${p?.isActive}`);
}

checkProduct()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

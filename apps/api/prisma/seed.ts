import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const menu = Array.from({ length: 20 }).map((_, i) => ({
    name: ['Americano', 'Latte', 'Cappuccino', 'Mocha'][i % 4] + ' #' + (i + 1),
    price: 60 + (i % 5) * 5,
    img: null as string | null,
  }));

  await prisma.$transaction([prisma.order.deleteMany(), prisma.menuItem.deleteMany()]);

  await prisma.menuItem.createMany({ data: menu });
  console.log('Seeded menu items:', menu.length);
}

main().finally(async () => prisma.$disconnect());

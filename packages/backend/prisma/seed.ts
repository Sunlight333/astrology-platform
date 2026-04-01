import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      type: 'natal_chart',
      name: 'Mapa Astral Completo',
      priceBrl: 97.0,
      active: true,
    },
    {
      type: 'transit_report',
      name: 'Relatório de Trânsitos',
      priceBrl: 67.0,
      active: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { type: product.type },
      update: { name: product.name, priceBrl: product.priceBrl },
      create: product,
    });
  }

  console.log('Seed completed: products created.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

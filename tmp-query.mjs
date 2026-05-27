import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const restaurants = await prisma.restaurant.findMany({ take: 10, orderBy: { createdAt: 'asc' } });
  const counts = {
    restaurants: await prisma.restaurant.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
  };
  console.log(JSON.stringify({ counts, restaurants }, null, 2));
  if (restaurants.length > 0) {
    const rid = restaurants[0].id;
    const cats = await prisma.category.findMany({ where: { restaurantId: rid } });
    const prods = await prisma.product.findMany({ where: { restaurantId: rid }, take: 10 });
    console.log('restaurant0', rid, JSON.stringify({ cats: cats.length, prods: prods.length }, null, 2));
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });

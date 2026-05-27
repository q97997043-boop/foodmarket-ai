import { menuRouter } from './api/menu-router.ts';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'test@example.com' } });
  if (!user) throw new Error('User not found');
  const caller = menuRouter.createCaller({ user });
  const categories = await caller.getCategories({ restaurantId: user.restaurantId });
  const products = await caller.getProducts({ restaurantId: user.restaurantId });
  console.log('user', JSON.stringify(user, null, 2));
  console.log('categories', categories.length, JSON.stringify(categories.slice(0,5), null, 2));
  console.log('products', products.length, JSON.stringify(products.slice(0,5), null, 2));
  await prisma.$disconnect();
}
main().catch((e)=>{ console.error(e); process.exit(1); });

import { PrismaClient } from '@prisma/client';
import { menuRouter } from '../api/menu-router';

const prisma = new PrismaClient();

async function main(){
  const user = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  if (!user) throw new Error('No owner user found');
  if (!user.restaurantId) throw new Error('User has no restaurantId');
  const caller = menuRouter.createCaller({ user });
  console.log('CREATING CATEGORY for restaurant', user.restaurantId);
  const created = await caller.createCategory({ restaurantId: user.restaurantId, name: 'AutoCategory' });
  console.log('CREATED', created);
  await prisma.$disconnect();
}

main().catch(e=>{ console.error('ERROR', e); process.exit(1); });

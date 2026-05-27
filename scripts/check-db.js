import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({ take: 5 });
    console.log('USERS_SAMPLE', users);
  } catch (err) {
    console.error('DB CHECK ERROR', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

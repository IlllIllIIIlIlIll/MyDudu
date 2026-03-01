import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.log('Database connectivity: OK');

  const budiUsers = await prisma.user.findMany({
    where: { fullName: { contains: 'Budi', mode: 'insensitive' } },
    select: { id: true, fullName: true, email: true },
    orderBy: { id: 'asc' },
  });

  if (budiUsers.length === 0) {
    console.log('No user with name containing "Budi" found.');
  } else {
    console.log(`Found ${budiUsers.length} user(s) containing "Budi":`);
    for (const user of budiUsers) {
      console.log(`- id=${user.id}, fullName=${user.fullName}, email=${user.email ?? '-'}`);
    }
  }
}

main()
  .catch((error) => {
    console.error('Connectivity or query check failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const parents = await prisma.user.findMany({
        where: { role: 'PARENT' },
        select: { id: true, fullName: true, nik: true, birthDate: true }
    });
    console.log("PARENT USERS IN DB:");
    console.log(JSON.stringify(parents, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

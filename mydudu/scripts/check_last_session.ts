import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const lastSession = await prisma.session.findFirst({
        orderBy: { recordedAt: 'desc' },
        include: { device: true },
    });

    console.log('Last Session:', JSON.stringify(lastSession, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const sessions = await prisma.session.findMany({
            orderBy: { recordedAt: 'desc' },
            include: {
                child: { select: { fullName: true } },
                device: { select: { name: true } }
            }
        });

        console.log(`Found ${sessions.length} sessions:`);
        if (sessions.length === 0) {
            console.log('No sessions found.');
        } else {
            // Print full objects with infinite depth
            console.dir(sessions, { depth: null, colors: true });
        }
    } catch (error) {
        console.error('Error listing sessions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

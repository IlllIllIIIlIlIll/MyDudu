import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const sessions = await prisma.session.findMany({
        orderBy: { recordedAt: 'desc' },
        take: 10,
        select: {
            id: true,
            sessionUuid: true,
            status: true,
            childId: true,
            measurementCompleted: true,
            examOutcome: true,
            recordedAt: true
        }
    });
    fs.writeFileSync('sessions.json', JSON.stringify(sessions, null, 2), 'utf8');
}

main().catch(console.error).finally(() => prisma.$disconnect());

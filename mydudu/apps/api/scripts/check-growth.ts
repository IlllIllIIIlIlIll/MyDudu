
import { PrismaClient } from '@prisma/client';
import { GrowthService } from '../src/growth/growth.service';
import { PrismaService } from '../src/prisma/prisma.service';

// Mock NestJS dependency injection
const prisma = new PrismaClient() as unknown as PrismaService;
const growthService = new GrowthService(prisma);

async function run() {
    const id = parseInt(process.argv[2] || '15', 10);
    const session = await prisma.session.findUnique({
        where: { id },
        include: {
            child: true,
        }
    });

    if (!session || !session.child) {
        console.log(`Session ${id} or child not found`);
        return;
    }

    const recordDate = session.recordedAt || new Date();
    const birthDate = session.child.birthDate;
    const diffTime = Math.abs(recordDate.getTime() - birthDate.getTime());
    const ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log('--- Invoking Analyze Growth ---');
    const result = await growthService.analyzeGrowth(
        session.child.id,
        session.child.gender,
        ageDays,
        session.weight ? Number(session.weight) : undefined,
        session.height ? Number(session.height) : undefined
    );

    console.log('--- Result ---');
    console.log(JSON.stringify(result, null, 2));
}

run()
    .catch(console.error)
    .finally(() => (prisma as any).$disconnect());

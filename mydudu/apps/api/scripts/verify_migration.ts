import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== Verifying Session Status Enum ===\n');

    // Check distinct status values in DB
    const statuses = await prisma.$queryRaw<{ status: string }[]>`
        SELECT DISTINCT status FROM "sessions" ORDER BY status
    `;
    console.log('Distinct status values in sessions table:');
    console.table(statuses);

    // Check session 24 nutrition status (as user requested)
    console.log('\n=== NutritionStatus for Session 24 ===\n');
    const nutrition = await prisma.nutritionStatus.findMany({
        where: { sessionId: 24 }
    });
    if (nutrition.length === 0) {
        console.log('[] → No nutrition records for session 24. Nutrition engine not persisting for this session.');
    } else {
        console.dir(nutrition, { depth: null, colors: true });
    }

    // Also show all sessions with their status
    console.log('\n=== All Sessions (id, status, measurementCompleted) ===\n');
    const sessions = await prisma.session.findMany({
        select: {
            id: true,
            status: true,
            examOutcome: true,
            measurementCompleted: true,
            recordedAt: true,
        },
        orderBy: { id: 'desc' },
        take: 20
    });
    console.table(sessions);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

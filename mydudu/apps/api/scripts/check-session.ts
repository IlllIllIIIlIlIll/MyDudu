
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    const id = parseInt(process.argv[2] || '15', 10);
    const session = await prisma.session.findUnique({
        where: { id },
        include: {
            child: true,
            device: true
        }
    });

    if (!session) {
        console.log(`Session ${id} not found`);
        return;
    }

    console.log('Session Details:');
    console.log(`ID: ${session.id}`);
    console.log(`Weight: ${session.weight}`);
    console.log(`Height: ${session.height}`);
    console.log(`RecordedAt: ${session.recordedAt}`);

    if (session.child) {
        console.log('Child Details:');
        console.log(`  ID: ${session.child.id}`);
        console.log(`  DOB: ${session.child.birthDate}`);
        console.log(`  Gender: ${session.child.gender}`);
    } else {
        console.log('No child associated');
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

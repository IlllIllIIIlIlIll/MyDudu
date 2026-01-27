import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const session = await prisma.session.findFirst({
        orderBy: { recordedAt: 'desc' },
        include: { device: true } // No longer need measurements relation inclusion
    });

    if (session) {
        console.log('--- VERIFICATION SUCCESS (Refactored) ---');
        console.log(`Session ID: ${session.id}`);
        console.log(`Device: ${session.device.deviceUuid}`);
        console.log(`RecordedAt: ${session.recordedAt}`);
        console.log('--- Metrics ---');
        console.log(`Weight: ${session.weight}`);
        console.log(`Height: ${session.height}`);
        console.log(`Temperature: ${session.temperature}`);
        // console.log(`Head Circ: ${session.headCirc}`);
        console.log(`Heart Rate: ${session.heartRate}`);
        console.log(`Noise Level: ${session.noiseLevel}`);
        console.log('---------------------------');
    } else {
        console.log('--- VERIFICATION FAILED: No session found ---');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const deviceUuid = 'MDX-0001';
    console.log(`Checking sessions for: ${deviceUuid}`);

    const device = await prisma.device.findUnique({
        where: { deviceUuid },
        include: {
            sessions: {
                orderBy: { recordedAt: 'desc' },
                take: 3,
                include: { device: true }
            }
        }
    });

    if (!device) {
        console.log('Device not found'); return;
    }

    console.log(`Found ${device.sessions.length} sessions.`);

    if (device.sessions.length > 0) {
        const session = device.sessions[0];
        console.log(`LATEST SESSION ID: ${session.id}`);
        console.log(`Time: ${session.recordedAt}`);
        console.log(`Status: ${session.status}`);
        console.log("--------------------------------");
        console.log(`Child ID: ${session.childId}`);
        console.log(`Height  : ${session.height}`);   // Should come from Sensor
        console.log(`Weight  : ${session.weight}`);   // Should come from Scale
        console.log(`HeartRt : ${session.heartRate}`);// Should come from Sensor
        console.log("--------------------------------");

        if (session.height && session.weight) {
            console.log("SUCCESS: Session has both Height and Weight!");
        } else {
            console.log("PARTIAL: Session missing data. Check logic.");
        }
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

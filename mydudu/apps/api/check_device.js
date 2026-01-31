
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const deviceUuid = 'MD-0001';
    console.log(`Checking device: ${deviceUuid}`);

    const device = await prisma.device.findUnique({
        where: { deviceUuid },
        include: {
            sessions: {
                orderBy: { recordedAt: 'desc' },
                take: 1
            }
        }
    });

    if (!device) {
        console.log(`Device ${deviceUuid} not found in DB.`);
        return;
    }

    console.log(`Device ID: ${device.id}`);
    console.log(`Name: ${device.name}`);
    console.log(`Status: ${device.status}`);

    if (device.sessions.length > 0) {
        const lastSession = device.sessions[0];
        console.log(`Last Session: ${lastSession.recordedAt}`);
        console.log(`Session UUID: ${lastSession.sessionUuid}`);
    } else {
        console.log("No sessions found.");
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

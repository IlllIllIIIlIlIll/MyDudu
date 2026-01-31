
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const deviceUuid = 'MDX-0001';
    const posyanduId = 471;
    console.log(`Registering device: ${deviceUuid}`);

    // Check if Posyandu exists first
    const posyandu = await prisma.posyandu.findUnique({
        where: { id: posyanduId }
    });

    if (!posyandu) {
        console.error(`Error: Posyandu ID ${posyanduId} NOT FOUND.`);
        // List some posyandus as suggestion?
        const existingPosyandus = await prisma.posyandu.findMany({ take: 3 });
        console.log('Available Posyandus:', existingPosyandus.map(p => `${p.id}: ${p.name}`));
        return;
    }

    const existing = await prisma.device.findUnique({
        where: { deviceUuid },
    });

    if (existing) {
        console.log(`Device ${deviceUuid} already exists. ID: ${existing.id}`);
        // Update it to match requirements if needed
        await prisma.device.update({
            where: { id: existing.id },
            data: {
                posyanduId: posyanduId,
                status: 'INACTIVE'
            }
        });
        console.log("Updated existing device to match requirements.");
        return;
    }

    const device = await prisma.device.create({
        data: {
            deviceUuid: deviceUuid,
            name: 'Split-Unit Device',
            status: 'INACTIVE',
            posyanduId: posyanduId
        }
    });

    console.log(`Device created successfully!`);
    console.log(`ID: ${device.id}`);
    console.log(`UUID: ${device.deviceUuid}`);
    console.log(`Status: ${device.status}`);
    console.log(`Posyandu ID: ${device.posyanduId}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

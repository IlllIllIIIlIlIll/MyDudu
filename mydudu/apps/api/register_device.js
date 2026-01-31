
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const deviceUuid = 'MD-0001';
    console.log(`Registering device: ${deviceUuid}`);

    // Check if exists first
    const existing = await prisma.device.findUnique({
        where: { deviceUuid },
    });

    if (existing) {
        console.log(`Device ${deviceUuid} already exists. ID: ${existing.id}`);
        return;
    }

    // Create device
    // We'll leave posyanduId null for now unless we find one
    const device = await prisma.device.create({
        data: {
            deviceUuid: deviceUuid,
            name: 'Prototype Device 01',
            status: 'AVAILABLE' // DeviceStatus enum
        }
    });

    console.log(`Device created successfully!`);
    console.log(`ID: ${device.id}`);
    console.log(`UUID: ${device.deviceUuid}`);
    console.log(`Status: ${device.status}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

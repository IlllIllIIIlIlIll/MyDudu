
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const deviceUuid = 'MD-0002';
    console.log(`Registering device: ${deviceUuid}`);

    const existing = await prisma.device.findUnique({
        where: { deviceUuid },
    });

    if (existing) {
        console.log(`Device ${deviceUuid} already exists. ID: ${existing.id}`);
        return;
    }

    const device = await prisma.device.create({
        data: {
            deviceUuid: deviceUuid,
            name: 'Prototype Scale 01',
            status: 'AVAILABLE'
        }
    });

    console.log(`Device created successfully!`);
    console.log(`ID: ${device.id}`);
    console.log(`UUID: ${device.deviceUuid}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

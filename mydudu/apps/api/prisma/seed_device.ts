import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const deviceUuid = 'MD-0001';

    // Create a dummy Posyandu first if not exists
    let posyandu = await prisma.posyandu.findFirst();
    if (!posyandu) {
        // Need a Village and District first?
        // Let's see if we can create just Posyandu? No, it needs villageId.
        // Let's just create Device without posyanduId if allowed.
        // Schema: posyanduId Int? -> Allowed.
    }

    const device = await prisma.device.upsert({
        where: { deviceUuid },
        update: {},
        create: {
            deviceUuid,
            name: 'Test Device 1',
            // status field removed from schema
            // other fields are optional
        },
    });

    console.log(`Upserted device: ${device.deviceUuid}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

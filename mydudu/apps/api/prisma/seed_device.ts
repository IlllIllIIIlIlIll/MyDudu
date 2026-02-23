import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // 1. Create or Find District
    const district = await prisma.district.upsert({
        where: { code: 'D-01' },
        update: {},
        create: {
            name: 'Kecamatan Contoh',
            code: 'D-01',
        },
    });
    console.log(`District ensured: ${district.name}`);

    // 2. Create or Find Village
    const village = await prisma.village.upsert({
        where: { code: 'V-01' },
        update: {},
        create: {
            name: 'Kelurahan Sehat',
            code: 'V-01',
            districtId: district.id,
        },
    });
    console.log(`Village ensured: ${village.name}`);

    // 3. Removed Posyandu creation

    // 4. Create Devices
    const devicesData = [
        { uuid: 'MD-0001', name: 'Scale & Height A' },
        { uuid: 'MD-0002', name: 'Scale & Height B' },
        { uuid: 'MD-0003', name: 'Thermometer X' },
    ];

    for (const d of devicesData) {
        const device = await prisma.device.upsert({
            where: { deviceUuid: d.uuid },
            update: {
                villageId: village.id, // Update relation just in case
            },
            create: {
                deviceUuid: d.uuid,
                name: d.name,
                villageId: village.id,
                status: 'AVAILABLE',
            },
        });
        console.log(`Device ensured: ${device.deviceUuid}`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Parent Data...');

    const nik = '3276012345678901';
    let user = await prisma.user.findFirst({
        where: { nik },
        include: { parentProfile: true }
    });

    // Find a valid village
    const village = await prisma.village.findFirst();
    const villageId = village ? village.id : null;

    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'parent.demo@example.com',
                fullName: 'Wali anak Demo Parenting',
                role: 'PARENT',
                nik: nik,
                status: 'ACTIVE',
                parentProfile: {
                    create: {
                        villageId: villageId
                    }
                }
            },
            include: { parentProfile: true }
        });
        console.log('Created Parent User:', user.fullName);
    } else {
        console.log('Parent User already exists:', user.fullName);
        if (!user.parentProfile) {
            await prisma.parent.create({
                data: {
                    parentId: user.id,
                    villageId: villageId
                }
            });
            console.log('Created Parent Profile for existing user');
        }
    }

    // Reload user with parent profile
    const parentProfile = await prisma.parent.findUnique({ where: { parentId: user.id } });
    if (!parentProfile) throw new Error('Failed to get parent profile');


    // 2. Create Child
    const childName = 'Anak Demo Kecil';
    let child = await prisma.child.findFirst({
        where: { parentId: parentProfile.id, fullName: childName }
    });

    if (!child) {
        child = await prisma.child.create({
            data: {
                parentId: parentProfile.id,
                fullName: childName,
                birthDate: new Date('2024-01-01'), // 2 years old approx
                gender: 'M',
                bloodType: 'O'
            }
        });
        console.log('Created Child:', child.fullName);
    } else {
        console.log('Child already exists:', child.fullName);
    }

    // 3. Create Session Data (History)
    // Create 5 sessions over last 5 months
    const sessions = await prisma.session.findMany({ where: { childId: child.id } });

    if (sessions.length === 0) {
        console.log('Seeding sessions...');
        const baseDate = new Date();
        const baseWeight = 10.0;
        const baseHeight = 80.0;

        // Need a valid device and posyandu? 
        // We can create a dummy device or find one.
        let device = await prisma.device.findFirst();
        if (!device) {
            // Create a dummy posyandu first if needed, but lets assume seed.js ran.
            // If not, we might fail here.
            // Let's create a fallback device/posyandu just in case.
            const district = await prisma.district.create({
                data: { name: 'Demo District', code: 'DMO' }
            });
            const village = await prisma.village.create({
                data: { name: 'Demo Village', code: 'DMO-V1', districtId: district.id }
            });
            device = await prisma.device.create({
                data: { deviceUuid: 'DEMO-001', name: 'Demo Scale', villageId: village.id, status: 'AVAILABLE' }
            });
        }

        for (let i = 4; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);

            // Random variation
            const weight = baseWeight + (5 - i) * 0.2 + (Math.random() * 0.1);
            const height = baseHeight + (5 - i) * 0.5 + (Math.random() * 0.2);
            const temp = 36.5 + (Math.random() * 0.5);

            await prisma.session.create({
                data: {
                    sessionUuid: `SES-${child.id}-${5 - i}`,
                    childId: child.id,
                    deviceId: device.id,
                    recordedAt: date,
                    status: 'CLINICALLY_DONE',
                    weight: weight,
                    height: height,
                    temperature: temp,
                    heartRate: 90 + Math.random() * 10,
                }
            });
            console.log(`Created session for month -${i}`);
        }
    } else {
        console.log('Sessions already exist.');
    }

    console.log('Seeding Parent Data Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

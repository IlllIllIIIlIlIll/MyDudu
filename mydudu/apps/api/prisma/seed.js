const { PrismaClient, UserRole, UserStatus, NutritionCategory, DeviceStatus, NotifType, NotifStatus } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // 1. Clean up (Optional, commented out)
    // await prisma.notification.deleteMany();
    // await prisma.auditLog.deleteMany();
    // await prisma.incident.deleteMany();
    // await prisma.nutritionStatus.deleteMany();
    // await prisma.session.deleteMany();
    // await prisma.child.deleteMany();
    // await prisma.device.deleteMany();
    // await prisma.parentProfile.deleteMany();
    // await prisma.user.deleteMany();
    // await prisma.posyandu.deleteMany();
    // await prisma.village.deleteMany();
    // await prisma.district.deleteMany();

    // 2. Locations
    const district = await prisma.district.upsert({
        where: { code: 'D01' },
        update: {},
        create: {
            name: 'Kecamatan Contoh',
            code: 'D01',
        },
    });

    const village = await prisma.village.upsert({
        where: { code: 'V01' },
        update: {},
        create: {
            name: 'Desa Sehat',
            code: 'V01',
            districtId: district.id,
        },
    });

    const posyandu = await prisma.posyandu.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Posyandu Mawar',
            address: 'Jl. Merdeka No. 1',
            villageId: village.id,
        },
    });

    // 3. Users
    const passwordHash = await argon2.hash('password123');

    // Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@dudu.com' },
        update: {},
        create: {
            fullName: 'Super Admin',
            email: 'admin@dudu.com',
            passwordHash,
            role: 'ADMIN', // specific string if enum lookup fails in JS, but require should work
            status: 'ACTIVE',
        },
    });

    // Puskesmas User
    await prisma.user.upsert({
        where: { email: 'puskesmas@dudu.com' },
        update: {},
        create: {
            fullName: 'Kepala Puskesmas',
            email: 'puskesmas@dudu.com',
            passwordHash,
            role: 'PUSKESMAS',
            districtId: district.id,
        },
    });

    // 10 Pending Users
    for (let i = 0; i < 5; i++) {
        await prisma.user.create({
            data: {
                fullName: `Pending User ${i}`,
                email: `pending${i}@test.com`,
                passwordHash,
                role: 'POSYANDU',
                status: 'PENDING',
            },
        });
    }

    // 4. Devices
    const devices = [];
    for (let i = 1; i <= 15; i++) {
        const device = await prisma.device.upsert({
            where: { deviceUuid: `DEV-${i.toString().padStart(3, '0')}` },
            update: {},
            create: {
                deviceUuid: `DEV-${i.toString().padStart(3, '0')}`,
                name: `Dudu Scale ${i}`,
                posyanduId: posyandu.id,
                isActive: i <= 12, // 12 active, 3 inactive
            },
        });
        devices.push(device);
    }

    // 5. Parent & Children for Sessions
    const parentUser = await prisma.user.create({
        data: {
            fullName: 'Ibu Budi',
            email: `ibu.budi.${Date.now()}@test.com`,
            passwordHash,
            role: 'PARENT',
        }
    });

    const parentProfile = await prisma.parentProfile.create({
        data: {
            userId: parentUser.id,
            address: 'Jl. Melati',
        }
    });

    const child = await prisma.child.create({
        data: {
            parentId: parentProfile.id,
            fullName: 'Anak Budi',
            birthDate: new Date('2024-01-01'),
            gender: 'M'
        }
    });

    // 6. Sessions (Today & Past)
    // Create 50 sessions
    for (let i = 0; i < 50; i++) {
        const isToday = i < 15; // 15 sessions today
        const date = new Date();
        if (!isToday) {
            date.setDate(date.getDate() - Math.floor(Math.random() * 10));
        } else {
            date.setHours(8 + Math.floor(Math.random() * 8)); // Valid hours today
        }

        const session = await prisma.session.create({
            data: {
                sessionUuid: `SES-${Date.now()}-${i}`,
                childId: child.id,
                deviceId: devices[i % devices.length].id,
                recordedAt: date,
                status: 'COMPLETE',
                weight: 10 + Math.random() * 5,
                height: 80 + Math.random() * 10,
            }
        });

        // Nutrition Status
        const categories = ['NORMAL', 'STUNTED', 'WASTED', 'OBESE'];
        const category = categories[Math.floor(Math.random() * categories.length)];

        await prisma.nutritionStatus.create({
            data: {
                sessionId: session.id,
                category: category,
                bbU: 0,
                tbU: 0,
                bbTb: 0
            }
        });
    }

    // 7. Incidents
    await prisma.incident.create({
        data: {
            title: 'Device Sync Failure',
            description: 'Device D005 failed to sync repeatedly',
            priority: 'HIGH',
            status: 'OPEN',
            deviceId: devices[0].id
        }
    });

    await prisma.incident.create({
        data: {
            title: 'Battery Low Alert',
            description: 'Device D002 reports 10% battery',
            priority: 'MEDIUM',
            status: 'OPEN',
            deviceId: devices[1].id
        }
    });

    await prisma.incident.create({
        data: {
            title: 'Connection Timeout',
            priority: 'LOW',
            status: 'RESOLVED',
            resolvedAt: new Date(),
            deviceId: devices[2].id
        }
    });

    // 8. Audit Logs
    const actions = ['USER_LOGIN', 'DEVICE_REGISTER', 'DATA_EXPORT', 'USER_UPDATE'];
    for (let i = 0; i < 10; i++) {
        await prisma.auditLog.create({
            data: {
                action: actions[i % actions.length],
                userId: admin.id,
                details: { ip: '192.168.1.1' },
                createdAt: new Date(Date.now() - i * 3600000)
            }
        });
    }

    // 9. Notifications
    await prisma.notification.create({
        data: {
            userId: admin.id, // Assign to admin
            type: 'SYSTEM',
            message: 'System backup completed successfully',
            status: 'SENT'
        }
    });

    await prisma.notification.create({
        data: {
            userId: admin.id,
            type: 'REMINDER',
            message: 'Monthly report is due tomorrow',
            status: 'SENT'
        }
    });

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

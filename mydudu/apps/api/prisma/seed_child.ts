import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Ensure we have a parent profile first
    let user = await prisma.user.findFirst({ where: { role: 'PARENT' } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'parent@example.com',
                fullName: 'Test Parent',
                role: 'PARENT',
                passwordHash: 'dummy',
                parentProfile: {
                    create: {
                        phoneNumber: '08123456789'
                    }
                }
            }
        });
        console.log('Created parent user');
    }

    let parentProfile = await prisma.parentProfile.findUnique({ where: { userId: user.id } });

    // Create Child ID 1
    const child = await prisma.child.upsert({
        where: { id: 1 },
        update: {},
        create: {
            parentId: parentProfile!.id,
            fullName: 'Test Child',
            birthDate: new Date('2023-01-01'),
            gender: 'M',
        }
    });
    console.log(`Upserted child: ${child.id} - ${child.fullName}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

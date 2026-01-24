import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const admins = [
        { email: 'dudu.innovillage@gmail.com', fullName: 'Dudu Internal', role: 'ADMIN' },
        { email: 'izza.diasputra10@gmail.com', fullName: 'Izza Diasputra', role: 'ADMIN' },
    ];

    for (const admin of admins) {
        const user = await prisma.user.upsert({
            where: { email: admin.email },
            update: { role: admin.role as any, status: 'ACTIVE' as any },
            create: {
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role as any,
                status: 'ACTIVE' as any,
                passwordHash: 'firebase-managed',
            },
        });
        console.log(`Upserted admin: ${user.email}`);
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

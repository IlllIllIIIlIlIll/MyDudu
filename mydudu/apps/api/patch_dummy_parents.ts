import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function patch() {
    console.log("Patching existing dummy parents...");

    // For the main demo parent
    await prisma.user.updateMany({
        where: { nik: '3276012345678901' },
        data: { birthDate: new Date('1990-01-01') }
    });

    // For the dummy pemeriksaan parent
    await prisma.user.updateMany({
        where: { email: 'orangtua.pemeriksaan.dummy@mydudu.local' },
        data: { nik: '3276011111111111', birthDate: new Date('1995-10-15') }
    });

    console.log("Patch complete! You can now login with: \nNIK: 3276012345678901 \nDOB: 01011990\n----------------\nNIK: 3276011111111111 \nDOB: 15101995");
}

patch().catch(console.error).finally(() => prisma.$disconnect());

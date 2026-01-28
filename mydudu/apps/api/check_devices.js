
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.device.count();
    console.log(`There are ${count} devices in the database.`);
    const devices = await prisma.device.findMany({ include: { posyandu: true } });
    console.log(JSON.stringify(devices, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

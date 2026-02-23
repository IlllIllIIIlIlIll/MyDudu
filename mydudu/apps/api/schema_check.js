const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    try {
        const res = await prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name = 'schedules';");
        fs.writeFileSync('schema_check.json', JSON.stringify(res, null, 2));
    } catch (err) {
        console.error('Error querying:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();

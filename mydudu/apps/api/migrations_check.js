const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    try {
        const migrations = await prisma.$queryRawUnsafe('SELECT * FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;');
        fs.writeFileSync('migrations-history.json', JSON.stringify(migrations, null, 2));
    } catch (err) {
        console.error('Error querying:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();

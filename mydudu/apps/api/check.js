const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE CHECK ---');
    try {
        const users = await prisma.user.count();
        const children = await prisma.child.count();
        const villages = await prisma.village.count();
        const schedules = await prisma.schedule.count();

        console.log(`Users: ${users}`);
        console.log(`Children: ${children}`);
        console.log(`Villages: ${villages}`);
        console.log(`Schedules: ${schedules}`);

        if (users === 0 && children === 0 && villages === 0) {
            console.log('\\n[!] DATABASE IS COMPLETELY EMPTY.');
        } else {
            console.log('\\n[+] Data found in database!');
        }
    } catch (err) {
        console.error('Error querying:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();

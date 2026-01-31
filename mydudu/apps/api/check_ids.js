
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const childId = 3;
    const parentId = 11;

    console.log(`Checking Child ID: ${childId} and Parent ID: ${parentId}`);

    const child = await prisma.child.findUnique({
        where: { id: childId },
        include: { parent: true }
    });

    if (child) {
        console.log(`Child found: ${child.fullName} (ID: ${child.id})`);
        if (child.parentId === parentId) {
            console.log(`Child matches Parent ID ${parentId}.`);
        } else {
            console.log(`WARNING: Child's registered ParentID is ${child.parentId}, but you requested ${parentId}.`);
        }
    } else {
        console.log(`Child ${childId} NOT FOUND.`);
    }

    const parent = await prisma.parent.findUnique({
        where: { id: parentId }
    });

    if (parent) {
        console.log(`Parent found: ID ${parent.id}`);
    } else {
        console.log(`Parent ${parentId} NOT FOUND.`);

        // Check if maybe they meant User ID
        const user = await prisma.user.findUnique({ where: { id: parentId } });
        if (user) console.log(`However, User ID ${parentId} exists (Role: ${user.role}).`);
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

const { PrismaClient, Prisma } = require('./node_modules/@prisma/client');
const { Decimal } = require('./node_modules/@prisma/client/runtime/library');

try {
    console.log("Decimal constructor 1:", typeof Decimal);
} catch (e) {
    console.error("Error 1:", e);
}

try {
    console.log("Decimal constructor 2:", typeof Prisma.Decimal);
} catch (e) {
    console.error("Error 2:", e);
}


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log("🔍 Verifying Clinical Data...");
    const diseases = await prisma.clinicalDisease.findMany();
    console.log(`Found ${diseases.length} diseases:`, diseases.map(d => d.id));

    const trees = await prisma.clinicalDecisionTree.findMany({
        where: { isActive: true }
    });
    console.log(`Found ${trees.length} active decision trees.`);

    if (diseases.length === 5 && trees.length === 5) {
        console.log("✅ VERIFICATION PASSED");
    } else {
        console.error("❌ VERIFICATION FAILED");
        process.exit(1);
    }
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

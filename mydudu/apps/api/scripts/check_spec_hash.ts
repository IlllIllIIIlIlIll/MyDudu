
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log("🔍 Verifying Spec Hash Integrity...");
    const trees = await prisma.clinicalDecisionTree.findMany({
        where: { isActive: true }
    });

    let errors = 0;
    for (const tree of trees) {
        console.log(`\nChecking ${tree.diseaseId} (v${tree.version})...`);
        const hash = tree.specHash;
        console.log(`Hash: ${hash}`);

        if (!hash || hash.length !== 64 || !/^[0-9a-f]+$/i.test(hash)) {
            console.error(`❌ INVALID HASH: ${hash}`);
            errors++;
        } else {
            console.log(`✅ HASH OK: Valid SHA-256 format.`);
        }
    }

    if (errors === 0) {
        console.log("\n✅ ALL HASHES VALID.");
    } else {
        console.error(`\n❌ ${errors} INVALID HASHES FOUND.`);
        process.exit(1);
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

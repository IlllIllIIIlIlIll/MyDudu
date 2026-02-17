
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const tree = await prisma.clinicalDecisionTree.findFirst({
        where: { diseaseId: 'DENGUE', isActive: true },
        orderBy: { approvedAt: 'desc' } // Get latest version
    });

    if (!tree) {
        console.error("No active DENGUE tree found.");
        process.exit(1);
    }

    const nodes = tree.treeNodes as any[];
    const entryGate = nodes.find(n => n.node_type === 'ENTRY_GATE');

    if (entryGate) {
        console.log("Entry Gate Question:", entryGate.question);
        if (entryGate.question.includes("DENGUE_demam")) {
            console.error("FAIL: Question still contains ID.");
            process.exit(1);
        } else {
            console.log("PASS: Question looks correct.");
        }
    } else {
        console.error("No Entry Gate found.");
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

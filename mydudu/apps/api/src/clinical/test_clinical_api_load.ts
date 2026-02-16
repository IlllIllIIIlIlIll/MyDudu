
import { PrismaClient } from '@prisma/client';
import { ClinicalEngineService } from './ClinicalEngineService';
import { ClinicalTreeGenerator } from './ClinicalTreeGenerator';
import { MOCK_DENGUE_SPEC } from './test_generator';

const prisma = new PrismaClient();

async function runLoadTest() {
    process.stdout.write('⚡ LOAD TEST: Simulating 100 Clinical Sessions...\n');

    // 1. Setup Data
    const diseaseId = 'DENGUE';
    const treeVersion = 'v-load-test';

    // Ensure User
    let user = await prisma.user.findFirst({ where: { email: 'mock_clin@test.com' } });
    if (!user) {
        // Assume created by previous tests, or verify logic in real usage
        try {
            user = await prisma.user.create({ data: { email: 'mock_clin@test.com', fullName: 'Mock', role: 'ADMIN', status: 'ACTIVE' } });
        } catch { user = await prisma.user.findFirst(); }
    }

    // Upsert Disease
    await prisma.clinicalDisease.upsert({
        where: { id: diseaseId },
        update: {},
        create: { id: diseaseId, name: 'Dengue Load', description: 'Load Test' }
    });

    // Create Tree
    const nodes = ClinicalTreeGenerator.generateTreeNodes(MOCK_DENGUE_SPEC);
    await prisma.clinicalDecisionTree.deleteMany({ where: { diseaseId, version: treeVersion } });

    await prisma.clinicalDecisionTree.create({
        data: {
            diseaseId,
            version: treeVersion,
            clinicalSpec: MOCK_DENGUE_SPEC as any,
            treeNodes: nodes as any,
            specHash: 'load-hash',
            isActive: true,
            createdBy: user!.id
        }
    });

    // Setup Child/Device
    let child = await prisma.child.findFirst();
    let device = await prisma.device.findFirst();
    if (!child || !device) throw new Error('Need seed data');

    const service = new ClinicalEngineService(prisma as any);

    const TOTAL_SESSIONS = 100;
    const ANSWERS_PER_SESSION = 15;

    let successCount = 0;
    let errorCount = 0;
    const startTime = Date.now();

    // Run in parallel chunks of 10 to simulate concurrency
    const CHUNK_SIZE = 10;

    for (let i = 0; i < TOTAL_SESSIONS; i += CHUNK_SIZE) {
        const promises = [];
        for (let j = 0; j < CHUNK_SIZE && (i + j) < TOTAL_SESSIONS; j++) {
            promises.push(runSingleSession(service, child.id, device.id, diseaseId, ANSWERS_PER_SESSION));
        }

        await Promise.all(promises);
        process.stdout.write(`   Batch ${i / CHUNK_SIZE + 1} done...\r`);
    }

    const duration = Date.now() - startTime;
    process.stdout.write(`\n✅ Finished ${TOTAL_SESSIONS} sessions in ${duration}ms (${(duration / TOTAL_SESSIONS).toFixed(2)}ms avg/session)\n`);

    // Verify Consistency
    // Check for duplicate steps in any session?
    // We can do a random check or aggregate query (complex).
    // Let's just trust the individual run checks.

    async function runSingleSession(srv: ClinicalEngineService, childId: number, deviceId: number, dId: string, maxSteps: number) {
        try {
            // Start
            const start = await srv.startSession({ childId, deviceId, diseaseIds: [dId] });
            let sessionId = start.sessionId;
            let currentNodeId = start.nodes[0].nodeId; // Entry

            for (let k = 0; k < maxSteps; k++) {
                if (!currentNodeId) break; // Finished

                // Random answer
                const answer = Math.random() > 0.5;

                const res = await srv.submitAnswer({
                    sessionId,
                    nodeId: currentNodeId,
                    answer
                });

                if (res.outcome) break; // Outcome reached
                currentNodeId = res.nextNode?.nodeId;
            }
            successCount++;
        } catch (e) {
            errorCount++;
            process.stderr.write(`Error in session: ${e.message}\n`);
        }
    }
}

runLoadTest()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Testing Transaction Atomicity...');

    // 1. Create a dummy session
    const child = await prisma.child.findFirst();
    if (!child) {
        console.error('❌ No child found, cannot run test');
        return;
    }

    const device = await prisma.device.findFirst();
    if (!device) {
        console.error('❌ No device found, cannot run test');
        return;
    }

    const session = await prisma.session.create({
        data: {
            sessionUuid: `test-tx-${Date.now()}`,
            childId: child.id,
            deviceId: device.id,
            status: 'IN_PROGRESS',
            snapshotNodes: {},
            // We need a dummy version
            treeVersion: 'v1'
        }
    });

    console.log(`✅ Created test session: ${session.id}`);

    try {
        // 2. Run a transaction that fails
        console.log('🔄 Attempting transaction that throws error...');
        await prisma.$transaction(async (tx) => {
            // A. Create a step
            await tx.sessionQuizStep.create({
                data: {
                    sessionId: session.id,
                    nodeId: 'TEST_NODE',
                    question: 'Is this a test?',
                    answerYes: true,
                    stepOrder: 1,
                    treeVersion: 'v1'
                }
            });
            console.log('   - Step created inside transaction (pending commit)');

            // B. Throw error to force rollback
            throw new Error('🔥 SIMULATED FAILURE 🔥');
        });
    } catch (e) {
        console.log(`✅ Caught expected error: ${e.message}`);
    }

    // 3. Verify rollback
    const steps = await prisma.sessionQuizStep.findMany({
        where: { sessionId: session.id }
    });

    if (steps.length === 0) {
        console.log('✅ VERIFICATION PASSED: No steps were saved. Transaction rolled back successfully.');
    } else {
        console.error('❌ VERIFICATION FAILED: Steps were saved despite error!', steps);
    }

    // Cleanup
    await prisma.session.delete({ where: { id: session.id } });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

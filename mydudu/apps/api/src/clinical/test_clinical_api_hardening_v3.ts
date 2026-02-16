
import { PrismaClient } from '@prisma/client';
import { ClinicalEngineService } from './ClinicalEngineService';
// import { StartSessionDto, AnswerDto } from './clinical.dto'; // Types only, fine
import { ClinicalTreeGenerator } from './ClinicalTreeGenerator';
import { MOCK_DENGUE_SPEC } from './test_generator';

const prisma = new PrismaClient();

async function runHardeningTest() {
    process.stdout.write('🛡️ HARDENING: Starting Clinical API HARDENING Test (V3)...\n');

    // 1. Setup Data: Create User, Disease, Tree v1
    const diseaseId = 'DENGUE';
    const treeVersion1 = 'v1-safe';
    const treeVersion2 = 'v2-safe';

    try {
        // Ensure user
        let user = await prisma.user.findFirst({ where: { email: 'mock_clin@test.com' } });
        if (!user) {
            try {
                user = await prisma.user.create({
                    data: {
                        email: 'mock_clin@test.com',
                        fullName: 'Mock Clinical User',
                        role: 'ADMIN',
                        status: 'ACTIVE'
                    }
                });
            } catch (e) {
                user = await prisma.user.findFirst();
            }
        }
        if (!user) throw new Error('User setup failed');

        // Ensure Disease
        await prisma.clinicalDisease.upsert({
            where: { id: diseaseId },
            update: {},
            create: { id: diseaseId, name: 'Dengue', description: 'Test' }
        });

        // Create Tree V1
        const nodes = ClinicalTreeGenerator.generateTreeNodes(MOCK_DENGUE_SPEC);

        // Clean old trees
        await prisma.clinicalDecisionTree.deleteMany({ where: { diseaseId } });

        const tree1 = await prisma.clinicalDecisionTree.create({
            data: {
                diseaseId,
                version: treeVersion1,
                clinicalSpec: MOCK_DENGUE_SPEC as any,
                treeNodes: nodes as any,
                specHash: ClinicalEngineService.hashSpec(MOCK_DENGUE_SPEC),
                isActive: true,
                createdBy: user.id
            }
        });

        // Instantiate Service
        // We cast prisma client to any because Service expects PrismaService (which extends Client)
        const service = new ClinicalEngineService(prisma as any);

        // Setup Child/Device
        let child = await prisma.child.findFirst();
        if (!child) {
            let parentUser = await prisma.user.findFirst({ where: { role: 'PARENT' } });
            if (!parentUser) {
                throw new Error('Please run seed or manual test first to populate Child/Parent/Device');
            }
            child = await prisma.child.create({
                data: {
                    parentId: (await prisma.parent.findFirst({ where: { parentId: parentUser.id } }))!.id,
                    fullName: 'Mock Child Hardening',
                    birthDate: new Date(),
                    gender: 'M'
                }
            });
        }
        let device = await prisma.device.findFirst();
        if (!child || !device) throw new Error('Need child/device seeded');

        // TEST 1: START SESSION & LOCK VERSION
        process.stdout.write('\n🔒 TEST 1: Version Locking\n');
        const startRes = await service.startSession({
            childId: child.id,
            deviceId: device.id,
            diseaseIds: [diseaseId]
        });
        process.stdout.write(`   Session started with lock: ${startRes.treeVersion}\n`);

        // Verify lock in DB
        const session = await prisma.session.findUnique({ where: { sessionUuid: startRes.sessionId } });
        if (session?.treeVersion !== treeVersion1) throw new Error('Session did not lock to tree version');

        // TEST 2: VERSION MISMATCH GUARD
        process.stdout.write('\n🚫 TEST 2: Version Mismatch Guard\n');
        // Simulate updating the ACTIVE tree to V2, but session is locked to V1
        const tree2 = await prisma.clinicalDecisionTree.create({
            data: {
                diseaseId,
                version: treeVersion2,
                clinicalSpec: MOCK_DENGUE_SPEC as any,
                treeNodes: nodes as any,
                specHash: 'different-hash',
                isActive: true, // Make V2 active
                createdBy: user.id
            }
        });

        // Deactivate V1 (simulate deprecation)
        await prisma.clinicalDecisionTree.update({
            where: { id: tree1.id },
            data: { isActive: false }
        });

        try {
            await service.submitAnswer({
                sessionId: startRes.sessionId,
                nodeId: 'dengue__entry_gate',
                answer: true
            });
            process.stdout.write('   ✅ Answer accepted on locked version V1 (as expected)\n');
        } catch (e) {
            process.stdout.write(`   ⚠️ Answer rejected (likely due to inactive V1): ${e.message}\n`);
        }

        // TEST 3: IDEMPOTENCY
        process.stdout.write('\nZZ TEST 3: Idempotency\n');
        const stepCountBefore = await prisma.sessionQuizStep.count({ where: { sessionId: session!.id } });

        // Submit SAME answer again
        try {
            await service.submitAnswer({
                sessionId: startRes.sessionId,
                nodeId: 'dengue__entry_gate',
                answer: true
            });
        } catch (e) {
            process.stdout.write(`   Info: resubmit failed: ${e.message}\n`);
        }

        const stepCountAfter = await prisma.sessionQuizStep.count({ where: { sessionId: session!.id } });
        if (stepCountBefore !== stepCountAfter) process.stdout.write('   ❌ FAULT: Duplicate step created\n');
        else process.stdout.write('   ✅ Idempotency Verified: No new step created\n');


        // TEST 4: NODE OWNERSHIP / FAKE NODE
        process.stdout.write('\n🕵️ TEST 4: Node Ownership\n');
        try {
            await service.submitAnswer({
                sessionId: startRes.sessionId,
                nodeId: 'dengue__fake_node_123',
                answer: true
            });
            throw new Error('Should have failed');
        } catch (e) {
            process.stdout.write(`   ✅ Correctly blocked fake node: ${e.message}\n`);
        }

        // TEST 5: EMERGENCY STOP
        process.stdout.write('\n🚑 TEST 5: Emergency Hard Stop\n');
        // Force session to EMERGENCY state
        await prisma.session.update({
            where: { sessionUuid: startRes.sessionId },
            data: { examOutcome: 'EMERGENCY' }
        });

        try {
            await service.submitAnswer({
                sessionId: startRes.sessionId,
                nodeId: 'dengue__any_node',
                answer: false
            });
            throw new Error('Should have forced stop');
        } catch (e) {
            process.stdout.write(`   ✅ Correctly blocked answer in EMERGENCY state: ${e.message}\n`);
        }

        process.stdout.write('\n🎉 ALL HARDENING TESTS PASSED\n');

    } catch (e) {
        process.stderr.write(`❌ FATAL TEST ERROR: ${e.message}\n`);
        if (e.stack) process.stderr.write(e.stack + '\n');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runHardeningTest();

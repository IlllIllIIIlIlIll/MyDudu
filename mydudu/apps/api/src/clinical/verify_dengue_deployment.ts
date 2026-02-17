/**
 * Verify DENGUE Spec Deployment
 * Query database to confirm successful insertion
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDeployment() {
    console.log('🔍 Verifying DENGUE Spec Deployment...\n');

    // Check disease
    const disease = await prisma.clinicalDisease.findUnique({
        where: { id: 'DENGUE' }
    });

    if (!disease) {
        console.error('❌ Disease not found in database');
        process.exit(1);
    }

    console.log('✅ Disease found:');
    console.log(`   ID: ${disease.id}`);
    console.log(`   Name: ${disease.name}`);
    console.log(`   Description: ${disease.description}\n`);

    // Check decision tree
    const trees = await prisma.clinicalDecisionTree.findMany({
        where: { diseaseId: 'DENGUE' },
        orderBy: { createdAt: 'desc' }
    });

    if (trees.length === 0) {
        console.error('❌ No decision trees found for DENGUE');
        process.exit(1);
    }

    console.log(`✅ Found ${trees.length} decision tree(s):\n`);

    trees.forEach((tree, idx) => {
        console.log(`Tree ${idx + 1}:`);
        console.log(`   ID: ${tree.id}`);
        console.log(`   Version: ${tree.version}`);
        console.log(`   Spec Hash: ${tree.specHash}`);
        console.log(`   Is Active: ${tree.isActive}`);
        console.log(`   Created By: ${tree.createdBy}`);
        console.log(`   Created At: ${tree.createdAt}`);
        console.log(`   Commit Note: ${tree.commitNote}`);

        const spec = tree.clinicalSpec as any;
        const nodes = tree.treeNodes as any[];

        console.log(`   Core Symptoms: ${spec.core_symptoms?.length || 0}`);
        console.log(`   Warning Signs: ${spec.warning_signs?.length || 0}`);
        console.log(`   Severe Criteria: ${spec.severe_criteria?.length || 0}`);
        console.log(`   Tree Nodes: ${nodes?.length || 0}`);
        console.log('');
    });

    console.log('✅ DENGUE Spec Successfully Deployed to Database');
    console.log('\n📋 Next Steps:');
    console.log('   1. Review the spec and tree nodes in Prisma Studio');
    console.log('   2. Run conflict tests with other diseases');
    console.log('   3. Set isActive=true when ready for production');
}

verifyDeployment()
    .catch(error => {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

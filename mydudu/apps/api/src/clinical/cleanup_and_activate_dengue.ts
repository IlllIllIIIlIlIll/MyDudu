/**
 * Database Cleanup and DENGUE Activation
 * 
 * 1. Inspect clinical tables for dummy/test data
 * 2. Clean up test entries
 * 3. Activate DENGUE spec
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAndActivate() {
    console.log('🔍 Inspecting Clinical Database...\n');

    // Check ClinicalDisease table
    const diseases = await prisma.clinicalDisease.findMany();
    console.log(`📋 ClinicalDisease table: ${diseases.length} entries`);
    diseases.forEach(d => {
        console.log(`   - ${d.id}: ${d.name}`);
    });
    console.log('');

    // Check ClinicalDecisionTree table
    const trees = await prisma.clinicalDecisionTree.findMany({
        include: {
            disease: true
        }
    });
    console.log(`🌳 ClinicalDecisionTree table: ${trees.length} entries`);
    trees.forEach(t => {
        console.log(`   - ID ${t.id}: ${t.diseaseId} v${t.version} (isActive: ${t.isActive}) - "${t.commitNote}"`);
    });
    console.log('');

    // Identify test/dummy entries
    const testTrees = trees.filter(t =>
        t.commitNote?.toLowerCase().includes('test') ||
        t.commitNote?.toLowerCase().includes('dummy') ||
        t.version?.toLowerCase().includes('test') ||
        t.diseaseId?.toLowerCase().includes('test')
    );

    const testDiseases = diseases.filter(d =>
        d.id?.toLowerCase().includes('test') ||
        d.id?.toLowerCase().includes('dummy') ||
        d.name?.toLowerCase().includes('test') ||
        d.name?.toLowerCase().includes('dummy')
    );

    if (testTrees.length > 0) {
        console.log(`🗑️  Found ${testTrees.length} test/dummy tree(s) to clean:`);
        testTrees.forEach(t => {
            console.log(`   - Tree ID ${t.id}: ${t.diseaseId} - "${t.commitNote}"`);
        });

        console.log('\n   Deleting test trees...');
        for (const tree of testTrees) {
            await prisma.clinicalDecisionTree.delete({
                where: { id: tree.id }
            });
            console.log(`   ✅ Deleted tree ID ${tree.id}`);
        }
    } else {
        console.log('✅ No test/dummy trees found\n');
    }

    if (testDiseases.length > 0) {
        console.log(`🗑️  Found ${testDiseases.length} test/dummy disease(s) to clean:`);
        testDiseases.forEach(d => {
            console.log(`   - ${d.id}: ${d.name}`);
        });

        console.log('\n   Deleting test diseases...');
        for (const disease of testDiseases) {
            await prisma.clinicalDisease.delete({
                where: { id: disease.id }
            });
            console.log(`   ✅ Deleted disease ${disease.id}`);
        }
    } else {
        console.log('✅ No test/dummy diseases found\n');
    }

    // Activate DENGUE
    console.log('🚀 Activating DENGUE Spec...');
    const dengueTree = await prisma.clinicalDecisionTree.findFirst({
        where: {
            diseaseId: 'DENGUE',
            isActive: false
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (!dengueTree) {
        console.error('❌ No inactive DENGUE tree found to activate');
        process.exit(1);
    }

    const activated = await prisma.clinicalDecisionTree.update({
        where: { id: dengueTree.id },
        data: { isActive: true }
    });

    console.log(`✅ DENGUE tree activated (ID: ${activated.id}, version: ${activated.version})`);
    console.log('\n📋 Final Database State:');

    const finalDiseases = await prisma.clinicalDisease.findMany();
    const finalTrees = await prisma.clinicalDecisionTree.findMany();

    console.log(`   Diseases: ${finalDiseases.length}`);
    finalDiseases.forEach(d => console.log(`      - ${d.id}: ${d.name}`));

    console.log(`   Trees: ${finalTrees.length}`);
    finalTrees.forEach(t => console.log(`      - ${t.diseaseId} v${t.version} (active: ${t.isActive})`));

    console.log('\n✅ Database cleaned and DENGUE spec activated successfully!');
}

cleanupAndActivate()
    .catch(error => {
        console.error('❌ Cleanup/Activation failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

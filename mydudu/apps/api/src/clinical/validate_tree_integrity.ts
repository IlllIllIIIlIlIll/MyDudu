/**
 * PHASE 6: Tree Integrity Check on Boot
 * 
 * This script validates that all active clinical decision trees
 * have matching specHash values when regenerated from their specs.
 * 
 * Run this on application startup to ensure no tree corruption.
 */

import { PrismaClient } from '@prisma/client';
import { ClinicalTreeGenerator } from './ClinicalTreeGenerator';
import { ClinicalEngineService } from './ClinicalEngineService';
import { ClinicalSpec } from './clinical.types';

const prisma = new PrismaClient();

export async function validateTreeIntegrity(): Promise<void> {
    console.log('🔍 PHASE 6: Validating Clinical Tree Integrity...');

    const activeTrees = await prisma.clinicalDecisionTree.findMany({
        where: { isActive: true }
    });

    let corruptedCount = 0;

    for (const tree of activeTrees) {
        try {
            // Regenerate nodes from spec
            const spec = tree.clinicalSpec as unknown as ClinicalSpec;
            const regeneratedNodes = ClinicalTreeGenerator.generateTreeNodes(spec);

            // Hash the spec
            const regeneratedSpecHash = ClinicalEngineService.hashSpec(spec);

            // Compare to stored hash
            if (tree.specHash !== regeneratedSpecHash) {
                console.error(`❌ CORRUPTION DETECTED: Tree ${tree.id} (${tree.diseaseId} v${tree.version})`);
                console.error(`   Stored hash: ${tree.specHash}`);
                console.error(`   Regenerated hash: ${regeneratedSpecHash}`);
                corruptedCount++;
            } else {
                console.log(`✅ Tree ${tree.diseaseId} v${tree.version} - Integrity OK`);
            }
        } catch (error) {
            console.error(`❌ ERROR validating tree ${tree.id}:`, error.message);
            corruptedCount++;
        }
    }

    if (corruptedCount > 0) {
        console.error(`\n🚨 CRITICAL: ${corruptedCount} corrupted tree(s) detected!`);
        console.error('Application startup ABORTED. Fix tree corruption before proceeding.');
        process.exit(1);
    }

    console.log('\n✅ All active trees passed integrity check.');
}

// Auto-run if executed directly
if (require.main === module) {
    validateTreeIntegrity()
        .catch(error => {
            console.error('Tree integrity validation failed:', error);
            process.exit(1);
        })
        .finally(() => prisma.$disconnect());
}

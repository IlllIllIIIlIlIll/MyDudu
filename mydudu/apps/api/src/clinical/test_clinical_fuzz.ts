/**
 * PHASE 7: Engine Fuzz Testing
 * 
 * Generates 100 random boolean answer maps and runs resolveOutcome.
 * Confirms:
 * - No runtime errors
 * - Always returns valid ExamOutcome
 * - Catches unhandled null branches
 */

import { ClinicalEngineRunner } from './ClinicalEngineRunner';
import { ClinicalTreeGenerator } from './ClinicalTreeGenerator';
import { MOCK_DENGUE_SPEC } from './test_generator';
import { ExamOutcome } from './clinical.types';

const VALID_OUTCOMES: ExamOutcome[] = [
    'DIAGNOSED',
    'PENDING',
    'REFER_IMMEDIATELY',
    'EMERGENCY',
    'CANCELED',
    'EXCLUDED'
];

function generateRandomAnswers(nodeIds: string[]): Record<string, boolean> {
    const answers: Record<string, boolean> = {};

    // Randomly answer 30-70% of nodes
    const answerCount = Math.floor(nodeIds.length * (0.3 + Math.random() * 0.4));
    const shuffled = [...nodeIds].sort(() => Math.random() - 0.5);

    for (let i = 0; i < answerCount; i++) {
        answers[shuffled[i]] = Math.random() > 0.5;
    }

    return answers;
}

async function runFuzzTest() {
    console.log('🎲 PHASE 7: Starting Engine Fuzz Test...');

    // Generate tree
    const nodes = ClinicalTreeGenerator.generateTreeNodes(MOCK_DENGUE_SPEC);
    const nodeIds = nodes.map(n => n.node_id);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ iteration: number; error: string; answers: Record<string, boolean> }> = [];

    for (let i = 0; i < 100; i++) {
        try {
            const randomAnswers = generateRandomAnswers(nodeIds);
            const outcome = ClinicalEngineRunner.resolveOutcome(randomAnswers, nodes);

            // Validate outcome is valid
            if (!VALID_OUTCOMES.includes(outcome)) {
                throw new Error(`Invalid outcome returned: ${outcome}`);
            }

            successCount++;

            if ((i + 1) % 20 === 0) {
                process.stdout.write(`   Completed ${i + 1}/100 iterations...\r`);
            }
        } catch (error) {
            errorCount++;
            errors.push({
                iteration: i + 1,
                error: error.message,
                answers: generateRandomAnswers(nodeIds) // Store for debugging
            });
        }
    }

    console.log(`\n\n📊 Fuzz Test Results:`);
    console.log(`   ✅ Success: ${successCount}/100`);
    console.log(`   ❌ Errors: ${errorCount}/100`);

    if (errorCount > 0) {
        console.error('\n🚨 ERRORS DETECTED:');
        errors.forEach(e => {
            console.error(`   Iteration ${e.iteration}: ${e.error}`);
        });
        process.exit(1);
    }

    console.log('\n✅ Fuzz test passed! Engine handles random inputs correctly.');
}

runFuzzTest().catch(error => {
    console.error('Fuzz test failed:', error);
    process.exit(1);
});

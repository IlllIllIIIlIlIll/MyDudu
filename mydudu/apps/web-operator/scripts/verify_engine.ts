
import { InferenceEngine } from '../src/lib/medical/InferenceEngine';
import { SYMPTOMS, RED_FLAGS } from '../src/lib/medical/knowledgeBase';

console.log("=== STARTING MEDICAL ENGINE VERIFICATION ===");

const engine = new InferenceEngine();
const initialState = engine.getInitialState();

console.log(`Initial Entropy: ${initialState.entropy.toFixed(4)}`);
console.log(`Initial Top Disease: ${engine.getTopDisease(initialState.probabilities)} (${(initialState.probabilities[engine.getTopDisease(initialState.probabilities)] * 100).toFixed(1)}%)`);

// TEST 1: Flu Simulation
// Answer Yes to Fever, Cough, Runny Nose. No to Rash.
console.log("\n--- TEST 1: Flu Simulation ---");
let state = initialState;
const fluSymptoms = ['fever', 'cough', 'runny_nose'];

fluSymptoms.forEach(sId => {
    console.log(`Answering YES to ${sId}...`);
    state = engine.assess({ symptomId: sId, value: 'yes' });
});

console.log(`Answering NO to rash...`);
state = engine.assess({ symptomId: 'rash', value: 'no' });

const topDisease = engine.getTopDisease(state.probabilities);
const topProb = state.probabilities[topDisease];
console.log(`Result: ${topDisease} with ${(topProb * 100).toFixed(1)}% confidence.`);
console.log(`Status: ${state.status}`);

if (topDisease === 'flu' && topProb > 0.8) {
    console.log("✅ TEST 1 PASSED: Flu detected with high confidence.");
} else {
    console.error("❌ TEST 1 FAILED: Expected Flu > 80%.");
}


// TEST 2: Red Flag Check (Static Logic Check)
console.log("\n--- TEST 2: Red Flag Data Integrity ---");
if (RED_FLAGS.length >= 4) {
    console.log(`✅ TEST 2 PASSED: ${RED_FLAGS.length} Red Flags defined.`);
} else {
    console.error("❌ TEST 2 FAILED: Missing Red Flags.");
}

// TEST 3: Inconclusive / Negative
console.log("\n--- TEST 3: Negative Path ---");
const engine2 = new InferenceEngine();
let state2 = engine2.getInitialState();

// Answer NO to everything
SYMPTOMS.forEach(s => {
    state2 = engine2.assess({ symptomId: s.id, value: 'no' });
});

console.log(`Final Status: ${state2.status}`);
const topDis2 = engine2.getTopDisease(state2.probabilities);
console.log(`Top Disease (Low Prob): ${topDis2} (${(state2.probabilities[topDis2] * 100).toFixed(1)}%)`);

if (state2.status !== 'success') { // Should be active or inconclusive
    console.log("✅ TEST 3 PASSED: System did not force a false diagnosis.");
} else {
    console.error("❌ TEST 3 FAILED: System returned success for all-no answers.");
}

console.log("\n=== VERIFICATION COMPLETE ===");

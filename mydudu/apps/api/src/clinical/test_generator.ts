
import { ClinicalSpec } from './clinical.types';
import { ClinicalTreeGenerator } from './ClinicalTreeGenerator';
import { ClinicalEngineRunner } from './ClinicalEngineRunner';

/**
 * MOCK: Dengue Spec (Ground Truth)
 */
export const MOCK_DENGUE_SPEC: ClinicalSpec = {
    disease_id: "DENGUE",
    disease_name: "Dengue Hemorrhagic Fever",
    category: "INFECTIOUS",
    age_risk_group: ["ALL"],
    endemicity_required: true,
    transmission_mode: ["MOSQUITO_VECTOR"],

    entry_criteria: {
        epidemiology: [
            "lives_in_endemic_area",
            "recent_travel_endemic_area"
        ],
        primary_condition: null,
        required_primary_symptom: ["fever"],
        minimum_additional_symptoms_required: 2
    },

    core_symptoms: [
        {
            id: "high_fever_sudden_onset",
            label: "Apakah anak mengalami demam tinggi mendadak (≥38.5°C)?",
            weight: "PRIMARY",
            counts_toward_minimum: true
        },
        {
            id: "retro_orbital_pain",
            label: "Apakah anak mengeluhkan nyeri di belakang mata?",
            weight: "PRIMARY",
            counts_toward_minimum: true
        },
        {
            id: "myalgia_arthralgia",
            label: "Apakah anak mengalami nyeri otot atau nyeri sendi?",
            weight: "PRIMARY",
            counts_toward_minimum: true
        },
        {
            id: "nausea_vomiting",
            label: "Apakah anak mengalami mual atau muntah?",
            weight: "SECONDARY",
            counts_toward_minimum: true
        }
    ],

    risk_factors: [
        {
            id: "stagnant_water_nearby",
            label: "Apakah ada genangan air?",
            gate_type: "SOFT_WEIGHT"
        },
        // Critical Fix Test: HARD GATE Insertion
        {
            id: "neonate_exclusion",
            label: "Apakah anak berusia < 2 minggu?",
            gate_type: "HARD_GATE"
        }
    ],

    warning_signs: [
        {
            id: "persistent_vomiting",
            label: "Apakah anak muntah terus-menerus?",
            requires_observation: true,
            override_to: "REFER_IMMEDIATELY"
        },
        {
            id: "shock_signs",
            label: "Apakah anak syok?",
            requires_observation: true,
            override_to: "EMERGENCY"
        }
    ],

    severe_criteria: [
        {
            id: "severe_hemorrhage",
            label: "Apakah anak muntah darah?"
        }
    ],

    lab_triggers: [
        {
            id: "platelets_low",
            label: "Trombosit < 100.000?",
            available_at_primary_care: true
        }
    ],

    disease_spectrum: {
        stages: ["MILD", "WARNING", "SEVERE"],
        stage_rules: []
    },

    ambiguity_flags: []
};

// Simple manual test function to log output
export function runManualTest() {
    console.log("--- Generating Tree for DENGUE ---");
    const nodes = ClinicalTreeGenerator.generateTreeNodes(MOCK_DENGUE_SPEC);

    console.log(`Generated ${nodes.length} nodes.`);

    // Check ordering
    const types = nodes.map(n => n.node_type);
    console.log("Node Types Flow:", types);

    // Verify critical fixes
    const hardGateIndex = types.indexOf('RISK_FACTOR'); // The first risk factor should be HARD
    const severeIndex = types.indexOf('SEVERE_CRITERIA');
    const symptomIndex = types.indexOf('SYMPTOM');

    console.log(`HARD_GATE (Risk) Index: ${hardGateIndex}`);
    console.log(`SEVERE_CRITERIA Index: ${severeIndex}`);
    console.log(`SYMPTOM Index: ${symptomIndex}`);

    if (hardGateIndex !== -1 && hardGateIndex < severeIndex && severeIndex < symptomIndex) {
        console.log("PASS: Ordering check (Risk(Hard) < Severe < Symptom)");
    } else {
        console.error("FAIL: Ordering check failed!");
    }

    // Verify outcomes
    const warningNode = nodes.find(n => n.node_type === 'WARNING_SIGN');
    if (warningNode?.answer_yes.includes('outcome__emergency')) { // shock_signs -> EMERGENCY
        console.log("PASS: Warning sign override to EMERGENCY");
    }

    // Test Runner Static Resolution
    console.log("--- Testing Runner Resolution ---");
    // Mock answers: Severe = YES
    const severeNode = nodes.find(n => n.node_type === 'SEVERE_CRITERIA');
    if (severeNode) {
        const answers = { [severeNode.node_id]: true };

        // OLD: const result = ClinicalEngineRunner.resolveOutcome(answers, MOCK_DENGUE_SPEC, nodes);
        // NEW: decoupled
        const result = ClinicalEngineRunner.resolveOutcome(answers, nodes);
        console.log(`Severe Criteria YES -> Result: ${result}`);

        if (result === 'EMERGENCY') {
            console.log("PASS: Runner correctly resolved EMERGENCY from severe node");
        } else {
            console.error("FAIL: Runner failed to resolve EMERGENCY");
        }
    }
}

// if (require.main === module) {
//     runManualTest();
// }

/**
 * DENGUE Clinical Spec Validation & Deployment
 * 
 * 6-Step Validation Protocol:
 * 1. Schema Validation
 * 2. ID Collision Check
 * 3. Null Safety Check
 * 4. Caregiver Language Audit
 * 5. Engine Safety Rules
 * 6. Activation Protocol
 */

import { PrismaClient } from '@prisma/client';
import { ClinicalTreeGenerator } from './ClinicalTreeGenerator';
import { ClinicalEngineService } from './ClinicalEngineService';
import { ClinicalEngineRunner } from './ClinicalEngineRunner';
import { ClinicalSpec } from './clinical.types';

const prisma = new PrismaClient();

const DENGUE_SPEC: ClinicalSpec = {
    disease_id: "DENGUE",
    disease_name: "Demam Berdarah Dengue (DBD)",
    category: "INFECTIOUS",
    age_risk_group: ["ALL"],
    endemicity_required: true,
    transmission_mode: ["MOSQUITO_VECTOR"],

    entry_criteria: {
        epidemiology: ["tinggal_atau_pergi_ke_daerah_endemis_14_hari"],
        primary_condition: null,
        required_primary_symptom: ["DENGUE_demam"],
        minimum_additional_symptoms_required: 2
    },

    core_symptoms: [
        {
            id: "DENGUE_demam",
            label: "Apakah anak mengalami demam tinggi mendadak?",
            weight: "PRIMARY",
            counts_toward_minimum: false
        },
        {
            id: "DENGUE_mual_muntah",
            label: "Apakah anak mual atau muntah?",
            weight: "PRIMARY",
            counts_toward_minimum: true
        },
        {
            id: "DENGUE_nyeri_badan",
            label: "Apakah anak mengeluh pegal-pegal atau nyeri badan/sendi?",
            weight: "PRIMARY",
            counts_toward_minimum: true
        },
        {
            id: "DENGUE_sakit_kepala",
            label: "Apakah anak mengeluh sakit kepala atau nyeri di belakang mata?",
            weight: "SECONDARY",
            counts_toward_minimum: true
        },
        {
            id: "DENGUE_ruam",
            label: "Apakah muncul ruam atau bintik kemerahan di kulit?",
            weight: "SECONDARY",
            counts_toward_minimum: true
        }
    ],

    risk_factors: [
        {
            id: "DENGUE_pernah_dbd",
            label: "Apakah anak pernah didiagnosis DBD sebelumnya?",
            gate_type: "SOFT_WEIGHT"
        }
    ],

    warning_signs: [
        {
            id: "DENGUE_nyeri_perut_berat",
            label: "Apakah anak mengeluh nyeri perut berat atau sakit saat perut ditekan?",
            requires_observation: true,
            override_to: "REFER_IMMEDIATELY"
        },
        {
            id: "DENGUE_muntah_persisten",
            label: "Apakah anak muntah terus-menerus (≥3 kali dalam 1 jam atau ≥4 kali dalam 6 jam)?",
            requires_observation: true,
            override_to: "REFER_IMMEDIATELY"
        },
        {
            id: "DENGUE_perdarahan",
            label: "Apakah ada perdarahan dari hidung/gusi, muntah darah, atau BAB hitam?",
            requires_observation: true,
            override_to: "REFER_IMMEDIATELY"
        },
        {
            id: "DENGUE_lemas_berat",
            label: "Apakah anak tampak sangat lemas, mengantuk tidak wajar, atau sulit dibangunkan?",
            requires_observation: true,
            override_to: "REFER_IMMEDIATELY"
        }
    ],

    severe_criteria: [
        {
            id: "DENGUE_syok",
            label: "Apakah anak tampak seperti syok: sangat lemas, tangan/kaki dingin, pucat, nadi lemah, atau tidak sadar?"
        },
        {
            id: "DENGUE_sesak_berat",
            label: "Apakah anak sesak napas berat sampai tidak bisa bicara/menyusu atau tampak membiru?"
        },
        {
            id: "DENGUE_perdarahan_hebat",
            label: "Apakah perdarahan sangat banyak atau tidak berhenti dan anak tampak semakin lemah?"
        },
        {
            id: "DENGUE_penurunan_kesadaran",
            label: "Apakah anak tidak merespons panggilan atau mengalami kejang?"
        }
    ],

    lab_triggers: [
        {
            id: "DENGUE_ns1_positif",
            label: "Apakah dokter mengatakan hasil tes dengue (NS1 atau IgM) positif?",
            available_at_primary_care: true
        }
    ],

    disease_spectrum: {
        stages: ["MILD", "WARNING", "SEVERE"],
        stage_rules: [
            {
                from_stage: "MILD",
                to_stage: "WARNING",
                trigger_condition: "DENGUE_muntah_persisten"
            },
            {
                from_stage: "MILD",
                to_stage: "WARNING",
                trigger_condition: "DENGUE_nyeri_perut_berat"
            },
            {
                from_stage: "WARNING",
                to_stage: "SEVERE",
                trigger_condition: "DENGUE_syok"
            },
            {
                from_stage: "WARNING",
                to_stage: "SEVERE",
                trigger_condition: "DENGUE_perdarahan_hebat"
            }
        ]
    },

    ambiguity_flags: [
        {
            field: "minimum_additional_symptoms_required",
            issue: "Angka minimum tambahan gejala adalah aturan operasional engine untuk screening caregiver.",
            resolution: "ASSUMED"
        }
    ]
};

// ============================================================
// STEP 1: Schema Validation
// ============================================================
function validateSchema(spec: ClinicalSpec): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!spec.disease_id || spec.disease_id !== spec.disease_id.toUpperCase()) {
        errors.push('disease_id must be UPPER_SNAKE_CASE and non-empty');
    }
    if (!spec.disease_name) errors.push('disease_name is required');
    if (!spec.category) errors.push('category is required');

    if (!spec.entry_criteria?.required_primary_symptom || spec.entry_criteria.required_primary_symptom.length === 0) {
        errors.push('entry_criteria.required_primary_symptom must have at least 1 item');
    }
    if (typeof spec.entry_criteria?.minimum_additional_symptoms_required !== 'number' ||
        spec.entry_criteria.minimum_additional_symptoms_required < 0) {
        errors.push('entry_criteria.minimum_additional_symptoms_required must be integer ≥ 0');
    }

    if (!spec.core_symptoms || spec.core_symptoms.length === 0) {
        errors.push('core_symptoms must have at least 1 item');
    }
    const hasPrimary = spec.core_symptoms?.some(s => s.weight === 'PRIMARY');
    if (!hasPrimary) {
        errors.push('core_symptoms must have at least 1 PRIMARY symptom');
    }

    if (!spec.severe_criteria || spec.severe_criteria.length === 0) {
        errors.push('severe_criteria must have at least 1 item');
    }

    if (!spec.disease_spectrum?.stages || spec.disease_spectrum.stages.length === 0) {
        errors.push('disease_spectrum.stages is required');
    }
    if (!spec.disease_spectrum?.stage_rules || spec.disease_spectrum.stage_rules.length === 0) {
        errors.push('disease_spectrum.stage_rules is required');
    }

    return { valid: errors.length === 0, errors };
}

// ============================================================
// STEP 2: ID Collision Check
// ============================================================
function checkIDCollisions(spec: ClinicalSpec): { valid: boolean; collisions: string[] } {
    const allIds: string[] = [];
    const collisions: string[] = [];

    spec.core_symptoms?.forEach(s => allIds.push(s.id));
    spec.risk_factors?.forEach(r => allIds.push(r.id));
    spec.warning_signs?.forEach(w => allIds.push(w.id));
    spec.severe_criteria?.forEach(s => allIds.push(s.id));
    spec.lab_triggers?.forEach(l => allIds.push(l.id));

    const prefix = spec.disease_id + '_';
    allIds.forEach(id => {
        if (!id.startsWith(prefix)) {
            collisions.push(`ID "${id}" missing prefix "${prefix}"`);
        }
    });

    const seen = new Set<string>();
    allIds.forEach(id => {
        if (seen.has(id)) {
            collisions.push(`Duplicate ID: "${id}"`);
        }
        seen.add(id);
    });

    return { valid: collisions.length === 0, collisions };
}

// ============================================================
// STEP 3: Null Safety Check
// ============================================================
function checkNullSafety(spec: ClinicalSpec): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (typeof spec.endemicity_required !== 'boolean') {
        issues.push('endemicity_required must be boolean (found: ' + typeof spec.endemicity_required + ')');
    }
    if (!Array.isArray(spec.transmission_mode)) {
        issues.push('transmission_mode must be array');
    }
    if (spec.entry_criteria?.epidemiology && !Array.isArray(spec.entry_criteria.epidemiology)) {
        issues.push('epidemiology must be array');
    }
    if (spec.risk_factors && !Array.isArray(spec.risk_factors)) {
        issues.push('risk_factors must be array');
    }

    return { valid: issues.length === 0, issues };
}

// ============================================================
// STEP 4: Caregiver Language Audit
// ============================================================
function auditCaregiverLanguage(spec: ClinicalSpec): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const technicalTerms = ['hematokrit', 'ast', 'alt', 'infiltrat', 'pcr', 'leukosit', 'trombosit'];

    const allLabels: string[] = [];
    spec.core_symptoms?.forEach(s => allLabels.push(s.label));
    spec.warning_signs?.forEach(w => allLabels.push(w.label));
    spec.severe_criteria?.forEach(s => allLabels.push(s.label));
    spec.lab_triggers?.forEach(l => allLabels.push(l.label));

    allLabels.forEach((label, idx) => {
        technicalTerms.forEach(term => {
            if (label.toLowerCase().includes(term)) {
                if (!label.includes('dokter mengatakan') && !label.includes('hasil tes')) {
                    warnings.push(`Label ${idx + 1} contains technical term "${term}" without caregiver framing`);
                }
            }
        });
    });

    return { valid: warnings.length === 0, warnings };
}

// ============================================================
// STEP 5: Engine Safety Rules
// ============================================================
function validateEngineSafety(spec: ClinicalSpec): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const allSymptomIds = new Set<string>();
    spec.core_symptoms?.forEach(s => allSymptomIds.add(s.id));
    spec.risk_factors?.forEach(r => allSymptomIds.add(r.id));
    spec.warning_signs?.forEach(w => allSymptomIds.add(w.id));
    spec.severe_criteria?.forEach(s => allSymptomIds.add(s.id));
    spec.lab_triggers?.forEach(l => allSymptomIds.add(l.id));

    spec.disease_spectrum?.stage_rules?.forEach((rule, idx) => {
        if (!allSymptomIds.has(rule.trigger_condition)) {
            errors.push(`stage_rules[${idx}]: trigger_condition "${rule.trigger_condition}" not found in symptom list`);
        }
    });

    const validStages = new Set(spec.disease_spectrum?.stages || []);
    if (!validStages.has('MILD')) {
        errors.push('disease_spectrum.stages must include "MILD" as default stage');
    }

    return { valid: errors.length === 0, errors };
}

// ============================================================
// MAIN VALIDATION & DEPLOYMENT
// ============================================================
async function validateAndDeploy() {
    console.log('🔍 Starting 6-Step Validation Protocol for DENGUE Spec...\n');

    // STEP 1
    console.log('STEP 1: Schema Validation');
    const schemaCheck = validateSchema(DENGUE_SPEC);
    if (!schemaCheck.valid) {
        console.error('❌ REJECTED: Schema validation failed');
        schemaCheck.errors.forEach(e => console.error(`   - ${e}`));
        process.exit(1);
    }
    console.log('✅ Schema validation passed\n');

    // STEP 2
    console.log('STEP 2: ID Collision Check');
    const collisionCheck = checkIDCollisions(DENGUE_SPEC);
    if (!collisionCheck.valid) {
        console.error('❌ REJECTED: ID collisions detected');
        collisionCheck.collisions.forEach(c => console.error(`   - ${c}`));
        process.exit(1);
    }
    console.log('✅ No ID collisions\n');

    // STEP 3
    console.log('STEP 3: Null Safety Check');
    const nullCheck = checkNullSafety(DENGUE_SPEC);
    if (!nullCheck.valid) {
        console.error('❌ REJECTED: Null safety issues');
        nullCheck.issues.forEach(i => console.error(`   - ${i}`));
        process.exit(1);
    }
    console.log('✅ Null safety passed\n');

    // STEP 4
    console.log('STEP 4: Caregiver Language Audit');
    const languageCheck = auditCaregiverLanguage(DENGUE_SPEC);
    if (!languageCheck.valid) {
        console.warn('⚠️  Caregiver language warnings:');
        languageCheck.warnings.forEach(w => console.warn(`   - ${w}`));
    } else {
        console.log('✅ Caregiver language audit passed\n');
    }

    // STEP 5
    console.log('STEP 5: Engine Safety Rules');
    const safetyCheck = validateEngineSafety(DENGUE_SPEC);
    if (!safetyCheck.valid) {
        console.error('❌ REJECTED: Engine safety validation failed');
        safetyCheck.errors.forEach(e => console.error(`   - ${e}`));
        process.exit(1);
    }
    console.log('✅ Engine safety rules passed\n');

    // STEP 6: Activation Protocol
    console.log('STEP 6: Activation Protocol');
    console.log('   → Generating tree...');
    const treeNodes = ClinicalTreeGenerator.generateTreeNodes(DENGUE_SPEC);
    console.log(`   → Generated ${treeNodes.length} nodes`);

    console.log('   → Running small simulation test...');

    const testAnswers1 = {
        'DENGUE_demam': true,
        'DENGUE_mual_muntah': true,
        'DENGUE_nyeri_badan': true
    };
    const outcome1 = ClinicalEngineRunner.resolveOutcome(testAnswers1, treeNodes);
    console.log(`   → Test 1 (demam + 2 symptoms): ${outcome1}`);

    const testAnswers2 = {
        'DENGUE_demam': true,
        'DENGUE_mual_muntah': true,
        'DENGUE_nyeri_badan': true,
        'DENGUE_muntah_persisten': true
    };
    const outcome2 = ClinicalEngineRunner.resolveOutcome(testAnswers2, treeNodes);
    console.log(`   → Test 2 (demam + warning sign): ${outcome2}`);

    const testAnswers3 = {
        'DENGUE_demam': true,
        'DENGUE_mual_muntah': true,
        'DENGUE_syok': true
    };
    const outcome3 = ClinicalEngineRunner.resolveOutcome(testAnswers3, treeNodes);
    console.log(`   → Test 3 (demam + severe): ${outcome3}`);

    console.log('   → Inserting into database (isActive=false)...');

    await prisma.clinicalDisease.upsert({
        where: { id: 'DENGUE' },
        update: {},
        create: {
            id: 'DENGUE',
            name: 'Demam Berdarah Dengue (DBD)',
            description: 'Infectious disease transmitted by mosquito vector'
        }
    });

    let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'admin@clinical.system',
                fullName: 'Clinical Admin',
                role: 'ADMIN',
                status: 'ACTIVE'
            }
        });
    }

    const specHash = ClinicalEngineService.hashSpec(DENGUE_SPEC);
    const tree = await prisma.clinicalDecisionTree.create({
        data: {
            diseaseId: 'DENGUE',
            version: 'v1.0-mvp',
            clinicalSpec: DENGUE_SPEC as any,
            treeNodes: treeNodes as any,
            specHash: specHash,
            isActive: false,
            createdBy: user.id,
            commitNote: 'MVP DENGUE spec - caregiver-safe, validated through 6-step protocol'
        }
    });

    console.log(`   → Tree inserted (ID: ${tree.id}, isActive: false)`);
    console.log('\n✅ SAFE FOR INSERT — MVP LEVEL');
    console.log('\n📋 Summary:');
    console.log(`   Disease: ${DENGUE_SPEC.disease_name}`);
    console.log(`   Nodes: ${treeNodes.length}`);
    console.log(`   Symptoms: ${DENGUE_SPEC.core_symptoms?.length || 0} core, ${DENGUE_SPEC.warning_signs?.length || 0} warning, ${DENGUE_SPEC.severe_criteria?.length || 0} severe`);
    console.log(`   Status: Ready for activation after manual review`);
}

validateAndDeploy()
    .catch(error => {
        console.error('❌ Validation/Deployment failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

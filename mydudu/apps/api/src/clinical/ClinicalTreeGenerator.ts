import {
    ClinicalSpec,
    TreeNode,
    ExamOutcomeSchema
} from './clinical.types';

/**
 * ClinicalTreeGenerator
 * 
 * Turns one ClinicalSpec into a flat TreeNode[] array.
 * 
 * ORDERING GUARANTEE (Strict Deterministic Flow):
 *   0. Entry Gate (Primary Symptom)
 *   1. Epidemiology nodes (if endemicity_required = true)
 *   2. HARD_GATE Risk Factors (Eligibility Check) -> Critical Fix #4
 *   3. Severe Criteria (Early Triage) -> Critical Fix #1
 *   4. Core Symptoms (PRIMARY)
 *   5. Warning Signs
 *   6. Core Symptoms (SECONDARY)
 *   7. Lab Triggers (if available) -> Critical Fix #7
 *   8. SOFT_WEIGHT Risk Factors
 *   9. Outcome Terminals
 */
export class ClinicalTreeGenerator {

    static generateTreeNodes(spec: ClinicalSpec): TreeNode[] {
        const nodes: TreeNode[] = [];
        const d = spec.disease_id.toLowerCase();

        // Helper to generate IDs
        const id = (suffix: string) => `${d}__${suffix}`;

        // ── STEP 0: Pre-build outcome terminal nodes ───────────────────────────────
        const OUTCOME_CONFIRMED = id(`outcome__confirmed`);
        const OUTCOME_PENDING = id(`outcome__pending`);
        const OUTCOME_REFER = id(`outcome__refer`);
        const OUTCOME_EMERGENCY = id(`outcome__emergency`);
        const OUTCOME_EXCLUDED = id(`outcome__excluded`);

        // ── STEP 1: Entry gate node ────────────────────────────────────────────────
        const primarySymptom = spec.entry_criteria.required_primary_symptom?.[0];

        // Determines the next node after Entry Gate success
        const firstRealNode = spec.endemicity_required
            ? id(`epi__0`)
            : (spec.risk_factors.some(r => r.gate_type === 'HARD_GATE') ? id(`risk_hard__0`) : id(`severe__0`));

        if (primarySymptom) {
            nodes.push({
                node_id: id(`entry_gate`),
                disease_id: spec.disease_id,
                node_type: 'ENTRY_GATE',
                question: `Apakah anak mengalami ${primarySymptom.replace(/_/g, " ")}?`,
                answer_yes: firstRealNode,
                answer_no: OUTCOME_EXCLUDED,
                metadata: {
                    source_field: "entry_criteria.required_primary_symptom",
                    clinical_id: primarySymptom
                }
            });
        }

        // ── STEP 2: Epidemiology nodes ─────────────────────────────────────────────
        if (spec.entry_criteria.epidemiology && spec.entry_criteria.epidemiology.length > 0) {
            spec.entry_criteria.epidemiology.forEach((epi, i) => {
                const isLast = i === spec.entry_criteria.epidemiology!.length - 1;
                // If last epi -> check HARD GATES, else Severe
                const nextBlock = spec.risk_factors.some(r => r.gate_type === 'HARD_GATE')
                    ? id(`risk_hard__0`)
                    : id(`severe__0`);

                nodes.push({
                    node_id: id(`epi__${i}`),
                    disease_id: spec.disease_id,
                    node_type: 'EPIDEMIOLOGY',
                    question: this.buildEpiQuestion(epi),
                    answer_yes: isLast ? nextBlock : id(`epi__${i + 1}`),
                    answer_no: OUTCOME_PENDING, // Weakened suspicion but not excluded? (Prompt says PENDING)
                    metadata: {
                        source_field: "entry_criteria.epidemiology",
                        clinical_id: epi
                    }
                });
            });
        }

        // ── STEP 2.5: HARD_GATE Risk Factors (Critical Fix #4) ─────────────────────
        // Must appear after epidemiology but before severe/symptom evaluation.
        const hardRisks = spec.risk_factors.filter(r => r.gate_type === 'HARD_GATE');
        hardRisks.forEach((rf, i) => {
            const isLast = i === hardRisks.length - 1;
            nodes.push({
                node_id: id(`risk_hard__${i}`),
                disease_id: spec.disease_id,
                node_type: 'RISK_FACTOR',
                question: rf.label,
                answer_yes: isLast ? id(`severe__0`) : id(`risk_hard__${i + 1}`),
                answer_no: OUTCOME_EXCLUDED, // Hard gate failure = Exclusion
                metadata: {
                    gate_type: 'HARD_GATE',
                    source_field: "risk_factors",
                    clinical_id: rf.id
                }
            });
        });

        // ── STEP 3: Severe criteria nodes ─────────────────────────────────────────
        // CRITICAL: These come BEFORE symptoms.
        spec.severe_criteria.forEach((sc, i) => {
            const isLast = i === spec.severe_criteria.length - 1;
            const nextBlock = id(`symptom_primary__0`);

            nodes.push({
                node_id: id(`severe__${i}`),
                disease_id: spec.disease_id,
                node_type: 'SEVERE_CRITERIA',
                question: sc.label,
                answer_yes: OUTCOME_EMERGENCY, // Short-circuit
                answer_no: isLast ? nextBlock : id(`severe__${i + 1}`),
                severity_level: 'SEVERE',
                metadata: {
                    source_field: "severe_criteria",
                    clinical_id: sc.id,
                    override_to: 'EMERGENCY' // Explicit override flag
                }
            });
        });

        // ── STEP 4: PRIMARY symptom nodes ─────────────────────────────────────────
        const primarySymptoms = spec.core_symptoms.filter(s => s.weight === 'PRIMARY');
        const secondarySymptoms = spec.core_symptoms.filter(s => s.weight === 'SECONDARY');

        primarySymptoms.forEach((sym, i) => {
            const isLast = i === primarySymptoms.length - 1;
            const nextBlock = spec.warning_signs.length > 0 ? id(`warning__0`) : (secondarySymptoms.length > 0 ? id(`symptom_secondary__0`) : id(`risk_soft__0`));

            nodes.push({
                node_id: id(`symptom_primary__${i}`),
                disease_id: spec.disease_id,
                node_type: 'SYMPTOM',
                question: sym.label,
                answer_yes: isLast ? nextBlock : id(`symptom_primary__${i + 1}`),
                answer_no: isLast ? nextBlock : id(`symptom_primary__${i + 1}`),
                metadata: {
                    weight: 'PRIMARY',
                    counts_toward_minimum: sym.counts_toward_minimum,
                    source_field: "core_symptoms",
                    clinical_id: sym.id // Critical Fix #2: Store ID for indexing
                    // No override_to here, symptoms just count
                }
            });
        });

        // ── STEP 5: Warning sign nodes ────────────────────────────────────────────
        spec.warning_signs.forEach((ws, i) => {
            const isLast = i === spec.warning_signs.length - 1;

            // Determine next block (Secondary -> Lab -> Soft Risk -> Outcome)
            let nextBlock = OUTCOME_PENDING; // Default fallback
            if (secondarySymptoms.length > 0) nextBlock = id(`symptom_secondary__0`);
            else if (spec.lab_triggers.some(l => l.available_at_primary_care)) nextBlock = id(`lab__0`);
            else if (spec.risk_factors.some(r => r.gate_type === 'SOFT_WEIGHT')) nextBlock = id(`risk_soft__0`);
            else nextBlock = OUTCOME_PENDING;

            // Branch Logic: Override immediately (Critical Fix #6)
            const overrideOutcome = ws.override_to === 'EMERGENCY' ? OUTCOME_EMERGENCY : OUTCOME_REFER;

            nodes.push({
                node_id: id(`warning__${i}`),
                disease_id: spec.disease_id,
                node_type: 'WARNING_SIGN',
                question: ws.label,
                answer_yes: overrideOutcome,
                answer_no: isLast ? nextBlock : id(`warning__${i + 1}`),
                severity_level: 'WARNING',
                metadata: {
                    source_field: "warning_signs",
                    clinical_id: ws.id,
                    override_to: ws.override_to
                }
            });
        });

        // ── STEP 6: SECONDARY symptom nodes ──────────────────────────────────────
        secondarySymptoms.forEach((sym, i) => {
            const isLast = i === secondarySymptoms.length - 1;

            // Determine next block (Lab -> Soft Risk -> Outcome)
            let nextBlock = OUTCOME_PENDING;
            if (spec.lab_triggers.some(l => l.available_at_primary_care)) nextBlock = id(`lab__0`);
            else if (spec.risk_factors.some(r => r.gate_type === 'SOFT_WEIGHT')) nextBlock = id(`risk_soft__0`);
            else nextBlock = OUTCOME_PENDING;

            nodes.push({
                node_id: id(`symptom_secondary__${i}`),
                disease_id: spec.disease_id,
                node_type: 'SYMPTOM',
                question: sym.label,
                answer_yes: isLast ? nextBlock : id(`symptom_secondary__${i + 1}`),
                answer_no: isLast ? nextBlock : id(`symptom_secondary__${i + 1}`),
                metadata: {
                    weight: 'SECONDARY',
                    counts_toward_minimum: sym.counts_toward_minimum,
                    source_field: "core_symptoms",
                    clinical_id: sym.id
                }
            });
        });

        // ── STEP 7: Lab trigger nodes ──────────────────────────────────────────
        // Critical Fix #7: Map only available labs and guard empty list
        const availableLabs = spec.lab_triggers.filter(l => l.available_at_primary_care);
        if (availableLabs.length > 0) {
            availableLabs.forEach((lab, i) => {
                const isLast = i === availableLabs.length - 1;
                const nextBlock = spec.risk_factors.some(r => r.gate_type === 'SOFT_WEIGHT')
                    ? id(`risk_hard__0`) // Fallback to soft risks? id logic check below
                    : OUTCOME_PENDING;

                // Oops, logic above used 'risk_soft__0', let's fix consistency
                const realNext = spec.risk_factors.some(r => r.gate_type === 'SOFT_WEIGHT')
                    ? id(`risk_soft__0`)
                    : OUTCOME_PENDING;

                nodes.push({
                    node_id: id(`lab__${i}`),
                    disease_id: spec.disease_id,
                    node_type: 'LAB_TRIGGER',
                    question: lab.label,
                    answer_yes: isLast ? OUTCOME_CONFIRMED : id(`lab__${i + 1}`),
                    answer_no: isLast ? realNext : id(`lab__${i + 1}`),
                    metadata: {
                        lab_required: false,
                        source_field: "lab_triggers",
                        clinical_id: lab.id
                    }
                });
            });
        }

        // ── STEP 8: SOFT_WEIGHT risk factor nodes ────────────────────────────────
        const softRisks = spec.risk_factors.filter(r => r.gate_type === 'SOFT_WEIGHT');
        softRisks.forEach((rf, i) => {
            const isLast = i === softRisks.length - 1;
            nodes.push({
                node_id: id(`risk_soft__${i}`),
                disease_id: spec.disease_id,
                node_type: 'RISK_FACTOR',
                question: rf.label,
                answer_yes: isLast ? OUTCOME_CONFIRMED : id(`risk_soft__${i + 1}`), // Proceed to generic confirmation check
                answer_no: isLast ? OUTCOME_CONFIRMED : id(`risk_soft__${i + 1}`),
                metadata: {
                    gate_type: 'SOFT_WEIGHT',
                    source_field: "risk_factors",
                    clinical_id: rf.id
                }
            });
        });

        // ── STEP 9: Outcome terminal nodes ────────────────────────────────────────
        // Helper specifically for outcomes to satisfy type checker (clinical_id not really needed for outcome but required by schema)
        const outcomeMeta = { source_field: "generated", clinical_id: "outcome_node" };

        nodes.push(
            { node_id: OUTCOME_CONFIRMED, disease_id: spec.disease_id, node_type: 'OUTCOME', question: "", answer_yes: "", answer_no: "", exam_outcome: 'DIAGNOSED', metadata: outcomeMeta },
            { node_id: OUTCOME_PENDING, disease_id: spec.disease_id, node_type: 'OUTCOME', question: "", answer_yes: "", answer_no: "", exam_outcome: 'PENDING', metadata: outcomeMeta },
            { node_id: OUTCOME_REFER, disease_id: spec.disease_id, node_type: 'OUTCOME', question: "", answer_yes: "", answer_no: "", exam_outcome: 'REFER_IMMEDIATELY', metadata: outcomeMeta },
            { node_id: OUTCOME_EMERGENCY, disease_id: spec.disease_id, node_type: 'OUTCOME', question: "", answer_yes: "", answer_no: "", exam_outcome: 'EMERGENCY', metadata: outcomeMeta },
            { node_id: OUTCOME_EXCLUDED, disease_id: spec.disease_id, node_type: 'OUTCOME', question: "", answer_yes: "", answer_no: "", exam_outcome: 'PENDING', metadata: outcomeMeta }
        );

        return nodes;
    }

    private static buildEpiQuestion(epiCondition: string): string {
        const map: Record<string, string> = {
            "lives_in_endemic_area": "Apakah anak tinggal di daerah endemis demam berdarah?",
            "recent_travel_endemic_area": "Apakah anak baru-baru ini bepergian ke daerah endemis?",
            "close_contact_with_infected": "Apakah ada anggota keluarga atau orang dekat yang terinfeksi?",
            "shared_items": "Apakah anak berbagi handuk, pakaian, atau peralatan mandi?"
        };
        return map[epiCondition] ?? `Apakah kondisi berikut berlaku: ${epiCondition.replace(/_/g, " ")}?`;
    }
}


import { z } from 'zod';

// ============================================================
// PART 1: CLINICAL SPECIFICATION (Source Artifact)
// ============================================================

export const SeveritySchema = z.enum(['MILD', 'WARNING', 'SEVERE', 'EMERGENCY']);
export const ExamOutcomeSchema = z.enum([
    'DIAGNOSED',
    'PENDING',
    'REFER_IMMEDIATELY',
    'EMERGENCY',
    'CANCELED',
    'EXCLUDED'
]);

export const AmbiguityFlagSchema = z.object({
    field: z.string(),
    issue: z.string(),
    resolution: z.enum(['ASSUMED', 'REQUIRES_CLINICIAN_REVIEW']),
});

export const ClinicalSpecSchema = z.object({
    disease_id: z.string(),
    disease_name: z.string(),
    category: z.string(),
    age_risk_group: z.array(z.string()),
    endemicity_required: z.boolean(),
    transmission_mode: z.array(z.string()),

    entry_criteria: z.object({
        epidemiology: z.array(z.string()).optional().nullable(),
        primary_condition: z.array(z.string()).optional().nullable(),
        required_primary_symptom: z.array(z.string()).optional().nullable(),
        minimum_additional_symptoms_required: z.number(),
    }),

    core_symptoms: z.array(z.object({
        id: z.string(),
        label: z.string(),
        weight: z.enum(['PRIMARY', 'SECONDARY']),
        counts_toward_minimum: z.boolean(),
    })),

    risk_factors: z.array(z.object({
        id: z.string(),
        label: z.string(),
        gate_type: z.enum(['HARD_GATE', 'SOFT_WEIGHT']),
    })),

    warning_signs: z.array(z.object({
        id: z.string(),
        label: z.string(),
        requires_observation: z.boolean(),
        override_to: ExamOutcomeSchema,
    })),

    severe_criteria: z.array(z.object({
        id: z.string(),
        label: z.string(),
    })),

    lab_triggers: z.array(z.object({
        id: z.string(),
        label: z.string(),
        available_at_primary_care: z.boolean(),
    })),

    disease_spectrum: z.object({
        stages: z.array(SeveritySchema),
        stage_rules: z.array(z.object({
            from_stage: SeveritySchema,
            to_stage: SeveritySchema,
            trigger_condition: z.string(),
        })),
    }),

    ambiguity_flags: z.array(AmbiguityFlagSchema).optional(),
});

export type ClinicalSpec = z.infer<typeof ClinicalSpecSchema>;

// ============================================================
// PART 2: EXECUTABLE TREE NODES (Runtime Artifact)
// ============================================================

export const TreeNodeTypeSchema = z.enum([
    'ENTRY_GATE',
    'EPIDEMIOLOGY',
    'RISK_FACTOR',
    'SYMPTOM',
    'WARNING_SIGN',
    'SEVERE_CRITERIA',
    'LAB_TRIGGER',
    'OUTCOME',
]);

export type TreeNodeType = z.infer<typeof TreeNodeTypeSchema>;

export type ExamOutcome = z.infer<typeof ExamOutcomeSchema>;

export const TreeNodeSchema = z.object({
    node_id: z.string(),
    disease_id: z.string(),
    node_type: TreeNodeTypeSchema,
    question: z.string(),
    answer_yes: z.string(), // Next Node ID
    answer_no: z.string(),  // Next Node ID

    severity_level: SeveritySchema.optional(),
    exam_outcome: ExamOutcomeSchema.optional(), // Only on OUTCOME nodes

    metadata: z.object({
        source_field: z.string(),
        clinical_id: z.string(), // REQUIRED now

        // Aggregation Logic Fields (Runtime Decoupling)
        weight: z.enum(['PRIMARY', 'SECONDARY']).optional(),
        gate_type: z.enum(['HARD_GATE', 'SOFT_WEIGHT']).optional(),

        // Safety Overrides
        override_to: ExamOutcomeSchema.optional(),

        // Symptom Counting
        counts_toward_minimum: z.boolean().optional(),
        SymptomThreshold: z.number().optional(), // Global threshold (stored on Entry Gate or root)

        lab_required: z.boolean().optional(),
    }),
});

export type TreeNode = z.infer<typeof TreeNodeSchema>;

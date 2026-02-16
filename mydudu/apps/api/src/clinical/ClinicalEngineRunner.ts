import {
    TreeNode,
    ExamOutcome
} from './clinical.types';

/**
 * ClinicalEngineRunner
 * 
 * Handles the runtime traversal and final aggregation of the tree.
 * Purely deterministic. Decoupled from ClinicalSpec source.
 */
export class ClinicalEngineRunner {

    /**
     * resolveOutcome
     * 
     * Runs AFTER the session is complete to determine the final clinical outcome.
     * Aggregates all answers and applies the disease rules based ONLY on TreeNode metadata.
     * 
     * @param answers Map of node_id -> boolean (true=YES, false=NO)
     * @param nodes The generated TreeNode[] (contains all rule metadata)
     */
    static resolveOutcome(
        answers: Record<string, boolean>,
        nodes: TreeNode[]
    ): ExamOutcome {

        // ── RULE 1: Global Severe Override (Critical Fix #1) ─────────────────
        // Any SEVERE_CRITERIA answered YES -> EMERGENCY
        // Relies on metadata.override_to being set to EMERGENCY for severe nodes
        const severeTriggered = nodes.some(n =>
            n.node_type === 'SEVERE_CRITERIA' &&
            answers[n.node_id] === true
        );

        if (severeTriggered) return 'EMERGENCY';


        // ── RULE 2: Warning Signs Override (Critical Fix #6) ─────────────────
        // Check overrides to REFER or EMERGENCY
        // Relies on metadata.override_to key
        for (const node of nodes) {
            if (node.node_type === 'WARNING_SIGN' && answers[node.node_id] === true) {
                if (node.metadata.override_to === 'EMERGENCY') return 'EMERGENCY';
                if (node.metadata.override_to === 'REFER_IMMEDIATELY') return 'REFER_IMMEDIATELY';
            }
        }

        // ── RULE 3: Minimum Symptom Count (Critical Fix #3) ──────────────────
        // Must count across ALL core symptoms (Primary OR Secondary) 
        // that have counts_toward_minimum === true

        let symptomCount = 0;
        let threshold = 2; // Default fallback

        // Find threshold from Entry Gate metadata (or any node that carries it)
        const entryNode = nodes.find(n => n.node_type === 'ENTRY_GATE');
        if (entryNode?.metadata.SymptomThreshold !== undefined) {
            threshold = entryNode.metadata.SymptomThreshold;
        }

        for (const node of nodes) {
            if (node.node_type === 'SYMPTOM' && node.metadata.counts_toward_minimum) {
                if (answers[node.node_id] === true) {
                    symptomCount++;
                }
            }
        }

        if (symptomCount >= threshold) {
            return 'DIAGNOSED';
        }

        // Default Fallback
        return 'PENDING';
    }

    /**
     * getNextNode
     * 
     * Simple deterministic traversal.
     * Explicitly ignores branching for SYMPTOM nodes to enforce linear flow.
     * 
     * @param currentNodeId Current node
     * @param answer boolean (YES/NO)
     * @param nodes Full tree
     */
    static getNextNode(currentNodeId: string, answer: boolean, nodes: TreeNode[]): TreeNode | undefined {
        const currentCheck = nodes.find(n => n.node_id === currentNodeId);
        if (!currentCheck) return undefined;

        // CRITICAL SAFETY FIX: Symptoms must never branch based on answer
        // They are data collection points only.
        if (currentCheck.node_type === 'SYMPTOM') {
            // For symptoms, YES and NO paths are identical in the generator,
            // but we enforce it here structurally.
            // Check if answer_yes is outcome?
            // Actually generator sets both yes/no to same next node.
            // We just grab answer_yes target.
            return nodes.find(n => n.node_id === currentCheck.answer_yes);
        }

        const nextId = answer ? currentCheck.answer_yes : currentCheck.answer_no;
        return nodes.find(n => n.node_id === nextId);
    }

    /**
     * findNextQuestion
     * 
     * Traces the path from Entry Gate using provided answers until it hits
     * a node that has NO answer yet. Returns that node.
     */
    static findNextQuestion(answers: Record<string, boolean>, nodes: TreeNode[]): TreeNode | undefined {
        // Start at valid start node (Entry Gate) or first node
        // The generator guarantees Entry Gate is first if present, or index 0.
        let currentNode = nodes.find(n => n.node_type === 'ENTRY_GATE') || nodes[0];

        while (currentNode) {
            // If it's an outcome node, stop (no more questions)
            if (currentNode.node_type === 'OUTCOME') {
                return undefined;
            }

            // Check if answered
            const answer = answers[currentNode.node_id];

            if (answer !== undefined) {
                // Answered -> Move next
                const next = this.getNextNode(currentNode.node_id, answer, nodes);
                if (!next) return undefined; // Should not happen in valid tree
                currentNode = next;
            } else {
                // Unanswered -> This is the question
                return currentNode;
            }
        }
        return undefined;
    }
}

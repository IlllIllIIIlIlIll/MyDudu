
import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
    Logger
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicalEngineRunner } from './ClinicalEngineRunner';
import { ClinicalSpec, TreeNode, ExamOutcome } from './clinical.types';
import { StartSessionDto, AnswerDto, SessionStatusDto } from './clinical.dto';

// Simple in-memory mock for Active Trees (until we hook up DB)
// In a real app, this would be injected or fetched from Prisma
interface ActiveTree {
    diseaseId: string;
    version: string;
    treeNodes: TreeNode[];
}

@Injectable()
export class ClinicalEngineService {
    private readonly logger = new Logger(ClinicalEngineService.name);

    constructor(private prisma: PrismaService) { }

    // ── Hashing Helper (Step 1) ─────────────────────────────────────────────
    static hashSpec(spec: ClinicalSpec): string {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(spec))
            .digest('hex');
    }

    // ── API Methods ─────────────────────────────────────────────────────────

    /**
     * Initialize session bound to a specific disease tree version.
     */
    async startSession(dto: StartSessionDto) {
        // 1. Fetch active trees for requested diseases
        const activeTrees = await this.prisma.clinicalDecisionTree.findMany({
            where: {
                diseaseId: { in: dto.diseaseIds },
                isActive: true
            }
        });

        if (activeTrees.length === 0) {
            throw new NotFoundException('No active clinical trees found for requested diseases');
        }

        // 2. Create session
        // We use the version of the FIRST tree as the session version lock for now,
        // assuming all active trees should be compatible or independently versioned.
        // If strict multi-versioning needed, we'd store a map. For now, locking to primary tree version.
        const primaryTree = activeTrees[0];

        // PHASE 9: Immutable Tree Snapshot
        // Store complete tree nodes at session creation for guaranteed replayability
        const snapshotNodes = activeTrees.reduce((acc, tree) => {
            acc[tree.diseaseId] = tree.treeNodes;
            return acc;
        }, {} as Record<string, any>);

        const session = await this.prisma.session.create({
            data: {
                sessionUuid: crypto.randomUUID(),
                childId: dto.childId,
                deviceId: dto.deviceId,
                treeVersion: primaryTree.version, // Lock session to this version
                snapshotNodes: snapshotNodes, // PHASE 9: Store immutable snapshot
                status: 'IN_PROGRESS'
            }
        });

        // 3. Return initial nodes (Entry Gates)
        const nodes = activeTrees.map(tree => {
            const treeNodes = tree.treeNodes as unknown as TreeNode[];
            // Entry Gate is usually the first node, or strictly typed 'ENTRY_GATE'
            const entryNode = treeNodes.find(n => n.node_type === 'ENTRY_GATE');
            return {
                diseaseId: tree.diseaseId,
                nodeId: entryNode?.node_id,
                question: entryNode?.question
            };
        });

        return {
            sessionId: session.sessionUuid,
            treeVersion: session.treeVersion, // Required for hardening test verification
            nodes
        };
    }

    /**
     * Submit one answer and get next node or outcome.
     */
    async submitAnswer(dto: AnswerDto) {
        // 1. Get Session & Verify
        const session = await this.prisma.session.findUnique({
            where: { sessionUuid: dto.sessionId },
            include: { quizSteps: true }
        });

        if (!session) throw new NotFoundException('Session not found');

        // PHASE 5: Timeout Protection
        this.checkSessionTimeout(session);

        // STEP 4: Emergency Hard Stop
        if (session.examOutcome === 'EMERGENCY' || session.status === 'CLINICALLY_SUFFICIENT') {
            throw new BadRequestException("Session already terminated.");
        }

        // 2. Security Check: Validate Node belongs to locked tree version
        const diseaseId = dto.nodeId.split('__')[0].toUpperCase();

        const tree = await this.prisma.clinicalDecisionTree.findFirst({
            where: {
                diseaseId: diseaseId,
                version: session.treeVersion || undefined,
                isActive: true
            }
        });

        if (!tree) throw new ForbiddenException(`Tree not found or version mismatch for ${diseaseId}`);

        // PHASE 1: Session State Integrity Lock
        if (session.treeVersion && tree.version !== session.treeVersion) {
            throw new ConflictException("Tree version mismatch.");
        }

        // PHASE 1: Spec Hash Integrity Verification
        if (tree.specHash && session.treeVersion) {
            const currentSpecHash = ClinicalEngineService.hashSpec(tree.clinicalSpec as ClinicalSpec);
            if (currentSpecHash !== tree.specHash) {
                this.logger.error({
                    event: 'SPEC_HASH_MISMATCH',
                    treeId: tree.id,
                    diseaseId: tree.diseaseId,
                    version: tree.version
                });
                throw new ConflictException("Spec integrity violation.");
            }
        }

        const treeNodes = tree.treeNodes as unknown as TreeNode[];
        const nodeDef = treeNodes.find(n => n.node_id === dto.nodeId);

        if (!nodeDef) throw new ForbiddenException('Node does not belong to the active tree version');

        // PHASE 4: Observability - Log node traversal
        this.logger.log({
            event: "CLINICAL_NODE_TRAVERSE",
            sessionId: dto.sessionId,
            nodeId: dto.nodeId,
            answer: dto.answer,
            treeVersion: tree.version,
            timestamp: new Date().toISOString()
        });

        // PHASE 2: Concurrency Guard - Transaction-based answer submission
        const savedStep = await this.prisma.$transaction(async (tx) => {
            const existing = await tx.sessionQuizStep.findFirst({
                where: {
                    sessionId: session.id,
                    nodeId: dto.nodeId
                }
            });

            if (existing) {
                // Idempotent: return existing if same answer
                if (existing.answerYes === dto.answer) {
                    return existing;
                }
                // Update if different answer
                return await tx.sessionQuizStep.update({
                    where: { id: existing.id },
                    data: { answerYes: dto.answer }
                });
            }

            // Create new step
            return await tx.sessionQuizStep.create({
                data: {
                    sessionId: session.id,
                    nodeId: dto.nodeId,
                    question: nodeDef.question,
                    answerYes: dto.answer,
                    stepOrder: session.quizSteps.length + 1,
                    treeVersion: tree.version
                }
            });
        });

        // 4. Re-Evaluate Outcome
        // We need answers for ALL diseases in this session to support orchestration
        // Use a generic findMany approach? Or just re-fetch steps?
        const allSteps = await this.prisma.sessionQuizStep.findMany({
            where: { sessionId: session.id }
        });

        // Re-construct answers map
        const answersMap: Record<string, Record<string, boolean>> = {};
        allSteps.forEach(step => {
            const dId = step.nodeId.split('__')[0].toUpperCase();
            if (!answersMap[dId]) answersMap[dId] = {};
            answersMap[dId][step.nodeId] = step.answerYes;
        });

        // Fetch active trees for these diseases
        const affectedDiseaseIds = Object.keys(answersMap);
        const activeTrees = await this.prisma.clinicalDecisionTree.findMany({
            where: {
                diseaseId: { in: affectedDiseaseIds }, // Or satisfy session version
                version: session.treeVersion || undefined
            }
        });

        const activeTreeCache: ActiveTree[] = activeTrees.map(t => ({
            diseaseId: t.diseaseId,
            version: t.version,
            treeNodes: t.treeNodes as unknown as TreeNode[]
        }));

        // Run Orchestrator
        const results = ClinicalEngineService.evaluateSession(
            answersMap,
            activeTreeCache,
            session.treeVersion || undefined
        );

        // Determine "Next Node" or Final Outcome
        // Logic:
        // 1. Look at top priority result.
        // 2. If it's finalized (Diagnosed/Emergency/Refer), return that.
        // 3. If Pending, find the next unanswered question in that tree.

        const topResult = results[0]; // Highest priority

        if (!topResult) return { status: 'PENDING', nextNode: null };

        if (['EMERGENCY', 'REFER_IMMEDIATELY', 'DIAGNOSED'].includes(topResult.outcome)) {
            // Stop & Return Outcome
            // Update Session outcome
            await this.prisma.session.update({
                where: { id: session.id },
                data: {
                    examOutcome: topResult.outcome,
                    status: 'CLINICALLY_SUFFICIENT', // or COMPLETE
                    diagnosisCode: null, // Should map outcome -> diagnosis code? Maybe later.
                    diagnosisText: `Automated Outcome: ${topResult.outcome} (${topResult.diseaseId})`
                }
            });

            return {
                outcome: topResult.outcome,
                severityRank: topResult.priority,
                diseaseId: topResult.diseaseId
            };
        }

        // If PENDING, find next node in the Pending tree(s)
        // We iterate results to find the first one that needs input
        for (const res of results) {
            if (res.outcome === 'PENDING') {
                const tree = activeTreeCache.find(t => t.diseaseId === res.diseaseId);
                if (!tree) continue;

                const nextNode = ClinicalEngineRunner.findNextQuestion(
                    answersMap[res.diseaseId] || {},
                    tree.treeNodes
                );

                if (nextNode) {
                    return {
                        nextNode: {
                            nodeId: nextNode.node_id,
                            question: nextNode.question,
                            diseaseId: res.diseaseId
                        }
                    };
                }
            }
        }

        // If no more questions but still Pending? -> Inconclusive / Healthy?
        return { outcome: 'PENDING', message: 'No more questions available.' };
    }

    async getSessionStatus(sessionId: string): Promise<SessionStatusDto> {
        const session = await this.prisma.session.findUnique({
            where: { sessionUuid: sessionId },
            include: { quizSteps: true }
        });

        if (!session) throw new NotFoundException('Session not found');

        // We could re-run evaluateSession here using steps to get "currentNode" dynamically
        // But for now just raw status
        return {
            sessionId: session.sessionUuid,
            status: session.status,
            outcome: session.examOutcome
        };
    }

    // ── Orchestrator (Steps 8, 9, 10) ───────────────────────────────────────
    /**
     * Runs analysis for a single session against all relevant trees.
     * Respects version locking if provided.
     * 
     * @param answers Per-disease map of answers { "DENGUE": { "node_1": true }, "SSSS": { ... } }
     * @param availableTrees List of trees to evaluate
     * @param lockedVersion Optional version string to enforce (e.g. "v1")
     */
    static evaluateSession(
        answers: Record<string, Record<string, boolean>>,
        availableTrees: ActiveTree[],
        lockedVersion?: string
    ): Array<{ diseaseId: string, outcome: ExamOutcome, priority: number }> {

        const results = [];

        for (const tree of availableTrees) {
            // Version Locking Check (Step 8)
            // If the session is locked to a specific tree version, skip mismatched trees
            // Note: In reality, we might filter availableTrees upstream based on the session lock
            if (lockedVersion && tree.version !== lockedVersion) {
                continue;
            }

            const treeAnswers = answers[tree.diseaseId] || {};

            // RUNNER CALL (Decoupled - Step 2)
            const outcome = ClinicalEngineRunner.resolveOutcome(treeAnswers, tree.treeNodes);

            results.push({
                diseaseId: tree.diseaseId,
                outcome,
                priority: this.getSeverityRank(outcome)
            });
        }

        // Sort by priority (High to Low)
        return results.sort((a, b) => b.priority - a.priority);
    }

    // ── Severity Ranking (Step 10 + Phase 8) ────────────────────────────────
    private static getSeverityRank(outcome: ExamOutcome): number {
        const rank: Record<ExamOutcome, number> = {
            'EMERGENCY': 4,
            'REFER_IMMEDIATELY': 3,
            'DIAGNOSED': 2,
            'PENDING': 1,
            'CANCELED': 0,
            'EXCLUDED': 0
        };
        return rank[outcome] ?? 0;
    }

    // ── PHASE 3: Deterministic Replay Test ──────────────────────────────────
    /**
     * Replay a completed session to verify deterministic outcome.
     * Loads stored answers, re-runs engine, confirms final outcome matches.
     */
    async replaySession(sessionId: string): Promise<{ match: boolean; storedOutcome: ExamOutcome | null; replayedOutcome: ExamOutcome | null }> {
        const session = await this.prisma.session.findUnique({
            where: { sessionUuid: sessionId },
            include: { quizSteps: true }
        });

        if (!session) throw new NotFoundException('Session not found for replay');

        // Reconstruct answers map
        const answersMap: Record<string, Record<string, boolean>> = {};
        session.quizSteps.forEach(step => {
            const dId = step.nodeId.split('__')[0].toUpperCase();
            if (!answersMap[dId]) answersMap[dId] = {};
            answersMap[dId][step.nodeId] = step.answerYes;
        });

        // Fetch trees matching session version
        const affectedDiseaseIds = Object.keys(answersMap);
        const activeTrees = await this.prisma.clinicalDecisionTree.findMany({
            where: {
                diseaseId: { in: affectedDiseaseIds },
                version: session.treeVersion || undefined
            }
        });

        const activeTreeCache: ActiveTree[] = activeTrees.map(t => ({
            diseaseId: t.diseaseId,
            version: t.version,
            treeNodes: t.treeNodes as unknown as TreeNode[]
        }));

        // Re-run orchestrator
        const results = ClinicalEngineService.evaluateSession(
            answersMap,
            activeTreeCache,
            session.treeVersion || undefined
        );

        const topResult = results[0];
        const replayedOutcome = topResult?.outcome || null;
        const storedOutcome = session.examOutcome;

        const match = replayedOutcome === storedOutcome;

        if (!match) {
            this.logger.error({
                event: 'REPLAY_MISMATCH',
                sessionId,
                storedOutcome,
                replayedOutcome,
                timestamp: new Date().toISOString()
            });
        }

        return { match, storedOutcome, replayedOutcome };
    }

    // ── PHASE 5: Timeout Protection ─────────────────────────────────────────
    private static readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    private checkSessionTimeout(session: { updatedAt: Date; status: string }): void {
        const now = Date.now();
        const lastUpdate = new Date(session.updatedAt).getTime();

        if (now - lastUpdate > ClinicalEngineService.SESSION_TIMEOUT_MS && session.status === 'IN_PROGRESS') {
            throw new BadRequestException('Session expired. Please restart.');
        }
    }

    // ── PHASE 8: Multi-Disease Conflict Resolver ─────────────────────────────
    /**
     * Enhanced evaluateSession with conflict resolution.
     * Never returns multiple EMERGENCY outcomes.
     * Ranks by severity weight and filters duplicates.
     */
    static evaluateSessionWithConflictResolution(
        answers: Record<string, Record<string, boolean>>,
        availableTrees: ActiveTree[],
        lockedVersion?: string
    ): Array<{ diseaseId: string, outcome: ExamOutcome, priority: number }> {
        const results = this.evaluateSession(answers, availableTrees, lockedVersion);

        // PHASE 8: Conflict Resolution
        // If multiple EMERGENCY → keep highest severity only (first one)
        const hasEmergency = results.some(r => r.outcome === 'EMERGENCY');
        if (hasEmergency) {
            const emergencyResult = results.find(r => r.outcome === 'EMERGENCY');
            return emergencyResult ? [emergencyResult] : results;
        }

        // If multiple REFER_IMMEDIATELY → rank by severity weight (already sorted)
        // If multiple DIAGNOSED → allow multiple
        return results;
    }
}

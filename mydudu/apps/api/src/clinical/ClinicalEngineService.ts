
import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
    Logger
} from '@nestjs/common';
import * as crypto from 'crypto';
import stringify = require('fast-json-stable-stringify');
import { PrismaService } from '../prisma/prisma.service';
import { SessionStatus } from '@prisma/client';
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
            .update(stringify(spec))
            .digest('hex');
    }

    // ── API Methods ─────────────────────────────────────────────────────────

    /**
     * Initialize session bound to a specific disease tree version.
     */
    async startSession(dto: StartSessionDto) {
        // 1. Fetch active trees
        // If diseaseIds provided, use those; otherwise fetch ALL active trees (screening mode)
        const treeFilter = dto.diseaseIds && dto.diseaseIds.length > 0
            ? { diseaseId: { in: dto.diseaseIds }, isActive: true }
            : { isActive: true as true };

        const activeTrees = await this.prisma.clinicalDecisionTree.findMany({
            where: treeFilter
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

        // PHASE 6: Transaction Atomicity - Session Creation / Reuse
        // Check for existing IN_PROGRESS session for same child
        // Relaxing device constraint: If a session is open for this child, we reuse it regardless of device mismatch (e.g. tablet vs scale)
        const existingSession = await this.prisma.session.findFirst({
            where: {
                childId: dto.childId,
                examOutcome: 'PENDING',
                measurementCompleted: true
            },
            orderBy: { recordedAt: 'desc' }
        });

        let session;

        if (existingSession) {
            // Reuse existing session — update clinical context if missing
            if (!existingSession.treeVersion || !existingSession.snapshotNodes) {
                session = await this.prisma.session.update({
                    where: { id: existingSession.id },
                    data: {
                        treeVersion: primaryTree.version,
                        snapshotNodes: snapshotNodes
                    }
                });
            } else {
                session = existingSession;
            }
        } else {
            // No existing session — measurement must be completed first
            throw new NotFoundException(
                'No pending session found for this child. Please complete measurement first.'
            );
        }

        // 3. Return initial nodes (Entry Gates) for all active trees
        const nodes = activeTrees.map(tree => {
            const treeNodes = tree.treeNodes as unknown as TreeNode[];
            const entryNode = treeNodes.find(n => n.node_type === 'ENTRY_GATE');
            return {
                diseaseId: tree.diseaseId,
                nodeId: entryNode?.node_id,
                question: entryNode?.question,
                layman: entryNode?.layman
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

        // STEP 4: Hard Stop — block answers if session is already finalized
        if (session.examOutcome === 'EMERGENCY' || session.status === 'CLINICALLY_DONE') {
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
            console.log("Stored hash:", tree.specHash);
            console.log("Runtime hash:", currentSpecHash);
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
        await this.prisma.$transaction(async (tx) => {
            const existing = await tx.sessionQuizStep.findFirst({
                where: {
                    sessionId: session.id,
                    nodeId: dto.nodeId
                }
            });

            if (existing) {
                if (existing.answerYes === dto.answer) return existing; // Idempotent
                return await tx.sessionQuizStep.update({
                    where: { id: existing.id },
                    data: { answerYes: dto.answer }
                });
            }

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

        // ── MULTI-DISEASE SCREENING ENGINE ────────────────────────────────────
        //
        // Strategy: Sequential
        // 1. Rebuild per-disease answers map from all stored quiz steps
        // 2. For each disease in the session snapshot, determine its state:
        //    - ACTIVE:    findNextQuestion() returns a node
        //    - EXCLUDED:  tree reached OUTCOME(EXCLUDED) node
        //    - FINAL:     tree reached OUTCOME(DIAGNOSED/EMERGENCY/REFER)
        // 3. If any disease is FINAL (high severity) → finalize session immediately
        // 4. If all diseases are EXCLUDED → finalize with PENDING (no match)
        // 5. Otherwise → return next question from first ACTIVE disease

        // Re-fetch all steps (including the one just saved)
        const allSteps = await this.prisma.sessionQuizStep.findMany({
            where: { sessionId: session.id }
        });

        // Build per-disease answers map (namespaced by disease prefix)
        const answersMap: Record<string, Record<string, boolean>> = {};
        allSteps.forEach(step => {
            const dId = step.nodeId.split('__')[0].toUpperCase();
            if (!answersMap[dId]) answersMap[dId] = {};
            answersMap[dId][step.nodeId] = step.answerYes;
        });

        // Load per-disease outcomes from snapshotNodes.meta (persisted exclusions)
        const snapshot = (session.snapshotNodes as Record<string, any>) || {};
        const persistedMeta: Record<string, string> = snapshot.meta?.diseaseOutcomes || {};

        // Fetch all active trees for this session (all diseases in snapshot)
        const snapshotDiseaseIds = Object.keys(snapshot).filter(k => k !== 'meta');
        const activeTrees = await this.prisma.clinicalDecisionTree.findMany({
            where: {
                diseaseId: { in: snapshotDiseaseIds.length > 0 ? snapshotDiseaseIds : [diseaseId] },
                version: session.treeVersion || undefined,
                isActive: true
            }
        });

        const activeTreeCache: ActiveTree[] = activeTrees.map(t => ({
            diseaseId: t.diseaseId,
            version: t.version,
            treeNodes: t.treeNodes as unknown as TreeNode[]
        }));

        // ── STEP 1: Resolve per-disease state ─────────────────────────────────
        type DiseaseState =
            | { status: 'ACTIVE'; nextNode: TreeNode }
            | { status: 'EXCLUDED' }
            | { status: 'FINAL'; outcome: ExamOutcome; priority: number };

        const diseaseStates: Record<string, DiseaseState> = {};

        for (const cachedTree of activeTreeCache) {
            const dId = cachedTree.diseaseId;

            // If already persisted as excluded, skip re-evaluation
            if (persistedMeta[dId] === 'EXCLUDED') {
                diseaseStates[dId] = { status: 'EXCLUDED' };
                continue;
            }

            const diseaseAnswers = answersMap[dId] || {};
            const nextNode = ClinicalEngineRunner.findNextQuestion(diseaseAnswers, cachedTree.treeNodes);

            if (nextNode) {
                // Still has unanswered questions
                diseaseStates[dId] = { status: 'ACTIVE', nextNode };
            } else {
                // No more questions — trace path to find terminal OUTCOME node
                let cursor = cachedTree.treeNodes.find(n => n.node_type === 'ENTRY_GATE') || cachedTree.treeNodes[0];
                let terminalOutcome: ExamOutcome = 'PENDING';

                while (cursor) {
                    if (cursor.node_type === 'OUTCOME') {
                        terminalOutcome = (cursor.exam_outcome as ExamOutcome) ?? 'PENDING';
                        break;
                    }
                    const answer = diseaseAnswers[cursor.node_id];
                    if (answer === undefined) break;
                    const next = ClinicalEngineRunner.getNextNode(cursor.node_id, answer, cachedTree.treeNodes);
                    if (!next) break;
                    cursor = next;
                }

                if (terminalOutcome === 'EXCLUDED' || terminalOutcome === 'PENDING') {
                    diseaseStates[dId] = { status: 'EXCLUDED' };
                } else {
                    // DIAGNOSED, EMERGENCY, REFER_IMMEDIATELY
                    diseaseStates[dId] = {
                        status: 'FINAL',
                        outcome: terminalOutcome,
                        priority: ClinicalEngineService.getSeverityRank(terminalOutcome)
                    };
                }
            }
        }

        // ── STEP 2: Persist updated exclusions to snapshotNodes.meta ──────────
        const updatedMeta: Record<string, string> = { ...persistedMeta };
        for (const [dId, state] of Object.entries(diseaseStates)) {
            if (state.status === 'EXCLUDED') updatedMeta[dId] = 'EXCLUDED';
            if (state.status === 'FINAL') updatedMeta[dId] = state.outcome;
        }

        await this.prisma.session.update({
            where: { id: session.id },
            data: {
                snapshotNodes: {
                    ...snapshot,
                    meta: { diseaseOutcomes: updatedMeta }
                }
            }
        });

        // ── STEP 3: Check for immediate high-severity finalization ─────────────
        const finalStates = Object.entries(diseaseStates)
            .filter(([, s]) => s.status === 'FINAL')
            .map(([dId, s]) => ({ diseaseId: dId, ...(s as { status: 'FINAL'; outcome: ExamOutcome; priority: number }) }))
            .sort((a, b) => b.priority - a.priority);

        if (finalStates.length > 0) {
            const top = finalStates[0];
            await this.prisma.session.update({
                where: { id: session.id },
                data: {
                    examOutcome: top.outcome,
                    status: SessionStatus.CLINICALLY_DONE,
                    diagnosisText: `Outcome: ${top.outcome} (${top.diseaseId})`
                }
            });
            return {
                outcome: top.outcome,
                diseaseId: top.diseaseId,
                severityRank: top.priority
            };
        }

        // ── STEP 4: Check if all diseases are excluded ─────────────────────────
        const allExcluded = Object.values(diseaseStates).every(s => s.status === 'EXCLUDED');
        if (allExcluded) {
            await this.prisma.session.update({
                where: { id: session.id },
                data: {
                    examOutcome: 'PENDING',
                    status: SessionStatus.CLINICALLY_DONE,
                    diagnosisText: 'No disease matched screening criteria.'
                }
            });
            return {
                outcome: 'PENDING',
                message: 'No disease matched. Session complete.'
            };
        }

        // ── STEP 5: Return next question from first ACTIVE disease ─────────────
        // Sequential strategy: diseases are processed in the order they appear in the snapshot
        for (const cachedTree of activeTreeCache) {
            const state = diseaseStates[cachedTree.diseaseId];
            if (state?.status === 'ACTIVE') {
                const next = state.nextNode;
                return {
                    nextNode: {
                        nodeId: next.node_id,
                        question: next.question,
                        layman: next.layman,
                        diseaseId: cachedTree.diseaseId
                    }
                };
            }
        }

        // Absolute fallback — should never reach here
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

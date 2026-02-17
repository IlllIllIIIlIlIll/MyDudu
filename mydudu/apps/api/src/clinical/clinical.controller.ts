import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ClinicalEngineService } from './ClinicalEngineService';

interface StartSessionRequest {
    childId: number;
    deviceId: number;
}

interface SubmitAnswerRequest {
    sessionId: string;
    nodeId: string;
    answer: boolean;
}

@Controller('clinical')
export class ClinicalController {
    constructor(private readonly clinicalService: ClinicalEngineService) { }

    @Post('start')
    async startSession(@Body() req: StartSessionRequest) {
        const { childId, deviceId } = req;

        // Start session with all active diseases (for now, just DENGUE)
        const result = await this.clinicalService.startSession({
            childId,
            deviceId,
            diseaseIds: ['DENGUE'] // Hardcoded for now, could be dynamic based on symptoms
        });

        // Transform to frontend format
        return {
            sessionId: result.sessionId,
            initialNodes: result.nodes.map(node => ({
                id: node.nodeId,
                question: node.question,
                layman: node.question, // TODO: Add layman field to tree nodes
                yesNodeId: null, // Will be determined by engine
                noNodeId: null,
            }))
        };
    }

    @Post('answer')
    async submitAnswer(@Body() req: SubmitAnswerRequest) {
        const { sessionId, nodeId, answer } = req;

        // Submit answer to engine
        const result = await this.clinicalService.submitAnswer({
            sessionId,
            nodeId,
            answer
        });

        // Check if we have an outcome
        if (result.outcome) {
            return {
                outcome: result.outcome,
                diseaseId: result.diseaseId,
            };
        }

        // Return next nodes
        const nextNodeData = result.nextNode;
        if (nextNodeData) {
            return {
                nextNodes: [{
                    id: nextNodeData.nodeId,
                    question: nextNodeData.question,
                    layman: nextNodeData.question,
                    yesNodeId: null,
                    noNodeId: null,
                }]
            };
        }

        return { nextNodes: [] };
    }

    @Get('status/:sessionId')
    async getStatus(@Param('sessionId') sessionId: string) {
        const result = await this.clinicalService.getSessionStatus(sessionId);

        return {
            sessionId: result.sessionId,
            status: result.status,
            examOutcome: result.outcome,
            diseaseId: null, // TODO: Add diseaseId to SessionStatusDto
            answers: {}, // TODO: Return actual answers from session
        };
    }
}

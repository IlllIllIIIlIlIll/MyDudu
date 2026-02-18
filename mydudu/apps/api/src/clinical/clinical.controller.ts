import { Controller, Post, Get, Body, Param, BadRequestException, NotFoundException, MethodNotAllowedException } from '@nestjs/common';
import { ClinicalEngineService } from './ClinicalEngineService';
import { PrismaService } from '../prisma/prisma.service';

interface StartSessionRequest {
    childUuid: string;  // Changed from childId
    deviceUuid?: string; // Changed from deviceId, optional
}

interface SubmitAnswerRequest {
    sessionId: string;
    nodeId: string;
    answer: boolean;
}

@Controller('clinical')
export class ClinicalController {
    constructor(
        private readonly clinicalService: ClinicalEngineService,
        private readonly prisma: PrismaService
    ) { }

    @Get('start')
    async startSessionGet() {
        throw new MethodNotAllowedException('This endpoint only accepts POST requests with a JSON body (childUuid, deviceUuid).');
    }

    @Post('start')
    async startSession(@Body() req: StartSessionRequest) {
        const { childUuid, deviceUuid } = req;

        // Query child by UUID to get internal ID
        const child = await this.prisma.child.findUnique({
            where: { childUuid },
            select: { id: true, fullName: true }
        });

        if (!child) {
            throw new NotFoundException(`Child with UUID ${childUuid} not found`);
        }

        // Query device by UUID or use first available device
        let deviceId: number;
        if (deviceUuid) {
            const device = await this.prisma.device.findUnique({
                where: { deviceUuid },
                select: { id: true }
            });

            if (!device) {
                throw new NotFoundException(`Device with UUID ${deviceUuid} not found`);
            }

            deviceId = device.id;
        } else {
            // Fallback: use first available device
            const firstDevice = await this.prisma.device.findFirst({
                orderBy: { id: 'asc' }
            });

            if (!firstDevice) {
                throw new BadRequestException('No devices found in the system');
            }

            deviceId = firstDevice.id;
        }

        // Start session with internal IDs
        // Pass empty diseaseIds to trigger all-active-trees screening mode
        const result = await this.clinicalService.startSession({
            childId: child.id,
            deviceId,
            diseaseIds: [] // Empty = fetch ALL active disease trees
        });

        // Transform to frontend format
        return {
            sessionId: result.sessionId,
            treeVersion: result.treeVersion,
            alreadyComplete: result.alreadyComplete,
            examOutcome: result.examOutcome,
            initialNodes: result.nodes.map(node => ({
                id: node.nodeId,
                question: node.question,
                layman: node.layman ?? node.question,
                yesNodeId: null,
                noNodeId: null,
                diseaseId: node.diseaseId
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
                message: (result as any).message
            };
        }

        // Return next node (backend drives navigation in multi-disease mode)
        const nextNodeData = result.nextNode;
        if (nextNodeData) {
            return {
                nextNode: {
                    nodeId: nextNodeData.nodeId,
                    question: nextNodeData.question,
                    layman: nextNodeData.layman,
                    diseaseId: nextNodeData.diseaseId
                }
            };
        }

        return { outcome: 'PENDING', message: 'No more questions available.' };
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

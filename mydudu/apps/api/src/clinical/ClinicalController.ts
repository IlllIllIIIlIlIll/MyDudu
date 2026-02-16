import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { ClinicalEngineService } from './ClinicalEngineService';
import { AnswerDto, StartSessionDto } from './clinical.dto';

@Controller('clinical')
export class ClinicalController {
    private readonly logger = new Logger(ClinicalController.name);

    constructor(private readonly engine: ClinicalEngineService) { }

    @Post('session/start')
    @UsePipes(new ValidationPipe({ transform: true }))
    async startSession(@Body() dto: StartSessionDto) {
        // Logging minimal event
        this.logger.log(`Starting clinical session for child ${dto.childId}, device ${dto.deviceId}`);
        return this.engine.startSession(dto);
    }

    @Post('session/answer')
    @UsePipes(new ValidationPipe({ transform: true }))
    async submitAnswer(@Body() dto: AnswerDto) {
        // Phase 3: Observability (Structured Log)
        this.logger.log({
            event: "CLINICAL_ANSWER",
            sessionId: dto.sessionId,
            nodeId: dto.nodeId,
            answer: dto.answer,
            timestamp: new Date().toISOString()
        });
        return this.engine.submitAnswer(dto);
    }

    @Get('session/:id/status')
    async getStatus(@Param('id') id: string) {
        return this.engine.getSessionStatus(id);
    }
}

import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ValidationService } from './validation.service';

@Controller('validation')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Post(':sessionId/approve')
  approve(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() body: { validatorId: number; remarks?: string },
  ) {
    return this.validationService.validateSession(
      sessionId,
      body.validatorId,
      body.remarks,
      'approve',
    );
  }

  @Post(':sessionId/reject')
  reject(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() body: { validatorId: number; remarks?: string },
  ) {
    return this.validationService.validateSession(
      sessionId,
      body.validatorId,
      body.remarks,
      'reject',
    );
  }
}

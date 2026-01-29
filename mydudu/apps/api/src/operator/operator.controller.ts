import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { OperatorService } from './operator.service';

@Controller('operator')
export class OperatorController {
  constructor(private readonly operatorService: OperatorService) {}

  @Get('overview')
  getOverview(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getOverview(userId);
  }

  @Get('children')
  getChildren(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getChildren(userId);
  }

  @Get('devices')
  getDevices(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getDevices(userId);
  }

  @Get('validations')
  getValidations(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getValidations(userId);
  }

  @Get('reports')
  getReports(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getReports(userId);
  }
}

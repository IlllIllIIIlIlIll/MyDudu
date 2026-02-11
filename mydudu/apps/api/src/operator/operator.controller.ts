import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { CancelSessionDto, DiagnoseSessionDto, ReleaseLockDto, RenewLockDto } from './dto/pemeriksaan.dto';

@Controller('operator')
export class OperatorController {
  constructor(private readonly operatorService: OperatorService) { }

  @Get('overview')
  getOverview(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getOverview(userId);
  }

  @Get('children')
  getChildren(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getChildren(userId);
  }

  @Get('parents')
  getParents(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getParents(userId);
  }

  @Get('parents/:parentId/children')
  getChildrenByParent(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('parentId', ParseIntPipe) parentId: number,
  ) {
    return this.operatorService.getChildrenByParent(userId, parentId);
  }

  @Get('devices')
  getDevices(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getDevices(userId);
  }

  @Get('devices/by-village')
  getDevicesByVillage(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('villageId', ParseIntPipe) villageId: number,
    @Query('q') query?: string,
  ) {
    return this.operatorService.getDevicesByVillage(userId, villageId, query || '');
  }

  @Get('validations')
  getValidations(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getValidations(userId);
  }

  @Get('reports')
  getReports(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getReports(userId);
  }

  @Get('pemeriksaan/queue')
  getPemeriksaanQueue(@Query('userId', ParseIntPipe) userId: number) {
    return this.operatorService.getPemeriksaanQueue(userId);
  }

  @Post('pemeriksaan/:sessionId/claim')
  claimPemeriksaanSession(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.operatorService.claimPemeriksaanSession(userId, sessionId);
  }

  @Post('pemeriksaan/:sessionId/renew-lock')
  renewPemeriksaanLock(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: RenewLockDto,
  ) {
    return this.operatorService.renewPemeriksaanLock(userId, sessionId, dto);
  }

  @Post('pemeriksaan/:sessionId/release-lock')
  releasePemeriksaanLock(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: ReleaseLockDto,
  ) {
    return this.operatorService.releasePemeriksaanLock(userId, sessionId, dto);
  }

  @Post('pemeriksaan/:sessionId/diagnose')
  diagnosePemeriksaanSession(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: DiagnoseSessionDto,
  ) {
    return this.operatorService.diagnosePemeriksaanSession(userId, sessionId, dto);
  }

  @Post('pemeriksaan/:sessionId/cancel')
  cancelPemeriksaanSession(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: CancelSessionDto,
  ) {
    return this.operatorService.cancelPemeriksaanSession(userId, sessionId, dto);
  }
}

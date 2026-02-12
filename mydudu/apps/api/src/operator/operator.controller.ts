import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { CancelSessionDto, DiagnoseSessionDto, ReleaseLockDto, RenewLockDto } from './dto/pemeriksaan.dto';
import { OperatorDashboardService } from './operator-dashboard.service';
import { OperatorResourceService } from './operator-resource.service';
import { OperatorSessionService } from './operator-session.service';

@Controller('operator')
export class OperatorController {
  constructor(
    private readonly dashboardService: OperatorDashboardService,
    private readonly resourceService: OperatorResourceService,
    private readonly sessionService: OperatorSessionService,
  ) { }

  @Get('overview')
  getOverview(@Query('userId', ParseIntPipe) userId: number) {
    return this.dashboardService.getOverview(userId);
  }

  @Get('children')
  getChildren(@Query('userId', ParseIntPipe) userId: number) {
    return this.resourceService.getChildren(userId);
  }

  @Get('parents')
  getParents(@Query('userId', ParseIntPipe) userId: number) {
    return this.resourceService.getParents(userId);
  }

  @Get('parents/:parentId/children')
  getChildrenByParent(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('parentId', ParseIntPipe) parentId: number,
  ) {
    return this.resourceService.getChildrenByParent(userId, parentId);
  }

  @Get('devices')
  getDevices(@Query('userId', ParseIntPipe) userId: number) {
    return this.resourceService.getDevices(userId);
  }

  @Get('devices/by-village')
  getDevicesByVillage(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('villageId', ParseIntPipe) villageId: number,
    @Query('q') query?: string,
  ) {
    return this.resourceService.getDevicesByVillage(userId, villageId, query || '');
  }

  @Get('validations')
  getValidations(@Query('userId', ParseIntPipe) userId: number) {
    return this.dashboardService.getValidations(userId);
  }

  @Get('reports')
  getReports(@Query('userId', ParseIntPipe) userId: number) {
    return this.dashboardService.getReports(userId);
  }

  @Get('pemeriksaan/queue')
  getPemeriksaanQueue(@Query('userId', ParseIntPipe) userId: number) {
    return this.sessionService.getPemeriksaanQueue(userId);
  }

  @Post('pemeriksaan/:sessionId/claim')
  claimPemeriksaanSession(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.sessionService.claimPemeriksaanSession(userId, sessionId);
  }

  @Post('pemeriksaan/:sessionId/renew-lock')
  renewPemeriksaanLock(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: RenewLockDto,
  ) {
    return this.sessionService.renewPemeriksaanLock(userId, sessionId, dto);
  }

  @Post('pemeriksaan/:sessionId/release-lock')
  releasePemeriksaanLock(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: ReleaseLockDto,
  ) {
    return this.sessionService.releasePemeriksaanLock(userId, sessionId, dto);
  }

  @Post('pemeriksaan/:sessionId/diagnose')
  diagnosePemeriksaanSession(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: DiagnoseSessionDto,
  ) {
    return this.sessionService.diagnosePemeriksaanSession(userId, sessionId, dto);
  }

  @Post('pemeriksaan/:sessionId/cancel')
  cancelPemeriksaanSession(
    @Query('userId', ParseIntPipe) userId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: CancelSessionDto,
  ) {
    return this.sessionService.cancelPemeriksaanSession(userId, sessionId, dto);
  }
}

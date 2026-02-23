import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('schedules')
@UseGuards(AuthGuard)
export class ScheduleController {
    constructor(private readonly scheduleService: ScheduleService) { }

    @Post()
    create(@Body() createScheduleDto: any, @Req() req: any) {
        return this.scheduleService.create(createScheduleDto, req.user?.id);
    }

    @Get()
    findAll(@Query('villageId') villageId?: string) {
        return this.scheduleService.findAll(villageId ? +villageId : undefined);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.scheduleService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateScheduleDto: any) {
        return this.scheduleService.update(id, updateScheduleDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.scheduleService.remove(id);
    }
}

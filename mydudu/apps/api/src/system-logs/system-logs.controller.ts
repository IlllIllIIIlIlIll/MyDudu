import { Controller, Get, Query } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';

@Controller('system-logs')
export class SystemLogsController {
    constructor(private readonly systemLogsService: SystemLogsService) { }

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50'
    ) {
        return this.systemLogsService.findAll(Number(page), Number(limit));
    }
}

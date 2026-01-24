import { Controller, Get, UseGuards } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
// import { AuthGuard } from '../auth/auth.guard'; // Assuming you implement this later

@Controller('telemetry')
export class TelemetryController {
    constructor(private readonly telemetryService: TelemetryService) { }

    @Get('stats')
    // @UseGuards(AuthGuard)
    async getStats() {
        return this.telemetryService.getDashboardStats();
    }
}

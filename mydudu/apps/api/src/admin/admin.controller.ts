import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SystemObservabilityService } from '../observability/system-observability.service';

@Controller('admin/dashboard')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly observabilityService: SystemObservabilityService
    ) { }

    @Get()
    async getDashboard() {
        return this.adminService.getDashboardStats();
    }

    @Get('observability')
    async getSystemMetrics() {
        return this.observabilityService.getLatestMetrics();
    }
}

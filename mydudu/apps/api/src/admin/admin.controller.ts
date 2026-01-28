import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin/dashboard')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get()
    async getDashboard() {
        return this.adminService.getDashboardStats();
    }
}

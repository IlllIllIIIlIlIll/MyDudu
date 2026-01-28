import { Controller, Get, Patch, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    async getNotifications(
        @Query('userId', ParseIntPipe) userId: number,
        @Query('limit') limit?: number
    ) {
        return this.notificationService.getNotifications(userId, limit ? Number(limit) : 20);
    }

    @Patch(':id/read')
    async markAsRead(@Param('id', ParseIntPipe) id: number) {
        return this.notificationService.markAsRead(id);
    }

    @Patch('read-all')
    async markAllAsRead(@Query('userId', ParseIntPipe) userId: number) {
        return this.notificationService.markAllAsRead(userId);
    }
}

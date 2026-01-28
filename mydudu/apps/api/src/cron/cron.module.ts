import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notifications.module'; // Import global

@Module({
    imports: [PrismaModule], // NotificationModule is Global
    providers: [CronService],
})
export class CronModule { }

import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { FirebaseAdminModule } from '../firebase/firebase-admin.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';
import { AuthGuard } from '../auth/auth.guard';

@Module({
    imports: [FirebaseAdminModule, PrismaModule, SystemLogsModule],
    controllers: [ScheduleController],
    providers: [ScheduleService, AuthGuard],
})
export class ScheduleModule { }

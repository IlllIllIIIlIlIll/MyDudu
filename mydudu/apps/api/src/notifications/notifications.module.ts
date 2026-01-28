import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';

@Global()
@Module({
    imports: [PrismaModule],
    controllers: [NotificationsController],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule { }

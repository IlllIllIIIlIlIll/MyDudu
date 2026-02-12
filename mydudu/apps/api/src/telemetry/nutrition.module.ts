import { Module } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { GrowthModule } from '../growth/growth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notifications.module'; // Global? Yes.

@Module({
    imports: [PrismaModule, GrowthModule],
    providers: [NutritionService],
    exports: [NutritionService],
})
export class NutritionModule { }

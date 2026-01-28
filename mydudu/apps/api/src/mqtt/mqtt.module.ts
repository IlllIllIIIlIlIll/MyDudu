import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

import { NutritionModule } from '../telemetry/nutrition.module';

@Module({
    imports: [PrismaModule, RedisModule, NutritionModule],
    providers: [MqttService],
    exports: [MqttService],
})
export class MqttModule { }

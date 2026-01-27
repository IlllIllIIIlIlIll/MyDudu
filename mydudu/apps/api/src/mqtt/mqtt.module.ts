import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [PrismaModule, RedisModule],
    providers: [MqttService],
    exports: [MqttService],
})
export class MqttModule { }

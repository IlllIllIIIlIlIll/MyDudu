import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { RedisModule } from './redis/redis.module';
import { PrismaModule } from './prisma/prisma.module';
import { FirebaseAdminModule } from './firebase/firebase-admin.module';
import { UsersModule } from './users/users.module';
import { DistrictsModule } from './districts/districts.module';
import { MqttModule } from './mqtt/mqtt.module';
import { DeviceModule } from './device/device.module';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from './notifications/notifications.module';
import { ValidationModule } from './validation/validation.module';
import { CronModule } from './cron/cron.module';
import { NutritionModule } from './telemetry/nutrition.module';
import { AdminModule } from './admin/admin.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        PrismaModule,
        AuthModule,
        UsersModule,
        DeviceModule,
        TelemetryModule,
        MqttModule,
        RedisModule,
        FirebaseAdminModule,
        DistrictsModule,
        SystemLogsModule,
        NotificationModule,
        ValidationModule,
        CronModule,
        NutritionModule,
        AdminModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }

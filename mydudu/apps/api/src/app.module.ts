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
import { ConfigModule } from '@nestjs/config';


@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }

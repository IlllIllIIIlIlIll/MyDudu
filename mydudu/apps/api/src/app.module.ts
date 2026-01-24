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

@Module({
    imports: [FirebaseAdminModule, PrismaModule, RedisModule, AuthModule, TelemetryModule, UsersModule, DistrictsModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }

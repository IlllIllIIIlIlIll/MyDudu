import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FirebaseAdminModule } from '../firebase/firebase-admin.module';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [
    PrismaModule,
    FirebaseAdminModule,
  ],
  controllers: [DeviceController],
  providers: [DeviceService, AuthGuard],
})
export class DeviceModule {}
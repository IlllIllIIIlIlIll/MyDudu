import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
    imports: [PrismaModule, ObservabilityModule],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }

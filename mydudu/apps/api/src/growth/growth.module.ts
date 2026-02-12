import { Module } from '@nestjs/common';
import { GrowthService } from './growth.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [GrowthService],
    exports: [GrowthService],
})
export class GrowthModule { }

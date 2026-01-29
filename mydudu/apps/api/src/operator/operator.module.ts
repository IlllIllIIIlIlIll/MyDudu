import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OperatorController } from './operator.controller';
import { OperatorService } from './operator.service';

@Module({
  imports: [PrismaModule],
  controllers: [OperatorController],
  providers: [OperatorService],
})
export class OperatorModule {}

import { Module } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { ValidationController } from './validation.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ValidationController],
    providers: [ValidationService],
    exports: [ValidationService],
})
export class ValidationModule { }

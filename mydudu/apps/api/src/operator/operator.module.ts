import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OperatorController } from './operator.controller';
import { OperatorService } from './operator.service';
import { OperatorScopeService } from './operator-scope.service';
import { OperatorDashboardService } from './operator-dashboard.service';
import { OperatorResourceService } from './operator-resource.service';
import { OperatorSessionService } from './operator-session.service';

@Module({
  imports: [PrismaModule],
  controllers: [OperatorController],
  providers: [
    OperatorService,
    OperatorScopeService,
    OperatorDashboardService,
    OperatorResourceService,
    OperatorSessionService,
  ],
})
export class OperatorModule { }

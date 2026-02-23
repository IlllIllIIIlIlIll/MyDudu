import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GrowthModule } from '../growth/growth.module';
import { MqttModule } from '../mqtt/mqtt.module';
import { OperatorController } from './operator.controller';
import { OperatorScopeService } from './operator-scope.service';
import { OperatorDashboardService } from './operator-dashboard.service';
import { OperatorResourceService } from './operator-resource.service';
import { OperatorSessionService } from './operator-session.service';

@Module({
  imports: [PrismaModule, GrowthModule, MqttModule],
  controllers: [OperatorController],
  providers: [
    OperatorScopeService,
    OperatorDashboardService,
    OperatorResourceService,
    OperatorSessionService,
  ],
})
export class OperatorModule { }


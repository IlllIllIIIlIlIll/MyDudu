import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemObservabilityService } from './system-observability.service';
import { MetricDerivationService } from './metric-derivation.service';

@Global() // Make it global so middleware can use it easily without imports in every module
@Module({
    imports: [PrismaModule],
    providers: [SystemObservabilityService, MetricDerivationService],
    exports: [SystemObservabilityService],
})
export class ObservabilityModule { }

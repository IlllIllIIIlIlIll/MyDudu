
import { Module } from '@nestjs/common';
import { ClinicalController } from './ClinicalController';
import { ClinicalEngineService } from './ClinicalEngineService';

@Module({
    imports: [], // PrismaModule is global? If not, import it. Usually global in mydudu based on app.module
    controllers: [ClinicalController],
    providers: [ClinicalEngineService],
    exports: [ClinicalEngineService]
})
export class ClinicalModule { }

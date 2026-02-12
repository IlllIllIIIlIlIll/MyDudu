import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SystemObservabilityService } from './system-observability.service';

@Injectable()
export class TelemetryMiddleware implements NestMiddleware {
    constructor(private observabilityService: SystemObservabilityService) { }

    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - start;
            const isError = res.statusCode >= 500;
            this.observabilityService.trackRequest(duration, isError);
        });

        next();
    }
}

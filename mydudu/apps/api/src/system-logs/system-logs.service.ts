import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum SystemLogAction {
    USER_LOGIN = 'USER_LOGIN',
    USER_REGISTER = 'USER_REGISTER',
    DEVICE_REGISTER = 'DEVICE_REGISTER',
    DEVICE_UPDATE = 'DEVICE_UPDATE',
    USER_UPDATE = 'USER_UPDATE',
    SESSION_CREATED = 'SESSION_CREATED',
    SESSION_UPDATED = 'SESSION_UPDATED',
    SESSION_VALIDATED = 'SESSION_VALIDATED',
}

@Injectable()
export class SystemLogsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit;

        // Get total count for pagination metadata
        const total = await this.prisma.auditLog.count();

        const logs = await this.prisma.auditLog.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { fullName: true, email: true }
                }
            }
        });

        return {
            data: logs,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit)
            }
        };
    }

    async logEvent(action: SystemLogAction, details: any, userId?: number, deviceUuid?: string) {
        // Ensure we don't log raw huge objects
        const sanitizedDetails = {
            deviceUuid,
            ...details
        };

        return this.prisma.auditLog.create({
            data: {
                action,
                userId,
                details: sanitizedDetails,
                // If we want to store device info explicitly in future we can add column, 
                // for now storing in details or relying on knowing it was a device action
            }
        });
    }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { SystemLogsService, SystemLogAction } from '../system-logs/system-logs.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class DeviceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly systemLogsService: SystemLogsService,
        private readonly notificationService: NotificationService
    ) { }


    async create(createDeviceDto: CreateDeviceDto) {
        // Generate UUID logic
        const lastDevice = await this.prisma.device.findFirst({
            where: { deviceUuid: { startsWith: 'MD' } },
            orderBy: { deviceUuid: 'desc' },
        });

        let nextNum = 1;
        if (lastDevice) {
            const lastNumStr = lastDevice.deviceUuid.replace('MD', '');
            const lastNum = parseInt(lastNumStr, 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }

        const deviceUuid = `MD${nextNum.toString().padStart(4, '0')}`;

        const device = await this.prisma.device.create({
            data: {
                deviceUuid: deviceUuid,
                name: createDeviceDto.name,
                posyanduId: createDeviceDto.posyanduId,
            },
        });

        await this.systemLogsService.logEvent(SystemLogAction.DEVICE_REGISTER, {
            name: device.name,
            posyanduId: device.posyanduId
        }, undefined, device.deviceUuid);

        return device;
    }

    async findAll(userEmail?: string) {
        let whereClause: any = {};

        if (userEmail) {
            const user = await this.prisma.user.findUnique({
                where: { email: userEmail },
                include: {
                    village: { include: { district: true } },
                    district: true
                }
            });

            if (user) {
                if (user.role === 'PUSKESMAS' && user.districtId) {
                    whereClause = {
                        posyandu: {
                            village: {
                                districtId: user.districtId
                            }
                        }
                    };
                } else if (user.role === 'POSYANDU' && user.villageId) {
                    whereClause = {
                        posyandu: {
                            villageId: user.villageId
                        }
                    };
                }
                // Admin sees all, so empty whereClause
            }
        }

        return this.prisma.device.findMany({
            where: whereClause,
            include: {
                posyandu: true,
            },
            orderBy: {
                id: 'desc',
            },
        });
    }

    async findOne(id: number) {
        return this.prisma.device.findUnique({
            where: { id },
            include: {
                posyandu: true,
            },
        });
    }

    async update(id: number, updateDeviceDto: UpdateDeviceDto) {
        const device = await this.prisma.device.update({
            where: { id },
            data: updateDeviceDto,
            include: {
                posyandu: true,
            },
        });

        await this.systemLogsService.logEvent(SystemLogAction.DEVICE_UPDATE, {
            updates: updateDeviceDto
        }, undefined, device.deviceUuid);

        return device;
    }

    async remove(id: number) {
        return this.prisma.device.delete({
            where: { id },
        });
    }

    async processManualEntry(data: { motherName: string; childName: string; weight?: number; height?: number; temperature?: number }) {
        // 1. Find Child
        const child = await this.prisma.child.findFirst({
            where: {
                fullName: { contains: data.childName, mode: 'insensitive' },
                parent: {
                    user: {
                        fullName: { contains: data.motherName, mode: 'insensitive' }
                    }
                }
            },
            include: { parent: true }
        });

        if (!child) {
            throw new Error('Child not found. Please check Mother Name and Child Name.');
        }

        // 2. Create Session (Manual)
        const measurementCompleted =
            data.weight !== undefined &&
            data.weight !== null &&
            data.height !== undefined &&
            data.height !== null &&
            data.temperature !== undefined &&
            data.temperature !== null;

        const session = await this.prisma.session.create({
            data: {
                sessionUuid: `manual-${Date.now()}`,
                childId: child.id,
                deviceId: 1, // Fallback to a default/virtual device ID or find one
                status: 'COMPLETE',
                examOutcome: 'PENDING',
                weight: data.weight,
                height: data.height,
                temperature: data.temperature,
                measurementCompleted,
                measurementCompletedAt: measurementCompleted ? new Date() : null,
                recordedAt: new Date(),
            }
        });

        // 3. Log & Notify
        await this.systemLogsService.logEvent(SystemLogAction.SESSION_CREATED, {
            sessionId: session.id,
            manual: true
        });

        // 4. Compute Nutrition Status (Lazy load or inject service if needed. Using direct create here)
        // Ideally inject NutritionService but avoiding circular deps if any.
        // For now, let's assume it's just stored.

        return session;
    }
}

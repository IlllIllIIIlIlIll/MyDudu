import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { SystemLogsService, SystemLogAction } from '../system-logs/system-logs.service';
import { NotificationService } from '../notifications/notifications.service';
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
                isActive: true,
            },
        });

        await this.systemLogsService.logEvent(SystemLogAction.DEVICE_REGISTER, {
            name: device.name,
            posyanduId: device.posyanduId
        }, undefined, device.deviceUuid);

        return device;
    }

    async findAll() {
        return this.prisma.device.findMany({
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
}

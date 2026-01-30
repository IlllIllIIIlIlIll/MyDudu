import { DeviceStatus } from '@prisma/client';

export class UpdateDeviceDto {
    name?: string;
    posyanduId?: number;
    status?: DeviceStatus;
}

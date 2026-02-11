import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Controller('devices')
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) { }

    @Post()
    create(@Body() createDeviceDto: CreateDeviceDto) {
        return this.deviceService.create(createDeviceDto);
    }

    @Get()
    @UseGuards(AuthGuard)
    findAll(@Req() req: any) {
        return this.deviceService.findAll(req.user?.email);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.deviceService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDeviceDto: UpdateDeviceDto) {
        return this.deviceService.update(id, updateDeviceDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.deviceService.remove(id);
    }

    @Post('manual-telemetry')
    submitManualTelemetry(@Body() body: {
        parentId?: number;
        childId?: number;
        motherName: string;
        childName: string;
        villageId?: number;
        deviceId?: number;
        weight?: number;
        height?: number;
        temperature?: number;
        heartRate?: number;
        noiseLevel?: number;
    }) {
        return this.deviceService.processManualEntry(body);
    }
}

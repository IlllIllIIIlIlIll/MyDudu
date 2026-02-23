import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService, SystemLogAction } from '../system-logs/system-logs.service';

@Injectable()
export class ScheduleService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly systemLogsService: SystemLogsService
    ) { }

    async create(data: any, userId?: number) {
        // Always resolve villageId server-side so the schedule is associated
        // with the operator's actual village, regardless of what the frontend sends.
        let resolvedVillageId = data.villageId ? Number(data.villageId) : undefined;
        if (userId) {
            const dbUser = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { villageId: true },
            });
            if (dbUser?.villageId) {
                resolvedVillageId = dbUser.villageId;
            }
        }

        const eventDate = new Date(data.eventDate);

        // Combine date and time if split
        let startTimeValue = null;
        if (data.startTime) {
            if (data.startTime.includes(':')) {
                const [h, m] = data.startTime.split(':');
                const st = new Date(eventDate);
                st.setHours(Number(h), Number(m), 0, 0);
                startTimeValue = st;
            } else {
                startTimeValue = new Date(data.startTime);
            }
        }

        let endTimeValue = null;
        if (data.endTime) {
            if (data.endTime.includes(':')) {
                const [h, m] = data.endTime.split(':');
                const et = new Date(eventDate);
                et.setHours(Number(h), Number(m), 0, 0);
                endTimeValue = et;
            } else {
                endTimeValue = new Date(data.endTime);
            }
        }

        const schedule = await this.prisma.schedule.create({
            data: {
                title: data.title,
                description: data.description,
                eventDate: eventDate,
                startTime: startTimeValue,
                endTime: endTimeValue,
                posyanduName: data.posyanduName,
                villageId: resolvedVillageId,
                createdBy: userId,
            },
        });

        await this.systemLogsService.logEvent(SystemLogAction.USER_UPDATE, {
            event: 'SCHEDULE_CREATED',
            scheduleId: schedule.id
        }, userId);

        return schedule;
    }

    findAll(villageId?: number) {
        const where = villageId ? { villageId } : {};
        return this.prisma.schedule.findMany({
            where,
            orderBy: { eventDate: 'desc' },
            include: {
                village: true,
            }
        });
    }

    async findOne(id: number) {
        const schedule = await this.prisma.schedule.findUnique({
            where: { id },
            include: {
                village: true,
            }
        });

        if (!schedule) {
            throw new NotFoundException(`Schedule #${id} not found`);
        }

        return schedule;
    }

    async update(id: number, data: any) {
        const existing = await this.findOne(id);
        const eventDate = data.eventDate ? new Date(data.eventDate) : existing.eventDate;

        // Combine date and time if split
        let startTimeValue = undefined;
        if (data.startTime) {
            if (data.startTime.includes(':')) {
                const [h, m] = data.startTime.split(':');
                const st = new Date(eventDate);
                st.setHours(Number(h), Number(m), 0, 0);
                startTimeValue = st;
            } else {
                startTimeValue = new Date(data.startTime);
            }
        }

        let endTimeValue = undefined;
        if (data.endTime) {
            if (data.endTime.includes(':')) {
                const [h, m] = data.endTime.split(':');
                const et = new Date(eventDate);
                et.setHours(Number(h), Number(m), 0, 0);
                endTimeValue = et;
            } else {
                endTimeValue = new Date(data.endTime);
            }
        }

        const schedule = await this.prisma.schedule.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                eventDate: data.eventDate ? eventDate : undefined,
                startTime: startTimeValue,
                endTime: endTimeValue,
                posyanduName: data.posyanduName,
                villageId: data.villageId,
            },
        });

        return schedule;
    }

    remove(id: number) {
        return this.prisma.schedule.delete({
            where: { id },
        });
    }
}

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import { SystemLogsService, SystemLogAction } from '../system-logs/system-logs.service';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private systemLogsService: SystemLogsService
    ) { }

    async findAll() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                status: true,
                createdAt: true,
                lastLogin: true,

                phoneNumber: true, // Replaced passwordHash
                profilePicture: true,
                village: {
                    select: { name: true, district: { select: { name: true } } }
                },
                district: {
                    select: { name: true }
                }
            }
        });
    }

    async createPuskesmas(data: { fullName: string; email: string; district: string; profilePicture?: string }, actorId?: number) {
        // 1. Check for existing user
        const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // 2. Find District by Name (Case Insensitive logic)
        let districtId = null;
        if (data.district) {
            const district = await this.prisma.district.findFirst({
                where: { name: { equals: data.district, mode: 'insensitive' } }
            });
            if (district) {
                districtId = district.id;
            }
        }

        // 3. Create User linked to district
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                fullName: data.fullName,
                role: UserRole.PUSKESMAS,
                status: UserStatus.ACTIVE,
                profilePicture: data.profilePicture,
                districtId: districtId
            }
        });

        await this.systemLogsService.logEvent(SystemLogAction.USER_REGISTER, {
            event: 'USER_REGISTERED',
            role: UserRole.PUSKESMAS,
            email: data.email
        }, actorId || user.id);

        return user;
    }

    async createPosyandu(data: { fullName: string; email: string; village: string; profilePicture?: string }, actorId?: number) {
        // 1. Check for existing user
        const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // 2. Find Village with District
        const village = await this.prisma.village.findFirst({
            where: { name: { equals: data.village, mode: 'insensitive' } },
            include: { district: true }
        });

        if (!village) {
            throw new NotFoundException(`Village '${data.village}' not found`);
        }

        // 3. Create User linked to Village and District
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                fullName: data.fullName,
                role: UserRole.POSYANDU,
                status: UserStatus.PENDING, // Pending Admin Approval
                profilePicture: data.profilePicture,
                villageId: village.id,
                districtId: village.district.id
            }
        });

        await this.systemLogsService.logEvent(SystemLogAction.USER_REGISTER, {
            event: 'USER_REGISTERED',
            role: UserRole.POSYANDU,
            email: data.email
        }, actorId || user.id);

        return user;
    }

    async searchDistricts(query: string) {
        return this.prisma.district.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' }
            },
            take: 10
        });
    }

    // Although the user asked for "kecamatan/district or the village selection", 
    // Puskesmas are usually per-district (Kecamatan). 
    // Creating village search just in case or for future use.
    async searchVillages(query: string) {
        return this.prisma.village.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' }
            },
            take: 10,
            include: { district: { select: { name: true } } }
        });
    }

    async searchPosyandus(query: string) {
        return this.prisma.posyandu.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' }
            },
            take: 10,
            include: {
                village: {
                    select: {
                        name: true,
                        district: { select: { name: true } }
                    }
                }
            }
        });
    }

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,

                status: true,
                phoneNumber: true,
                profilePicture: true,
                villageId: true,
                districtId: true,
                village: {
                    select: {
                        name: true,
                        district: { select: { name: true } }
                    }
                },
                district: { select: { name: true } }
            }
        });

        if (!user) return null;

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const assignedLocation: any = {};

        if (user.role === UserRole.POSYANDU) {
            assignedLocation.village = user.village?.name || null;
            assignedLocation.kecamatan = user.village?.district?.name || null;
        }

        if (user.role === UserRole.PUSKESMAS) {
            assignedLocation.puskesmasName = user.fullName || null;
            assignedLocation.kecamatan = user.district?.name || null;
        }

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            status: user.status,
            phoneNumber: user.phoneNumber,
            profilePicture: user.profilePicture,
            assignedLocation
        };
    }
    async updateProfile(id: number, data: { fullName?: string; profilePicture?: string; district?: string; email?: string; phoneNumber?: string }, actorId?: number) {
        // Check email uniqueness if email is being updated
        if (data.email) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    email: data.email,
                    NOT: { id }
                }
            });
            if (existingUser) {
                throw new ConflictException('Email already in use');
            }
        }

        let districtId = undefined;
        if (data.district) {
            const district = await this.prisma.district.findFirst({
                where: { name: { equals: data.district, mode: 'insensitive' } }
            });
            if (district) {
                districtId = district.id;
            }
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                fullName: data.fullName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                profilePicture: data.profilePicture,
                ...(districtId !== undefined && { districtId })
            }
        });

        await this.systemLogsService.logEvent(SystemLogAction.USER_UPDATE, {
            updates: Object.keys(data),
            userId: id
        }, actorId || id);

        return updatedUser;
    }

    async deleteUser(id: number, actorId?: number) {
        const deletedUser = await this.prisma.user.delete({
            where: { id }
        });
        await this.systemLogsService.logEvent(SystemLogAction.USER_UPDATE, { event: 'USER_DELETED', targetUserId: id }, actorId);
        return deletedUser;
    }

    async approveUser(id: number, actorId?: number) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { status: UserStatus.ACTIVE }
        });
        await this.systemLogsService.logEvent(SystemLogAction.USER_UPDATE, { event: 'USER_APPROVED', targetUserId: id }, actorId);
        return user;
    }

    async rejectUser(id: number, actorId?: number) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { status: UserStatus.SUSPENDED }
        });
        await this.systemLogsService.logEvent(SystemLogAction.USER_UPDATE, { event: 'USER_REJECTED', targetUserId: id }, actorId);
        return user;
    }
}

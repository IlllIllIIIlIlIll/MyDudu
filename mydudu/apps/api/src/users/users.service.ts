import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

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
                posyandu: {
                    select: { name: true, village: { select: { name: true } } }
                }
            }
        });
    }

    async createPuskesmas(data: { fullName: string; email: string; district: string; profilePicture?: string }) {
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
        return this.prisma.user.create({
            data: {
                email: data.email,
                fullName: data.fullName,
                role: UserRole.PUSKESMAS,
                status: UserStatus.ACTIVE,
                passwordHash: 'dummy-hash',
                profilePicture: data.profilePicture,
                districtId: districtId
            }
        });
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
            include: { district: true }
        });
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async updateProfile(id: number, data: { fullName?: string; profilePicture?: string }) {
        return this.prisma.user.update({
            where: { id },
            data: {
                fullName: data.fullName,
                profilePicture: data.profilePicture
            }
        });
    }

    async approveUser(id: number) {
        return this.prisma.user.update({
            where: { id },
            data: { status: UserStatus.ACTIVE }
        });
    }

    async rejectUser(id: number) {
        return this.prisma.user.update({
            where: { id },
            data: { status: UserStatus.SUSPENDED }
        });
    }
}

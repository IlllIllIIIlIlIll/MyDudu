import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Injectable()
@Injectable()
export class ChildrenService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    // Basic validation
    if (!data.parentId || !data.fullName || !data.birthDate) {
      throw new Error("Missing required fields");
    }

    const userId = parseInt(data.parentId);
    if (isNaN(userId)) {
      throw new Error("Invalid parent ID");
    }

    // Find or create Parent profile
    // The frontend sends the User ID, but the Child table links to the Parent (Profile) ID.
    let parentProfile = await this.prisma.parent.findUnique({
      where: { parentId: userId }
    });

    if (!parentProfile) {
      // Ensure the user exists and get their details (e.g. villageId)
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error("User parent not found");
      }

      // Create new Parent profile
      parentProfile = await this.prisma.parent.create({
        data: {
          parentId: userId,
          villageId: user.villageId
        }
      });
    }

    return this.prisma.child.create({
      data: {
        parentId: parentProfile.id, // Use the Parent (Profile) ID
        fullName: data.fullName,
        birthDate: new Date(data.birthDate),
        // Map Gender: MALE -> M, FEMALE -> F
        gender: data.gender === 'MALE' ? 'M' : data.gender === 'FEMALE' ? 'F' : data.gender,
        bloodType: data.bloodType,
      },
      include: {
        parent: {
          include: {
            user: true
          }
        }
      }
    });
  }

  findAll() {
    return this.prisma.child.findMany({
      include: {
        parent: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findOne(id: number) {
    return this.prisma.child.findUnique({
      where: { id },
      include: {
        parent: {
          include: { user: true }
        },
        sessions: {
          orderBy: { recordedAt: 'desc' },
          take: 5
        }
      }
    });
  }

  update(id: number, updateChildDto: UpdateChildDto) {
    return `This action updates a #${id} child`;
  }

  remove(id: number) {
    return this.prisma.child.delete({ where: { id } });
  }
}

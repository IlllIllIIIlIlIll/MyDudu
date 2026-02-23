import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DistrictsService {
  constructor(private prisma: PrismaService) { }

  findAll() {
    return this.prisma.district.findMany({
      orderBy: { name: 'asc' },
      include: {
        villages: true
      }
    });
  }

  findOne(id: number) {
    return this.prisma.district.findUnique({ where: { id } });
  }

  // ... other methods can remain unimplemented or basic for now if not needed


}

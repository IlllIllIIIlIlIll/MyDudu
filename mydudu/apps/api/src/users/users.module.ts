import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FirebaseAdminModule } from '../firebase/firebase-admin.module';

@Module({
  imports: [PrismaModule, FirebaseAdminModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule { }

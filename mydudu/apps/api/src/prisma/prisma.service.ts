import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        // Retry logic for DB connection
        const maxRetries = 5;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                await this.$connect();
                console.log('Successfully connected to the database');
                break;
            } catch (error) {
                console.error(`Failed to connect to DB (Attempt ${retryCount + 1}/${maxRetries})`, error);
                retryCount++;
                if (retryCount === maxRetries) throw error;
                await new Promise(res => setTimeout(res, 5000)); // Wait 5s before retry
            }
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}

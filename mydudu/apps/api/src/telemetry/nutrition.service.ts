import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
import { NutritionCategory, NotifType } from '@prisma/client';

@Injectable()
export class NutritionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService
    ) { }

    async computeStatus(sessionId: number) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { child: true } // Needed for age calc
        });

        if (!session || !session.child) return;

        // --- Mock Calculation Logic ---
        // In real app, we use WHO standards tables (Z-Score)
        // Here we simulate Stunting if height < 70cm for age > 1 year (example)

        let category: NutritionCategory = NutritionCategory.NORMAL;

        // Dummy Logic: If weight < 10 AND height < 80 => STUNTED (Just for triggering)
        // You can adjust this to easily trigger the alert
        if (Number(session.weight) < 10 && Number(session.height) < 80) {
            category = NutritionCategory.STUNTED;
        } else if (Number(session.weight) < 5) {
            category = NutritionCategory.WASTED;
        }

        // Save Status
        await this.prisma.nutritionStatus.create({
            data: {
                sessionId: session.id,
                category: category,
                bbU: 0, // Mock Z-scores
                tbU: 0,
                bbTb: 0
            }
        });

        // 2.1 [SYSTEM] High Risk Alert
        if (category === NutritionCategory.STUNTED || category === NutritionCategory.WASTED) {
            await this.notificationService.notifyDoctor(
                `Ditemukan kasus ${category} pada anak ${session.child.fullName} (Sesi #${session.id}). Segera tinjau.`
            );
        }
    }
}

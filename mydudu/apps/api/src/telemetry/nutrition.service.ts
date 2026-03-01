import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
import { GrowthService } from '../growth/growth.service';
import { NutritionCategory, WhoGrowthIndicator } from '@prisma/client';
import { NUTRITION_THRESHOLDS } from '../common/constants'; // Keep for other usages if any
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class NutritionService {
    private readonly logger = new Logger(NutritionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
        private readonly growthService: GrowthService,
    ) { }

    async computeStatus(sessionId: number) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { child: true }
        });

        if (!session || !session.child) {
            this.logger.warn(`Session ${sessionId} not found or no child specific`);
            return;
        }

        // Calculate Age in Days
        const recordDate = session.recordedAt || new Date();
        const birthDate = session.child.birthDate;
        const diffTime = Math.abs(recordDate.getTime() - birthDate.getTime());
        const ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const gender = session.child.gender || 'M'; // Default to M if unknown, or handle error
        const weight = session.weight ? Number(session.weight) : undefined;
        const height = session.height ? Number(session.height) : undefined;

        // Perform Analysis using GrowthService
        // We only analyze if we have at least weight or height
        if (!weight && !height) {
            this.logger.log(`Session ${sessionId}: Missing weight/height for growth analysis`);
            return;
        }

        const growthResults = await this.growthService.analyzeGrowth(
            session.childId,
            gender,
            ageDays,
            weight,
            height
        );

        // Determine Primary Category
        // Priority: Stunted > Wasted > Obese > Normal
        // Or Stunted (height/age) AND Wasted (weight/height) can coexist.
        // The schema has a single `category` field.
        // Usually, we pick the most severe or specific one.
        // Let's use logic:
        // If Stunted, mark Stunted.
        // If Wasted, mark Wasted.
        // If both, maybe Stunted? Or Wasted?
        // Let's prioritize Wasted (acute) over Stunted (chronic) for alert purposes?
        // Or maybe just follow the finding order.

        let primaryCategory: NutritionCategory = NutritionCategory.NORMAL;
        let bbU: number | null = null;
        let tbU: number | null = null;
        let bbTb: number | null = null;

        // Extract Z-scores
        if (growthResults[WhoGrowthIndicator.WEIGHT_FOR_AGE]) {
            bbU = growthResults[WhoGrowthIndicator.WEIGHT_FOR_AGE]!.zScore;
            // Check Underweight
            if (growthResults[WhoGrowthIndicator.WEIGHT_FOR_AGE]!.status !== NutritionCategory.NORMAL) {
                // We don't have UNDERWEIGHT enum, schema uses WASTED for thinness?
                // Wait, Schema has STUNTED, WASTED, OBESE, NORMAL.
                // Underweight is low Weight-for-Age. Wasted is low Weight-for-Height.
                // If the schema strictly follows WHO definitions:
                // Stunted = Low Height-for-Age
                // Wasted = Low Weight-for-Height
                // Obese = High Weight-for-Height
                // Underweight (Weight-for-Age) is often a composite.
            }
        }

        if (growthResults[WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE]) {
            tbU = growthResults[WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE]!.zScore;
            if (growthResults[WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE]!.status === NutritionCategory.STUNTED) {
                primaryCategory = NutritionCategory.STUNTED;
            }
        }

        const wfhIndicator = ageDays < 730 ? WhoGrowthIndicator.WEIGHT_FOR_LENGTH : WhoGrowthIndicator.WEIGHT_FOR_HEIGHT;
        if (growthResults[wfhIndicator]) {
            bbTb = growthResults[wfhIndicator]!.zScore;
            const status = growthResults[wfhIndicator]!.status;
            if (status === NutritionCategory.WASTED) {
                primaryCategory = NutritionCategory.WASTED;
            } else if (status === NutritionCategory.OBESE && primaryCategory === NutritionCategory.NORMAL) {
                primaryCategory = NutritionCategory.OBESE;
            }
        }

        // If BMI available, it reinforces Wasted/Obese
        if (growthResults[WhoGrowthIndicator.BMI_FOR_AGE]) {
            const status = growthResults[WhoGrowthIndicator.BMI_FOR_AGE]!.status;
            if (status === NutritionCategory.WASTED) {
                primaryCategory = NutritionCategory.WASTED;
            } else if (status === NutritionCategory.OBESE && primaryCategory === NutritionCategory.NORMAL) {
                primaryCategory = NutritionCategory.OBESE;
            }
        }

        // Save Status
        // Check if status already exists?
        // The previous code did create.
        await this.prisma.nutritionStatus.create({
            data: {
                sessionId: session.id,
                category: primaryCategory,
                bbU: bbU !== null ? new Decimal(bbU) : null,
                tbU: tbU !== null ? new Decimal(tbU) : null,
                bbTb: bbTb !== null ? new Decimal(bbTb) : null
            }
        });

        // System Alert
        if (primaryCategory !== NutritionCategory.NORMAL) {
            await this.notificationService.notifyDoctor(
                `Ditemukan kasus ${primaryCategory} pada anak ${session.child.fullName} (Sesi #${session.id}). Z-Scores: BB/U=${bbU !== null ? bbU.toFixed(2) : '-'}, TB/U=${tbU !== null ? tbU.toFixed(2) : '-'}, BB/TB=${bbTb !== null ? bbTb.toFixed(2) : '-'}`
            );
        }
    }
}

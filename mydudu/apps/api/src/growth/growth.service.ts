import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhoGrowthIndicator, WhoGender, NutritionCategory } from '@prisma/client';
const chroma = require('chroma-js');

export interface GrowthAnalysisResult {
    zScore: number;
    percentile: number;
    lms: { l: number; m: number; s: number };
    indicator: WhoGrowthIndicator;
    status: NutritionCategory;
    deviation: number; // Value - Ideal (M)
    ideal: number;     // Median (M)
    color: string;     // Hex color based on Z-score
}

@Injectable()
export class GrowthService {
    private readonly logger = new Logger(GrowthService.name);
    // Color scale: Red (-3) -> Yellow (-2) -> Green (0) -> Yellow (+2) -> Red (+3)
    private readonly colorScale = chroma.scale(['#ff0000', '#ffff00', '#00ff00', '#ffff00', '#ff0000'])
        .domain([-3, -2, 0, 2, 3])
        .mode('lab');

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Calculates Z-score using LMS method:
     * If L != 0: Z = ((X/M)^L - 1) / (L * S)
     * If L == 0: Z = ln(X/M) / S
     */
    calculateZScore(l: number, m: number, s: number, x: number): number {
        if (l === 0) {
            return Math.log(x / m) / s;
        } else {
            return (Math.pow(x / m, l) - 1) / (l * s);
        }
    }

    /**
     * Calculates percentile from Z-score using error function approximation for Normal CDF.
     * Logic: P = 0.5 * (1 + erf(Z / sqrt(2)))
     * Returns value between 0 and 100.
     */
    calculatePercentile(z: number): number {
        // Error function approximation (Abramowitz and Stegun)
        // constants
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        // Save the sign of x
        const sign = z < 0 ? -1 : 1;
        const x = Math.abs(z) / Math.sqrt(2);

        // A&S formula 7.1.26
        const t = 1.0 / (1.0 + p * x);
        const y =
            1.0 -
            (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x);

        const erf = sign * y;

        // Convert to percentile (0-100)
        return 50 * (1 + erf);
    }

    /**
     * Retrieves LMS parameters for a specific indicator, gender, and measurement (age or height/length).
     * Supports interpolation if exact matching record is not found.
     */
    async getLMSData(
        indicator: WhoGrowthIndicator,
        gender: WhoGender,
        measure: number,
    ): Promise<{ l: number; m: number; s: number, id: number } | null> {

        // Determine query filter based on indicator type
        let whereCondition: any = {
            indicator,
            gender,
        };

        const isAgeBased = ([
            WhoGrowthIndicator.BMI_FOR_AGE,
            WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE,
            WhoGrowthIndicator.WEIGHT_FOR_AGE,
        ] as WhoGrowthIndicator[]).includes(indicator);

        if (isAgeBased) {
            whereCondition.ageDays = Math.round(measure); // Age is usually integer days in table
        } else {
            // For height/length based, specific query logic below
        }

        // Attempt exact/close match or interpolation
        if (isAgeBased) {
            // For Age-based, we also support interpolation in case data is monthly (e.g. 1 month = 30 days) and we have 45 days.
            const lower = await this.prisma.whoGrowthStandard.findFirst({
                where: {
                    ...whereCondition,
                    ageDays: { lte: Math.round(measure) }
                },
                orderBy: { ageDays: 'desc' }
            });

            const upper = await this.prisma.whoGrowthStandard.findFirst({
                where: {
                    ...whereCondition,
                    ageDays: { gte: Math.round(measure) }
                },
                orderBy: { ageDays: 'asc' }
            });

            if (!lower && !upper) return null;
            if (!lower) return { l: Number(upper.l), m: Number(upper.m), s: Number(upper.s), id: upper.id };
            if (!upper) return { l: Number(lower.l), m: Number(lower.m), s: Number(lower.s), id: lower.id };

            if (lower.id === upper.id) return { l: Number(lower.l), m: Number(lower.m), s: Number(lower.s), id: lower.id };

            // Linear Interpolation
            const x1 = Number(lower.ageDays);
            const x2 = Number(upper.ageDays);

            // Prevent division by zero if x1 == x2 (should be handled by id check, but for safety)
            if (x1 === x2) return { l: Number(lower.l), m: Number(lower.m), s: Number(lower.s), id: lower.id };

            const fraction = (measure - x1) / (x2 - x1);

            const l = Number(lower.l) + (Number(upper.l) - Number(lower.l)) * fraction;
            const m = Number(lower.m) + (Number(upper.m) - Number(lower.m)) * fraction;
            const s = Number(lower.s) + (Number(upper.s) - Number(lower.s)) * fraction;

            return { l, m, s, id: lower.id };
        } else {
            // Height/Length based - use ranges
            const lower = await this.prisma.whoGrowthStandard.findFirst({
                where: {
                    ...whereCondition,
                    lengthHeightCm: { lte: measure }
                },
                orderBy: { lengthHeightCm: 'desc' }
            });

            const upper = await this.prisma.whoGrowthStandard.findFirst({
                where: {
                    ...whereCondition,
                    lengthHeightCm: { gte: measure }
                },
                orderBy: { lengthHeightCm: 'asc' }
            });

            if (!lower && !upper) return null;
            if (!lower) return { l: Number(upper.l), m: Number(upper.m), s: Number(upper.s), id: upper.id };
            if (!upper) return { l: Number(lower.l), m: Number(lower.m), s: Number(lower.s), id: lower.id };

            if (lower.id === upper.id) return { l: Number(lower.l), m: Number(lower.m), s: Number(lower.s), id: lower.id };

            // Linear Interpolation
            const x1 = Number(lower.lengthHeightCm);
            const x2 = Number(upper.lengthHeightCm);
            const fraction = (measure - x1) / (x2 - x1);

            const l = Number(lower.l) + (Number(upper.l) - Number(lower.l)) * fraction;
            const m = Number(lower.m) + (Number(upper.m) - Number(lower.m)) * fraction;
            const s = Number(lower.s) + (Number(upper.s) - Number(lower.s)) * fraction;

            return { l, m, s, id: lower.id }; // ID is just for reference
        }
    }

    determineStatus(zScore: number, indicator: WhoGrowthIndicator): NutritionCategory {
        switch (indicator) {
            case WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE:
                if (zScore < -2) return NutritionCategory.STUNTED;
                break;
            case WhoGrowthIndicator.WEIGHT_FOR_LENGTH:
            case WhoGrowthIndicator.WEIGHT_FOR_HEIGHT:
            case WhoGrowthIndicator.BMI_FOR_AGE:
                if (zScore < -2) return NutritionCategory.WASTED;
                if (zScore > 2) return NutritionCategory.OBESE;
                break;
            case WhoGrowthIndicator.WEIGHT_FOR_AGE:
                if (zScore < -2) return NutritionCategory.WASTED;
                break;
        }
        return NutritionCategory.NORMAL;
    }

    private formatResult(
        lms: { l: number; m: number; s: number },
        indicator: WhoGrowthIndicator,
        value: number
    ): GrowthAnalysisResult {
        const z = this.calculateZScore(lms.l, lms.m, lms.s, value);
        const status = this.determineStatus(z, indicator);
        const color = this.colorScale(z).hex();

        return {
            zScore: z,
            percentile: this.calculatePercentile(z),
            lms,
            indicator,
            status,
            deviation: value - lms.m,
            ideal: lms.m,
            color
        };
    }

    async analyzeGrowth(
        childId: number,
        gender: string, // 'M' or 'F'
        ageDays: number,
        weight?: number,
        height?: number,
    ): Promise<Partial<Record<WhoGrowthIndicator, GrowthAnalysisResult>>> {
        const results: Partial<Record<WhoGrowthIndicator, GrowthAnalysisResult>> = {};
        const sex = gender === 'M' ? WhoGender.M : WhoGender.F;

        // 1. Weight-for-Age (0-5 years)
        if (weight !== undefined && ageDays <= 1856) {
            const lms = await this.getLMSData(WhoGrowthIndicator.WEIGHT_FOR_AGE, sex, ageDays);
            if (lms) {
                results[WhoGrowthIndicator.WEIGHT_FOR_AGE] = this.formatResult(lms, WhoGrowthIndicator.WEIGHT_FOR_AGE, weight);
            }
        }

        // 2. Length/Height-for-Age
        if (height !== undefined) {
            const lms = await this.getLMSData(WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE, sex, ageDays);
            if (lms) {
                results[WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE] = this.formatResult(lms, WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE, height);
            }
        }


        // 3. Weight-for-Length/Height
        if (weight !== undefined && height !== undefined) {
            let indicator: WhoGrowthIndicator;
            // WHO Standard: < 2 years (730 days) use Length, >= 2 years use Height
            if (ageDays < 730) {
                indicator = WhoGrowthIndicator.WEIGHT_FOR_LENGTH;
            } else {
                indicator = WhoGrowthIndicator.WEIGHT_FOR_HEIGHT;
            }

            const lms = await this.getLMSData(indicator, sex, height);
            if (lms) {
                results[indicator] = this.formatResult(lms, indicator, weight);
            }
        }

        // 4. BMI-for-Age
        if (weight !== undefined && height !== undefined) {
            // BMI = weight (kg) / height (m)^2
            const bmi = weight / Math.pow(height / 100, 2);
            const lms = await this.getLMSData(WhoGrowthIndicator.BMI_FOR_AGE, sex, ageDays);
            if (lms) {
                results[WhoGrowthIndicator.BMI_FOR_AGE] = this.formatResult(lms, WhoGrowthIndicator.BMI_FOR_AGE, bmi);
            }
        }

        return results;
    }
}

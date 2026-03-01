import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhoGrowthIndicator, WhoGender, NutritionCategory } from '@prisma/client';
import { Z_SCORE_THRESHOLDS, AGE_THRESHOLDS } from '@mydudu/shared';
const chroma = require('chroma-js');

export interface GrowthAnalysisResult {
    zScore: number;
    percentile: number;
    lms: { l: number; m: number; s: number };
    indicator: WhoGrowthIndicator;
    status: NutritionCategory;
    clinicalStatus: string; // Strict WHO classification (e.g., 'SEVERE_STUNTED')
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
     * 
     * @throws Error if Z-score is outside [-5, 5] (Extreme outlier protection)
     */
    calculateZScore(l: number, m: number, s: number, x: number): number | null {
        let z: number;
        if (l === 0) {
            z = Math.log(x / m) / s;
        } else {
            z = (Math.pow(x / m, l) - 1) / (l * s);
        }

        // Domain Guard: Reject extreme outliers to prevent statistical explosion
        if (z < -5 || z > 5) {
            this.logger.warn(`Z-Score ${z} out of safety range [-5, 5]. Value=${x}, L=${l}, M=${m}, S=${s}`);
            return null; // Signals invalid/unsafe data
        }

        return z;
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
     * Implements strict Linear Interpolation for both Age and Height.
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

        let lower, upper;
        let x1: number, x2: number;

        if (isAgeBased) {
            // 1. Age-Based Lookup (Exact or Range)
            const age = measure;
            lower = await this.prisma.whoGrowthStandard.findFirst({
                where: { ...whereCondition, ageDays: { lte: age } },
                orderBy: { ageDays: 'desc' }
            });
            upper = await this.prisma.whoGrowthStandard.findFirst({
                where: { ...whereCondition, ageDays: { gte: age } },
                orderBy: { ageDays: 'asc' }
            });
            if (!lower && !upper) return null;
            if (!lower) return { l: Number(upper.l), m: Number(upper.m), s: Number(upper.s), id: upper.id };
            if (!upper) return { l: Number(lower.l), m: Number(lower.m), s: Number(lower.s), id: lower.id };
            if (lower.id === upper.id) return { l: Number(lower.l), m: Number(lower.m), s: Number(lower.s), id: lower.id };

            x1 = Number(lower.ageDays);
            x2 = Number(upper.ageDays);

        } else {
            // 2. Height/Length-Based Lookup (Exact or Range)
            lower = await this.prisma.whoGrowthStandard.findFirst({
                where: { ...whereCondition, lengthHeightCm: { lte: measure } },
                orderBy: { lengthHeightCm: 'desc' }
            });

            upper = await this.prisma.whoGrowthStandard.findFirst({
                where: { ...whereCondition, lengthHeightCm: { gte: measure } },
                orderBy: { lengthHeightCm: 'asc' }
            });

            if (!lower && !upper) return null;
            if (!lower) return { l: Number(upper.l), m: Number(upper.m), s: Number(upper.s), id: upper.id };
            if (!upper) return { l: Number(lower.l), m: Number(lower.m), s: Number(lower.s), id: lower.id };
            if (lower.id === upper.id) return { l: Number(lower.l), m: Number(lower.m), s: Number(lower.s), id: lower.id };

            x1 = Number(lower.lengthHeightCm);
            x2 = Number(upper.lengthHeightCm);
        }

        // Linear Interpolation Logic
        if (x1 === x2) return { l: Number(lower.l), m: Number(lower.m), s: Number(lower.s), id: lower.id };

        const fraction = (measure - x1) / (x2 - x1);

        const l = Number(lower.l) + (Number(upper.l) - Number(lower.l)) * fraction;
        const m = Number(lower.m) + (Number(upper.m) - Number(lower.m)) * fraction;
        const s = Number(lower.s) + (Number(upper.s) - Number(lower.s)) * fraction;

        return { l, m, s, id: lower.id };
    }

    determineStatus(zScore: number, indicator: WhoGrowthIndicator): { status: NutritionCategory, clinicalStatus: string } {
        // Default return with explicit type to prevent literal inference
        let status: NutritionCategory = NutritionCategory.NORMAL;
        let clinicalStatus = 'NORMAL';

        switch (indicator) {
            case WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE:
                // Height-for-Age (Stunting)
                if (zScore <= Z_SCORE_THRESHOLDS.SEVERE_UNDER) {
                    status = NutritionCategory.STUNTED; // Map to closest DB enum
                    clinicalStatus = 'SEVERE_STUNTED';
                } else if (zScore <= Z_SCORE_THRESHOLDS.UNDER) {
                    status = NutritionCategory.STUNTED;
                    clinicalStatus = 'STUNTED';
                } else {
                    status = NutritionCategory.NORMAL;
                    clinicalStatus = 'NORMAL';
                }
                break;

            case WhoGrowthIndicator.WEIGHT_FOR_LENGTH:
            case WhoGrowthIndicator.WEIGHT_FOR_HEIGHT:
                // Weight-for-Length/Height (Wasting/Overweight)
                if (zScore <= Z_SCORE_THRESHOLDS.SEVERE_UNDER) {
                    status = NutritionCategory.WASTED;
                    clinicalStatus = 'SEVERE_WASTED';
                } else if (zScore <= Z_SCORE_THRESHOLDS.UNDER) {
                    status = NutritionCategory.WASTED;
                    clinicalStatus = 'WASTED';
                } else if (zScore >= Z_SCORE_THRESHOLDS.SEVERE_OVER) {
                    status = NutritionCategory.OBESE;
                    clinicalStatus = 'OBESE';
                } else if (zScore >= Z_SCORE_THRESHOLDS.OVER) {
                    status = NutritionCategory.OBESE; // Map Overweight to Obese for DB safety
                    clinicalStatus = 'OVERWEIGHT';
                } else {
                    status = NutritionCategory.NORMAL;
                    clinicalStatus = 'NORMAL';
                }
                break;

            case WhoGrowthIndicator.BMI_FOR_AGE:
                // BMI-for-Age
                if (zScore <= Z_SCORE_THRESHOLDS.SEVERE_UNDER) {
                    status = NutritionCategory.WASTED;
                    clinicalStatus = 'SEVERE_WASTED';
                } else if (zScore <= Z_SCORE_THRESHOLDS.UNDER) {
                    status = NutritionCategory.WASTED;
                    clinicalStatus = 'WASTED';
                } else if (zScore >= Z_SCORE_THRESHOLDS.SEVERE_OVER) {
                    status = NutritionCategory.OBESE;
                    clinicalStatus = 'OBESE';
                } else if (zScore >= Z_SCORE_THRESHOLDS.OVER) {
                    status = NutritionCategory.OBESE;
                    clinicalStatus = 'OVERWEIGHT';
                } else {
                    status = NutritionCategory.NORMAL;
                    clinicalStatus = 'NORMAL';
                }
                break;

            case WhoGrowthIndicator.WEIGHT_FOR_AGE:
                // Weight-for-Age (Underweight)
                if (zScore <= Z_SCORE_THRESHOLDS.SEVERE_UNDER) {
                    status = NutritionCategory.WASTED; // Proxy
                    clinicalStatus = 'SEVERE_UNDERWEIGHT';
                } else if (zScore <= Z_SCORE_THRESHOLDS.UNDER) {
                    status = NutritionCategory.WASTED; // Proxy
                    clinicalStatus = 'UNDERWEIGHT';
                } else {
                    status = NutritionCategory.NORMAL;
                    clinicalStatus = 'NORMAL';
                }
                break;
        }
        return { status, clinicalStatus };
    }

    private formatResult(
        lms: { l: number; m: number; s: number },
        indicator: WhoGrowthIndicator,
        value: number
    ): GrowthAnalysisResult | null {
        const z = this.calculateZScore(lms.l, lms.m, lms.s, value);

        // Return null if Z-score is invalid (e.g., outlier)
        if (z === null) return null;

        const { status, clinicalStatus } = this.determineStatus(z, indicator);
        const color = this.colorScale(z).hex();

        return {
            zScore: z,
            percentile: this.calculatePercentile(z),
            lms,
            indicator,
            status,
            clinicalStatus,
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

        // Query child to get name and UUID for logging (don't log database ID)
        const child = await this.prisma.child.findUnique({
            where: { id: childId },
            select: { fullName: true, childUuid: true }
        });

        const childIdentifier = child ? `"${child.fullName}" (${child.childUuid})` : `ID:${childId}`;
        console.log(`[GrowthService] Analyze: child=${childIdentifier}, sex=${sex}, age=${ageDays}, w=${weight}, h=${height}`);

        // Helper to safely set result if valid
        const setResult = (ind: WhoGrowthIndicator, res: GrowthAnalysisResult | null) => {
            if (res) results[ind] = res;
        };

        // 1. Weight-for-Age (0-5 years)
        if (weight !== undefined && ageDays <= 1856) {
            const lms = await this.getLMSData(WhoGrowthIndicator.WEIGHT_FOR_AGE, sex, ageDays);
            if (lms) setResult(WhoGrowthIndicator.WEIGHT_FOR_AGE, this.formatResult(lms, WhoGrowthIndicator.WEIGHT_FOR_AGE, weight));
        }

        // 2. Length/Height-for-Age
        if (height !== undefined) {
            const lms = await this.getLMSData(WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE, sex, ageDays);
            if (lms) setResult(WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE, this.formatResult(lms, WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE, height));
        }

        // 3. Weight-for-Length/Height
        if (weight !== undefined && height !== undefined) {
            let indicator: WhoGrowthIndicator;
            // WHO Standard: <= MAX_DAYS (729 days) use Length, >= 2 years use Height
            if (ageDays <= AGE_THRESHOLDS.USE_LENGTH_MAX_DAYS) {
                indicator = WhoGrowthIndicator.WEIGHT_FOR_LENGTH;
            } else {
                indicator = WhoGrowthIndicator.WEIGHT_FOR_HEIGHT;
            }

            const lms = await this.getLMSData(indicator, sex, height);
            if (lms) setResult(indicator, this.formatResult(lms, indicator, weight));
        }

        // 4. BMI-for-Age
        if (weight !== undefined && height !== undefined) {
            const bmi = weight / Math.pow(height / 100, 2);
            const lms = await this.getLMSData(WhoGrowthIndicator.BMI_FOR_AGE, sex, ageDays);
            if (lms) setResult(WhoGrowthIndicator.BMI_FOR_AGE, this.formatResult(lms, WhoGrowthIndicator.BMI_FOR_AGE, bmi));
        }

        return results;
    }
}

import { Test, TestingModule } from '@nestjs/testing';
import { GrowthService } from './growth.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhoGrowthIndicator, WhoGender, NutritionCategory } from '@prisma/client';

describe('GrowthService', () => {
    let service: GrowthService;
    let prisma: PrismaService;

    const mockPrismaService = {
        whoGrowthStandard: {
            findFirst: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GrowthService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<GrowthService>(GrowthService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('calculateZScore', () => {
        it('should calculate Z-score correctly when L != 0', () => {
            // Example values
            const l = 1;
            const m = 10;
            const s = 0.1; // CV 10%
            const x = 11; // 1SD above mean logic roughly
            // Z = ((11/10)^1 - 1) / (1 * 0.1) = (1.1 - 1) / 0.1 = 0.1 / 0.1 = 1
            expect(service.calculateZScore(l, m, s, x)).toBeCloseTo(1.0);
        });

        it('should calculate Z-score correctly when L = 0', () => {
            const l = 0;
            const m = 10;
            const s = 0.1;
            const x = 10 * Math.exp(0.1); // x should give Z=1
            // Z = ln(x/m)/s = ln(exp(0.1))/0.1 = 0.1/0.1 = 1
            expect(service.calculateZScore(l, m, s, x)).toBeCloseTo(1.0);
        });
    });

    describe('calculatePercentile', () => {
        it('should return 50 for Z=0', () => {
            expect(service.calculatePercentile(0)).toBeCloseTo(50, 4);
        });

        it('should return ~97.72 for Z=2', () => {
            expect(service.calculatePercentile(2)).toBeCloseTo(97.72, 1);
        });

        it('should return ~2.28 for Z=-2', () => {
            expect(service.calculatePercentile(-2)).toBeCloseTo(2.28, 1);
        });
    });

    describe('Integration Logic (Simplified)', () => {
        it('should return STUNTED for low Height-for-Age', () => {
            const status = service.determineStatus(-2.1, WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE);
            expect(status).toBe(NutritionCategory.STUNTED);
        });

        it('should return NORMAL for normal Height-for-Age', () => {
            const status = service.determineStatus(-1.9, WhoGrowthIndicator.LENGTH_HEIGHT_FOR_AGE);
            expect(status).toBe(NutritionCategory.NORMAL);
        });

        it('should return WASTED for low BMI-for-Age', () => {
            const status = service.determineStatus(-2.1, WhoGrowthIndicator.BMI_FOR_AGE);
            expect(status).toBe(NutritionCategory.WASTED);
        });
    });
});

import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { GrowthService } from './growth.service';

@Controller('growth')
export class GrowthController {
    constructor(private readonly growthService: GrowthService) { }

    @Post('evaluate')
    async evaluateManual(@Body() dto: {
        gender: 'M' | 'F',
        ageMonths: number,
        weightKg?: number,
        heightCm?: number
    }) {
        if (!dto.gender || dto.ageMonths === undefined) {
            throw new BadRequestException('Gender and ageMonths are required for WHO evaluation.');
        }

        const ageDays = Math.round(dto.ageMonths * 30.4375); // Approximate conversion for standard eval
        const results = await this.growthService.analyzeGrowth(
            0, // System/Manual Evaluation ID
            dto.gender,
            ageDays,
            dto.weightKg,
            dto.heightCm
        );

        return {
            ageDays,
            gender: dto.gender,
            results
        };
    }
}
